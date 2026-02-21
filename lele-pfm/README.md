# LELE PFM - Personal Financial Management Mobile App

A production-ready React Native/Expo application for personal financial management built with TypeScript, offering comprehensive features for tracking transactions, managing budgets, and analyzing financial performance.

## Project Overview

LELE PFM is a full-featured mobile application designed to help users:
- Track income and expenses with categorization
- Monitor account balances across multiple accounts
- Set and achieve savings goals
- Analyze financial performance with insights
- Manage budgets with alerts
- Secure authentication with biometric support

## Technology Stack

### Core Framework
- **React Native 0.76.0** - Cross-platform mobile development
- **Expo 52.0.0** - Development platform and managed service
- **Expo Router 4.0.0** - File-based routing
- **TypeScript 5.4** - Type-safe development

### State Management & Form Handling
- **Zustand 5.0.0** - Lightweight state management
- **React Hook Form 7.53.0** - Efficient form handling
- **Zod 3.23.8** - TypeScript-first schema validation

### Backend & Authentication
- **Supabase 2.45.0** - Backend as a Service with PostgreSQL
- **Expo Secure Store 13.0.0** - Secure token persistence
- **Expo Local Authentication 14.0.0** - Biometric authentication

### UI & Styling
- **React Native Reanimated 3.16.0** - Smooth animations
- **Lucide React Native 0.447.0** - Icon library
- **React Navigation 6.1.18** - Tab navigation

### Utilities
- **i18next 23.15.0** - Internationalization (French by default)
- **date-fns 4.1.0** - Date manipulation
- **Victory Native 41.0.0** - Data visualization

### Development Tools
- **ESLint** - Code quality with strict TypeScript rules
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Testing Library React Native** - Component testing

## Project Structure

```
lele-pfm/
├── src/
│   ├── app/
│   │   ├── (tabs)/              # Tab navigation group
│   │   │   ├── _layout.tsx      # Tab navigator setup
│   │   │   ├── index.tsx        # Dashboard screen
│   │   │   ├── transactions.tsx # Transactions screen
│   │   │   ├── performance.tsx  # Performance analytics
│   │   │   └── settings.tsx     # Settings screen
│   │   └── _layout.tsx          # Root layout
│   ├── components/              # Reusable components
│   ├── theme/
│   │   ├── colors.ts           # Color palette (light/dark)
│   │   ├── typography.ts       # Font definitions
│   │   └── index.ts            # Theme export
│   ├── i18n/
│   │   ├── index.ts            # i18n configuration
│   │   └── locales/
│   │       └── fr.json         # French translations
│   ├── infrastructure/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client setup
│   │       └── config.ts       # Configuration
│   ├── stores/
│   │   ├── auth.store.ts       # Authentication state
│   │   ├── app.store.ts        # App settings state
│   │   └── transaction.store.ts # Transaction management
│   ├── types/
│   │   └── index.ts            # Type definitions
│   ├── utils/
│   │   ├── validation.ts       # Input validation
│   │   ├── formatting.ts       # Format utilities
│   │   └── errors.ts           # Error handling
│   ├── services/
│   │   ├── auth.service.ts     # Authentication logic
│   │   └── index.ts            # Service exports
│   └── hooks/
│       ├── useTheme.ts         # Theme hook
│       ├── useBiometric.ts     # Biometric authentication
│       └── index.ts            # Hook exports
├── assets/                     # App icons and splash screens
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── app.json                   # Expo configuration
├── babel.config.js            # Babel configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration
└── package.json              # Dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
```bash
cd lele-pfm
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Initialize i18n**
The app initializes i18n automatically with French as the default language.

### Development

#### Start the development server
```bash
npm run start
```

#### Run on specific platforms
```bash
# iOS
npm run ios

# Android
npm run android

# Web (if configured)
npm run web
```

#### Type checking
```bash
npm run type-check
```

#### Linting
```bash
npm run lint
```

#### Formatting
```bash
npm run format
```

#### Testing
```bash
npm run test
```

## Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the required tables:
   - `users` - User profiles
   - `accounts` - Bank/investment accounts
   - `transactions` - Financial transactions
   - `categories` - Transaction categories
   - `budgets` - Budget management
   - `goals` - Savings goals

