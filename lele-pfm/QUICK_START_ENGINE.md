# PersonalFinanceEngine - Quick Start Guide

## Basic Usage

### 1. Import the Engine

```typescript
import { PersonalFinanceEngine, EngineInput, EngineOutput } from '@domain/engine/personal-finance-engine';
```

### 2. Prepare Your Input Data

```typescript
const engineInput: EngineInput = {
  revenues: [
    {
      id: 'rev1',
      type: 'salaire_net',
      montant_mensuel: 300000,      // 3000 EUR in cents
      montant_annuel: 3600000,       // 36000 EUR in cents
      progression_pct: 2,            // 2% growth potential
      devise: 'EUR',
      date_debut: new Date('2024-01-01'),
      stable: true
    }
  ],
  expenses: [
    {
      id: 'exp1',
      type: 'fixe',
      montant_mensuel: 100000,       // 1000 EUR fixed rent
      montant_annuel: 1200000,
      devise: 'EUR',
      description: 'Rent',
      coicop_code: '04',             // Housing
      date_debut: new Date('2024-01-01'),
      flexibilite: 10,               // 10% flexible
      incompressibilite: 90          // 90% incompressible
    },
    {
      id: 'exp2',
      type: 'variable',
      montant_mensuel: 50000,        // 500 EUR food
      montant_annuel: 600000,
      devise: 'EUR',
      description: 'Groceries',
      coicop_code: '01',             // Food
      date_debut: new Date('2024-01-01'),
      flexibilite: 60,               // 60% flexible
      incompressibilite: 30          // 30% incompressible
    }
  ],
  financialHistory: [
    {
      annee: 2023,
      revenus_annuels: 3500000,      // Historical variations
      depenses_annuels: 1800000,
      epargne_nette: 1700000,
      variation_pct: 5                // 5% year-over-year
    },
    {
      annee: 2022,
      revenus_annuels: 3400000,
      depenses_annuels: 1750000,
      epargne_nette: 1650000,
      variation_pct: 3
    },
    {
      annee: 2021,
      revenus_annuels: 3300000,
      depenses_annuels: 1700000,
      epargne_nette: 1600000,
      variation_pct: 1
    }
  ],
  commitments: [
    {
      id: 'debt1',
      type: 'pret',
      montant_mensuel: 50000,        // Loan payment
      montant_total_restant: 500000, // 5000 EUR remaining
      taux_interet: 3.5,             // 3.5% interest
      duree_mois: 24,                // 2 years left
      date_fin: new Date('2026-02-07')
    }
  ],
  riskAssessment: {
    emploi: 2,                       // Low employment risk
    santé: 2,                        // Low health risk
    résidentiel: 1,                  // Very low housing risk
    familial: 2,                     // Low family risk
    endettement: 2,                  // Low debt risk
    inflation: 3                     // Moderate inflation risk
  },
  ekhScore: {
    score: 6.5,                      // Good EKH (0-10)
    epargne: 4,                      // Good savings
    endettement: 3,                  // Moderate debt
    competences: 4,                  // Good skills
    horizon: 120                     // 10-year horizon
  },
  levers: [
    {
      id: 'lever1',
      type: 'urgence',               // Emergency fund
      priority: 1,
      target_amount: 300000,         // 3000 EUR target
      current_amount: 150000,        // Currently 1500 EUR
      pct_total: 30
    },
    {
      id: 'lever2',
      type: 'dette',                 // Debt reduction
      priority: 2,
      target_amount: 250000,         // 2500 EUR target
      current_amount: 0,
      pct_total: 25
    },
    {
      id: 'lever3',
      type: 'investissement',        // Investments
      priority: 3,
      target_amount: 300000,         // 3000 EUR target
      current_amount: 100000,        // Currently 1000 EUR
      pct_total: 30
    },
    {
      id: 'lever4',
      type: 'plaisir',               // Quality of life
      priority: 4,
      target_amount: 150000,         // 1500 EUR target
      current_amount: 50000,         // Currently 500 EUR
      pct_total: 15
    }
  ],
  profile: {
    type: 'Salarié',                 // Employee
    age: 35,
    dependents: 1,
    risk_tolerance: 'Modéré',        // Moderate risk
    locale: 'fr-FR'
  }
};
```

### 3. Create Engine and Calculate

