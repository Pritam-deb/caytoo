import json
import requests
import time
import logging
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO)

class ScraperService:
    def __init__(self, input_file='articles.json', output_file='scraped_articles.json'):
        self.input_file = input_file
        self.output_file = output_file

    def load_links(self):
        with open(self.input_file, 'r') as f:
            data = json.load(f)

        links = []
        for alert_name, dates in data.items():
            for date, urls in dates.items():
                for url in urls:
                    links.append({
                        'alert_name': alert_name,
                        'date': date,
                        'url': url
                    })
        return links

    def scrape_article(self, url, retries=3, backoff_factor=2):
        attempt = 0
        while attempt < retries:
            try:
                logging.info(f"Scraping {url}... (Attempt {attempt + 1}/{retries})")
                headers = {'User-Agent': 'Mozilla/5.0'}
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')

                article = soup.find('article')
                if not article:
                    article = soup.find('div', class_='content')

                if article:
                    logging.info(f"Successfully scraped {url}")
                    return article.get_text(strip=True)
                else:
                    logging.warning(f"No article content found for {url}")
                    return "No article content found."
            except Exception as e:
                attempt += 1
                logging.error(f"Error scraping {url}: {str(e)}")
                if attempt < retries:
                    wait_time = backoff_factor ** attempt
                    logging.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    return f"Failed to scrape {url} after {retries} attempts."

    def scrape_all(self):
        entries = self.load_links()
        scraped_data = []

        for entry in entries:
            content = self.scrape_article(entry['url'])
            scraped_data.append({
                'alert_name': entry['alert_name'],
                'date': entry['date'],
                'url': entry['url'],
                'content': content
            })

        with open(self.output_file, 'w') as f:
            json.dump(scraped_data, f, indent=2)
        logging.info(f"Scraping complete. Data saved to {self.output_file}")