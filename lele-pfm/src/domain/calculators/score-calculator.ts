import { Grade } from '../../types';

export interface WeeklyScoreResult {
  score: number;
  grade: Grade;
}

export function calculateWeeklyScore(
  ekhPercent: number,
  completionPercent: number,
  budgetRespectPercent: number,
  eprVariationPercent: number
): WeeklyScoreResult {
  const score =
    (ekhPercent / 100) * 4 +
    (completionPercent / 100) * 3 +
    (budgetRespectPercent / 100) * 2 +
    (eprVariationPercent / 100) * 1;

  return {
    score: Math.round(score * 10) / 10,
    grade: scoreToGrade(score),
  };
}

export function scoreToGrade(score: number): Grade {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B';
  if (score >= 5.5) return 'C';
  if (score >= 4) return 'D';
  return 'E';
}

export function getGradeDescription(grade: Grade): string {
  const descriptions: Record<Grade, string> = {
    'A+': 'Exceptional - Outstanding financial health',
    A: 'Excellent - Strong financial position',
    B: 'Good - Solid financial management',
    C: 'Fair - Acceptable but needs improvement',
    D: 'Poor - Significant financial challenges',
    E: 'Critical - Urgent intervention needed',
  };
  return descriptions[grade];
}
