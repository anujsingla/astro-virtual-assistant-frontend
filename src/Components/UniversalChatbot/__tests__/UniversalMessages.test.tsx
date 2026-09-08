import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniversalMessages from '../UniversalMessages';
import { useActiveConversation, useInitLimitation, useIsInitializing, useMessages, useSendMessage } from '@redhat-cloud-services/ai-react-state';
import useArhMessageQuota from '../../ARHClient/useArhMessageQuota';

// Mock hooks used by UniversalMessages
const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;
const mockUseInitLimitation = useInitLimitation as jest.MockedFunction<typeof useInitLimitation>;
const mockUseActiveConversation = useActiveConversation as jest.MockedFunction<typeof useActiveConversation>;
const mockUseIsInitializing = useIsInitializing as jest.MockedFunction<typeof useIsInitializing>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;
const mockUseArhMessageQuota = useArhMessageQuota as jest.MockedFunction<typeof useArhMessageQuota>;

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useMessages: jest.fn(),
  useInitLimitation: jest.fn(),
  useActiveConversation: jest.fn(),
  useIsInitializing: jest.fn(),
  useSendMessage: jest.fn(),
  useCreateNewConversation: jest.fn(() => jest.fn()),
}));

// Mock PatternFly components
jest.mock('@patternfly/chatbot', () => ({
  ChatbotContent: ({ children }: { children: React.ReactNode }) => <div data-testid="chatbot-content">{children}</div>,
  MessageBox: ({ children }: { children: React.ReactNode }) => <div data-testid="message-box">{children}</div>,
  ChatbotWelcomePrompt: ({ title, description, content }: any) => (
    <div data-testid="welcome-prompt">
      <div data-testid="welcome-title">{title}</div>
      <div data-testid="welcome-description">{description}</div>
      <div data-testid="welcome-content">{content}</div>
    </div>
  ),
  Message: ({ content, role }: any) => <div data-testid={`message-${role}`}>{content}</div>,
}));

jest.mock('@patternfly/react-core', () => ({
  Bullseye: ({ children }: { children: React.ReactNode }) => <div data-testid="bullseye">{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  Alert: ({ children, ...props }: any) => (
    <div data-testid="alert" {...props}>
      {children}
    </div>
  ),
}));

// Mock ARH hooks
jest.mock('../../ARHClient/useArhMessageQuota', () => jest.fn());

// Mock UniversalBanner component
jest.mock('../UniversalBanner', () => ({
  __esModule: true,
  default: function MockUniversalBanner({ isOpen, setOpen, ...rest }: any) {
    return <div data-testid="universal-banner" {...rest} />;
  },
}));

describe('UniversalMessages', () => {
  const defaultProps = {
    avatar: 'test-avatar.png',
    setIsBannerOpen: jest.fn(),
    isBannerOpen: false,
    scrollToBottomRef: React.createRef<HTMLDivElement>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock return values
    mockUseMessages.mockReturnValue([]);
    mockUseInitLimitation.mockReturnValue(undefined);
    mockUseActiveConversation.mockReturnValue({
      id: 'test-conversation',
      title: 'Test',
      messages: [],
      locked: false,
      createdAt: new Date(),
    } as any);
    mockUseIsInitializing.mockReturnValue(false);
    mockUseSendMessage.mockReturnValue(jest.fn());
    mockUseArhMessageQuota.mockReturnValue(undefined);
  });

  it('should render without crashing', () => {
    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('chatbot-content')).toBeInTheDocument();
  });

  it('should show spinner when useIsInitializing is true', () => {
    mockUseIsInitializing.mockReturnValue(true);

    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('bullseye')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('chatbot-content')).not.toBeInTheDocument();
  });

  it('should show chatbot content when not initializing', () => {
    mockUseIsInitializing.mockReturnValue(false);

    render(<UniversalMessages {...defaultProps} />);

    expect(screen.getByTestId('chatbot-content')).toBeInTheDocument();
    expect(screen.queryByTestId('bullseye')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
