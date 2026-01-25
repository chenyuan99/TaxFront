import React from 'react';
import { ProgressIndicatorProps } from './types';
import { getBilingualDisplay } from './utils/bilingualText';

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  completedSteps
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = completedSteps.includes(stepNumber);
            const isCurrent = stepNumber === currentStep;
            const isPast = stepNumber < currentStep;
            
            return (
              <div key={index} className="relative flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    isCompleted || isPast
                      ? 'bg-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium max-w-20 ${
                      isCurrent
                        ? 'text-indigo-600'
                        : isCompleted || isPast
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {getBilingualDisplay(label, 'both')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Progress Text */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps} / 第{currentStep}步，共{totalSteps}步
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round(progressPercentage)}% Complete / 完成度 {Math.round(progressPercentage)}%
        </p>
      </div>
    </div>
  );
};