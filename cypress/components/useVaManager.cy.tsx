import React from 'react';
import { ScalprumProvider } from '@scalprum/react-core';
import { FlagProvider } from '@unleash/proxy-client-react';
import useVaManager from '../../src/aiClients/useVaManager';
import { Models } from '../../src/aiClients/types';
import { mockChromeApi } from '../mocks/chromeApi';

const UseVaManagerComponent = () => {
  const { manager, loading } = useVaManager();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="model">{manager?.model}</div>
      <div data-testid="model-name">{manager?.modelName}</div>
      <div data-testid="selection-title">{manager?.selectionTitle}</div>
      <div data-testid="history-management">{String(manager?.historyManagement)}</div>
      <div data-testid="stream-messages">{String(manager?.streamMessages)}</div>
      <div data-testid="has-message-entry">{String(!!manager?.MessageEntryComponent)}</div>
      <div data-testid="has-state-manager">{String(!!manager?.stateManager)}</div>
      <div data-testid="welcome-buttons">
        {JSON.stringify(manager?.welcome?.buttons?.map((b) => b.title) ?? [])}
      </div>
    </div>
  );
};

const mountComponent = () => {
  cy.intercept('GET', '**/api/frontend**', {
    statusCode: 200,
    body: { toggles: [] },
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
        <UseVaManagerComponent />
      </FlagProvider>
    </ScalprumProvider>,
  );
};

describe('useVaManager', () => {
  beforeEach(() => {
    mountComponent();
  });

  it('should return VA model configuration', () => {
    cy.get('[data-testid="model"]').should('contain', Models.VA);
    cy.get('[data-testid="model-name"]').should('contain', 'Hybrid Cloud Console - Virtual Assistant');
    cy.get('[data-testid="selection-title"]').should('contain', 'Hybrid Cloud Console');
  });

  it('should use VAMessageEntry component', () => {
    cy.get('[data-testid="has-message-entry"]').should('contain', 'true');
  });

  it('should have a state manager', () => {
    cy.get('[data-testid="has-state-manager"]').should('contain', 'true');
  });

  it('should not stream messages', () => {
    cy.get('[data-testid="stream-messages"]').should('contain', 'false');
  });

  it('should not manage history', () => {
    cy.get('[data-testid="history-management"]').should('contain', 'false');
  });
});
