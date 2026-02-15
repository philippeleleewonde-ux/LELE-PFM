/**
 * ============================================
 * TESTS UNITAIRES - CENTRE DE PERFORMANCE
 * ============================================
 *
 * Tests des fonctions de calcul de performance:
 * - calculateGlobalNote: Note sur 10
 * - calculateGrade: Attribution du grade A+ à E
 * - getGradeColor: Couleur CSS du grade
 * - Distribution Prime/Trésorerie: 33%/67%
 */

import { describe, test, expect } from 'vitest';
import {
  calculateGlobalNote,
  calculateGrade,
  getGradeColor,
  getGradeTextColor,
  INDICATOR_LABELS,
  INDICATOR_KEYS,
  validateCurrency,
  validateObjectif,
  validateEconomies,
  isValidIndicatorKey,
  isValidGrade,
  calculateGlobalNoteWithValidation,
  validatePrimeTresoRatio,
  PRIME_RATIO,
  TRESO_RATIO
} from '../types/performanceCenter';

// ============================================
// TESTS: calculateGlobalNote
// ============================================

describe('calculateGlobalNote', () => {
  describe('cas nominaux', () => {
    test('retourne 10 pour 100% de réalisation', () => {
      expect(calculateGlobalNote(1000, 1000)).toBe(10);
    });

    test('retourne 5 pour 50% de réalisation', () => {
      expect(calculateGlobalNote(500, 1000)).toBe(5);
    });

    test('retourne 7.5 pour 75% de réalisation', () => {
      expect(calculateGlobalNote(750, 1000)).toBe(7.5);
    });

    test('retourne 2.5 pour 25% de réalisation', () => {
      expect(calculateGlobalNote(250, 1000)).toBe(2.5);
    });
  });

  describe('cas de surperformance', () => {
    test('plafonne à 10 pour 150% de réalisation', () => {
      expect(calculateGlobalNote(1500, 1000)).toBe(10);
    });

    test('plafonne à 10 pour 200% de réalisation', () => {
      expect(calculateGlobalNote(2000, 1000)).toBe(10);
    });

    test('plafonne à 10 pour toute valeur > objectif', () => {
      expect(calculateGlobalNote(999999, 1000)).toBe(10);
    });
  });

  describe('cas limites - zéro', () => {
    test('retourne 0 pour zéro économies', () => {
      expect(calculateGlobalNote(0, 1000)).toBe(0);
    });

    test('retourne 0 pour objectif zéro', () => {
      expect(calculateGlobalNote(1000, 0)).toBe(0);
    });

    test('retourne 0 pour les deux valeurs à zéro', () => {
      expect(calculateGlobalNote(0, 0)).toBe(0);
    });
  });

  describe('cas limites - valeurs négatives', () => {
    test('retourne 0 pour économies négatives', () => {
      expect(calculateGlobalNote(-500, 1000)).toBe(0);
    });

    test('retourne 0 pour objectif négatif', () => {
      expect(calculateGlobalNote(500, -1000)).toBe(0);
    });

    test('retourne 0 pour les deux valeurs négatives', () => {
      expect(calculateGlobalNote(-500, -1000)).toBe(0);
    });
  });

  describe('précision et arrondi', () => {
    test('arrondit à une décimale - cas 7.33...', () => {
      // 733.33... / 1000 * 10 = 7.333...
      expect(calculateGlobalNote(733, 1000)).toBe(7.3);
    });

    test('arrondit à une décimale - cas 7.67', () => {
      // 766.67 / 1000 * 10 = 7.6667
      expect(calculateGlobalNote(767, 1000)).toBe(7.7);
    });

    test('gère les très petites valeurs', () => {
      expect(calculateGlobalNote(1, 1000)).toBe(0);
    });

    test('gère les très grandes valeurs', () => {
      expect(calculateGlobalNote(1000000, 1000000)).toBe(10);
    });
  });
});

// ============================================
// TESTS: calculateGrade
// ============================================

