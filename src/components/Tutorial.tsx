import React, { useCallback } from 'react';
import { Joyride, ACTIONS, STATUS } from 'react-joyride';
import type { Step, EventData, Controls, TooltipRenderProps } from 'react-joyride';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface TutorialProps {
  run: boolean;
  steps: Step[];
  onComplete: () => void;
  onSkip: () => void;
}

const CustomTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isLastStep,
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 max-w-md w-[90vw] md:w-[400px] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-base leading-tight">
          {step.title as string}
        </h3>
        <button
          {...closeProps}
          className="text-white/70 hover:text-white transition-colors p-1 -mr-1"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-slate-600 text-sm leading-relaxed">{step.content as string}</p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Step Counter */}
          <span className="text-xs font-medium text-slate-400 tracking-wider">
            {index + 1} / {size}
          </span>

          {/* Skip Button */}
          {!isLastStep && (
            <button
              {...skipProps}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <SkipForward size={12} />
              Skip Tour
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Back Button */}
          {index > 0 && (
            <button
              {...backProps}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}

          {/* Next / Finish Button */}
          {continuous && (
            <button
              {...primaryProps}
              className="flex items-center gap-1 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Step Dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {Array.from({ length: size }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === index
                ? 'bg-blue-600 w-4'
                : i < index
                  ? 'bg-blue-300'
                  : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export const Tutorial: React.FC<TutorialProps> = ({ run, steps, onComplete, onSkip }) => {
  const handleEvent = useCallback(
    (data: EventData, controls: Controls) => {
      const { status, action } = data;

      if (status === STATUS.FINISHED) {
        onComplete();
      } else if (status === STATUS.SKIPPED) {
        onSkip();
      } else if (action === ACTIONS.CLOSE) {
        controls.stop();
        onSkip();
      }
    },
    [onComplete, onSkip]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      tooltipComponent={CustomTooltip}
      options={{
        overlayClickAction: false,
        overlayColor: 'rgba(15, 23, 42, 0.6)',
        spotlightRadius: 16,
        zIndex: 10000,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
    />
  );
};
