import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import React, { useContext } from 'react';
import { useCreateNewConversation, useIsInitializing } from '@redhat-cloud-services/ai-react-state';

import { UniversalChatbotContext } from '../UniversalChatbot/UniversalChatbotProvider';

const MASNewChatModal = () => {
  const { rootElementRef, setConversationsDrawerOpened, showNewConversationWarning, setShowNewConversationWarning } =
    useContext(UniversalChatbotContext);
  const createNewConversation = useCreateNewConversation();
  const initializingMessages = useIsInitializing();

  async function handleNewChat() {
    if (initializingMessages) {
      return;
    }
    try {
      setShowNewConversationWarning(false);
      await createNewConversation();
      setConversationsDrawerOpened(false);
    } catch (error) {
      setShowNewConversationWarning(false);
      console.error('Error creating new conversation:', error);
    }
  }
  return (
    <Modal
      appendTo={rootElementRef.current || document.body}
      variant="small"
      title="Start a new chat?"
      isOpen={showNewConversationWarning}
      onClose={() => setShowNewConversationWarning(false)}
    >
      <ModalHeader title="Start a new chat?" labelId="variant-modal-title" titleIconVariant="warning" />
      <ModalBody id="modal-box-body-variant">
        This will close your current conversation and make it view-only. You can still view it later, but you won&apos;t be able to add new
        messages.
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="link" onClick={handleNewChat}>
          Start new chat
        </Button>
        <Button key="cancel" variant="link" onClick={() => setShowNewConversationWarning(false)}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MASNewChatModal;