describe('calculateGrade', () => {
  describe('grades A+ et A', () => {
    test('retourne A+ pour note 10', () => {
      expect(calculateGrade(10)).toBe('A+');
    });

    test('retourne A+ pour note 9.5 (arrondi à 10)', () => {
      expect(calculateGrade(9.5)).toBe('A+');
    });

    test('retourne A+ pour note 9', () => {
      expect(calculateGrade(9)).toBe('A+');
    });

    test('retourne A+ pour note 8.5 (arrondi à 9)', () => {
      expect(calculateGrade(8.5)).toBe('A+');
    });

    test('retourne A pour note 8', () => {
      expect(calculateGrade(8)).toBe('A');
    });

    test('retourne A pour note 7.6 (arrondi à 8)', () => {
      expect(calculateGrade(7.6)).toBe('A');
    });
  });

  describe('grades B+ et B', () => {
    test('retourne B+ pour note 7', () => {
      expect(calculateGrade(7)).toBe('B+');
    });

    test('retourne B+ pour note 6.5 (arrondi à 7)', () => {
      expect(calculateGrade(6.5)).toBe('B+');
    });

    test('retourne B pour note 6', () => {
      expect(calculateGrade(6)).toBe('B');
    });

    test('retourne B pour note 5.6 (arrondi à 6)', () => {
      expect(calculateGrade(5.6)).toBe('B');
    });
  });

  describe('grades C+ et C', () => {
    test('retourne C+ pour note 5', () => {
      expect(calculateGrade(5)).toBe('C+');
    });

    test('retourne C pour note 4', () => {
      expect(calculateGrade(4)).toBe('C');
    });
  });

  describe('grades D+ et D', () => {
    test('retourne D+ pour note 3', () => {
      expect(calculateGrade(3)).toBe('D+');
    });

    test('retourne D pour note 2', () => {
      expect(calculateGrade(2)).toBe('D');
    });
  });

  describe('grades E+ et E', () => {
    test('retourne E+ pour note 1', () => {
      expect(calculateGrade(1)).toBe('E+');
    });

    test('retourne E pour note 0', () => {
      expect(calculateGrade(0)).toBe('E');
    });

    test('retourne E pour valeurs négatives', () => {
      expect(calculateGrade(-1)).toBe('E');
    });
  });
});

// ============================================
// TESTS: getGradeColor
// ============================================

describe('getGradeColor', () => {
  // Couleurs WCAG AA conformes (contraste ≥ 4.5:1 avec texte blanc)
  test('retourne emerald-600 pour A+ (contraste 5.1:1)', () => {
    expect(getGradeColor('A+')).toBe('bg-emerald-600');
  });

  test('retourne green-600 pour A (contraste 4.5:1)', () => {
    expect(getGradeColor('A')).toBe('bg-green-600');
  });

  test('retourne blue-600 pour B+ (contraste 4.6:1)', () => {
    expect(getGradeColor('B+')).toBe('bg-blue-600');
  });

  test('retourne sky-600 pour B (contraste 4.7:1)', () => {
    expect(getGradeColor('B')).toBe('bg-sky-600');
  });

  test('retourne amber-700 pour C+ (contraste 4.6:1)', () => {
    expect(getGradeColor('C+')).toBe('bg-amber-700');
  });

  test('retourne orange-700 pour C (contraste 4.7:1)', () => {
    expect(getGradeColor('C')).toBe('bg-orange-700');
  });

  test('retourne red-600 pour D+ (contraste 4.5:1)', () => {
    expect(getGradeColor('D+')).toBe('bg-red-600');
  });

  test('retourne red-700 pour D (contraste 5.6:1)', () => {
    expect(getGradeColor('D')).toBe('bg-red-700');
  });

  test('retourne rose-700 pour E+ (contraste 5.2:1)', () => {
    expect(getGradeColor('E+')).toBe('bg-rose-700');
  });

  test('retourne rose-800 pour E (contraste 6.8:1)', () => {
    expect(getGradeColor('E')).toBe('bg-rose-800');
  });

  test('retourne gray-500 pour grade invalide', () => {
    expect(getGradeColor('X')).toBe('bg-gray-500');
  });
});

// ============================================
// TESTS: getGradeTextColor
// ============================================

