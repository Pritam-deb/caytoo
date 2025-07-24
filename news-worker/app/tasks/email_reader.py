from app.services.gmail_client import get_google_alert_links

async def process_gmail_alerts():
    print("📩 Reading Gmail alerts...")
    data = get_google_alert_links()
    for link in data:
        print("Found subjects:", link)
    return data['total_links'] if 'total_links' in data else 0