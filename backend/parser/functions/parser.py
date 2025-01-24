import re
from PyPDF2 import PdfReader
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaxDocumentParser:
    """
    Parser to extract data from tax documents.
    """

    # Common tax document patterns
    PATTERNS = {
        'name': [
            r"Name:\s*([A-Za-z\s\-']+)",
            r"Taxpayer Name:\s*([A-Za-z\s\-']+)",
            r"Full Name:\s*([A-Za-z\s\-']+)"
        ],
        'tax_id': [
            r"Tax ID:\s*([\d\-]+)",
            r"SSN:\s*([\d\-]+)",
            r"EIN:\s*([\d\-]+)",
            r"Tax Identification Number:\s*([\d\-]+)"
        ],
        'income': [
            r"Income:\s*\$([\d,]+\.?\d*)",
            r"Total Income:\s*\$([\d,]+\.?\d*)",
            r"Gross Income:\s*\$([\d,]+\.?\d*)",
            r"Adjusted Gross Income:\s*\$([\d,]+\.?\d*)"
        ],
        'tax_due': [
            r"Tax Due:\s*\$([\d,]+\.?\d*)",
            r"Total Tax:\s*\$([\d,]+\.?\d*)",
            r"Amount Due:\s*\$([\d,]+\.?\d*)",
            r"Balance Due:\s*\$([\d,]+\.?\d*)"
        ],
        'tax_year': [
            r"Tax Year:\s*(\d{4})",
            r"For Year:\s*(\d{4})",
            r"Filing Year:\s*(\d{4})"
        ],
        'filing_status': [
            r"Filing Status:\s*([A-Za-z\s]+)",
            r"Status:\s*([A-Za-z\s]+)"
        ]
    }

    def __init__(self, file_path):
        self.file_path = file_path
        self.data = ""
        self.metadata = {}
        self.confidence_scores = {}

    def extract_text(self):
        """
        Extracts text from the PDF document with error handling.
        """
        try:
            logger.info(f"Starting text extraction from {self.file_path}")
            reader = PdfReader(self.file_path)
            
            text_parts = []
            for i, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                    else:
                        logger.warning(f"Empty text extracted from page {i+1}")
                except Exception as e:
                    logger.error(f"Error extracting text from page {i+1}: {str(e)}")
            
            self.data = " ".join(text_parts)
            if not self.data:
                logger.error("No text could be extracted from the document")
            else:
                logger.info(f"Successfully extracted {len(self.data)} characters")
            
            return self.data
            
        except Exception as e:
            logger.error(f"Error during text extraction: {str(e)}")
            raise

    def find_best_match(self, patterns, text):
        """
        Finds the best matching pattern with confidence score.
        """
        best_match = None
        best_confidence = 0
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                # Calculate confidence based on context and format
                confidence = self._calculate_confidence(match)
                if confidence > best_confidence:
                    best_match = match
                    best_confidence = confidence
        
        return best_match, best_confidence

    def _calculate_confidence(self, match):
        """
        Calculates confidence score based on match quality.
        """
        confidence = 1.0
        
        # Length factor
        value_length = len(match.group(1))
        if value_length < 2:
            confidence *= 0.5
        elif value_length > 50:
            confidence *= 0.7
        
        # Context factor
        context_before = match.string[max(0, match.start() - 20):match.start()]
        context_after = match.string[match.end():min(len(match.string), match.end() + 20)]
        if re.search(r'total|sum|final', context_before.lower()):
            confidence *= 1.2
        
        # Format factor
        if re.match(r'^\d+$', match.group(1)):
            confidence *= 1.1
            
        return min(confidence, 1.0)

    def parse_data(self):
        """
        Parses specific tax-related data from the text with confidence scores.
        """
        if not self.data:
            logger.warning("No data to parse. Ensure text is extracted first.")
            return {}

        parsed_data = {}
        
        # Process each field type
        for field, patterns in self.PATTERNS.items():
            best_match, confidence = self.find_best_match(patterns, self.data)
            
            if best_match:
                value = best_match.group(1).strip()
                
                # Convert numeric values
                if field in ['income', 'tax_due']:
                    try:
                        value = float(value.replace(',', ''))
                    except ValueError:
                        logger.error(f"Error converting {field} value: {value}")
                        continue
                
                parsed_data[field] = value
                self.confidence_scores[field] = confidence
                logger.info(f"Found {field} with confidence {confidence:.2f}: {value}")
            else:
                logger.warning(f"Could not find {field} in document")

        # Add metadata
        parsed_data['metadata'] = {
            'confidence_scores': self.confidence_scores,
            'parser_version': '2.0',
            'processing_timestamp': datetime.now().isoformat(),
            'extraction_success': bool(parsed_data)
        }

        return parsed_data


# Example Usage
if __name__ == "__main__":
    # Provide the file path for the tax document
    file_path = "tax_document.pdf"

    parser = TaxDocumentParser(file_path)
    text_data = parser.extract_text()

    if text_data:
        parsed_data = parser.parse_data()
        print("Parsed Tax Document Data:")
        for key, value in parsed_data.items():
            print(f"{key}: {value}")
