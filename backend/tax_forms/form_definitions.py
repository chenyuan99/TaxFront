from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class FormType(Enum):
    FORM_1040 = "1040"
    FORM_W2 = "W-2"
    FORM_1099_INT = "1099-INT"
    FORM_1099_DIV = "1099-DIV"
    FORM_1099_B = "1099-B"
    FORM_1099_MISC = "1099-MISC"

@dataclass
class FormField:
    id: str
    name: str
    type: str  # text, number, date, checkbox
    page: int
    coordinates: Dict[str, float]  # x, y coordinates on the PDF
    validation: Optional[Dict] = None  # validation rules

@dataclass
class FormDefinition:
    form_type: FormType
    year: int
    url: str
    fields: List[FormField]
    
# Example form definitions
FORM_1040_2024 = FormDefinition(
    form_type=FormType.FORM_1040,
    year=2024,
    url="https://www.irs.gov/pub/irs-pdf/f1040.pdf",
    fields=[
        FormField(
            id="first_name",
            name="First Name",
            type="text",
            page=1,
            coordinates={"x": 50, "y": 100}
        ),
        FormField(
            id="last_name",
            name="Last Name",
            type="text",
            page=1,
            coordinates={"x": 150, "y": 100}
        ),
        FormField(
            id="ssn",
            name="Social Security Number",
            type="text",
            page=1,
            coordinates={"x": 250, "y": 100},
            validation={
                "pattern": r"^\d{3}-\d{2}-\d{4}$",
                "required": True
            }
        ),
        # Add more fields as needed
    ]
)

FORM_W2_2024 = FormDefinition(
    form_type=FormType.FORM_W2,
    year=2024,
    url="https://www.irs.gov/pub/irs-pdf/fw2.pdf",
    fields=[
        FormField(
            id="employer_ein",
            name="Employer ID Number",
            type="text",
            page=1,
            coordinates={"x": 50, "y": 150},
            validation={
                "pattern": r"^\d{2}-\d{7}$",
                "required": True
            }
        ),
        FormField(
            id="wages",
            name="Wages, tips, other compensation",
            type="number",
            page=1,
            coordinates={"x": 150, "y": 150},
            validation={
                "min": 0,
                "required": True
            }
        ),
        # Add more fields as needed
    ]
)

# Dictionary of all supported forms
SUPPORTED_FORMS = {
    (FormType.FORM_1040, 2024): FORM_1040_2024,
    (FormType.FORM_W2, 2024): FORM_W2_2024,
}

def get_form_definition(form_type: FormType, year: int) -> Optional[FormDefinition]:
    """Get form definition for a specific form type and year."""
    return SUPPORTED_FORMS.get((form_type, year))