```typescript
try {
  const engine = new PersonalFinanceEngine(engineInput);
  const output: EngineOutput = engine.calculate();
  
  // Results are now available in output
  console.log('Global Score:', output.globalScore);
  console.log('Grade:', output.grade);
  console.log('Execution Time:', output.executionTimeMs, 'ms');
} catch (error) {
  console.error('Engine error:', error);
}
```

### 4. Access Results

```typescript
// Step 1: Revenue Potentials
const potentials = output.step1;
console.log('Total Revenue Potential:', potentials.total_revenue_potential); // cents
console.log('Fixed Potential:', potentials.fixed_potential);
console.log('Variable Potential:', potentials.variable_potential);

// Step 2: Expected Losses
const expectedLoss = output.step2;
console.log('Total Expected Loss:', expectedLoss.total_expected_loss);
expectedLoss.details.forEach(detail => {
  console.log(`${detail.category}: ${detail.expected_loss} (prob: ${detail.probability})`);
});

// Step 3: Volatility
const volatility = output.step3;
console.log('Total Volatility:', volatility.sigma_total);
console.log('Used Default:', volatility.used_default);

// Step 4: Unexpected Loss
const ul = output.step4;
console.log('Unexpected Loss:', ul.unexpected_loss);
console.log('Coefficient:', ul.contextual_coefficient);

// Step 5: Historical VaR
const varHist = output.step5;
console.log('5th Percentile:', varHist.var_percentile);

// Step 6: VaR 95
const var95 = output.step6;
console.log('VaR 95:', var95.var95); // 95% confidence interval

// Step 7: PRL
const prl = output.step7;
console.log('Reste-à-vivre:', prl.reste_a_vivre);
console.log('Alert Level:', prl.alert_level); // green/yellow/red

// Step 8: POB & Forecast
const pob = output.step8;
console.log('Probability of Default:', pob.pob, '%');
console.log('36-Month EL Forecast:', pob.el_36_months);

// Step 9: Distribution
const distribution = output.step9;
console.log('Reserve Amount:', distribution.reserve_amount);
distribution.distributions.forEach(alloc => {
  console.log(`${alloc.lever_type}: ${alloc.allocated_amount}`);
});

// Step 10: Monthly Ventilation
const ventilation = output.step10;
console.log('Total 36-month:', ventilation.total_36_months);
ventilation.monthly_ventilations.forEach((month, idx) => {
  console.log(`Month ${idx + 1}: ${month.total_month} (${month.progression_pct.toFixed(1)}%)`);
});

// Global Score & Grade
console.log('Global Score:', output.globalScore);     // 0-10
console.log('Grade:', output.grade);                  // A+ to E
console.log('Audit Trail:', output.auditTrail);      // Performance timing
```

## Helper Functions

### Calculate Weekly Score

```typescript
import { calculateWeeklyFinancialScore } from '@domain/calculators/score-calculator';

const weeklyScore = calculateWeeklyFinancialScore({
  ekh_score: 6.5,              // 0-10
  completion_rate: 0.75,       // 75% completion
  budget_respect: 0.85,        // 85% budget adherence
  variation_smoothness: 0.70   // 70% smooth spending
});

console.log('Weekly Score:', weeklyScore.raw_score);
console.log('Grade:', weeklyScore.grade);
console.log('Components:', weeklyScore.components);
```

### Calculate Flexibility Score

```typescript
import { calculateFlexibilityScore } from '@domain/calculators/flexibility-calculator';

const flexibility = calculateFlexibilityScore(
  15,  // F1: Fixed expense rigidity (0-21)
  18,  // F2: Variable flexibility (0-21)
  14   // F3: Budget compliance (0-21)
);

// Result: (15+18+14)/63 × 100 = 69.8%
console.log('Flexibility Score:', flexibility.total_score);
```

### Calculate Waterfall Allocation

```typescript
import { calculateWaterfallAllocation } from '@domain/calculators/waterfall-distributor';

const allocation = calculateWaterfallAllocation(
  25,      // P1: Urgence (%) 
  25,      // P2: Dette (%)
  30,      // P3: Investissement (%)
  20,      // P4: Plaisir (%)
  1000000  // Total EPR (cents) = 10,000 EUR
);

console.log('P1 (Urgence):', allocation.p1_urgence);           // 250,000 cents
console.log('P2 (Dette):', allocation.p2_dette);               // 250,000 cents
console.log('P3 (Investissement):', allocation.p3_investissement); // 300,000 cents
console.log('P4 (Plaisir):', allocation.p4_plaisir);           // 200,000 cents
```

