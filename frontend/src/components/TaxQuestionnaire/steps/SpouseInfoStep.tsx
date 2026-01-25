import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const SpouseInfoStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Spouse Information / 配偶信息"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Spouse Info Step - Coming Soon</div>
    </FormStep>
  );
};