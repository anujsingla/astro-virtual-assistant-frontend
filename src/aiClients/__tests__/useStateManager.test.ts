import { act, renderHook } from '@testing-library/react';
import useStateManager from '../useStateManager';
import { useLocation } from 'react-router-dom';
import { VirtualAssistantStateSingleton } from '../../utils/VirtualAssistantStateSingleton';
import { Models } from '../types';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

// Mock scalprum remote hook manager API used by the hook under test
const createStateManager = () => ({
  isInitialized: jest.fn(() => false),
  isInitializing: jest.fn(() => false),
  init: jest.fn(),
});

const mockAddHook = jest.fn();
const mockCleanup = jest.fn();
const mockHookResults: Array<Record<string, unknown>> = [];
jest.mock('@scalprum/react-core', () => ({
  useRemoteHookManager: jest.fn(() => ({
    addHook: mockAddHook,
    cleanup: mockCleanup,
    get hookResults() {
      return mockHookResults;
    },
  })),
}));

// Mock the useFlag hook for feature flags
const mockUseFlag = jest.fn();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const createManagerHookResult = (id: string, model: Models | null) => ({
  id,
  loading: false,
  error: null,
  hookResult: {
    manager: model
      ? {
          model,
          stateManager: createStateManager(),
          historyManagement: true,
          streamMessages: true,
        }
      : null,
  },
});

describe('useStateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    VirtualAssistantStateSingleton.setIsOpen(false);
    VirtualAssistantStateSingleton.setCurrentModel(undefined);
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });

    // Mock fetch to prevent network calls and silence warnings
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;

    // Default remote hook results: ARH and RHEL managers available, async one failing
    mockHookResults.length = 0;
    mockHookResults.push(
      {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'Ask Red Hat',
            stateManager: createStateManager(),
            historyManagement: true,
            streamMessages: true,
            routes: ['/baz/*'],
          },
        },
      },
      {
        id: 'rhel',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'RHEL Lightspeed',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/foo/bar/*'],
          },
        },
      },
      {
        id: 'ai',
        loading: false,
        error: 'An error occured',
        hookResult: {
          manager: {
            model: 'AI Chatbot',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/ai/*'],
          },
        },
      }
    );
  });

  it('sets currentModel to the first available', async () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('sets currentModel to matching route', async () => {
    mockUseFlag.mockReturnValue(false);
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/baz/foo' });

    const { result, rerender } = renderHook((isOpen: boolean) => useStateManager(isOpen));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/' });
    // the model won't change with route change after first render
    rerender(false);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');

    (useLocation as jest.Mock).mockReturnValue({ pathname: '/baz/foo' });
    // the model won't change with route change after first render
    rerender(false);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
    rerender(true);
    expect(result.current.currentModel).toBe('RHEL Lightspeed');
  });

  it('does not show non-authenticated models', async () => {
    mockUseFlag.mockReturnValue(false);
    // Simulate RHEL manager not being available due to failed authentication
    mockHookResults.length = 0;
    mockHookResults.push(
      {
        id: 'arh',
        loading: false,
        error: null,
        hookResult: {
          manager: {
            model: 'Ask Red Hat',
            stateManager: createStateManager(),
            historyManagement: true,
            streamMessages: true,
            routes: ['/baz/*'],
          },
        },
      },
      {
        id: 'rhel',
        loading: false,
        error: null,
        hookResult: {
          manager: null,
        },
      },
      {
        id: 'ai',
        loading: false,
        error: 'An error occured',
        hookResult: {
          manager: {
            model: 'AI Chatbot',
            stateManager: createStateManager(),
            historyManagement: false,
            streamMessages: false,
            routes: ['/ai/*'],
          },
        },
      }
    );
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/foo/bar/baz' });

    const { result } = renderHook(() => useStateManager(true));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.currentModel).toBe('Ask Red Hat');
  });

  it('registers in order ARH, VA, HCC AI, MAS, RHEL when arh-default is ON', () => {
    mockUseFlag.mockReturnValue(true);

    renderHook(() => useStateManager(true));

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toEqual(['./useArhChatbot', './useVaChatbot', './useHccAiChatbot', './useMasChatbot', './useRhelChatbot']);
  });

  it('registers in order VA, HCC AI, MAS, ARH, RHEL when arh-default is OFF', () => {
    mockUseFlag.mockReturnValue(false);

    renderHook(() => useStateManager(true));

    const modules = mockAddHook.mock.calls.map(([arg]: [{ module: string }]) => arg.module);
    expect(modules).toEqual(['./useVaChatbot', './useHccAiChatbot', './useMasChatbot', './useArhChatbot', './useRhelChatbot']);
  });

  describe('when VA is unavailable (arh-default OFF)', () => {
    beforeEach(() => {
      mockUseFlag.mockReturnValue(false);
    });

    it('selects HCC AI as default when all services are available', async () => {
      // Registration order (arh-default OFF): VA, HCC AI, MAS, ARH, RHEL
      // After VA filtered out: HCC AI, MAS, ARH, RHEL → managers[0] = HCC AI
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', Models.HCC_AI),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentModel).toBe(Models.HCC_AI);
    });

    it('selects MAS when HCC AI is also unavailable', async () => {
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', null),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentModel).toBe(Models.MAS);
    });

    it('selects ARH when HCC AI and MAS are also unavailable', async () => {
      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', null),
        createManagerHookResult('mas', null),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentModel).toBe(Models.ASK_RED_HAT);
    });

    it('reselects to HCC AI when current model (VA) becomes unavailable', async () => {
      VirtualAssistantStateSingleton.setCurrentModel(Models.VA);

      mockHookResults.length = 0;
      mockHookResults.push(
        createManagerHookResult('va', null),
        createManagerHookResult('hcc-ai', Models.HCC_AI),
        createManagerHookResult('mas', Models.MAS),
        createManagerHookResult('arh', Models.ASK_RED_HAT),
        createManagerHookResult('rhel', Models.RHEL_LIGHTSPEED)
      );

      const { result } = renderHook(() => useStateManager(true));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.currentModel).toBe(Models.HCC_AI);
    });
  });
});
