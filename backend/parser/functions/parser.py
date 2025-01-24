import re
from PyPDF2 import PdfReader


class TaxDocumentParser:
    """
    Parser to extract data from tax documents.
    """

    def __init__(self, file_path):
        self.file_path = file_path
        self.data = ""

    def extract_text(self):
        """
        Extracts text from the PDF document.
        """
        try:
            reader = PdfReader(self.file_path)
            self.data = " ".join([page.extract_text() for page in reader.pages])
            return self.data
        except Exception as e:
            print(f"Error extracting text: {e}")
            return ""

    def parse_data(self):
        """
        Parses specific tax-related data from the text.
        """
        if not self.data:
            print("No data to parse. Ensure text is extracted first.")
            return {}

        # Regular expressions for extracting tax data
        name_pattern = r"Name:\s*([A-Za-z\s]+)"
        tax_id_pattern = r"Tax ID:\s*([\d\-]+)"
        income_pattern = r"Income:\s*\$([\d,]+\.?\d*)"
        tax_due_pattern = r"Tax Due:\s*\$([\d,]+\.?\d*)"

        # Extract data
        name = re.search(name_pattern, self.data)
        tax_id = re.search(tax_id_pattern, self.data)
        income = re.search(income_pattern, self.data)
        tax_due = re.search(tax_due_pattern, self.data)

        parsed_data = {
            "Name": name.group(1).strip() if name else None,
            "Tax ID": tax_id.group(1).strip() if tax_id else None,
            "Income": float(income.group(1).replace(",", "")) if income else None,
            "Tax Due": float(tax_due.group(1).replace(",", "")) if tax_due else None,
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
