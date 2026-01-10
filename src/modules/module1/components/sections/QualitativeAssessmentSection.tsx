'use client';

import { QualitativeAssessment } from '@/modules/module1/types';
import { CheckCircle, AlertCircle, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';

interface QualitativeAssessmentSectionProps {
  data: QualitativeAssessment;
  onChange: (data: QualitativeAssessment) => void;
}

export function QualitativeAssessmentSection({ data, onChange }: QualitativeAssessmentSectionProps) {
  const handleChange = (field: keyof QualitativeAssessment, value: string) => {
    const numericValue = CFOCalculationEngine.convertQualitativeToQuantitative(value);
    onChange({ ...data, [field]: numericValue });
  };

  // Standardized 5-option scale for all qualitative assessments
  const importanceOptions = [
    'Not important at all',
    'Not very important',
    'Somewhat important',
    'Important',
    'Very important'
  ];

  const getDisplayValue = (value: string | number) => {
    if (typeof value === 'number') {
      return CFOCalculationEngine.convertQuantitativeToQualitative(value);
    }
    return value || ''; // Return the string value or an empty string if it's null/undefined
  };

  return (
    <div className="space-y-6">
      {/* Section Description */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
        <p className="text-primary text-sm">
          Programming data of potentially recoverable loss accounts (PRL): qualitative estimate of the incidents of operational risk.
        </p>
      </div>

      <div className="form-grid">
        {/* 1- Operational Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" />
            <span>1- Losses related to Operational Risk (Basel II Committee, Loss event type classification, QIS 2 - Operational Risk Loss Data, 4 May 2001)</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.operationalRiskIncidents)}
            onChange={(e) => handleChange('operationalRiskIncidents', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* 2- Credit Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <DollarSign className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
            <span>2- Losses related to Credit counterparty risk or signature risk (Client risk and Country risk)</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.creditRiskAssessment)}
            onChange={(e) => handleChange('creditRiskAssessment', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* 3- Market Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <TrendingUp className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
            <span>3- Losses related to Market risk (errors that can be made by processing payments or settling transactions)</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.marketVolatility)}
            onChange={(e) => handleChange('marketVolatility', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* 4- Transformation Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <span>4- Losses related to Transformation risk (large gap between different maturities of receivables and debts) and illiquidity</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.liquidityPosition)}
            onChange={(e) => handleChange('liquidityPosition', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* 5- Organizational Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <Users className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
            <span>5- Losses related to Organizational risk (Workforce, Equipment and Environment)</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.reputationalFactors)}
            onChange={(e) => handleChange('reputationalFactors', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* 6- Health and Insurance Risk */}
        <div className="form-field">
          <label className="form-label flex items-start space-x-2 min-h-[4.5rem]">
            <Target className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <span>6- Losses related to Specific Heath and Insurance Risk</span>
          </label>
          <select
            className="form-select"
            value={getDisplayValue(data.strategicAlignment)}
            onChange={(e) => handleChange('strategicAlignment', e.target.value)}
          >
            <option value="">Select importance level</option>
            {importanceOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessment Summary */}
      <div className="bg-cfo-card rounded-lg p-4 border border-cfo-border">
        <h4 className="text-cfo-text font-medium mb-3">Qualitative Risk Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => {
            if (!value) return null;
            
            const fieldNames = {
              operationalRiskIncidents: 'Operational Risk',
              creditRiskAssessment: 'Credit Risk',
              marketVolatility: 'Market Volatility',
              liquidityPosition: 'Liquidity Position',
              reputationalFactors: 'Reputational Factors',
              strategicAlignment: 'Strategic Alignment'
            };

            const textValue = getDisplayValue(value);

            const getRiskColor = (value: string) => {
              if (['Not important at all', 'Not very important'].includes(value)) return 'text-primary';
              if (['Somewhat important'].includes(value)) return 'text-yellow-500';
              if (['Important'].includes(value)) return 'text-orange-500';
              if (['Very important'].includes(value)) return 'text-destructive';
              return 'text-cfo-muted';
            };

            return (
              <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-cfo-muted text-sm">
                  {fieldNames[key as keyof typeof fieldNames]}
                </span>
                <span className={`text-sm font-medium ${getRiskColor(textValue)}`}>
                  {textValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h3 className="text-primary font-medium mb-2">Qualitative Risk Assessment</h3>
        <p className="text-primary/80 text-sm">
          These qualitative assessments provide context to quantitative risk data and help identify
          areas requiring management attention. The assessments influence risk appetite calculations
          and strategic decision-making processes within the CFO platform.
        </p>
      </div>
    </div>
  );
}
