import { useState } from 'react';
import type { ServiceHelp, FaqItem } from './faq-data';
import { SetupWizard } from './setup-wizard';

interface FaqSectionProps {
  service: ServiceHelp;
  onOpenWizardForIntegration?: (serviceId: string) => void;
}

function FaqItemRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-default last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left py-4 flex items-center justify-between gap-2"
      >
        <span className="font-medium text-foreground-secondary text-sm">{item.question}</span>
        <span className="text-muted-foreground shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export function FaqSection({ service, onOpenWizardForIntegration }: FaqSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleGoToConfigure = () => {
    setWizardOpen(false);
    onOpenWizardForIntegration?.(service.id);
  };

  return (
    <section className="rounded-xl border border-border-default bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-hover/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{service.icon}</span>
          <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Guia passo a passo
        </button>
      </div>
      <div className="px-6 divide-y-0">
        {service.faqs.map((item, i) => (
          <FaqItemRow key={i} item={item} />
        ))}
      </div>
      {wizardOpen && (
        <SetupWizard
          service={service}
          onClose={() => setWizardOpen(false)}
          onGoToConfigure={onOpenWizardForIntegration ? handleGoToConfigure : undefined}
        />
      )}
    </section>
  );
}
