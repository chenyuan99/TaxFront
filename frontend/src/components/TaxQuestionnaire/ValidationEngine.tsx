import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { ValidationErrors, ValidationRule, QuestionnaireData } from './types';
import { validateField, validateFormData, getNestedValue } from './utils/validation';
import { getBilingualDisplay } from './utils/bilingualText';

interface ValidationContextType {
  errors: ValidationErrors;
  validateField: (fieldPath: string, value: any, rules?: ValidationRule[]) => ValidationErrors;
  validateForm: (data: Partial<QuestionnaireData>) => ValidationErrors;
  clearErrors: (fieldPaths?: string[]) => void;
  hasErrors: (fieldPaths?: string[]) => boolean;
  getFieldError: (fieldPath: string, language?: 'en' | 'zh' | 'both') => string | undefined;
}

const ValidationContext = createContext<ValidationContextType | null>(null);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

interface ValidationProviderProps {
  children: React.ReactNode;
  language?: 'en' | 'zh' | 'both';
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({
  children,
  language = 'both'
}) => {
  const [errors, setErrors] = React.useState<ValidationErrors>({});

  const validateFieldCallback = useCallback((
    fieldPath: string, 
    value: any, 
    rules?: ValidationRule[]
  ): ValidationErrors => {
    const fieldErrors = validateField(fieldPath, value, rules);
    
    // Update errors state
    setErrors(prev => {
      const newErrors = { ...prev };
      
      // Remove existing error for this field
      delete newErrors[fieldPath];
      
      // Add new error if exists
      if (fieldErrors[fieldPath]) {
        newErrors[fieldPath] = fieldErrors[fieldPath];
      }
      
      return newErrors;
    });
    
    return fieldErrors;
  }, []);

  const validateFormCallback = useCallback((data: Partial<QuestionnaireData>): ValidationErrors => {
    const formErrors = validateFormData(data);
    setErrors(formErrors);
    return formErrors;
  }, []);

  const clearErrors = useCallback((fieldPaths?: string[]) => {
    setErrors(prev => {
      if (!fieldPaths) {
        return {}; // Clear all errors
      }
      
      const newErrors = { ...prev };
      fieldPaths.forEach(path => {
        delete newErrors[path];
      });
      return newErrors;
    });
  }, []);

  const hasErrors = useCallback((fieldPaths?: string[]): boolean => {
    if (!fieldPaths) {
      return Object.keys(errors).length > 0;
    }
    
    return fieldPaths.some(path => errors[path]);
  }, [errors]);

  const getFieldError = useCallback((
    fieldPath: string, 
    displayLanguage: 'en' | 'zh' | 'both' = language
  ): string | undefined => {
    const error = errors[fieldPath];
    if (!error) return undefined;
    
    return getBilingualDisplay(error, displayLanguage);
  }, [errors, language]);

  const contextValue = useMemo(() => ({
    errors,
    validateField: validateFieldCallback,
    validateForm: validateFormCallback,
    clearErrors,
    hasErrors,
    getFieldError
  }), [
    errors,
    validateFieldCallback,
    validateFormCallback,
    clearErrors,
    hasErrors,
    getFieldError
  ]);

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
};

// Hook for real-time field validation
export const useFieldValidation = (
  fieldPath: string,
  value: any,
  rules?: ValidationRule[],
  validateOnChange: boolean = true
) => {
  const { validateField, getFieldError, clearErrors } = useValidation();
  const [isValidating, setIsValidating] = React.useState(false);

  const validate = useCallback(async () => {
    if (!validateOnChange) return;
    
    setIsValidating(true);
    
    // Add small delay for better UX (debounce effect)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    validateField(fieldPath, value, rules);
    setIsValidating(false);
  }, [fieldPath, value, rules, validateField, validateOnChange]);

  // Validate on value change
  React.useEffect(() => {
    if (validateOnChange && value !== undefined) {
      validate();
    }
  }, [value, validate, validateOnChange]);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => {
      clearErrors([fieldPath]);
    };
  }, [fieldPath, clearErrors]);

  const error = getFieldError(fieldPath);
  const hasError = Boolean(error);

  return {
    error,
    hasError,
    isValidating,
    validate: () => validateField(fieldPath, value, rules)
  };
};

// Component for displaying validation errors
interface ValidationErrorProps {
  fieldPath: string;
  language?: 'en' | 'zh' | 'both';
  className?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  fieldPath,
  language,
  className = 'text-sm text-red-600 mt-1'
}) => {
  const { getFieldError } = useValidation();
  const error = getFieldError(fieldPath, language);

  if (!error) return null;

  return (
    <div className={className} role="alert">
      {error}
    </div>
  );
};

// Higher-order component for form fields with validation
interface WithValidationProps {
  fieldPath: string;
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  children: (props: {
    error?: string;
    hasError: boolean;
    isValidating: boolean;
    validate: () => ValidationErrors;
  }) => React.ReactNode;
}

export const WithValidation: React.FC<WithValidationProps> = ({
  fieldPath,
  rules,
  validateOnChange = true,
  children
}) => {
  const [fieldValue, setFieldValue] = React.useState<any>();
  const validation = useFieldValidation(fieldPath, fieldValue, rules, validateOnChange);

  // This is a render prop pattern - children function receives validation state
  return (
    <>
      {children({
        error: validation.error,
        hasError: validation.hasError,
        isValidating: validation.isValidating,
        validate: validation.validate
      })}
    </>
  );
};