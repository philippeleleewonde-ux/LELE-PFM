import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frCommon from './locales/fr/common.json';
import frOnboarding from './locales/fr/onboarding.json';
import frWizard from './locales/fr/wizard.json';
import frTracking from './locales/fr/tracking.json';
import frApp from './locales/fr/app.json';
import frChallenges from './locales/fr/challenges.json';
import frPerformance from './locales/fr/performance.json';

import enCommon from './locales/en/common.json';
import enOnboarding from './locales/en/onboarding.json';
import enWizard from './locales/en/wizard.json';
import enTracking from './locales/en/tracking.json';
import enApp from './locales/en/app.json';
import enChallenges from './locales/en/challenges.json';
import enPerformance from './locales/en/performance.json';

import esCommon from './locales/es/common.json';
import esOnboarding from './locales/es/onboarding.json';
import esWizard from './locales/es/wizard.json';
import esTracking from './locales/es/tracking.json';
import esApp from './locales/es/app.json';
import esChallenges from './locales/es/challenges.json';
import esPerformance from './locales/es/performance.json';

import ptCommon from './locales/pt/common.json';
import ptOnboarding from './locales/pt/onboarding.json';
import ptWizard from './locales/pt/wizard.json';
import ptTracking from './locales/pt/tracking.json';
import ptApp from './locales/pt/app.json';
import ptChallenges from './locales/pt/challenges.json';
import ptPerformance from './locales/pt/performance.json';

const resources = {
  fr: {
    common: frCommon,
    onboarding: frOnboarding,
    wizard: frWizard,
    tracking: frTracking,
    app: frApp,
    challenges: frChallenges,
    performance: frPerformance,
  },
  en: {
    common: enCommon,
    onboarding: enOnboarding,
    wizard: enWizard,
    tracking: enTracking,
    app: enApp,
    challenges: enChallenges,
    performance: enPerformance,
  },
  es: {
    common: esCommon,
    onboarding: esOnboarding,
    wizard: esWizard,
    tracking: esTracking,
    app: esApp,
    challenges: esChallenges,
    performance: esPerformance,
  },
  pt: {
    common: ptCommon,
    onboarding: ptOnboarding,
    wizard: ptWizard,
    tracking: ptTracking,
    app: ptApp,
    challenges: ptChallenges,
    performance: ptPerformance,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: ['common', 'onboarding', 'wizard', 'tracking', 'app', 'challenges', 'performance'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
