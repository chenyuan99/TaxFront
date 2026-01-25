import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const PaymentMethodStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Payment Method / 付款方式"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Payment Method Step - Coming Soon</div>
    </FormStep>
  );
};