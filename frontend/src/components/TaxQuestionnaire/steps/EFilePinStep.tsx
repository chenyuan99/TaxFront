import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const EFilePinStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="E-file PIN / 电子报税PIN"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>E-file PIN Step - Coming Soon</div>
    </FormStep>
  );
};