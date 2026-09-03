import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActiveAgent } from '@redhat-cloud-services/mas-client';

import MASAgentStatusPanel from '../MASAgentStatusPanel';

const agents: ActiveAgent[] = [
  { nodeId: '1', name: 'Research Agent', status: 'done' },
  { nodeId: '2', name: 'Planner Agent', status: 'running' },
  { nodeId: '3', name: 'user question node', status: 'done' },
];

describe('MASAgentStatusPanel', () => {
  it('renders nothing when there are no visible agents', () => {
    const { container } = render(
      <MASAgentStatusPanel activeAgents={[{ nodeId: '1', name: 'user question node', status: 'running' }]} contentId="panel-1" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows agent status summary and excludes internal nodes', () => {
    render(<MASAgentStatusPanel activeAgents={agents} contentId="panel-1" />);

    expect(screen.getByText('Active Agents: 1 completed · 1 in progress')).toBeInTheDocument();
    expect(screen.queryByText('user question node')).not.toBeInTheDocument();
  });

  it('shows needs attention when an agent has failed', () => {
    const failedAgents: ActiveAgent[] = [{ nodeId: '1', name: 'Research Agent', status: 'error' }];

    render(<MASAgentStatusPanel activeAgents={failedAgents} contentId="panel-1" />);

    expect(screen.getByText('Active Agents: 1 needs attention')).toBeInTheDocument();
  });

  it('expands and collapses the agent list', () => {
    render(<MASAgentStatusPanel activeAgents={agents} contentId="panel-expand" />);

    const toggle = screen.getByRole('button', { name: /Active Agents:/ });
    expect(toggle).toHaveAttribute('aria-controls', 'panel-expand');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Research Agent')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Research Agent')).toBeInTheDocument();
    expect(screen.getByText('Planner Agent')).toBeInTheDocument();
    expect(document.getElementById('panel-expand')).toBeInTheDocument();
  });
});
