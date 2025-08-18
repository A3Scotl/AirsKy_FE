import React from "react";

const CustomStepper = ({
  steps,
  currentStep,
  titleFontSize = "text-xs", // text-xs, text-sm, text-base, text-lg
  titleFontWeight = "font-medium", // font-light, font-normal, font-bold
  circleFontSize = "text-sm", // text-xs, text-sm, text-base
  circleFontWeight = "font-semibold", // font-medium, font-semibold
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Desktop Stepper */}
      <div className="hidden sm:flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step Item */}
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${circleFontSize} ${circleFontWeight} transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
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
                  className={`mt-2 ${titleFontSize} ${titleFontWeight} text-center max-w-16 md:max-w-20 ${
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
                <div className="flex-1 px-2 md:px-4">
                  <div
                    className={`h-0.5 w-full mt-4 transition-all duration-300 ${
                      stepNumber < currentStep
                        ? "bg-green-500"
                        : stepNumber === currentStep
                        ? "bg-gradient-to-r from-blue-500 to-gray-200"
                        : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden">
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <div className="flex items-center">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;

                return (
                  <React.Fragment key={index}>
                    {/* Step Circle */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-3 h-3"
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

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-1">
                        <div
                          className={`h-0.5 w-full transition-all duration-300 ${
                            stepNumber < currentStep
                              ? "bg-green-500"
                              : stepNumber === currentStep
                              ? "bg-gradient-to-r from-blue-500 to-gray-200"
                              : "bg-gray-200"
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Step Title for Mobile */}
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-600">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomStepper;
