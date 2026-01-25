import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const ReviewStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Review & Submit / 审核提交"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Review Step - Coming Soon</div>
    </FormStep>
  );
};