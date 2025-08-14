import React from "react";

const CustomStepper = ({ 
  steps, 
  currentStep,
  titleFontSize = "text-xs", // text-xs, text-sm, text-base, text-lg
  titleFontWeight = "font-medium", // font-light, font-normal, font-bold
  circleFontSize = "text-sm", // text-xs, text-sm, text-base
  circleFontWeight = "font-semibold" // font-medium, font-semibold
}) => {
  return (
    <div className="flex items-center justify-between mb-8 px-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${circleFontSize} ${circleFontWeight} transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
              
              {/* Step Title */}
              <div
                className={`mt-2 ${titleFontSize} ${titleFontWeight} text-center max-w-20 ${
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={`h-0.5 transition-all duration-300 ${
                    stepNumber < currentStep
                      ? "bg-green-500"
                      : stepNumber === currentStep
                      ? "bg-gradient-to-r from-blue-500 to-gray-200"
                      : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomStepper;