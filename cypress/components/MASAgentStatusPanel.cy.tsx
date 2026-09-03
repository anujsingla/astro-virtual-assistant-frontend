import React from 'react';
import { ActiveAgent } from '@redhat-cloud-services/mas-client';
import MASAgentStatusPanel from '../../src/Components/MASClient/MASAgentStatusPanel';

const agents: ActiveAgent[] = [
  { nodeId: '1', name: 'Research Agent', status: 'done' },
  { nodeId: '2', name: 'Planner Agent', status: 'running' },
  { nodeId: '3', name: 'user question node', status: 'done' },
];

describe('MASAgentStatusPanel', () => {
  it('shows status summary for visible agents', () => {
    cy.mount(<MASAgentStatusPanel activeAgents={agents} contentId="mas-panel-1" />);

    cy.contains('Active Agents: 1 completed · 1 in progress').should('be.visible');
    cy.contains('user question node').should('not.exist');
  });

  it('expands to show agent names', () => {
    cy.mount(<MASAgentStatusPanel activeAgents={agents} contentId="mas-panel-2" />);

    cy.get('button[aria-controls="mas-panel-2"]').click();
    cy.contains('Research Agent').should('be.visible');
    cy.contains('Planner Agent').should('be.visible');
    cy.get('#mas-panel-2').should('exist');
  });

  it('shows needs attention for failed agents', () => {
    cy.mount(
      <MASAgentStatusPanel
        activeAgents={[{ nodeId: '1', name: 'Research Agent', status: 'error' }]}
        contentId="mas-panel-3"
      />
    );

    cy.contains('Active Agents: 1 needs attention').should('be.visible');
  });
});
