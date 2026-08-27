import React from 'react';
import { Flex, FlexItem, Icon, Spinner } from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { ActiveAgent } from '@redhat-cloud-services/mas-client';

function AgentStatusIcon({ status }: { status: ActiveAgent['status'] }) {
  if (status === 'running') {
    return <Spinner size="sm" aria-label="Agent running" />;
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
  if (activeAgents.length === 0) {
    return null;
  }

  return (
    <Flex
      direction={{ default: 'column' }}
      rowGap={{ default: 'rowGapXs' }}
      className="pf-v6-u-mt-sm pf-v6-u-mb-xs pf-v6-u-pl-md pf-v6-u-font-size-sm"
      aria-label="Active agents"
      aria-live="polite"
    >
      {activeAgents.map((agent) => (
        <FlexItem key={agent.nodeId}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} columnGap={{ default: 'columnGapSm' }}>
            <FlexItem>
              <AgentStatusIcon status={agent.status} />
            </FlexItem>
            <FlexItem>{agent.name}</FlexItem>
          </Flex>
        </FlexItem>
      ))}
    </Flex>
  );
}

export default MASAgentStatusPanel;
