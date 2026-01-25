# Design Document

## Overview

The Tax Questionnaire is a comprehensive multi-step form system built as a React TypeScript component that collects taxpayer information for tax preparation services. The system features bilingual support (English/Chinese), real-time validation, auto-save functionality, and secure data handling. The questionnaire is designed to integrate seamlessly with TaxFront's existing Firebase-based architecture.

## Architecture

The Tax Questionnaire follows a modular, component-based architecture:

```
TaxQuestionnaire (Main Container)
├── ProgressIndicator (Step tracking)
├── FormSteps (Step management)
│   ├── PersonalInfoStep
│   ├── SpouseInfoStep (conditional)
│   ├── DependentInfoStep
│   ├── AddressInfoStep
│   ├── PaymentMethodStep
│   ├── BankingInfoStep (conditional)
│   ├── EFilePinStep
│   ├── ImmigrationHistoryStep
│   └── ReviewStep
├── ValidationEngine (Real-time validation)
├── AutoSaveManager (Data persistence)
└── LanguageProvider (Bilingual support)
```

### Data Flow

1. **User Input** → **Validation Engine** → **Auto-Save Manager** → **Firestore**
2. **Form Navigation** → **Progress Indicator Update** → **Step Transition**
3. **Form Submission** → **Final Validation** → **Data Processing** → **Confirmation**

## Components and Interfaces

### Core Components

#### TaxQuestionnaire (Main Container)
```typescript
interface TaxQuestionnaireProps {
  userId: string;
  onComplete: (data: QuestionnaireData) => void;
  onSave?: (data: Partial<QuestionnaireData>) => void;
  initialData?: Partial<QuestionnaireData>;
  language?: 'en' | 'zh' | 'both';
}
```

#### FormStep (Base Step Component)
```typescript
interface FormStepProps {
  data: Partial<QuestionnaireData>;
  onUpdate: (updates: Partial<QuestionnaireData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
  errors: ValidationErrors;
}
```

#### ProgressIndicator
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: BilingualText[];
  completedSteps: number[];
}
```

### Data Models

#### QuestionnaireData
```typescript
interface QuestionnaireData {
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
```

#### Validation Models
```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'date' | 'custom';
  message: BilingualText;
  validator?: (value: any) => boolean;
}

interface ValidationErrors {
  [fieldName: string]: BilingualText;
}

interface BilingualText {
  en: string;
  zh: string;
}
```

### Service Interfaces

#### QuestionnaireService
```typescript
interface QuestionnaireService {
  saveQuestionnaire(userId: string, data: Partial<QuestionnaireData>): Promise<void>;
  loadQuestionnaire(userId: string): Promise<QuestionnaireData | null>;
  submitQuestionnaire(userId: string, data: QuestionnaireData): Promise<string>;
  validateField(field: string, value: any, rules: ValidationRule[]): ValidationErrors;
}
```

#### AutoSaveManager
```typescript
interface AutoSaveManager {
  enableAutoSave(userId: string, callback: (data: Partial<QuestionnaireData>) => void): void;
  disableAutoSave(): void;
  saveNow(data: Partial<QuestionnaireData>): Promise<void>;
  getLastSaved(): Date | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, I identified several properties that can be consolidated:
- Multiple validation properties can be combined into comprehensive validation properties
- Navigation properties can be unified into form navigation properties
- Language display properties can be consolidated into bilingual rendering properties
- Auto-save and data persistence properties can be combined

### Core Properties

**Property 1: Form Navigation Consistency**
*For any* form step and user interaction, navigation should maintain data integrity and proper step progression according to completion status
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

**Property 2: Bilingual Content Completeness**
*For any* form element (labels, instructions, error messages), both English and Chinese text should be present and properly formatted
**Validates: Requirements 2.1, 2.2, 12.2**

**Property 3: Input Validation Consistency**
*For any* form field with validation rules, invalid input should be rejected with appropriate error messages, and valid input should be accepted
**Validates: Requirements 3.2, 3.3, 8.2, 9.1, 10.1, 12.1**

**Property 4: Conditional Field Display**
*For any* conditional form section, fields should appear or disappear based on user selections, and validation should adjust accordingly
**Validates: Requirements 4.1, 4.2, 6.1, 6.2, 8.1**

**Property 5: Data Persistence Round-trip**
*For any* form data that is auto-saved, retrieving and restoring the data should produce equivalent form state
**Validates: Requirements 11.1, 11.2**

**Property 6: Form Completion Validation**
*For any* form submission attempt, the system should only allow submission when all required fields are valid and complete
**Validates: Requirements 13.1, 13.2**

**Property 7: Required Field Enforcement**
*For any* form step, attempting to proceed without completing required fields should prevent advancement and highlight missing information
**Validates: Requirements 3.1, 5.1, 7.1**

## Error Handling

### Validation Error Handling
- Real-time field validation with immediate feedback
- Bilingual error messages for all validation failures
- Visual indicators (red borders, error icons) for invalid fields
- Prevention of form progression until errors are resolved

### Network Error Handling
- Graceful handling of auto-save failures with retry logic
- Offline mode detection with local storage fallback
- Connection restoration with automatic data synchronization
- User notification of network issues without data loss

### Data Recovery
- Automatic recovery of unsaved changes on page reload
- Conflict resolution for concurrent editing sessions
- Backup data storage with configurable retention periods
- Manual data export/import capabilities for data portability

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific functionality and property-based tests for comprehensive validation:

**Unit Tests:**
- Individual form field validation
- Component rendering with different props
- User interaction handling (clicks, input changes)
- Error state management
- Language switching functionality

**Property-Based Tests:**
- Form navigation behavior across all steps
- Validation consistency across different input types
- Data persistence and recovery scenarios
- Bilingual content rendering
- Conditional field display logic

### Property Test Configuration
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: tax-questionnaire, Property {number}: {property_text}**
- Comprehensive input generation for edge cases
- Integration with Firebase emulators for backend testing

### Testing Tools
- **Frontend**: Vitest for unit tests, React Testing Library for component tests
- **Property Testing**: fast-check for TypeScript property-based testing
- **Integration**: Firebase emulators for end-to-end testing
- **Validation**: Custom generators for form data and user interactions