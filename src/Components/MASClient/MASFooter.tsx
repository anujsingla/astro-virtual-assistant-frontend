import React from 'react';
import { ChatbotFooter, ChatbotFootnote, MessageBar } from '@patternfly/chatbot';
import { useActiveConversation, useInProgress, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import { FooterComponentProps } from '../../aiClients/types';
import { useMessage } from '../../utils/VirtualAssistantStateSingleton';
import MASNewChatModal from './MASNewChatModal';

const MASFooter = ({ streamMessages, isCompact }: FooterComponentProps) => {
  const sendMessage = useSendMessage();
  const inProgress = useInProgress();
  const activeConversation = useActiveConversation();
  const [defaultMessage, setDefaultMessage] = useMessage();
  const handleSend = (message: string | number) => {
    sendMessage(`${message}`, {
      stream: streamMessages,
    });
    setDefaultMessage(undefined);
  };
  const isDisabled = inProgress || activeConversation?.locked;

  return (
    <ChatbotFooter isCompact={isCompact}>
      <MessageBar
        id="query-input"
        onSendMessage={handleSend}
        aria-label="Type your message to the AI assistant"
        alwayShowSendButton
        isSendButtonDisabled={isDisabled}
        hasAttachButton={false}
        isCompact={isCompact}
        {...(defaultMessage && { value: defaultMessage })}
      />
      <ChatbotFootnote label="Always review AI generated content prior to use." />
      <MASNewChatModal />
    </ChatbotFooter>
  );
};

export default MASFooter;
