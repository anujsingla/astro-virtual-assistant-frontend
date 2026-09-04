import React from 'react';
import { Message } from '@patternfly/chatbot';
import { Message as MessageType } from '@redhat-cloud-services/ai-client-state';
import { MASAdditionalAttributes } from '@redhat-cloud-services/mas-client';

import MASAgentStatusPanel from './MASAgentStatusPanel';
import MAS_BOT_ICON from '../../assets/Ask_Red_Hat_OFFICIAL-whitebackground.svg';

function MASMessageEntry({ message, avatar, isCompact }: { message: MessageType<MASAdditionalAttributes>; avatar: string; isCompact?: boolean }) {
  const messageDate = message.date ? `${message.date.toLocaleDateString()} ${message.date.toLocaleTimeString()}` : '';
  const activeAgents = message.additionalAttributes?.activeAgents ?? [];
  const isStreaming = message.role === 'bot' && message.answer === '';

  return (
    <>
      <Message
        id={`message-${message.id}`}
        isMarkdownDisabled={message.role === 'user'}
        isLoading={isStreaming}
        role={message.role}
        avatar={message.role === 'user' ? avatar : MAS_BOT_ICON}
        content={message.answer}
        aria-label={`${message.role === 'user' ? 'Your message' : 'AI response'}: ${message.answer}`}
        timestamp={messageDate}
        isCompact={isCompact}
      />
      {message.role === 'bot' && <MASAgentStatusPanel activeAgents={activeAgents} contentId={`mas-agent-panel-content-${message.id}`} />}
    </>
  );
}

export default MASMessageEntry;
