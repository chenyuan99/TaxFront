import React, { useState, useEffect, useCallback } from 'react';
import { TaxQuestionnaireProps, QuestionnaireData, StepConfig, FormStepType } from './types';
import { ProgressIndicator } from './ProgressIndicator';
import { ValidationProvider } from './ValidationEngine';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { useAutoSave } from './hooks/useAutoSave';
import { questionnaireService } from './services';
import { validateFormData, isStepValid } from './utils/validation';
import { STEP_LABELS, getBilingualDisplay, COMMON_TEXT } from './utils/bilingualText';

// Step configuration
const STEP_CONFIGS: StepConfig[] = [
  {
    type: 'personal',
    title: STEP_LABELS.PERSONAL,
    description: { en: 'Basic personal information', zh: '基本个人信息' },
    component: PersonalInfoStep,
  },
  // Additional steps will be added as they're implemented
];

export const TaxQuestionnaire: React.FC<TaxQuestionnaireProps> = ({
  userId,
  onComplete,
  onSave,
  initialData,
  language = 'both'
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QuestionnaireData>>(
    initialData || {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        wechatId: ''
      },
      dependentInfo: {
        hasDependents: false
      },
      addressInfo: {
        addressType: 'us'
      },
      paymentMethod: {
        method: 'check'
      },
      eFilePin: '',
      immigrationHistory: {
        isUSCitizen: false
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language
      }
    }
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save functionality
  const { saveNow, lastSaved, isSaving } = useAutoSave({
    userId,
    enabled: true,
    onSave: (data) => {
      console.log('Auto-saved questionnaire data');
      onSave?.(data);
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    }
  });

  // Load existing questionnaire data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const existingData = await questionnaireService.loadQuestionnaire(userId);
        if (existingData) {
          setFormData(existingData);
          
          // Determine completed steps based on data
          const completed: number[] = [];
          if (isStepValid('personal', existingData)) {
            completed.push(1);
          }
          setCompletedSteps(completed);
        }
      } catch (error) {
        console.error('Failed to load existing questionnaire:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [userId]);

  // Update form data and trigger auto-save
  const handleDataUpdate = useCallback((updates: Partial<QuestionnaireData>) => {
    const updatedData = {
      ...formData,
      ...updates,
      metadata: {
        ...formData.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    setFormData(updatedData);
    
    // Trigger auto-save
    saveNow(updatedData);
  }, [formData, saveNow]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    const nextStep = currentStep + 1;
    
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    if (nextStep <= STEP_CONFIGS.length) {
      setCurrentStep(nextStep);
    } else {
      // All steps completed, submit form
      handleSubmit();
    }
  }, [currentStep, completedSteps]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Submit questionnaire
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Final validation
      const errors = validateFormData(formData);
      if (Object.keys(errors).length > 0) {
        console.error('Form has validation errors:', errors);
        setIsSubmitting(false);
        return;
      }

      // Submit to backend
      const referenceNumber = await questionnaireService.submitQuestionnaire(
        userId, 
        formData as QuestionnaireData
      );
      
      // Call completion callback
      onComplete(formData as QuestionnaireData);
      
      console.log('Questionnaire submitted successfully:', referenceNumber);
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current step configuration
  const currentStepConfig = STEP_CONFIGS[currentStep - 1];
  const CurrentStepComponent = currentStepConfig?.component;

  // Validate current step
  const currentStepErrors = validateFormData(formData);
  const isCurrentStepValid = currentStepConfig ? 
    isStepValid(currentStepConfig.type, formData) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {getBilingualDisplay(COMMON_TEXT.LOADING, language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ValidationProvider language={language}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {language === 'zh' ? '个人问卷' : 'Personal Questionnaire'}
              {language === 'both' && <span className="block text-2xl mt-1">个人问卷</span>}
            </h1>
            <p className="text-gray-600">
              {language === 'zh' 
                ? '请填写以下信息以完成您的税务申报'
                : 'Please fill out the following information to complete your tax filing'
              }
              {language === 'both' && (
                <span className="block mt-1">
                  Please fill out the following information to complete your tax filing
                </span>
              )}
            </p>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={STEP_CONFIGS.length}
            stepLabels={STEP_CONFIGS.map(config => config.title)}
            completedSteps={completedSteps}
          />

          {/* Auto-save Status */}
          {(isSaving || lastSaved) && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">
                {isSaving ? (
                  <>
                    {language === 'zh' ? '正在保存...' : 'Saving...'}
                    {language === 'both' && ' / 正在保存...'}
                  </>
                ) : lastSaved ? (
                  <>
                    {language === 'zh' 
                      ? `已保存于 ${lastSaved.toLocaleTimeString()}`
                      : `Saved at ${lastSaved.toLocaleTimeString()}`
                    }
                    {language === 'both' && ` / 已保存于 ${lastSaved.toLocaleTimeString()}`}
                  </>
                ) : null}
              </p>
            </div>
          )}

          {/* Current Step */}
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={formData}
              onUpdate={handleDataUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isValid={isCurrentStepValid}
              errors={currentStepErrors}
              language={language}
            />
          )}

          {/* Submission Loading */}
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-700">
                  {language === 'zh' ? '正在提交问卷...' : 'Submitting questionnaire...'}
                  {language === 'both' && <span className="block">正在提交问卷...</span>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ValidationProvider>
  );
};