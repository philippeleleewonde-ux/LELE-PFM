import type { InvestmentProcedure } from '@/types/investor-journey';

import proceduresCemac from './procedures-cemac.json';
import proceduresUemoa from './procedures-uemoa.json';
import proceduresEastAfrica from './procedures-east-africa.json';
import proceduresSouthernAfrica from './procedures-southern-africa.json';
import proceduresMaghreb from './procedures-maghreb.json';
import proceduresEurope from './procedures-europe.json';
import proceduresOther from './procedures-other.json';

export const ALL_PROCEDURES: Record<string, InvestmentProcedure> = {
  ...(proceduresCemac as Record<string, InvestmentProcedure>),
  ...(proceduresUemoa as Record<string, InvestmentProcedure>),
  ...(proceduresEastAfrica as Record<string, InvestmentProcedure>),
  ...(proceduresSouthernAfrica as Record<string, InvestmentProcedure>),
  ...(proceduresMaghreb as Record<string, InvestmentProcedure>),
  ...(proceduresEurope as Record<string, InvestmentProcedure>),
  ...(proceduresOther as Record<string, InvestmentProcedure>),
};

export function getProcedure(
  countryCode: string,
  assetClass: string
): InvestmentProcedure | undefined {
  return ALL_PROCEDURES[`${countryCode}_${assetClass}`];
}

export function getProceduresForCountry(
  countryCode: string
): InvestmentProcedure[] {
  return Object.entries(ALL_PROCEDURES)
    .filter(([key]) => key.startsWith(`${countryCode}_`))
    .map(([, proc]) => proc);
}

export function getAvailableCountries(): string[] {
  const countries = new Set<string>();
  Object.keys(ALL_PROCEDURES).forEach((key) => {
    const countryCode = key.split('_')[0];
    countries.add(countryCode);
  });
  return Array.from(countries).sort();
}

export function getAssetClassesForCountry(countryCode: string): string[] {
  return Object.keys(ALL_PROCEDURES)
    .filter((key) => key.startsWith(`${countryCode}_`))
    .map((key) => key.replace(`${countryCode}_`, ''));
}
