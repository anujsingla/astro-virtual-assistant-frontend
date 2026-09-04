import { StateManager } from '@redhat-cloud-services/ai-client-state';
import { IAIClient } from '@redhat-cloud-services/ai-client-common';

export enum Models {
  ASK_RED_HAT = 'Ask Red Hat',
  RHEL_LIGHTSPEED = 'RHEL Lightspeed',
  VA = 'Virtual Assistant',
  OAI = 'OpenShift assisted Installer',
  HCC_AI = 'HCC AI Assistant',
  MAS = 'Multi-Agent System',
}

export interface WelcomeButton {
  /** Title for the welcome button */
  title: string;
  /** Optional message to display below the title */
  message?: string;
  /** Message to send when the button is clicked */
  value: string;
}

export interface WelcomeConfig {
  /** Welcome message content to display */
  content?: string;
  /** Optional array of interactive buttons */
  buttons?: WelcomeButton[];
}

export type ModelsSelection = {
  activeModel: Models;
  setActiveModel: (model: Models) => void;
  availableModels: Models[];
};

export function isModels(value?: string | number): value is Models {
  if (typeof value === 'number') {
    return false;
  }
  return Object.values(Models).includes(value as Models);
}

export type FooterComponentProps = {
  streamMessages: boolean;
  isCompact?: boolean | undefined;
};

export type StateManagerConfiguration<S extends IAIClient> = {
  model: Models;
  historyManagement: boolean;
  streamMessages: boolean;
  modelName: string;
  docsUrl: string;
  selectionTitle: string;
  selectionDescription: string;
  welcome?: WelcomeConfig;
  stateManager: StateManager<Record<string, unknown>, S>;
  isPreview?: boolean;
  handleNewChat?: (toggleDrawer: (isOpen: boolean) => void) => void;
  MessageEntryComponent?: React.ComponentType<any>;
  FooterComponent?: React.ComponentType<FooterComponentProps>;
  routes?: string[];
};

export type UseManagerHook = { manager: StateManagerConfiguration<IAIClient> | null; loading: boolean };
