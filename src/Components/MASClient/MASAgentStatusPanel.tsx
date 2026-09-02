import React, { useState } from 'react';
import { Icon, Spinner } from '@patternfly/react-core';
import { AngleRightIcon, CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { ActiveAgent } from '@redhat-cloud-services/mas-client';

import './MASAgentStatusPanel.scss';

const EXCLUDED_AGENT_NAMES = new Set(['user question node', 'final answer node']);

function AgentStatusIcon({ status }: { status: ActiveAgent['status'] }) {
  if (status === 'running') {
    return <Spinner size="sm" aria-label="running" />;
  }
  if (status === 'done') {
    return (
      <Icon status="success">
        <CheckCircleIcon />
      </Icon>
    );
  }
  return (
    <Icon status="danger">
      <ExclamationCircleIcon />
    </Icon>
  );
}

function MASAgentStatusPanel({ activeAgents }: { activeAgents: ActiveAgent[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleAgents = activeAgents.filter((agent) => !EXCLUDED_AGENT_NAMES.has(agent.name.toLowerCase()));

  if (visibleAgents.length === 0) {
    return null;
  }

  const runningCount = visibleAgents.filter((a) => a.status === 'running').length;
  const completedCount = visibleAgents.filter((a) => a.status === 'done').length;

  const statusParts: string[] = [];
  if (completedCount > 0) statusParts.push(`${completedCount} completed`);
  if (runningCount > 0) statusParts.push(`${runningCount} in progress`);
  const statusText = statusParts.length > 0 ? statusParts.join(' · ') : 'all completed';

  return (
    <div className="mas-agent-panel" aria-live="polite">
      <button
        className="mas-agent-panel__toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="mas-agent-panel-content"
      >
        <AngleRightIcon className={`mas-agent-panel__chevron${isExpanded ? ' mas-agent-panel__chevron--expanded' : ''}`} />
        <span className="mas-agent-panel__label">Active Agents:&nbsp;{statusText}</span>
        {runningCount > 0 && (
          <span className="mas-agent-panel__spinner">
            <Spinner size="sm" aria-hidden="true" />
          </span>
        )}
      </button>
      {isExpanded && (
        <div id="mas-agent-panel-content" className="mas-agent-panel__agents">
          {visibleAgents.map((agent) => (
            <div key={agent.nodeId} className="mas-agent-panel__agent">
              <span className="mas-agent-panel__agent-icon">
                <AgentStatusIcon status={agent.status} />
              </span>
              {agent.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MASAgentStatusPanel;
