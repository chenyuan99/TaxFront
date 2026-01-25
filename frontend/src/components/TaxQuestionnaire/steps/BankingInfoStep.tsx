import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const BankingInfoStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Banking Information / 银行信息"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Banking Info Step - Coming Soon</div>
    </FormStep>
  );
};