import json
import requests
import time
import logging
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class ScraperService:
    def __init__(self, input_file='articles.json', output_file='scraped_articles.json'):
        self.input_file = input_file
        self.output_file = output_file
        # Common selectors for article titles
        self.title_selectors = [
            {'tag': 'h1', 'attrs': {}},  # General h1
            {'tag': 'h1', 'attrs': {'class': 'article-title'}},
            {'tag': 'h1', 'attrs': {'class': 'headline'}},
            {'tag': 'h1', 'attrs': {'itemprop': 'headline'}},
            {'tag': 'title', 'attrs': {}}, # Page title
            {'tag': 'meta', 'attrs': {'property': 'og:title'}, 'content': True},
            {'tag': 'meta', 'attrs': {'name': 'twitter:title'}, 'content': True},
        ]
        # Common selectors for article bodies
        self.body_selectors = [
            {'tag': 'article', 'attrs': {}},
            {'tag': 'div', 'attrs': {'class': 'article-body'}},
            {'tag': 'div', 'attrs': {'class': 'story-content'}},
            {'tag': 'div', 'attrs': {'class': 'post-content'}},
            {'tag': 'div', 'attrs': {'class': 'entry-content'}},
            {'tag': 'div', 'attrs': {'class': 'td-post-content'}},
            {'tag': 'div', 'attrs': {'class': 'content__body'}},
            {'tag': 'div', 'attrs': {'itemprop': 'articleBody'}},
            {'tag': 'main', 'attrs': {}},
            {'tag': 'div', 'attrs': {'id': 'content'}},
            {'tag': 'div', 'attrs': {'id': 'main-content'}},
            {'tag': 'div', 'attrs': {'id': 'article-content'}},
            {'tag': 'div', 'attrs': {'role': 'main'}},
            {'tag': 'div', 'attrs': {'class': 'content'}},
            {'tag': 'div', 'attrs': {'class': 'main'}},
            {'tag': 'div', 'attrs': {'class': 'post'}},
            {'tag': 'div', 'attrs': {'class': 'story'}},
        ]
        # Keywords to detect registration/subscription walls
        self.registration_wall_keywords = [
            "register a valid email address", "create an account", "to continue reading",
            "subscribe to read", "log in to read", "enter your email", "unlock this article",
            "must register", "must log in", "must subscribe", "complete your registration",
            "sign up to continue", "join to read"
        ]
        # Minimum length for a successfully extracted body to be considered complete
        self.min_body_length_for_success = 200 # Characters


    def load_links(self):
        """Loads links from the input JSON file."""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            logging.error(f"Input file {self.input_file} not found.")
            return []
        except json.JSONDecodeError:
            logging.error(f"Error decoding JSON from {self.input_file}.")
            return []

        links = []
        for alert_name, dates in data.items():
            for date, urls in dates.items():
                if isinstance(urls, list):
                    for url_item in urls: # Renamed to avoid conflict with outer 'url' in scrape_article
                        links.append({
                            'alert_name': alert_name,
                            'date': date,
                            'url': url_item
                        })
                else:
                    logging.warning(f"Expected a list of URLs for {alert_name} on {date}, but got {type(urls)}. Skipping.")
        return links

    def _extract_element_text(self, soup, selectors, element_type="body"):
        """Helper function to extract text using a list of selectors."""
        for selector in selectors:
            tag = selector['tag']
            attrs = selector['attrs']
            element = soup.find(tag, attrs)
            if element:
                if element_type == "title" and selector.get('content'):
                    content_attr = element.get('content')
                    if content_attr:
                        logging.debug(f"Found {element_type} using {tag} with attrs {attrs} (meta content)")
                        return content_attr.strip()
                elif element_type == "title": # For titles, keep collapsing to a single line
                     logging.debug(f"Found {element_type} using {tag} with attrs {attrs}")
                     return element.get_text(separator=' ', strip=True)
                else: # For body, preserve newlines and tabs by not using separator
                     logging.debug(f"Found {element_type} using {tag} with attrs {attrs}")
                     return element.get_text(strip=True) 
        return None

    def scrape_article(self, url, retries=3, backoff_factor=2):
        """Scrapes title and main content, detecting registration walls."""
        attempt = 0
        while attempt < retries:
            try:
                logging.info(f"Scraping {url}... (Attempt {attempt + 1}/{retries})")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive'
                }
                response = requests.get(url, headers=headers, timeout=20)
                response.raise_for_status()
                
                if 'text/html' not in response.headers.get('Content-Type', '').lower():
                    logging.warning(f"Content at {url} is not HTML. Skipping.")
                    return {"title": "Not HTML content", "body": "Content type was not text/html."}

                soup = BeautifulSoup(response.content, 'html.parser')

                # --- Extract Title ---
                article_title = self._extract_element_text(soup, self.title_selectors, "title")
                if not article_title:
                    page_title_tag = soup.find('title')
                    if page_title_tag:
                        article_title = page_title_tag.get_text(separator=' ', strip=True) # Ensure title is single line
                
                if not article_title:
                    article_title = "Title not found"
                    logging.warning(f"Title not found for {url}")
                else:
                    logging.info(f"Extracted title for {url}: {article_title[:50]}...")

                # --- Extract Body ---
                article_body_text = self._extract_element_text(soup, self.body_selectors, "body")
                final_body_message = "Main article content not found or too short." # Default

                if article_body_text and len(article_body_text) >= self.min_body_length_for_success:
                    logging.info(f"Successfully scraped content for {url} (length: {len(article_body_text)})")
                    # Assign directly to preserve newlines and tabs from get_text(strip=True)
                    final_body_message = article_body_text 
                else:
                    # Body is short or not found, check for registration/paywall
                    page_text_lower = soup.get_text().lower() 
                    is_walled = False
                    detected_keyword = ""
                    for keyword in self.registration_wall_keywords:
                        if keyword in page_text_lower:
                            is_walled = True
                            detected_keyword = keyword
                            break
                    
                    if is_walled:
                        logging.warning(f"Potential registration/paywall detected for {url} (keyword: '{detected_keyword}')")
                        final_body_message = "Content likely behind a registration/subscription wall."
                        if article_body_text and article_body_text.strip(): 
                             # Use original article_body_text for snippet to reflect what was initially grabbed
                             snippet = article_body_text.strip().replace('\n', ' ').replace('\t', ' ')
                             final_body_message += f" (Initial snippet: '{' '.join(snippet.split())[:150]}...')"
                    elif article_body_text and article_body_text.strip(): 
                        snippet = article_body_text.strip().replace('\n', ' ').replace('\t', ' ')
                        final_body_message = f"Content found but is very short. (Content: '{' '.join(snippet.split())[:200]}...')"
                        logging.warning(f"Extracted content for {url} is very short ({len(article_body_text.strip())} chars) and no wall keywords detected.")
                    else: 
                        logging.warning(f"No main article content found for {url} using defined selectors, and no wall keywords detected.")
                
                return {"title": article_title, "body": final_body_message}

            except requests.exceptions.HTTPError as e:
                logging.error(f"HTTP error scraping {url}: {str(e)}")
                if e.response.status_code in [401, 403, 404]:
                    return {"title": f"HTTP {e.response.status_code}", "body": f"Failed to access {url}: {str(e)}"}
                if attempt >= retries - 1:
                    return {"title": "HTTP Error", "body": f"Failed to scrape {url} after {retries} attempts due to HTTP error: {str(e)}."}
            except requests.exceptions.RequestException as e:
                logging.error(f"Request error scraping {url}: {str(e)}")
                if attempt >= retries - 1:
                     return {"title": "Request Error", "body": f"Failed to scrape {url} after {retries} attempts due to request error: {str(e)}."}
            except Exception as e:
                logging.error(f"Generic error scraping {url}: {str(e)}", exc_info=True)
                if attempt >= retries - 1:
                    return {"title": "Generic Error", "body": f"Failed to scrape {url} after {retries} attempts due to: {str(e)}."}
            
            attempt += 1
            if attempt < retries:
                wait_time = backoff_factor ** attempt
                logging.info(f"Retrying {url} in {wait_time} seconds...")
                time.sleep(wait_time)
        
        return {"title": "Scraping Failed", "body": f"Failed to scrape {url} after {retries} attempts (reached end of retry loop)."}


    def scrape_all(self):
        """Loads links, scrapes each one, and saves the data."""
        entries = self.load_links()
        if not entries:
            logging.info("No links to scrape.")
            return

        scraped_data = []
        for i, entry in enumerate(entries):
            logging.info(f"Processing entry {i+1}/{len(entries)}: {entry['url']}")
            scraped_content = self.scrape_article(entry['url'])
            
            scraped_data.append({
                'alert_name': entry['alert_name'],
                'date': entry['date'],
                'url': entry['url'],
                'title': scraped_content['title'],
                'content': scraped_content['body']
            })
            if i < len(entries) - 1:
                time.sleep(1) 

        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(scraped_data, f, indent=2, ensure_ascii=False)
            logging.info(f"Scraping complete. Data saved to {self.output_file}")
        except IOError:
            logging.error(f"Could not write to output file {self.output_file}.")

if __name__ == '__main__':
    dummy_articles = {
        "TechAlert": {
            "2024-05-30": [
                "https://www.theverge.com/2024/5/29/24167097/microsoft-build-2024-copilot-ai-windows-developers-news-announcements",
                "https://www.wired.com/story/this-is-how-you-lose-the-time-war-review/",
                "http://example.com", 
                "https://nonexistent-url-for-testing123.com/article",
            ]
        },
        "FinanceNews": {
            "2024-05-29": [
                "https://www.bloomberg.com/news/articles/2024-05-30/global-stocks-slip-as-rate-cut-bets-fade-markets-wrap", 
                "https://www.reuters.com/markets/global-markets-wrapup-1-pix-2024-05-30/"
            ]
        }
    }
    # Create a dummy articles.json for testing if it doesn't exist or you want to overwrite
    # with open('articles.json', 'w', encoding='utf-8') as f:
    #    json.dump(dummy_articles, f, indent=2)

    scraper = ScraperService(input_file='articles.json', output_file='scraped_articles_enhanced.json')
    scraper.scrape_all()
