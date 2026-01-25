import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const AddressInfoStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Address Information / 地址信息"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Address Info Step - Coming Soon</div>
    </FormStep>
  );
};