import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import useMasClient from '../../src/aiClients/useMasClient';
import { Models } from '../../src/aiClients/types';
import { MAS_ENABLED_FLAG } from '../../src/aiClients/flags';
import { mockChromeApi } from '../mocks/chromeApi';

const UseMasClientComponent = () => {
  const { manager, loading } = useMasClient();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="has-manager">{String(!!manager)}</div>
      <div data-testid="model">{manager?.model}</div>
      <div data-testid="model-name">{manager?.modelName}</div>
      <div data-testid="selection-title">{manager?.selectionTitle}</div>
      <div data-testid="history-management">{String(manager?.historyManagement)}</div>
      <div data-testid="stream-messages">{String(manager?.streamMessages)}</div>
      <div data-testid="has-message-entry">{String(!!manager?.MessageEntryComponent)}</div>
      <div data-testid="has-footer">{String(!!manager?.FooterComponent)}</div>
      <div data-testid="is-preview">{String(manager?.isPreview)}</div>
      <div data-testid="has-state-manager">{String(!!manager?.stateManager)}</div>
      <div data-testid="welcome-buttons">{JSON.stringify(manager?.welcome?.buttons?.map((b) => b.title) ?? [])}</div>
    </div>
  );
};

const mountWithFlags = (toggles: Array<{ name: string; enabled: boolean }>) => {
  cy.intercept('GET', '**/api/frontend**', {
    statusCode: 200,
    body: { toggles },
  }).as('unleashAPI');

  cy.intercept('POST', '**/api/frontend/client/metrics', {
    statusCode: 200,
    body: {},
  }).as('unleashMetrics');

  cy.mount(
    <ScalprumProvider config={{}} api={{ chrome: mockChromeApi }}>
      <FlagProvider
        config={{
          url: 'http://localhost:4242/api/frontend',
          clientKey: 'test-key',
          appName: 'test-app',
        }}
      >
        <UseMasClientComponent />
      </FlagProvider>
    </ScalprumProvider>
  );
};

describe('useMasClient', () => {
  describe('when feature flag is off', () => {
    beforeEach(() => {
      mountWithFlags([]);
    });

    it('should return null manager', () => {
      cy.get('[data-testid="has-manager"]').should('contain', 'false');
    });

    it('should not be loading after auth check completes', () => {
      cy.get('[data-testid="loading"]').should('contain', 'false');
    });
  });

  describe('when feature flag is on', () => {
    beforeEach(() => {
      mountWithFlags([{ name: MAS_ENABLED_FLAG, enabled: true }]);
    });

    it('should return MAS model configuration', () => {
      cy.get('[data-testid="has-manager"]').should('contain', 'true');
      cy.get('[data-testid="model"]').should('contain', Models.MAS);
      cy.get('[data-testid="model-name"]').should('contain', 'Multi-Agent System');
      cy.get('[data-testid="selection-title"]').should('contain', 'Multi-Agent System');
    });

    it('should enable history management and streaming', () => {
      cy.get('[data-testid="history-management"]').should('contain', 'true');
      cy.get('[data-testid="stream-messages"]').should('contain', 'true');
    });

    it('should use MAS-specific UI components', () => {
      cy.get('[data-testid="has-message-entry"]').should('contain', 'true');
      cy.get('[data-testid="has-footer"]').should('contain', 'true');
      cy.get('[data-testid="is-preview"]').should('contain', 'true');
    });

    it('should have a state manager', () => {
      cy.get('[data-testid="has-state-manager"]').should('contain', 'true');
    });

    it('should provide static welcome buttons', () => {
      cy.get('[data-testid="welcome-buttons"]').should(
        'contain',
        '["What can you help me with?","Tell me about Multi-Agent System."]'
      );
    });
  });
});
