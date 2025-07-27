import os.path
import base64
import re
import json
from email import message_from_bytes
from email.utils import parsedate_to_datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import urllib.parse
from collections import defaultdict
from datetime import datetime, timedelta
import redis

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print("Failed to refresh token. Re-authenticating...")
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def get_google_alert_links():
    service = get_gmail_service()
    oldest_date = (datetime.utcnow() - timedelta(days=5)).date()
    results = service.users().messages().list(
        userId='me',
        labelIds=['INBOX'],
        q='from:(googlealerts-noreply@google.com) newer_than:1d',
    ).execute()
    
    messages = results.get('messages', [])
    print(f"Found {len(messages)} Google Alert emails.")
    data = defaultdict(lambda: defaultdict(list))
    r = redis.Redis(host='redis', port=6379, db=0)
    r.set("article_processing", "true")

    for msg in messages:  # Limit to recent 5
        msg_data = service.users().messages().get(userId='me', id=msg['id'], format='raw').execute()
        raw_data = base64.urlsafe_b64decode(msg_data['raw'].encode('ASCII'))
        mime_msg = message_from_bytes(raw_data)

        body = ""
        if mime_msg.is_multipart():
            for part in mime_msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                if content_type == "text/html" and "attachment" not in content_disposition:
                    body = part.get_payload(decode=True).decode(errors='ignore')
                    break
        else:
            body = mime_msg.get_payload(decode=True).decode(errors='ignore')

        found_links = re.findall(r'https?://www\.google\.com/url\?[^"]+', body)
        subject = mime_msg['Subject'] or "No Subject"
        try:
            parsed_date = parsedate_to_datetime(mime_msg['Date']).date()
            if parsed_date < oldest_date:
                continue
            date = parsed_date.isoformat()
        except Exception:
            continue  # skip if date can't be parsed
        for link in found_links:
            # print(f"Found link on date {date}: {link}")
            link = link.replace('&amp;', '&')
            match = re.search(r'[?&]url=([^&]+)', link)
            if match:
                clean_url = urllib.parse.unquote(match.group(1))
                data[subject][date].append(clean_url)
                try:
                    structured_data = {
                        "category": subject,
                        "date": date,
                        "url": clean_url
                    }
                    r.rpush('google_alert_links', json.dumps(structured_data))
                except Exception as e:
                    print(f"Failed to push to Redis: {e}")
    totalLinks =0
    for subject, dates in data.items():
        print(f"Subject: {subject}")
        for date, links in dates.items():
            totalLinks += len(links)
            print(f"  {date}: {len(links)} links")

    with open("articles.json", "w") as f:
        json.dump(data, f, indent=2)
    data['total_links'] = totalLinks
    return data