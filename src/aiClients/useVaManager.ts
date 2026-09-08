import { useEffect, useMemo, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { Models, UseManagerHook, WelcomeConfig } from './types';
import VAClient from './vaClient';
import { Events, createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import VAMessageEntry from '../Components/VAClient/VAMessageEntry';
import { VA_ENABLED_FLAG } from './flags';

export default function useVaManager(): UseManagerHook {
  const isEnabled = useFlag(VA_ENABLED_FLAG);

  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeConfig | undefined>(undefined);

  const stateManager = useMemo(() => {
    const client = new VAClient();
    const stateManager = createClientStateManager(client);
    return stateManager;
  }, []);

  // Watch for client initialization to update welcome content using state manager events
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const client = stateManager.getClient();

    const updateContent = () => {
      if (client.isInitialized()) {
        const dynamicContent = client.getWelcomeConfig();

        if (dynamicContent && dynamicContent.content) {
          setWelcomeConfig(dynamicContent);
        }
      } else if (!client.isInitializing()) {
        // TODO: have a special error state
        setWelcomeConfig({ content: 'Sorry, something went wrong while talking to the Virtual Assistant.' });
      }
    };

    // Check immediately
    updateContent();

    // Subscribe to state manager events for updates
    const unsubscribeInit = stateManager.subscribe(Events.INITIALIZING_MESSAGES, updateContent);
    const unsubscribeConversation = stateManager.subscribe(Events.ACTIVE_CONVERSATION, updateContent);

    return () => {
      unsubscribeInit();
      unsubscribeConversation();
    };
  }, [stateManager, isEnabled]);

  const manager = useMemo(
    () => ({
      stateManager,
      model: Models.VA,
      historyManagement: false,
      docsUrl:
        'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/getting_started_with_the_red_hat_hybrid_cloud_console/hcc-help-options_getting-started#virtual-assistant_getting-started',
      streamMessages: false,
      modelName: 'Hybrid Cloud Console - Virtual Assistant',
      selectionTitle: 'Hybrid Cloud Console',
      selectionDescription:
        'Learn about the Hybrid Cloud Console and configure settings like your personal information, request access from your admin, show critical vulnerabilities, and more.',
      MessageEntryComponent: VAMessageEntry,
      // Ignoring content/message from watson
      welcome: {
        buttons: welcomeConfig?.buttons,
      },
    }),
    [stateManager, welcomeConfig]
  );

  if (!isEnabled) {
    return { manager: null, loading: false };
  }

  return { manager, loading: false };
}
