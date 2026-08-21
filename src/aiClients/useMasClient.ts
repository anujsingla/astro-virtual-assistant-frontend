import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import { MASClient } from '@redhat-cloud-services/mas-client';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useMemo, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';

import { Models, StateManagerConfiguration, UseManagerHook } from './types';
import { MAS_ENABLED_FLAG } from './flags';
import MASFooter from '../Components/MASClient/MASFooter';

const MAS_BLUEPRINT_ID = "f8604096-8cf5-42af-9a90-044b36bedbab";

export function useMasAuthenticated() {
  // const flagEnabled = useFlag(MAS_ENABLED_FLAG);
  const flagEnabled = true;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const chrome = useChrome();

  async function handleMasSetup() {
    if (!flagEnabled) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const user = await chrome.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
      console.error('Failed to check MAS chatbot auth', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleMasSetup();
  }, [chrome.auth.token, flagEnabled]);

  return {
    loading,
    isAuthenticated,
  };
}

function useMasClient(): UseManagerHook {
  const { loading, isAuthenticated } = useMasAuthenticated();
  const chrome = useChrome();

  const manager = useMemo(() => {
    const client = new MASClient({
      baseUrl: window.location.origin + '/api/mas',
      blueprintId: MAS_BLUEPRINT_ID,
      fetchFunction: async (input, options) => {
        const token = await chrome.auth.getToken();
        if (!token) {
          throw new Error('User is not authenticated');
        }
        return fetch(input, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });
    const stateManager = createClientStateManager(client);

    const configuration: StateManagerConfiguration<MASClient> = {
      model: Models.MAS,
      historyManagement: true,
      streamMessages: true,
      modelName: 'Multi-Agent System',
      selectionTitle: 'Multi-Agent System',
      selectionDescription:
        'Interact with an AI-powered multi-agent system for complex tasks, workflows, and automated assistance.',
      stateManager,
      FooterComponent: MASFooter,
      docsUrl: '',
      isPreview: true,
      welcome: {
        buttons: [
          {
            title: 'What can you help me with?',
            value: 'What can you help me with?',
          },
          {
            title: 'Tell me about Multi-Agent System.',
            value: 'Tell me about Multi-Agent System.',
          },
        ],
      },
    };
    return configuration;
  }, []);

  if (loading) {
    return { manager: null, loading };
  }

  if (!isAuthenticated) {
    return { manager: null, loading: false };
  }

  return { manager, loading: false };
}

export default useMasClient;
