import React from 'react';
import { FormStepProps } from './types';
import { getBilingualDisplay, COMMON_TEXT } from './utils/bilingualText';

export interface BaseFormStepProps extends FormStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showNavigation?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export const FormStep: React.FC<BaseFormStepProps> = ({
  title,
  description,
  children,
  showNavigation = true,
  canGoNext = true,
  canGoPrevious = true,
  onNext,
  onPrevious,
  isValid,
  language = 'both'
}) => {
  const handleNext = () => {
    if (isValid && canGoNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Step Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600">
            {description}
          </p>
        )}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {children}
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              canGoPrevious
                ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                : 'text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            {getBilingualDisplay(COMMON_TEXT.PREVIOUS, language)}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!isValid || !canGoNext}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isValid && canGoNext
                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            {getBilingualDisplay(COMMON_TEXT.NEXT, language)}
          </button>
        </div>
      )}
    </div>
  );
};

// Base form field component for consistent styling
export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  language?: 'en' | 'zh' | 'both';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  language = 'both'
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && (
          <span className="text-red-500 ml-1">
            *{language !== 'en' && ' / 必填'}
          </span>
        )}
      </label>
      
      <div className={error ? 'mb-1' : ''}>
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

// Input component with consistent styling
export interface FormInputProps {
  type?: 'text' | 'email' | 'tel' | 'date' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
        error
          ? 'border-red-300 text-red-900 placeholder-red-300'
          : 'border-gray-300 text-gray-900 placeholder-gray-400'
      } ${
        disabled
          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
          : 'bg-white'
      }`}
    />
  );
};

// Select component with consistent styling
export interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
        error
          ? 'border-red-300 text-red-900'
          : 'border-gray-300 text-gray-900'
      } ${
        disabled
          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
          : 'bg-white'
      }`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};