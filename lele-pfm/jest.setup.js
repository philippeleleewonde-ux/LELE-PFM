import '@testing-library/jest-dom';

// Mock expo modules
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([]),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn().mockResolvedValue(undefined),
      language: 'fr',
      isInitialized: true,
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Suppress console errors in tests if needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Non-serializable values') ||
        args[0].includes('Warning: useLayoutEffect'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testTimeout = 10000;

// Mock crypto module if needed
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = crypto;
}
