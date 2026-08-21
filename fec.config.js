const path = require('path');

const extraExposes = {};

const getRoutes = () => {
  const routes = {};

  if (process.env.USE_LOCAL_RASA && process.env.USE_LOCAL_RASA !== '') {
    routes['/api/virtual-assistant/v2'] = { host: 'http://localhost:5000' };
  }

  // Local MAS backend: USE_LOCAL_MAS=1 npm run start
  if (process.env.USE_LOCAL_MAS && process.env.USE_LOCAL_MAS !== '') {
    routes['/api/mas'] = {
      host: 'http://127.0.0.1:8002',
      pathRewrite: { '^/api/mas': '' },
    };
  }

  return Object.keys(routes).length > 0 ? routes : undefined;
};

module.exports = {
  appUrl: ['/go-to-landing-page'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  routes: getRoutes(),
  interceptChromeConfig: false,
  // Local dev only: needed for npm link to resolve ai-client-common from this project's node_modules.
  // Remove before merging — not needed when mas-client is installed from npm.
  resolve: {
    alias: {
      '@redhat-cloud-services/ai-client-common': path.resolve(__dirname, 'node_modules/@redhat-cloud-services/ai-client-common'),
    },
  },
  moduleFederation: {
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          version: '^6.3.0',
        },
      },
    ],
    exposes: {
      './AstroVirtualAssistant': path.resolve(__dirname, './src/SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant.tsx'),
      './VAEmbed': path.resolve(__dirname, './src/SharedComponents/VAEmbed/VAEmbed.tsx'),
      './useArhChatbot': path.resolve(__dirname, './src/aiClients/useArhClient.ts'),
      './useRhelChatbot': path.resolve(__dirname, './src/aiClients/useRhelLightSpeedManager.ts'),
      './useVaChatbot': path.resolve(__dirname, './src/aiClients/useVaManager.ts'),
      './useHccAiChatbot': path.resolve(__dirname, './src/aiClients/useHccAiManager.ts'),
      './useMasChatbot': path.resolve(__dirname, './src/aiClients/useMasClient.ts'),
      './state/globalState': path.resolve(__dirname, './src/utils/VirtualAssistantStateSingleton.ts'),
      ...extraExposes,
    },
  },
  plugins: [],
  sassPrefix: '.virtualAssistant',
  hotReload: process.env.HOT === 'true',
};
