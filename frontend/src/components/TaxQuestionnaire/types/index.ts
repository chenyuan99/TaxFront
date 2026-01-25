// Core Type Definitions for Tax Questionnaire

export interface BilingualText {
  en: string;
  zh: string;
}

export interface QuestionnaireData {
  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    wechatId?: string;
  };
  
  // Spouse Information (conditional)
  spouseInfo?: {
    hasSpouse: boolean;
    firstName?: string;
    lastName?: string;
    ssnOrItin?: string;
    email?: string;
    dateOfBirth?: string;
    occupation?: string;
  };
  
  // Dependent Information
  dependentInfo: {
    hasDependents: boolean;
  };
  
  // Address Information
  addressInfo: {
    addressType: 'us' | 'foreign';
    usAddress?: USAddress;
    foreignAddress?: ForeignAddress;
  };
  
  // Payment/Refund Method
  paymentMethod: {
    method: 'check' | 'card' | 'direct_deposit';
    bankInfo?: BankingInfo;
  };
  
  // E-file PIN
  eFilePin: string;
  
  // Immigration History
  immigrationHistory: {
    isUSCitizen: boolean;
    firstEntryVisa?: string;
    firstEntryDate?: string;
    travelHistory?: string;
  };
  
  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    language: 'en' | 'zh' | 'both';
  };
}

export interface USAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ForeignAddress {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface BankingInfo {
  bankName: string;
  accountHolder: string;
  accountType: 'checking' | 'savings';
  accountNumber: string;
  routingNumber: string;
  accountNumberConfirm: string;
  confirmed: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'date' | 'custom';
  message: BilingualText;
  validator?: (value: any) => boolean;
}

export interface ValidationErrors {
  [fieldName: string]: BilingualText;
}

export interface FormStepProps {
  data: Partial<QuestionnaireData>;
  onUpdate: (updates: Partial<QuestionnaireData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
  errors: ValidationErrors;
  language: 'en' | 'zh' | 'both';
}

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: BilingualText[];
  completedSteps: number[];
}

export interface TaxQuestionnaireProps {
  userId: string;
  onComplete: (data: QuestionnaireData) => void;
  onSave?: (data: Partial<QuestionnaireData>) => void;
  initialData?: Partial<QuestionnaireData>;
  language?: 'en' | 'zh' | 'both';
}

export type FormStepType = 
  | 'personal'
  | 'spouse'
  | 'dependents'
  | 'address'
  | 'payment'
  | 'banking'
  | 'efilepin'
  | 'immigration'
  | 'review';

export interface StepConfig {
  type: FormStepType;
  title: BilingualText;
  description: BilingualText;
  component: React.ComponentType<FormStepProps>;
  isOptional?: boolean;
  showIf?: (data: Partial<QuestionnaireData>) => boolean;
}