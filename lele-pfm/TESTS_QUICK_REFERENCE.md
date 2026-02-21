# Unit Tests - Quick Reference Guide

## Files Location
```
lele-pfm/
├── __tests__/unit/domain/
│   ├── epr-calculator.test.ts          (18 tests)
│   ├── score-calculator.test.ts        (34 tests)
│   ├── waterfall-distributor.test.ts   (24 tests)
│   └── business-rules.test.ts          (84 tests)
├── jest.config.js                       (Enhanced)
└── jest.setup.js                        (Enhanced)
```

## Test Execution

### Run All Tests
```bash
npm test
```

### Run Specific Suite
```bash
npm test epr-calculator
npm test score-calculator
npm test waterfall-distributor
npm test business-rules
```

### Coverage Report
```bash
npm test -- --coverage
```

### Watch Mode (Auto-rerun on changes)
```bash
npm test -- --watch
```

## EPR Calculator Tests (18 tests)

### calculateFlexibilityScore()
- All zeros → 0
- Maximum values (21,21,21) → 100
- Mid-range values → proportional score
- Single dimension maximum → 33.33%

### calculateEPR()
- Zero incompressibility (100% flexible) → full amount
- Zero flexibility → 0 EPR
- Formula: `amount * (1 - incomp%) * flex%`
- Large amounts handling
- Decimal precision

## Score Calculator Tests (34 tests)

### scoreToGrade()
- A+ for 9.0-10.0
- A for 8.0-8.9
- B for 7.0-7.9
- C for 6.0-6.9
- D for 5.0-5.9
- E for 0.0-4.9

### calculateWeeklyScore()
- Weights: EKH=4x, EAMK=1x, EAMU=1x, EAMP=1x
- Perfect score (100,100,100,100) → 10.0 (A+)
- Zero score (0,0,0,0) → 0.0 (E)
- Returns {score, grade} object

## Waterfall Distributor Tests (24 tests)

### distributeWaterfall(epr, config)
- Distributes EPR amount across 4 periods (P1-P4)
- Config percentages must sum to 100 (±0.01 tolerance)
- **NOT hardcoded 67/33** - fully config-driven
- Returns {p1Amount, p2Amount, p3Amount, p4Amount, isValid}

### Key Verifications
```javascript
// All configs should be respected
distributeWaterfall(10000, {p1: 50, p2: 20, p3: 20, p4: 10})
// → p1Amount: 5000, p2Amount: 2000, etc.

// Config-driven, not hardcoded
distributeWaterfall(10000, {p1: 10, p2: 60, p3: 20, p4: 10})
// → p1Amount: 1000, p2Amount: 6000 (NOT 6700)
```

## Business Rules Tests (84 tests)

### validateTransactionType()
- Accept: 'Fixe', 'Variable', 'Imprévue', 'Épargne-Dette'
- Reject: All other values including 'EKH'
- Case-sensitive validation

### validateCOICOPCode()
- Accept: '01' to '08' only
- Reject: '00', '09', and higher
- Two-digit string format required

### capRealToPrevu(actual, planned)
- Returns `min(actual, planned)`
- Prevents overspending against budget

### validateWaterfallConfig()
- Percentages must sum to 100 ± 0.01
- Rejects negative percentages
- Allows 100/0/0/0 distributions

### validateFlexibilityParams(f1, f2, f3)
- Each parameter: 0 to 21 range
- Used for flexibility score calculation

### validateWeekNumber(week)
- Accept: 1 to 52 inclusive
- Reject: 0, 53, decimals, negatives

## Common Test Patterns

### Testing Bounds
```typescript
it('should accept maximum values', () => {
  expect(validateWeekNumber(52)).toBe(true);
  expect(validateWeekNumber(53)).toBe(false);
});
```

### Testing Formulas
```typescript
it('should calculate correctly', () => {
  // amount=10000, incomp=30%, flex=60%
  // 10000 * (1 - 0.3) * (0.6) = 4200
  expect(calculateEPR(10000, 30, 60)).toBe(4200);
});
```

### Testing Return Types
```typescript
it('should return object with properties', () => {
  const result = calculateWeeklyScore(80, 85, 90, 75);
  expect(result).toHaveProperty('score');
  expect(result).toHaveProperty('grade');
});
```

## Coverage Targets

```
Coverage Thresholds:
├── Branches: 70%
├── Functions: 70%
├── Lines: 70%
└── Statements: 70%
```

## Key Business Rules Enforced

1. **EPR Calculation**
   - Formula: `amount * (1 - incompressibility%) * flexibility%`
   - Both factors applied in order
   - Never exceeds original amount

2. **Weekly Scoring**
   - EKH weighted at 4x
   - Other metrics (EAMK, EAMU, EAMP) at 1x each
   - Max score: 10.0, Min score: 0.0

3. **Waterfall Distribution**
   - Config-driven percentages (NOT hardcoded)
   - Must sum to 100% (±0.01 tolerance)
   - Proportional distribution maintains precision

4. **Data Validation**
   - 4 transaction types only
   - COICOP codes 01-08 only
   - Weeks 1-52 only
   - Flexibility dimensions 0-21 range

## Debugging Failed Tests

### Check Imports
Ensure @/ aliases resolve in jest.config.js moduleNameMapper

### Check Percentages
Many tests validate percentage sums - ensure tolerance is 0.01

### Check Formula Implementation
Verify order of operations in calculators

### Check Boundaries
Boundary tests often catch off-by-one errors in validators

## Performance Notes

- All tests run in Node.js environment
- No DOM interactions (no React component tests)
- Average execution time: < 100ms per test file
- Total suite time: ~2-3 seconds