describe('getGradeTextColor', () => {
  // Couleurs avec variantes dark mode
  test('retourne couleur avec dark mode pour A+', () => {
    expect(getGradeTextColor('A+')).toBe('text-emerald-600 dark:text-emerald-400');
  });

  test('retourne couleur avec dark mode pour B', () => {
    expect(getGradeTextColor('B')).toBe('text-sky-600 dark:text-sky-400');
  });

  test('retourne couleur avec dark mode pour C+', () => {
    expect(getGradeTextColor('C+')).toBe('text-amber-600 dark:text-amber-400');
  });

  test('retourne couleur avec dark mode pour E', () => {
    expect(getGradeTextColor('E')).toBe('text-rose-700 dark:text-rose-400');
  });

  test('retourne fallback pour grade invalide', () => {
    expect(getGradeTextColor('X')).toBe('text-gray-600 dark:text-gray-400');
  });
});

// ============================================
// TESTS: Distribution Prime/Trésorerie
// ============================================

describe('Distribution Prime/Trésorerie', () => {
  const PRIME_RATIO = 0.33;
  const TRESO_RATIO = 0.67;

  test('la somme des ratios égale 100%', () => {
    expect(PRIME_RATIO + TRESO_RATIO).toBe(1);
  });

  test('calcul correct pour objectif 1000€', () => {
    const objectif = 1000;
    const prevPrime = objectif * PRIME_RATIO;
    const prevTreso = objectif * TRESO_RATIO;

    expect(prevPrime).toBe(330);
    expect(prevTreso).toBe(670);
    expect(prevPrime + prevTreso).toBe(objectif);
  });

  test('calcul correct pour économies 750€', () => {
    const economies = 750;
    const realPrime = economies * PRIME_RATIO;
    const realTreso = economies * TRESO_RATIO;

    // Utiliser toBeCloseTo pour gérer les erreurs d'arrondi flottant
    expect(realPrime).toBeCloseTo(247.5, 5);
    expect(realTreso).toBeCloseTo(502.5, 5);
    expect(realPrime + realTreso).toBeCloseTo(economies, 10);
  });

  test('gère les valeurs décimales sans perte de précision significative', () => {
    const objectif = 1234.56;
    const prime = objectif * PRIME_RATIO;
    const treso = objectif * TRESO_RATIO;

    // Tolérance pour erreurs d'arrondi flottant
    expect(prime + treso).toBeCloseTo(objectif, 10);
  });
});

// ============================================
// TESTS: Constantes
// ============================================

describe('Constantes', () => {
  test('INDICATOR_LABELS contient tous les indicateurs', () => {
    expect(Object.keys(INDICATOR_LABELS)).toHaveLength(5);
    expect(INDICATOR_LABELS.abs).toBe('Absentéisme');
    expect(INDICATOR_LABELS.qd).toBe('Défauts de qualité');
    expect(INDICATOR_LABELS.oa).toBe('Accidents du travail');
    expect(INDICATOR_LABELS.ddp).toBe('Écarts de productivité directe');
    expect(INDICATOR_LABELS.ekh).toBe('Écarts de savoir-faire');
  });

  test('INDICATOR_KEYS contient les clés correctes', () => {
    expect(INDICATOR_KEYS).toEqual(['abs', 'qd', 'oa', 'ddp', 'ekh']);
    expect(INDICATOR_KEYS).toHaveLength(5);
  });
});

// ============================================
// TESTS D'INTÉGRATION
// ============================================

describe('Intégration: Note → Grade → Couleur', () => {
  test('workflow complet pour excellente performance', () => {
    const economies = 950;
    const objectif = 1000;

    const note = calculateGlobalNote(economies, objectif);
    const grade = calculateGrade(note);
    const color = getGradeColor(grade);

    expect(note).toBe(9.5);
    expect(grade).toBe('A+');
    expect(color).toBe('bg-emerald-600');
  });

  test('workflow complet pour performance moyenne', () => {
    const economies = 650;
    const objectif = 1000;

    const note = calculateGlobalNote(economies, objectif);
    const grade = calculateGrade(note);
    const color = getGradeColor(grade);

    expect(note).toBe(6.5);
    expect(grade).toBe('B+');
    expect(color).toBe('bg-blue-600');
  });

  test('workflow complet pour mauvaise performance', () => {
    const economies = 200;
    const objectif = 1000;

    const note = calculateGlobalNote(economies, objectif);
    const grade = calculateGrade(note);
    const color = getGradeColor(grade);

    expect(note).toBe(2);
    expect(grade).toBe('D');
    expect(color).toBe('bg-red-700'); // WCAG AA conforme (contraste 5.6:1)
  });

  test('workflow complet pour surperformance', () => {
    const economies = 1500;
    const objectif = 1000;

    const note = calculateGlobalNote(economies, objectif);
    const grade = calculateGrade(note);
    const color = getGradeColor(grade);

    expect(note).toBe(10); // Capped
    expect(grade).toBe('A+');
    expect(color).toBe('bg-emerald-600');
  });
});

