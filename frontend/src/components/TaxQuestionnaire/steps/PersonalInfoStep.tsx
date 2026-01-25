import React from 'react';
import { FormStepProps } from '../types';
import { FormStep, FormField, FormInput } from '../FormStep';
import { getBilingualDisplay, FIELD_LABELS, STEP_LABELS } from '../utils/bilingualText';
import { useFieldValidation } from '../ValidationEngine';
import { VALIDATION_RULES } from '../utils/validation';

export const PersonalInfoStep: React.FC<FormStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isValid,
  errors,
  language = 'both'
}) => {
  const personalInfo = data.personalInfo || {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    wechatId: ''
  };

  const handleFieldChange = (field: keyof typeof personalInfo, value: string) => {
    const updatedPersonalInfo = {
      ...personalInfo,
      [field]: value
    };
    
    onUpdate({
      ...data,
      personalInfo: updatedPersonalInfo
    });
  };

  // Field validation hooks
  const firstNameValidation = useFieldValidation(
    'personalInfo.firstName',
    personalInfo.firstName,
    VALIDATION_RULES['personalInfo.firstName']
  );

  const lastNameValidation = useFieldValidation(
    'personalInfo.lastName',
    personalInfo.lastName,
    VALIDATION_RULES['personalInfo.lastName']
  );

  const emailValidation = useFieldValidation(
    'personalInfo.email',
    personalInfo.email,
    VALIDATION_RULES['personalInfo.email']
  );

  const phoneValidation = useFieldValidation(
    'personalInfo.phoneNumber',
    personalInfo.phoneNumber,
    VALIDATION_RULES['personalInfo.phoneNumber']
  );

  return (
    <FormStep
      title={getBilingualDisplay(STEP_LABELS.PERSONAL, language)}
      description="Please provide your basic personal information / 请提供您的基本个人信息"
      onNext={onNext}
      onPrevious={onPrevious}
      isValid={isValid}
      canGoPrevious={false} // First step
      language={language}
      data={data}
      onUpdate={onUpdate}
      errors={errors}
    >
      <div className="space-y-6">
        {/* First Name */}
        <FormField
          label={getBilingualDisplay(FIELD_LABELS.FIRST_NAME, language)}
          required
          error={firstNameValidation.error}
          language={language}
        >
          <FormInput
            type="text"
            value={personalInfo.firstName}
            onChange={(value) => handleFieldChange('firstName', value)}
            placeholder={language === 'zh' ? '请输入您的名字' : 'Enter your first name'}
            error={firstNameValidation.hasError}
          />
        </FormField>

        {/* Last Name */}
        <FormField
          label={getBilingualDisplay(FIELD_LABELS.LAST_NAME, language)}
          required
          error={lastNameValidation.error}
          language={language}
        >
          <FormInput
            type="text"
            value={personalInfo.lastName}
            onChange={(value) => handleFieldChange('lastName', value)}
            placeholder={language === 'zh' ? '请输入您的姓氏' : 'Enter your last name'}
            error={lastNameValidation.hasError}
          />
        </FormField>

        {/* Email */}
        <FormField
          label={getBilingualDisplay(FIELD_LABELS.EMAIL, language)}
          required
          error={emailValidation.error}
          language={language}
        >
          <FormInput
            type="email"
            value={personalInfo.email}
            onChange={(value) => handleFieldChange('email', value)}
            placeholder={language === 'zh' ? '请输入您的邮箱地址' : 'Enter your email address'}
            error={emailValidation.hasError}
          />
        </FormField>

        {/* Phone Number */}
        <FormField
          label={getBilingualDisplay(FIELD_LABELS.PHONE, language)}
          required
          error={phoneValidation.error}
          language={language}
        >
          <FormInput
            type="tel"
            value={personalInfo.phoneNumber}
            onChange={(value) => handleFieldChange('phoneNumber', value)}
            placeholder={language === 'zh' ? '请输入10位美国电话号码' : 'Enter 10-digit U.S. phone number'}
            error={phoneValidation.hasError}
          />
          <div className="mt-2 text-sm text-gray-600">
            {language === 'zh' ? (
              <>如无美国电话，请输入 0000000000 (10个0)</>
            ) : (
              <>If you don't have a U.S. phone number, please enter 0000000000</>
            )}
            {language === 'both' && (
              <div className="mt-1">
                If you don't have a U.S. phone number, please enter 0000000000
              </div>
            )}
          </div>
        </FormField>

        {/* WeChat ID (Optional) */}
        <FormField
          label={getBilingualDisplay(FIELD_LABELS.WECHAT_ID, language)}
          language={language}
        >
          <FormInput
            type="text"
            value={personalInfo.wechatId || ''}
            onChange={(value) => handleFieldChange('wechatId', value)}
            placeholder={language === 'zh' ? '请输入您的微信号（可选）' : 'Enter your WeChat ID (optional)'}
          />
        </FormField>
      </div>
    </FormStep>
  );
};