// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  dashboardSidebar: [
    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'dashboard/intro',
        'dashboard/components',
        'dashboard/state-management',
      ],
    },
  ],
  agentSidebar: [
    {
      type: 'category',
      label: 'Windows Agent',
      items: [
        'agent/intro',
        'agent/architecture',
        'agent/installation',
      ],
    },
  ],
  backendSidebar: [
    {
      type: 'category',
      label: 'NestJS Backend',
      items: [
        'backend/intro',
        'backend/database',
        'backend/auth',
      ],
    },
  ],
  extrasSidebar: [
    {
      type: 'category',
      label: 'Extras & Deployment',
      items: [
        'extras/cloudflare-setup',
        'extras/testing-deployment',
      ],
    },
  ],
};

export default sidebars;
