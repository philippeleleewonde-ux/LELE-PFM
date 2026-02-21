module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components$': '<rootDir>/src/components',
    '^@/theme$': '<rootDir>/src/theme',
    '^@/stores$': '<rootDir>/src/stores',
    '^@/types$': '<rootDir>/src/types',
    '^@/utils$': '<rootDir>/src/utils',
    '^@/services$': '<rootDir>/src/services',
    '^@/hooks$': '<rootDir>/src/hooks',
    '^@/i18n$': '<rootDir>/src/i18n',
    '^@/infrastructure$': '<rootDir>/src/infrastructure',
    '^@/domain$': '<rootDir>/src/domain',
    '^@/domain/calculators/(.*)$': '<rootDir>/src/domain/calculators/$1',
    '^@/domain/validators/(.*)$': '<rootDir>/src/domain/validators/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest'],
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/?(*.)+(spec|test).(ts|tsx)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
};
