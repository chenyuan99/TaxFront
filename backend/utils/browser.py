import os
from typing import Optional, Union
from contextlib import contextmanager
import logging

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options as ChromeOptions
from webdriver_manager.chrome import ChromeDriverManager
from playwright.sync_api import sync_playwright, Browser as PlaywrightBrowser, Page as PlaywrightPage

logger = logging.getLogger(__name__)

class BrowserManager:
    @staticmethod
    def get_chrome_options(headless: bool = True) -> ChromeOptions:
        """Configure Chrome options for Selenium."""
        chrome_options = ChromeOptions()
        if headless:
            chrome_options.add_argument('--headless')
        
        # Add required arguments for running in Docker
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        
        # Set binary location if specified in environment
        chrome_bin = os.environ.get('CHROME_BIN')
        if chrome_bin:
            chrome_options.binary_location = chrome_bin
            
        return chrome_options

    @contextmanager
    def get_selenium_driver(self, headless: bool = True):
        """
        Get a Selenium WebDriver instance with proper configuration.
        
        Usage:
            with BrowserManager().get_selenium_driver() as driver:
                driver.get("https://example.com")
                # Do something with the page
        """
        driver = None
        try:
            chrome_options = self.get_chrome_options(headless)
            
            # Use ChromeDriver from environment or download it
            chromedriver_path = os.environ.get('CHROMEDRIVER_PATH')
            if chromedriver_path:
                service = Service(executable_path=chromedriver_path)
            else:
                service = Service(ChromeDriverManager().install())
            
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.set_page_load_timeout(30)
            yield driver
            
        finally:
            if driver:
                driver.quit()

    @contextmanager
    def get_playwright_browser(
        self,
        headless: bool = True,
        browser_type: str = 'chromium'
    ) -> Union[PlaywrightBrowser, PlaywrightPage]:
        """
        Get a Playwright browser instance with proper configuration.
        
        Usage:
            with BrowserManager().get_playwright_browser() as browser:
                page = browser.new_page()
                page.goto("https://example.com")
                # Do something with the page
        """
        playwright = None
        browser = None
        try:
            playwright = sync_playwright().start()
            
            launch_args = {
                'headless': headless,
            }
            
            # Add required arguments for running in Docker
            if os.environ.get('DOCKER_CONTAINER'):
                launch_args.update({
                    'args': [
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                    ]
                })
            
            browser = getattr(playwright, browser_type).launch(**launch_args)
            yield browser
            
        finally:
            if browser:
                browser.close()
            if playwright:
                playwright.stop()

browser_manager = BrowserManager()

# Example usage functions
def selenium_example(url: str) -> Optional[str]:
    """Example function using Selenium for web scraping."""
    try:
        with browser_manager.get_selenium_driver() as driver:
            driver.get(url)
            return driver.page_source
    except Exception as e:
        logger.error(f"Error in selenium_example: {str(e)}")
        return None

def playwright_example(url: str) -> Optional[str]:
    """Example function using Playwright for web scraping."""
    try:
        with browser_manager.get_playwright_browser() as browser:
            page = browser.new_page()
            page.goto(url)
            return page.content()
    except Exception as e:
        logger.error(f"Error in playwright_example: {str(e)}")
        return None