### Calculate EPR

```typescript
import { calculateTotalEPR } from '@domain/calculators/epr-calculator';

const totalEPR = calculateTotalEPR(expenses);
console.log('Total EPR (Realizable Savings):', totalEPR); // cents
```

## Validation

All inputs are validated before calculation:

```typescript
import { validateEngineInput } from '@domain/utils/validation';

const validation = validateEngineInput(engineInput);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  validation.errors.forEach(error => console.error(`  - ${error}`));
}
```

## Conversion Utilities

```typescript
import { centsToCurrency, currencyToCents } from '@domain/utils/math-utils';

// Convert cents to currency string
const formatted = centsToCurrency(150000, 'EUR', 'fr-FR');
console.log(formatted); // "1 500,00 €"

// Convert currency to cents
const cents = currencyToCents(1500);
console.log(cents); // 150000
```

## Error Handling

Every step includes detailed error messages:

```typescript
try {
  const engine = new PersonalFinanceEngine(invalidInput);
  const output = engine.calculate();
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Error message will be like:
    // "Engine calculation failed: Step 1 failed: Invalid revenue..."
  }
}
```

## Performance Monitoring

Check execution time and audit trail:

```typescript
console.log('Total execution time:', output.executionTimeMs, 'ms');

output.auditTrail.forEach(audit => {
  console.log(`${audit.step}. ${audit.step_name}: ${audit.duration_ms}ms`);
});

// Output:
// 1. Calculate Potentials: 0.5ms
// 2. Calculate Expected Losses: 1.2ms
// 3. Calculate Volatility: 0.3ms
// ...
// Total target: < 500ms
```

## Integration with React

```typescript
import { useState } from 'react';
import { PersonalFinanceEngine } from '@domain/engine';

export function FinanceDashboard() {
  const [results, setResults] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (input: EngineInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const engine = new PersonalFinanceEngine(input);
      const output = engine.calculate();
      setResults(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Calculating...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!results) return <button onClick={() => handleCalculate(...)}>Calculate</button>;

  return (
    <div>
      <h1>Financial Health: {results.grade} ({results.globalScore}/10)</h1>
      <p>Execution time: {results.executionTimeMs}ms</p>
      {/* Display results.step1 through step10 */}
    </div>
  );
}
```

## Key Constraints & Validations

### Transaction Types (4 only)
- Fixe - Fixed recurring expenses
- Variable - Variable spending
- Imprévue - Unexpected/irregular
- Épargne-Dette - Savings/debt repayment

### COICOP Codes (01-08)
- 01: Food and non-alcoholic beverages
- 02: Alcoholic beverages and tobacco
- 03: Clothing and footwear
- 04: Housing, water, electricity, gas
- 05: Furnishings and household equipment
- 06: Health
- 07: Transport
- 08: Communication

### Score Ranges
- EKH Score: 0-10
- Weekly Score: 0-10
- Flexibility Score: 0-100
- Grade: A+ (9-10) | A (8-8.9) | B (7-7.9) | C (6-6.9) | D (5-5.9) | E (0-4.9)
- Risk Scores: 1-5 per category
- F1, F2, F3: 0-21 each

### Monetary Values
- All in CENTS (integers)
- Non-negative only
- Examples: 150000 = 1500 EUR, 50000 = 500 EUR

## Common Issues & Solutions

### "Transaction type must be one of..."
You used an invalid transaction type. Use only: Fixe, Variable, Imprévue, or Épargne-Dette

### "COICOP code must be 01-08"
You used an invalid expense category. Use codes 01 through 08.

### "Waterfall allocation invalid: Sum = X%"
Your P1+P2+P3+P4 percentages don't equal 100%. Check validation.

### "Step X failed: Montant must be a non-negative integer"
You passed a non-integer or negative number for a monetary value. All amounts must be in cents (integers) and >= 0.

## Next Steps

1. Review the detailed implementation in `/src/domain/`
2. Check the type definitions in `/src/domain/engine/types.ts`
3. Run unit tests with sample data
4. Integrate results display in your UI
5. Add state management for results
6. Implement local persistence if needed
