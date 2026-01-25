import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const DependentInfoStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Dependent Information / 受抚养人信息"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Dependent Info Step - Coming Soon</div>
    </FormStep>
  );
};