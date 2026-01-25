import { ValidationRule, ValidationErrors, QuestionnaireData } from '../types';
import { VALIDATION_MESSAGES } from './bilingualText';

// Validation rules for different fields
export const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  'personalInfo.firstName': [
    {
      field: 'personalInfo.firstName',
      type: 'required',
      message: VALIDATION_MESSAGES.REQUIRED_FIELD
    }
  ],
  'personalInfo.lastName': [
    {
      field: 'personalInfo.lastName',
      type: 'required',
      message: VALIDATION_MESSAGES.REQUIRED_FIELD
    }
  ],
  'personalInfo.email': [
    {
      field: 'personalInfo.email',
      type: 'required',
      message: VALIDATION_MESSAGES.REQUIRED_FIELD
    },
    {
      field: 'personalInfo.email',
      type: 'email',
      message: VALIDATION_MESSAGES.INVALID_EMAIL
    }
  ],
  'personalInfo.phoneNumber': [
    {
      field: 'personalInfo.phoneNumber',
      type: 'required',
      message: VALIDATION_MESSAGES.REQUIRED_FIELD
    },
    {
      field: 'personalInfo.phoneNumber',
      type: 'phone',
      message: VALIDATION_MESSAGES.INVALID_PHONE
    }
  ],
  'eFilePin': [
    {
      field: 'eFilePin',
      type: 'required',
      message: VALIDATION_MESSAGES.REQUIRED_FIELD
    },
    {
      field: 'eFilePin',
      type: 'custom',
      message: VALIDATION_MESSAGES.INVALID_PIN,
      validator: (value: string) => {
        if (!value) return false;
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length === 5 && cleaned !== '00000';
      }
    }
  ]
};

// Helper function to get nested property value
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Helper function to set nested property value
export const setNestedValue = (obj: any, path: string, value: any): any => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
};

// Validate a single field
export const validateField = (
  fieldPath: string, 
  value: any, 
  customRules?: ValidationRule[]
): ValidationErrors => {
  const rules = customRules || VALIDATION_RULES[fieldPath] || [];
  const errors: ValidationErrors = {};
  
  for (const rule of rules) {
    let isValid = true;
    
    switch (rule.type) {
      case 'required':
        isValid = value !== undefined && value !== null && value !== '';
        break;
        
      case 'email':
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(value);
        }
        break;
        
      case 'phone':
        if (value) {
          const cleaned = value.replace(/\D/g, '');
          isValid = cleaned.length === 10;
        }
        break;
        
      case 'date':
        if (value) {
          isValid = !isNaN(Date.parse(value));
        }
        break;
        
      case 'custom':
        if (rule.validator) {
          isValid = rule.validator(value);
        }
        break;
    }
    
    if (!isValid) {
      errors[fieldPath] = rule.message;
      break; // Stop at first error
    }
  }
  
  return errors;
};

// Validate entire form data
export const validateFormData = (data: Partial<QuestionnaireData>): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Validate all fields that have rules
  Object.keys(VALIDATION_RULES).forEach(fieldPath => {
    const value = getNestedValue(data, fieldPath);
    const fieldErrors = validateField(fieldPath, value);
    Object.assign(errors, fieldErrors);
  });
  
  // Custom validation for conditional fields
  if (data.spouseInfo?.hasSpouse) {
    const spouseFields = [
      'spouseInfo.firstName',
      'spouseInfo.lastName',
      'spouseInfo.ssnOrItin',
      'spouseInfo.email',
      'spouseInfo.dateOfBirth',
      'spouseInfo.occupation'
    ];
    
    spouseFields.forEach(fieldPath => {
      const value = getNestedValue(data, fieldPath);
      if (!value) {
        errors[fieldPath] = VALIDATION_MESSAGES.REQUIRED_FIELD;
      }
    });
  }
  
  // Validate banking info if direct deposit is selected
  if (data.paymentMethod?.method === 'direct_deposit' && data.paymentMethod.bankInfo) {
    const bankInfo = data.paymentMethod.bankInfo;
    
    if (bankInfo.accountNumber !== bankInfo.accountNumberConfirm) {
      errors['paymentMethod.bankInfo.accountNumberConfirm'] = VALIDATION_MESSAGES.ACCOUNT_MISMATCH;
    }
  }
  
  return errors;
};

// Check if a form step is valid
export const isStepValid = (
  stepType: string, 
  data: Partial<QuestionnaireData>
): boolean => {
  const stepErrors = validateFormData(data);
  
  // Define which fields belong to which steps
  const stepFields: Record<string, string[]> = {
    personal: [
      'personalInfo.firstName',
      'personalInfo.lastName', 
      'personalInfo.email',
      'personalInfo.phoneNumber'
    ],
    spouse: data.spouseInfo?.hasSpouse ? [
      'spouseInfo.firstName',
      'spouseInfo.lastName',
      'spouseInfo.ssnOrItin',
      'spouseInfo.email',
      'spouseInfo.dateOfBirth',
      'spouseInfo.occupation'
    ] : [],
    efilepin: ['eFilePin']
  };
  
  const fieldsToCheck = stepFields[stepType] || [];
  
  return fieldsToCheck.every(field => !stepErrors[field]);
};