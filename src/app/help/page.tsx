import { useNavigate } from 'react-router-dom';
import { SERVICES_HELP } from '@/components/help/faq-data';
import { FaqSection } from '@/components/help/faq-section';

export default function HelpPage() {
  const navigate = useNavigate();

  const openWizardForIntegration = (serviceId: string) => {
    navigate(`/integrations?open=${serviceId}&wizard=1`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
        <p className="text-muted mt-1">
          FAQ e guias passo a passo para configurar GitHub, GitLab, Jira, GitHub Copilot e Cursor.
        </p>
      </div>

      <div className="space-y-6">
        {SERVICES_HELP.map((service) => (
          <FaqSection
            key={service.id}
            service={service}
            onOpenWizardForIntegration={openWizardForIntegration}
          />
        ))}
      </div>
    </div>
  );
}
