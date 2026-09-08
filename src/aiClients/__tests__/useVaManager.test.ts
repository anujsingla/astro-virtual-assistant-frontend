import { renderHook } from '@testing-library/react';
import useVaManager from '../useVaManager';
import VAClient from '../vaClient';
import { Models } from '../types';

// Mock VAClient
jest.mock('../vaClient');
const MockVAClient = VAClient as jest.MockedClass<typeof VAClient>;

// Mock AI client state
const mockStateManager = {
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
  getClient: jest.fn(),
  subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
};

jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => mockStateManager),
  Events: {
    INITIALIZING_MESSAGES: 'INITIALIZING_MESSAGES',
    ACTIVE_CONVERSATION: 'ACTIVE_CONVERSATION',
  },
}));

// Mock VA Message Entry component
jest.mock('../../Components/VAClient/VAMessageEntry', () => ({
  __esModule: true,
  default: () => null,
}));

// Track useFlag return value
let mockUseFlagReturn = false;
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => mockUseFlagReturn),
}));

describe('useVaManager', () => {
  let mockClient: jest.Mocked<VAClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlagReturn = false;

    // Create mock client instance
    mockClient = {
      isInitialized: jest.fn(() => false),
      isInitializing: jest.fn(() => false),
      getWelcomeContent: jest.fn(() => ''),
      init: jest.fn(),
      createNewConversation: jest.fn(),
      getConversationHistory: jest.fn(),
      healthCheck: jest.fn(),
      sendMessage: jest.fn(),
    } as any;

    MockVAClient.mockImplementation(() => mockClient);
    mockStateManager.getClient.mockReturnValue(mockClient);
  });

  describe('when feature flag is off', () => {
    it('should return null manager', () => {
      const { result } = renderHook(() => useVaManager());

      expect(result.current.manager).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('when feature flag is on', () => {
    beforeEach(() => {
      mockUseFlagReturn = true;
    });

    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useVaManager());

      expect(result.current.manager?.model).toBe(Models.VA);
      expect(result.current.manager?.historyManagement).toBe(false);
      expect(result.current.manager?.streamMessages).toBe(false);
      expect(result.current.manager?.welcome).toBeDefined();
    });
  });
});
