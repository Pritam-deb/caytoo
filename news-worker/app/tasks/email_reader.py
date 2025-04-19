from app.services.gmail_client import get_google_alert_links

async def process_gmail_alerts():
    print("📩 Reading Gmail alerts...")
    links = get_google_alert_links()
    for link in links:
        print("Found article:", link)