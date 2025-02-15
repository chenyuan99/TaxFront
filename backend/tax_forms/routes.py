from flask import Blueprint, request, jsonify, send_file
import json
from datetime import datetime
import os

from .form_definitions import FormType
from .form_filler import TaxFormFiller

bp = Blueprint('tax_forms', __name__)
form_filler = TaxFormFiller()

@bp.route('/api/tax-forms/supported', methods=['GET'])
def get_supported_forms():
    """Get list of supported tax forms."""
    return jsonify([{
        'type': form_type.value,
        'year': year
    } for (form_type, year) in form_filler.SUPPORTED_FORMS.keys()])

@bp.route('/api/tax-forms/fill', methods=['POST'])
def fill_tax_form():
    """Fill a tax form with provided data."""
    try:
        data = request.get_json()
        
        # Validate request
        if not all(k in data for k in ['formType', 'year', 'formData']):
            return jsonify({
                'error': 'Missing required fields: formType, year, formData'
            }), 400

        # Parse form type
        try:
            form_type = FormType(data['formType'])
        except ValueError:
            return jsonify({
                'error': f"Invalid form type. Supported types: {[t.value for t in FormType]}"
            }), 400

        # Fill the form
        output_path = form_filler.fill_form(
            form_type=form_type,
            year=data['year'],
            data=data['formData']
        )

        # Return the filled form
        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{form_type.value}_{data['year']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f"Internal server error: {str(e)}"}), 500

# Example JSON data for testing
EXAMPLE_DATA = {
    'form_1040_2024': {
        'formType': 'FORM_1040',
        'year': 2024,
        'formData': {
            'first_name': 'John',
            'last_name': 'Doe',
            'ssn': '123-45-6789',
            # Add more fields as needed
        }
    },
    'form_w2_2024': {
        'formType': 'W-2',
        'year': 2024,
        'formData': {
            'employer_ein': '12-3456789',
            'wages': '75000.00',
            # Add more fields as needed
        }
    }
}
