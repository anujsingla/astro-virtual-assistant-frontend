import { renderHook, waitFor } from '@testing-library/react';
import useMasClient, { useMasAuthenticated } from '../useMasClient';
import { Models } from '../types';
import { MAS_ENABLED_FLAG } from '../flags';
import { ChromeUser } from '@redhat-cloud-services/types';

const mockChrome = {
  auth: {
    getUser: jest.fn(),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    token: 'mock-token',
  },
};

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  __esModule: true,
  default: jest.fn(() => mockChrome),
}));

jest.mock('../../Components/MASClient/MASFooter', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../Components/MASClient/MASMessageEntry', () => ({
  __esModule: true,
  default: () => null,
}));

const mockStateManager = {
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
  getClient: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};

jest.mock('@redhat-cloud-services/ai-client-state', () => ({
  createClientStateManager: jest.fn(() => mockStateManager),
}));

jest.mock('@redhat-cloud-services/mas-client', () => ({
  MASClient: jest.fn(() => ({
    init: jest.fn(),
    healthCheck: jest.fn(),
  })),
}));

const mockUseFlag = jest.fn();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const mockUser: ChromeUser = {
  entitlements: {},
  identity: {
    org_id: 'org-123',
    account_number: '123456',
    internal: {
      org_id: 'org-123',
      account_id: 'account-123',
    },
    type: 'User',
    user: {
      is_internal: false,
      is_org_admin: false,
      locale: 'en-US',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
    },
  },
};

describe('useMasAuthenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockImplementation((flag: string) => flag === MAS_ENABLED_FLAG);
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
  });

  it('returns unauthenticated when feature flag is disabled', async () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useMasAuthenticated());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockChrome.auth.getUser).not.toHaveBeenCalled();
  });

  it('returns authenticated when flag is enabled and user exists', async () => {
    const { result } = renderHook(() => useMasAuthenticated());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns unauthenticated when user is missing', async () => {
    mockChrome.auth.getUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMasAuthenticated());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useMasClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockImplementation((flag: string) => flag === MAS_ENABLED_FLAG);
    mockChrome.auth.getUser.mockResolvedValue(mockUser);
    mockChrome.auth.getToken.mockResolvedValue('mock-token');
  });

  describe('when feature flag is off', () => {
    beforeEach(() => {
      mockUseFlag.mockReturnValue(false);
    });

    it('returns null manager', async () => {
      const { result } = renderHook(() => useMasClient());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.manager).toBeNull();
    });
  });

  describe('when feature flag is on', () => {
    it('creates MASClient with same-origin base URL and blueprint id', async () => {
      const { MASClient } = jest.requireMock('@redhat-cloud-services/mas-client');

      renderHook(() => useMasClient());

      await waitFor(() => {
        expect(MASClient).toHaveBeenCalled();
      });

      expect(MASClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: `${window.location.origin}/api/mas`,
          blueprintId: '48d8d52a-edc3-474f-8630-d20160fc2082',
          fetchFunction: expect.any(Function),
        })
      );
    });

    it('returns MAS manager configuration', async () => {
      const { result } = renderHook(() => useMasClient());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.manager?.model).toBe(Models.MAS);
      expect(result.current.manager?.historyManagement).toBe(true);
      expect(result.current.manager?.streamMessages).toBe(true);
      expect(result.current.manager?.modelName).toBe('Multi-Agent System');
      expect(result.current.manager?.isPreview).toBe(true);
      expect(result.current.manager?.FooterComponent).toBeDefined();
      expect(result.current.manager?.MessageEntryComponent).toBeDefined();
      expect(result.current.manager?.welcome?.buttons).toEqual([
        { title: 'What can you help me with?', value: 'What can you help me with?' },
        { title: 'Tell me about Multi-Agent System.', value: 'Tell me about Multi-Agent System.' },
      ]);
    });

    it('returns null manager when user is not authenticated', async () => {
      mockChrome.auth.getUser.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMasClient());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.manager).toBeNull();
    });

    describe('fetchFunction behavior', () => {
      let fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
      let mockFetch: jest.Mock;
      const originalFetch = global.fetch;

      beforeEach(async () => {
        const { MASClient } = jest.requireMock('@redhat-cloud-services/mas-client');
        mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        renderHook(() => useMasClient());

        await waitFor(() => {
          expect(MASClient).toHaveBeenCalled();
        });

        fetchFunction = MASClient.mock.calls[0][0].fetchFunction;
      });

      afterEach(() => {
        global.fetch = originalFetch;
      });

      it('adds Authorization header', async () => {
        await fetchFunction('https://example.com/api/health/', { headers: {} });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/api/health/',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token',
            }),
          })
        );
      });

      it('throws when token is missing', async () => {
        mockChrome.auth.getToken.mockResolvedValue('');

        await expect(fetchFunction('https://example.com/api/health/', { headers: {} })).rejects.toThrow('User is not authenticated');
      });
    });
  });
});
