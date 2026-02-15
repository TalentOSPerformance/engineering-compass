import { useState } from 'react';
import type { ServiceHelp } from './faq-data';

interface SetupWizardProps {
  service: ServiceHelp;
  onClose: () => void;
  onGoToConfigure?: () => void;
}

export function SetupWizard({ service, onClose, onGoToConfigure }: SetupWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = service.wizardSteps;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface border border-border-default rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{service.icon}</span>
            <h2 className="text-lg font-semibold text-foreground">
              Guia: {service.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-hover"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-2 flex gap-1.5 overflow-x-auto">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStepIndex(i)}
              className={`shrink-0 w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                i === stepIndex
                  ? 'bg-blue-600 text-white'
                  : i < stepIndex
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-surface-hover text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {step && (
            <>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              {step.bullets && step.bullets.length > 0 && (
                <ul className="list-disc list-inside text-sm text-foreground-secondary space-y-1.5">
                  {step.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {step.code && (
                <pre className="text-xs bg-surface-hover rounded-lg p-3 overflow-x-auto text-foreground-secondary font-mono">
                  {step.code}
                </pre>
              )}
              {step.link && (
                <a
                  href={step.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
                >
                  {step.link.label} ↗
                </a>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface-hover/30">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-surface-hover disabled:opacity-50 disabled:pointer-events-none"
          >
            Anterior
          </button>
          <div className="flex gap-2">
            {onGoToConfigure && (stepIndex >= steps.length - 1 || stepIndex >= 1) && (
              <button
                type="button"
                onClick={onGoToConfigure}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Ir para configurar
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Concluir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