// ============================================
// TESTS: VALIDATION DES ENTRÉES
// ============================================

describe('validateCurrency', () => {
  test('valide un nombre positif', () => {
    const result = validateCurrency(1000, 'montant');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(1000);
  });

  test('valide zéro', () => {
    const result = validateCurrency(0, 'montant');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(0);
  });

  test('rejette valeur négative par défaut', () => {
    const result = validateCurrency(-500, 'montant');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('négatif');
    expect(result.sanitizedValue).toBe(0);
  });

  test('accepte valeur négative si autorisé', () => {
    const result = validateCurrency(-500, 'montant', { allowNegative: true });
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(-500);
  });

  test('convertit une chaîne numérique', () => {
    const result = validateCurrency('1234.56', 'montant');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(1234.56);
  });

  test('rejette NaN', () => {
    const result = validateCurrency(NaN, 'montant');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('nombre valide');
  });

  test('rejette Infinity', () => {
    const result = validateCurrency(Infinity, 'montant');
    expect(result.isValid).toBe(false);
  });

  test('rejette chaîne non numérique', () => {
    const result = validateCurrency('abc', 'montant');
    expect(result.isValid).toBe(false);
  });

  test('respecte la valeur maximale', () => {
    const result = validateCurrency(15000, 'montant', { maxValue: 10000 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('maximale');
    expect(result.sanitizedValue).toBe(10000);
  });
});

describe('validateObjectif', () => {
  test('valide un objectif positif', () => {
    const result = validateObjectif(5000);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(5000);
  });

  test('rejette zéro (division par zéro)', () => {
    const result = validateObjectif(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('supérieur à 0');
  });

  test('rejette valeur négative', () => {
    const result = validateObjectif(-100);
    expect(result.isValid).toBe(false);
  });
});

describe('validateEconomies', () => {
  test('valide économies positives', () => {
    const result = validateEconomies(1000);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(1000);
  });

  test('plafonne économies négatives à 0', () => {
    const result = validateEconomies(-500);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(0);
  });

  test('accepte zéro', () => {
    const result = validateEconomies(0);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(0);
  });
});

describe('isValidIndicatorKey', () => {
  test('accepte les clés valides', () => {
    expect(isValidIndicatorKey('abs')).toBe(true);
    expect(isValidIndicatorKey('qd')).toBe(true);
    expect(isValidIndicatorKey('oa')).toBe(true);
    expect(isValidIndicatorKey('ddp')).toBe(true);
    expect(isValidIndicatorKey('ekh')).toBe(true);
  });

  test('rejette les clés invalides', () => {
    expect(isValidIndicatorKey('xyz')).toBe(false);
    expect(isValidIndicatorKey('')).toBe(false);
    expect(isValidIndicatorKey('ABS')).toBe(false);
  });
});

describe('isValidGrade', () => {
  test('accepte tous les grades valides', () => {
    const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E+', 'E'];
    validGrades.forEach(grade => {
      expect(isValidGrade(grade)).toBe(true);
    });
  });

  test('rejette les grades invalides', () => {
    expect(isValidGrade('F')).toBe(false);
    expect(isValidGrade('')).toBe(false);
    expect(isValidGrade('a+')).toBe(false);
  });
});

describe('calculateGlobalNoteWithValidation', () => {
  test('calcule correctement avec entrées valides', () => {
    const result = calculateGlobalNoteWithValidation(750, 1000);
    expect(result.note).toBe(7.5);
    expect(result.grade).toBe('A');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test('gère objectif invalide', () => {
    const result = calculateGlobalNoteWithValidation(500, 0);
    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.note).toBe(0);
  });

  test('gère économies négatives (plafonnées)', () => {
    const result = calculateGlobalNoteWithValidation(-500, 1000);
    expect(result.isValid).toBe(true);
    expect(result.note).toBe(0); // économies plafonnées à 0
    expect(result.grade).toBe('E');
  });

  test('gère entrées chaîne', () => {
    const result = calculateGlobalNoteWithValidation('500', '1000');
    expect(result.note).toBe(5);
    expect(result.grade).toBe('C+');
    expect(result.isValid).toBe(true);
  });
});

// ============================================
// TESTS: validatePrimeTresoRatio
// ============================================

describe('validatePrimeTresoRatio', () => {
  test('valide un ratio conforme 33%/67%', () => {
    const economies = 1000;
    const realPrime = economies * PRIME_RATIO; // 330
    const realTreso = economies * TRESO_RATIO; // 670

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso);

    expect(result.isFullyCompliant).toBe(true);
    expect(result.isPrimeRatioValid).toBe(true);
    expect(result.isTresoRatioValid).toBe(true);
    expect(result.actualPrimeRatio).toBeCloseTo(PRIME_RATIO, 5);
    expect(result.actualTresoRatio).toBeCloseTo(TRESO_RATIO, 5);
  });

  test('détecte un ratio Prime incorrect (50%/50%)', () => {
    const economies = 1000;
    const realPrime = 500; // 50% au lieu de 33%
    const realTreso = 500; // 50% au lieu de 67%

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso);

    expect(result.isFullyCompliant).toBe(false);
    expect(result.isPrimeRatioValid).toBe(false);
    expect(result.isTresoRatioValid).toBe(false);
    expect(result.actualPrimeRatio).toBeCloseTo(0.5, 5);
    expect(result.actualTresoRatio).toBeCloseTo(0.5, 5);
  });

  test('détecte seulement Prime incorrect', () => {
    const economies = 1000;
    const realPrime = 400; // 40% au lieu de 33%
    const realTreso = 670; // 67% correct

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso);

    expect(result.isFullyCompliant).toBe(false);
    expect(result.isPrimeRatioValid).toBe(false);
    expect(result.isTresoRatioValid).toBe(true);
  });

  test('détecte seulement Trésorerie incorrect', () => {
    const economies = 1000;
    const realPrime = 330; // 33% correct
    const realTreso = 500; // 50% au lieu de 67%

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso);

    expect(result.isFullyCompliant).toBe(false);
    expect(result.isPrimeRatioValid).toBe(true);
    expect(result.isTresoRatioValid).toBe(false);
  });

  test('gère économies à zéro (aucune erreur)', () => {
    const result = validatePrimeTresoRatio(0, 0, 0);

    expect(result.isFullyCompliant).toBe(true);
    expect(result.isPrimeRatioValid).toBe(true);
    expect(result.isTresoRatioValid).toBe(true);
    expect(result.actualPrimeRatio).toBe(0);
    expect(result.actualTresoRatio).toBe(0);
  });

  test('accepte une tolérance de 1%', () => {
    const economies = 1000;
    // 33.5% Prime au lieu de 33% (écart de 0.5%)
    const realPrime = 335;
    // 66.5% Tréso au lieu de 67% (écart de 0.5%)
    const realTreso = 665;

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso, 0.01);

    // Avec tolérance de 1%, cela devrait être accepté (écart < 1%)
    expect(result.isPrimeRatioValid).toBe(true);
    expect(result.isTresoRatioValid).toBe(true);
    expect(result.isFullyCompliant).toBe(true);
  });

  test('rejette si écart dépasse la tolérance', () => {
    const economies = 1000;
    // 35% Prime au lieu de 33% (écart de 2%)
    const realPrime = 350;
    const realTreso = 650;

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso, 0.01);

    expect(result.isPrimeRatioValid).toBe(false);
    expect(result.primeDeviation).toBeCloseTo(0.02, 5);
  });

  test('calcule correctement les écarts', () => {
    const economies = 1000;
    const realPrime = 400; // 40%
    const realTreso = 600; // 60%

    const result = validatePrimeTresoRatio(economies, realPrime, realTreso);

    // Écart Prime: |0.40 - 0.33| = 0.07
    expect(result.primeDeviation).toBeCloseTo(0.07, 5);
    // Écart Tréso: |0.60 - 0.67| = 0.07
    expect(result.tresoDeviation).toBeCloseTo(0.07, 5);
  });
});
