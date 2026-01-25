import React from 'react';
import { FormStepProps } from '../types';
import { FormStep } from '../FormStep';

export const ImmigrationHistoryStep: React.FC<FormStepProps> = (props) => {
  return (
    <FormStep
      title="Immigration History / 移民历史"
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      isValid={props.isValid}
      language={props.language}
      data={props.data}
      onUpdate={props.onUpdate}
      errors={props.errors}
    >
      <div>Immigration History Step - Coming Soon</div>
    </FormStep>
  );
};