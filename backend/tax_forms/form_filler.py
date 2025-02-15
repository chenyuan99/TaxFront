import os
import re
import json
import tempfile
from typing import Dict, Optional
import logging
from datetime import datetime

import requests
import PyPDF2
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from .form_definitions import FormType, FormDefinition, get_form_definition

logger = logging.getLogger(__name__)

class TaxFormFiller:
    def __init__(self, cache_dir: str = "/app/data/tax_forms"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _download_form(self, form_def: FormDefinition) -> str:
        """Download form PDF from IRS website and cache it."""
        cache_path = os.path.join(
            self.cache_dir,
            f"{form_def.form_type.value}_{form_def.year}.pdf"
        )

        # Return cached file if it exists
        if os.path.exists(cache_path):
            return cache_path

        # Download the form
        response = requests.get(form_def.url)
        response.raise_for_status()

        with open(cache_path, 'wb') as f:
            f.write(response.content)

        return cache_path

    def _validate_field_value(self, field_def, value) -> Optional[str]:
        """Validate field value against field definition."""
        if not field_def.validation:
            return None

        if field_def.validation.get('required') and not value:
            return f"Field {field_def.name} is required"

        if pattern := field_def.validation.get('pattern'):
            if not re.match(pattern, str(value)):
                return f"Field {field_def.name} does not match required pattern"

        if field_def.type == 'number':
            try:
                num_value = float(value)
                if 'min' in field_def.validation and num_value < field_def.validation['min']:
                    return f"Field {field_def.name} must be greater than {field_def.validation['min']}"
                if 'max' in field_def.validation and num_value > field_def.validation['max']:
                    return f"Field {field_def.name} must be less than {field_def.validation['max']}"
            except ValueError:
                return f"Field {field_def.name} must be a number"

        return None

    def fill_form(
        self,
        form_type: FormType,
        year: int,
        data: Dict,
        output_path: Optional[str] = None
    ) -> str:
        """Fill tax form with provided data and return path to filled PDF."""
        # Get form definition
        form_def = get_form_definition(form_type, year)
        if not form_def:
            raise ValueError(f"Unsupported form type {form_type} for year {year}")

        # Download form if needed
        form_path = self._download_form(form_def)

        # Create temporary file for the filled form
        if not output_path:
            output_path = os.path.join(
                self.cache_dir,
                f"{form_type.value}_{year}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            )

        # Validate all fields
        for field in form_def.fields:
            if value := data.get(field.id):
                if error := self._validate_field_value(field, value):
                    raise ValueError(f"Validation error: {error}")

        # Create a temporary PDF with form fields
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            c = canvas.Canvas(tmp_file.name, pagesize=letter)
            
            current_page = 1
            for field in form_def.fields:
                if value := data.get(field.id):
                    # Move to correct page if needed
                    while current_page < field.page:
                        c.showPage()
                        current_page += 1
                    
                    # Add text to PDF
                    c.drawString(
                        field.coordinates['x'],
                        field.coordinates['y'],
                        str(value)
                    )
            
            c.save()

            # Merge original form with filled data
            original_pdf = PyPDF2.PdfReader(form_path)
            overlay_pdf = PyPDF2.PdfReader(tmp_file.name)
            
            output_pdf = PyPDF2.PdfWriter()
            
            # Merge pages
            for i in range(len(original_pdf.pages)):
                page = original_pdf.pages[i]
                if i < len(overlay_pdf.pages):
                    page.merge_page(overlay_pdf.pages[i])
                output_pdf.add_page(page)
            
            # Write the merged PDF
            with open(output_path, 'wb') as output_file:
                output_pdf.write(output_file)

        # Clean up temporary file
        os.unlink(tmp_file.name)

        return output_path

# Example usage
def fill_form_example():
    # Example data for Form 1040
    data_1040 = {
        "first_name": "John",
        "last_name": "Doe",
        "ssn": "123-45-6789",
        # Add more fields as needed
    }

    # Example data for Form W-2
    data_w2 = {
        "employer_ein": "12-3456789",
        "wages": "75000.00",
        # Add more fields as needed
    }

    filler = TaxFormFiller()

    # Fill Form 1040
    filled_1040_path = filler.fill_form(
        form_type=FormType.FORM_1040,
        year=2024,
        data=data_1040
    )
    logger.info(f"Filled Form 1040 saved to: {filled_1040_path}")

    # Fill Form W-2
    filled_w2_path = filler.fill_form(
        form_type=FormType.FORM_W2,
        year=2024,
        data=data_w2
    )
    logger.info(f"Filled Form W-2 saved to: {filled_w2_path}")

if __name__ == "__main__":
    fill_form_example()
