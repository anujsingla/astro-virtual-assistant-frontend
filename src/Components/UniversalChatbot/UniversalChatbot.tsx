import React, { useEffect, useRef, useState } from 'react';
import { useConversations, useInitLimitation, useSetActiveConversation } from '@redhat-cloud-services/ai-react-state';
import { Chatbot, ChatbotConversationHistoryNav, ChatbotDisplayMode } from '@patternfly/chatbot';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import classnames from 'classnames';

import UniversalChatbotProvider, { ChatbotProps } from './UniversalChatbotProvider';
import emptyAvatar from '../../assets/img_avatar.svg';
import useScrollToBottom from './useScrollToBottom';
import UniversalHeader from './UniversalHeader';
import UniversalFooter from './UniversalFooter';
import UniversalMessages from './UniversalMessages';
import UniversalAssistantSelection from './UniversalAssistantSelection';
import { Models } from '../../aiClients/types';

import '@patternfly/chatbot/dist/css/main.css';

function UniversalChatbot({ setOpen, currentModel, setCurrentModel, managers, displayMode: propDisplayMode }: ChatbotProps) {
  const [displayMode, setDisplayMode] = useState<ChatbotDisplayMode>(propDisplayMode || ChatbotDisplayMode.default);
  const effectiveDisplayMode = propDisplayMode || displayMode;
  const [isBannerOpen, setIsBannerOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(emptyAvatar);

  const rootElementRef = useRef<HTMLDivElement>(null);
  const conversations = useConversations();
  const setActiveConversation = useSetActiveConversation();
  const scrollToBottomRef = useScrollToBottom(isBannerOpen);
  const initLimitations = useInitLimitation();
  const [conversationsDrawerOpened, setConversationsDrawerOpened] = useState(false);
  const [showNewConversationWarning, setShowNewConversationWarning] = useState(false);
  const chrome = useChrome();

  async function handleUserSetup() {
    let user;
    try {
      user = await chrome.auth.getUser();
    } catch (e) {
      console.error('Failed to get user', e);
    }
    if (user) {
      const url = `https://access.redhat.com/api/users/avatar/${user.identity.user?.username ?? ''}/`;
      // check if the image loads before setting state
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (img.width === 140) {
          setAvatar(img.src);
        }
      };
      setUsername(user.identity.user?.username ?? '');
    }
  }
  useEffect(() => {
    handleUserSetup();
  }, [chrome.auth.token]);

  const manager = managers?.find((m) => m.model === currentModel);

  useEffect(() => {
    if (manager) {
      // notify any subscribed components that the manager has changed and they should re-render
      manager.stateManager.notifyAll();
    }
  }, [manager]);

  const FooterComponent = manager?.FooterComponent ?? UniversalFooter;
  const chatbotClassName = classnames({
    'universal-chatbot-relative': effectiveDisplayMode !== ChatbotDisplayMode.fullscreen,
  });

  const drawerContent = (
    <>
      <UniversalHeader
        historyManagement={!!manager?.historyManagement}
        conversationsDrawerOpened={conversationsDrawerOpened}
        scrollToBottomRef={scrollToBottomRef}
        setOpen={setOpen}
        setDisplayMode={propDisplayMode ? undefined : setDisplayMode}
        displayMode={effectiveDisplayMode}
        isCompact
      />
      <UniversalAssistantSelection containerRef={rootElementRef} />
      <UniversalMessages
        isBannerOpen={isBannerOpen}
        avatar={avatar}
        username={username}
        scrollToBottomRef={scrollToBottomRef}
        setIsBannerOpen={setIsBannerOpen}
        MessageEntryComponent={manager?.MessageEntryComponent}
        isCompact
        welcome={manager?.welcome}
      />
      <FooterComponent streamMessages={!!manager?.streamMessages} isCompact />
    </>
  );

  if (!manager?.historyManagement) {
    return (
      <UniversalChatbotProvider
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        setConversationsDrawerOpened={setConversationsDrawerOpened}
        rootElementRef={rootElementRef}
        setShowNewConversationWarning={setShowNewConversationWarning}
        showNewConversationWarning={showNewConversationWarning}
        managers={managers}
      >
        <div ref={rootElementRef} id="ai-chatbot" aria-label="AI Assistant Chatbot" className={chatbotClassName}>
          <Chatbot displayMode={effectiveDisplayMode}>{drawerContent}</Chatbot>
        </div>
      </UniversalChatbotProvider>
    );
  }

  return (
    <UniversalChatbotProvider
      currentModel={currentModel}
      setCurrentModel={setCurrentModel}
      setConversationsDrawerOpened={setConversationsDrawerOpened}
      rootElementRef={rootElementRef}
      setShowNewConversationWarning={setShowNewConversationWarning}
      showNewConversationWarning={showNewConversationWarning}
      managers={managers}
    >
      <div ref={rootElementRef} id="ai-chatbot" aria-label="AI Assistant Chatbot" className={chatbotClassName}>
        <Chatbot displayMode={effectiveDisplayMode} isCompact>
          <ChatbotConversationHistoryNav
            displayMode={effectiveDisplayMode}
            isDrawerOpen={conversationsDrawerOpened}
            onDrawerToggle={() => setConversationsDrawerOpened((prev) => !prev)}
            setIsDrawerOpen={setConversationsDrawerOpened}
            onSelectActiveItem={(_e, conversationId) => {
              setActiveConversation(`${conversationId}`);
              if (effectiveDisplayMode === ChatbotDisplayMode.default) {
                setConversationsDrawerOpened(false);
              }
            }}
            // do not allow sending new chats if quota is breached
            onNewChat={
              initLimitations?.reason === 'quota-breached'
                ? undefined
                : () => {
                    // TODO: figure out nice way to handle custom conversation creation flow
                    (currentModel === Models.ASK_RED_HAT || currentModel === Models.MAS) &&
                      setShowNewConversationWarning(true);
                    manager?.handleNewChat?.(setConversationsDrawerOpened);
                  }
            }
            conversations={conversations.map((conversation) => ({
              id: conversation.id,
              text: conversation.title,
            }))}
            drawerContent={drawerContent}
            isCompact
          />
        </Chatbot>
      </div>
    </UniversalChatbotProvider>
  );
}

export default UniversalChatbot;