3. Configure Row Level Security (RLS) policies
4. Set up storage buckets for avatars, receipts, and documents

### Theme Customization

Colors are defined in `src/theme/colors.ts` with support for light and dark modes:
- Primary, Secondary, Accent colors
- Status colors (success, error, warning, info)
- Neutral grays
- Text and background colors

Update color values to match your brand:
```typescript
// src/theme/colors.ts
export const colors = {
  light: {
    primary: { /* ... */ },
    secondary: { /* ... */ },
  },
  dark: { /* ... */ },
};
```

### Internationalization

Add new language support:

1. Create `src/i18n/locales/en.json` for English
2. Update `src/i18n/index.ts`:
```typescript
const resources = {
  fr: { translation: fr },
  en: { translation: en },
};
```

## Key Features Implementation

### Authentication
- Email/password signup and login
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Secure token storage with expo-secure-store
- Automatic session management

### State Management
- **Auth Store**: User authentication state and session
- **App Store**: App settings (theme, language, notifications)
- **Transaction Store**: Transactions with filtering and sorting

### Validation
- Email validation
- Password strength requirements
- Phone number validation
- Currency validation
- Date validation

### Formatting
- Currency formatting with locale support
- Date/time formatting (French locale)
- File size formatting
- Percentage formatting
- String utilities (truncate, capitalize, slugify)

## API Integration

The app uses Supabase for:
- Authentication (JWT tokens)
- Real-time database (PostgreSQL)
- File storage (S3-compatible)
- Vector embeddings (optional)

## Security Features

1. **Secure Token Storage**: Tokens stored in device secure storage
2. **Biometric Authentication**: Optional fingerprint/face recognition
3. **Input Validation**: All user inputs validated server and client-side
4. **Error Handling**: Comprehensive error handling with custom error classes
5. **Environment Variables**: Sensitive data in environment files
6. **HTTPS Only**: All API communication encrypted

## Testing

### Run tests
```bash
npm run test
```

### Test coverage
```bash
npm run test -- --coverage
```

### Test structure
- Tests collocated with features
- Mocked dependencies (i18n, expo modules)
- Focus on unit and integration tests

## Code Quality

### ESLint Rules
- No console except warn/error
- No var declarations (use const/let)
- No unused variables
- Type assertions must use proper alternatives
- Strict null checks enabled

### Prettier Formatting
- Semicolons required
- Single quotes for strings
- Trailing commas (ES5)
- 100 character line width
- 2-space indentation

## Build & Deployment

### Build for iOS
```bash
eas build --platform ios
```

### Build for Android
```bash
eas build --platform android
```

### Configuration
- EAS project ID configured in `app.json`
- Bundle identifiers set per platform
- Icons and splash screens configured
- Permissions specified for each platform

## Troubleshooting

### Common Issues

**Expo not starting**
```bash
npm run start -- -c
```

**Module resolution errors**
Ensure path aliases in `tsconfig.json` and `babel.config.js` match

**i18n not initialized**
Check that `i18n/index.ts` is imported in the root layout

**Biometric not working**
Verify device supports biometric authentication and EnrolledAsync returns true

## Contributing Guidelines

1. **Branches**: Use feature branches (`feature/feature-name`)
2. **Commits**: Follow conventional commits
3. **Code Style**: Run `npm run lint` and `npm run format`
4. **Types**: Maintain strict TypeScript mode
5. **Tests**: Add tests for new features

## Performance Optimization

- React Native Reanimated for smooth animations
- Code splitting with Expo Router
- Lazy loading components
- Efficient state management with Zustand
- Proper memoization and useCallback usage

## Monitoring & Analytics

Integration points for:
- Error tracking (Sentry, LogRocket)
- Analytics (Firebase, Segment)
- Performance monitoring
- User behavior tracking

## Documentation

- Inline code comments for complex logic
- JSDoc for public APIs
- Type definitions for all data structures
- README for each major module

## License

Proprietary - LELE Team

## Support

For issues and questions, contact the development team.

## Changelog

### v1.0.0 (Initial Release)
- Core authentication system
- Dashboard with KPI cards
- Transaction management
- Performance analytics
- Settings and preferences
- Biometric authentication support
- French localization
- Dark mode support
