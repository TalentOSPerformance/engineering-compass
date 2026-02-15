/**
 * FAQ e steps dos wizards de configuração por serviço.
 * Serviços: GitHub, GitLab, Jira, GitHub Copilot, Cursor.
 */

export type ServiceId = 'github' | 'gitlab' | 'jira' | 'copilot' | 'cursor';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface WizardStep {
  title: string;
  description: string;
  bullets?: string[];
  link?: { label: string; url: string };
  code?: string;
}

export interface ServiceHelp {
  id: ServiceId;
  name: string;
  icon: string;
  faqs: FaqItem[];
  wizardSteps: WizardStep[];
}

export const SERVICES_HELP: ServiceHelp[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    faqs: [
      {
        question: 'Qual tipo de token devo usar: Classic ou Fine-Grained?',
        answer:
          'Ambos funcionam. Fine-Grained é mais seguro (escopo por repositório). Em Settings → Developer settings → Personal access tokens, crie um token com permissões de leitura: Repository → Contents, Pull requests, Metadata. Para backfill de deployments, inclua também Deployments.',
      },
      {
        question: 'O backfill falha com "Repositório não encontrado". O que fazer?',
        answer:
          'Verifique: (1) O nome está no formato org/repo (ex: afya-b2b/solutionshub.web). (2) O token tem acesso ao repositório (em caso de repo privado, use um token com permissão na org ou no repo). (3) Não use a URL completa no campo de repos — use só org/repo.',
      },
      {
        question: 'Como configuro o webhook no GitHub?',
        answer:
          'Gere um segredo forte (ex: openssl rand -hex 32). No GitHub: repositório ou organização → Settings → Webhooks → Add webhook. Payload URL: https://SUA_API/api/v1/webhooks/ingest/github. Content type: application/json. Em "Secret" cole o segredo. No servidor, defina GITHUB_WEBHOOK_SECRET no .env com o mesmo valor.',
      },
      {
        question: 'Quais repositórios serão sincronizados?',
        answer:
          'Os repositórios que você informar no primeiro backfill manual (campo "Repos"). Eles ficam vinculados à organização. O backfill automático (a cada 6h) sincroniza apenas esses repos. Para adicionar mais, rode um backfill manual com os novos nomes.',
      },
      {
        question: 'Posso usar repositórios de várias organizações no GitHub?',
        answer:
          'Sim. Você pode cadastrar uma conexão por organização do GitHub (cada uma com seu próprio token): em Integrações → GitHub, use "Adicionar conexão" e informe o slug da organização (ex.: minha-org) e o token. No backfill, informe os repos no formato org1/repo1 org2/repo2; o sistema usa o token da conexão correspondente a cada org. Métricas de Copilot são agregadas de todas as conexões.',
      },
    ],
    wizardSteps: [
      {
        title: 'Criar um Personal Access Token',
        description: 'O token permite que o TalentOS leia PRs, commits e deployments.',
        bullets: [
          'No GitHub: Settings → Developer settings → Personal access tokens.',
          'Classic: em "Scopes" marque repo (acesso completo a repositórios).',
          'Fine-Grained: crie um token com Repository permissions: Contents, Pull requests, Metadata (e opcionalmente Deployments).',
          'Copie o token (ghp_... ou github_pat_...) e guarde — ele não será exibido de novo.',
        ],
        link: { label: 'Abrir GitHub → Tokens', url: 'https://github.com/settings/tokens' },
      },
      {
        title: 'Configurar a integração no TalentOS',
        description: 'Cole o token na página de Integrações.',
        bullets: [
          'Em Integrações, clique em Configurar no card GitHub.',
          'Cole o token no campo "Token de acesso".',
          'Clique em "Testar conexão" e depois em "Salvar".',
        ],
      },
      {
        title: 'Vincular repositórios (backfill)',
        description: 'Informe quais repositórios deseja monitorar.',
        bullets: [
          'Na seção "Historical backfill", escolha Source: GitHub.',
          'No campo "Repos", digite os nomes no formato org/repo, separados por espaço (ex: org1/repo1 org2/repo2).',
          'Clique em "Start backfill". Os repos serão vinculados e os dados históricos importados.',
        ],
      },
      {
        title: 'Opcional: Webhook para tempo real',
        description: 'Para atualizações instantâneas ao abrir/fechar PRs.',
        bullets: [
          'Gere um segredo (ex: openssl rand -hex 32).',
          'No GitHub: repo ou org → Settings → Webhooks → Add webhook.',
          'Payload URL: https://SUA_API/api/v1/webhooks/ingest/github. Content type: application/json. Secret: o segredo gerado.',
          'No .env do servidor: GITHUB_WEBHOOK_SECRET=mesmo_segredo.',
        ],
      },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    faqs: [
      {
        question: 'Funciona com GitLab self-hosted?',
        answer:
          'Sim. No campo "Base URL" informe a URL da sua instância (ex: https://gitlab.minhaempresa.com). O token deve ter permissão de leitura nos projetos desejados.',
      },
      {
        question: 'Como gero um Access Token no GitLab?',
        answer:
          'Em GitLab: User Settings → Access Tokens. Crie um token com escopos read_api e read_repository (e opcionalmente read_registry se precisar). Use o token que começa com glpat-.',
      },
      {
        question: 'Como defino os projetos (repositórios) no backfill?',
        answer:
          'Use o caminho do projeto no GitLab, no formato org/grupo/projeto (ex: minha-org/backend/api). No "Historical backfill", em Repos, coloque um por linha ou separados por espaço. Após o primeiro backfill, eles ficam vinculados à organização.',
      },
    ],
    wizardSteps: [
      {
        title: 'Criar um Access Token',
        description: 'O token permite leitura de projetos e merge requests.',
        bullets: [
          'No GitLab: ícone do usuário → Preferences → Access Tokens.',
          'Nome: ex. "TalentOS". Scopes: read_api, read_repository.',
          'Crie e copie o token (glpat-...).',
        ],
        link: { label: 'Abrir GitLab → Access Tokens', url: 'https://gitlab.com/-/user_settings/personal_access_tokens' },
      },
      {
        title: 'Configurar Base URL e token no TalentOS',
        description: 'Para GitLab.com use https://gitlab.com. Para self-hosted, use a URL da sua instância.',
        bullets: [
          'Em Integrações, clique em Configurar no card GitLab.',
          'Base URL: https://gitlab.com (ou sua instância).',
          'Cole o Access Token. Teste e salve.',
        ],
      },
      {
        title: 'Vincular projetos (backfill)',
        description: 'Informe o caminho dos projetos que deseja monitorar.',
        bullets: [
          'Em "Historical backfill", Source: GitLab.',
          'Repos: caminho do projeto (ex: grupo/subgrupo/projeto), separados por espaço.',
          'Clique em "Start backfill".',
        ],
      },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: '📋',
    faqs: [
      {
        question: 'Qual URL do Jira devo usar?',
        answer:
          'A URL base da sua instância Atlassian, sem barra no final. Ex: https://sua-empresa.atlassian.net. Para Jira Data Center/Server use a URL que você acessa no navegador.',
      },
      {
        question: 'Como gero um API Token no Atlassian?',
        answer:
          'Acesse https://id.atlassian.com/manage-profile/security/api-tokens. Clique em "Create API token", dê um nome (ex: TalentOS) e copie o token (começa com ATATT3...). Use o e-mail da sua conta Atlassian no campo "E-mail" da integração.',
      },
      {
        question: 'Quais project keys devo usar no backfill?',
        answer:
          'São as siglas dos projetos no Jira (ex: ENG, PLATFORM, BACKEND). Aparecem na URL das issues (jira.../browse/ENG-123). No backfill, informe as keys separadas por espaço. O sistema importa Stories, Bugs e Tasks atualizados no período.',
      },
    ],
    wizardSteps: [
      {
        title: 'Criar um API Token (Atlassian)',
        description: 'Necessário para a API do Jira autenticar o TalentOS.',
        bullets: [
          'Acesse o gerenciador de tokens da Atlassian (link abaixo).',
          'Create API token → nome ex: TalentOS → Copy.',
          'Guarde o token (ATATT3...); use o mesmo e-mail da conta Atlassian no TalentOS.',
        ],
        link: { label: 'Atlassian API Tokens', url: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
      },
      {
        title: 'Preencher Jira URL e credenciais no TalentOS',
        description: 'URL base da instância + e-mail + API Token.',
        bullets: [
          'Jira URL: https://sua-empresa.atlassian.net (sem barra no final).',
          'E-mail: o e-mail da sua conta Atlassian.',
          'API Token: o token criado no passo anterior. Teste e salve.',
        ],
      },
      {
        title: 'Definir projetos no backfill',
        description: 'Informe as project keys que deseja importar.',
        bullets: [
          'Em "Historical backfill", Source: Jira.',
          'Project keys: ex. ENG PLATFORM (siglas dos projetos, separadas por espaço).',
          'Start backfill para importar issues e sprints.',
        ],
      },
    ],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: '🤖',
    faqs: [
      {
        question: 'De onde vêm os dados do Copilot?',
        answer:
          'Os dados vêm da API de métricas do GitHub (GET /orgs/{org}/copilot/metrics). É necessário: organização com Copilot Business/Enterprise, uma conexão GitHub com o slug da organização preenchido e token Classic (PAT) com escopo read:org ou manage_billing:copilot — tokens Fine-Grained podem não ser suportados por essa API.',
      },
      {
        question: 'O que é exibido na página AI Tools?',
        answer:
          'Métricas de uso do Copilot: aceitação de sugestões, linhas sugeridas vs aceitas, uso por linguagem, etc. Os dados são agregados por organização e podem ser cacheados por alguns minutos.',
      },
      {
        question: 'Não vejo dados de Copilot. O que verificar?',
        answer:
          'Confirme: (1) Em Integrações → GitHub, a conexão usada para Copilot tem o campo "Organização GitHub" (slug da org) preenchido. (2) A API de métricas Copilot do GitHub aceita token Classic (PAT) com escopo read:org ou manage_billing:copilot; tokens Fine-Grained podem não funcionar — use um Classic PAT só para essa conexão se necessário. (3) A organização tem licença Copilot Business/Enterprise e a política "Copilot Metrics API" está habilitada. (4) Há uso de Copilot no período (mínimo de usuários ativos por dia).',
      },
      {
        question: 'Posso usar token Fine-Grained para métricas Copilot?',
        answer:
          'A API de métricas Copilot (GET /orgs/{org}/copilot/metrics) do GitHub documenta escopos para tokens Classic (read:org, manage_billing:copilot). Fine-Grained PATs podem não ter permissão equivalente para esse endpoint. Se não aparecerem dados, crie um Classic PAT com escopo read:org, adicione uma conexão GitHub em Integrações com o slug da organização e esse token, e use-o apenas para Copilot (ou para essa org).',
      },
    ],
    wizardSteps: [
      {
        title: 'Requisitos: Copilot e token',
        description: 'A organização precisa de GitHub Copilot Business ou Enterprise.',
        bullets: [
          'Licença: GitHub Copilot para negócios na organização.',
          'Conexão GitHub: em Integrações, adicione uma conexão com o slug da organização (ex.: minha-org) e um token com permissão para métricas.',
          'Use um token Classic (PAT) com escopo read:org ou manage_billing:copilot — a API de métricas Copilot pode não aceitar Fine-Grained.',
        ],
        link: { label: 'GitHub Copilot for Business', url: 'https://github.com/features/copilot/business' },
      },
      {
        title: 'Verificar permissões do token',
        description: 'O token deve poder acessar usage data da organização.',
        bullets: [
          'Classic PAT: em GitHub → Settings → Developer settings → Personal access tokens (classic), crie um token com scope read:org (ou manage_billing:copilot).',
          'Fine-Grained: a API de métricas Copilot pode não suportar; se não houver dados, use um Classic PAT para a conexão usada no Copilot.',
          'Na integração: preencha o campo "Organização GitHub" com o slug da org. Após salvar, acesse Métricas → AI Tools.',
        ],
      },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '◈',
    faqs: [
      {
        question: 'O TalentOS integra com Cursor hoje?',
        answer:
          'A integração com Cursor (editor com IA) pode ser feita de formas diferentes: uso de métricas exportadas, API futura do Cursor, ou dados agregados. Hoje o foco das métricas de "AI Tools" está no GitHub Copilot; Cursor pode ser incluído quando houver API ou convenção de dados disponível.',
      },
      {
        question: 'Onde configuro Cursor?',
        answer:
          'Se existir uma integração específica para Cursor nas Integrações, use o guia passo a passo associado. Caso contrário, métricas de uso de IA no código podem vir do Copilot ou de fontes que a sua organização definir (ex: exportações manuais).',
      },
    ],
    wizardSteps: [
      {
        title: 'Suporte a Cursor',
        description: 'Cursor é um editor com IA. A integração no TalentOS depende de API ou convenção de dados.',
        bullets: [
          'Atualmente a área AI Tools prioriza dados do GitHub Copilot.',
          'Se sua equipe usa Cursor, você pode acompanhar métricas de código via GitHub (commits, PRs) já vinculados.',
          'Integração nativa com Cursor (usage, aceitação de sugestões) pode ser adicionada quando houver API ou formato de exportação disponível.',
        ],
        link: { label: 'Cursor', url: 'https://cursor.com' },
      },
    ],
  },
];

export function getServiceHelp(id: ServiceId): ServiceHelp | undefined {
  return SERVICES_HELP.find((s) => s.id === id);
}
