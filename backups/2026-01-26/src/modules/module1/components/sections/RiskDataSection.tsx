'use client';

import { RiskData, Currency } from '@/modules/module1/types';
import { getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { Shield, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';

interface RiskDataSectionProps {
  data: RiskData;
  onChange: (data: RiskData) => void;
  selectedCurrency: Currency;
}

export function RiskDataSection({ data, onChange, selectedCurrency }: RiskDataSectionProps) {
  const symbol = getCurrencySymbol(selectedCurrency);
  const handleChange = (field: keyof RiskData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleRiskCategoryChange = (category: keyof RiskData['riskCategories'], value: number) => {
    onChange({
      ...data,
      riskCategories: {
        ...data.riskCategories,
        [category]: value
      }
    });
  };

  const totalRiskCategories = Object.values(data.riskCategories).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="space-y-6">
      {/* UL Data */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <TrendingDown className="w-5 h-5 text-cfo-accent" />
          <span>Unexpected Loss (UL) Data</span>
        </h3>
        
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">
              <span>{`Total UL (k${symbol})`}</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Total unexpected losses"
              min="0"
              step="0.1"
              value={data.totalUL || ''}
              onChange={(e) => handleChange('totalUL', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              <Calendar className="w-4 h-4 text-cfo-accent inline mr-2" />
              <span>Years of Collection</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Number of years"
              min="1"
              max="20"
              value={data.yearsOfCollection || ''}
              onChange={(e) => handleChange('yearsOfCollection', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Risk Categories */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <Shield className="w-5 h-5 text-cfo-accent" />
          <span>Risk Categories</span>
        </h3>

        <div className="space-y-4">
          {/* Operational Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>Operational Risk (Basel II Committee, Loss event type classification, QIS 2 - Operational Risk Loss Data, 4 May 2001)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Operational risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.operationalRisk || ''}
              onChange={(e) => handleRiskCategoryChange('operationalRisk', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Credit Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Credit counterparty risk or signature risk (Client risk and Country risk)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Credit risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.creditRisk || ''}
              onChange={(e) => handleRiskCategoryChange('creditRisk', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Market Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span>Market risk (errors that can be made by processing payments or settling transactions)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Market risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.marketRisk || ''}
              onChange={(e) => handleRiskCategoryChange('marketRisk', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Liquidity Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span>Transformation risk (large gap between different maturities of receivables and debts) and illiquidity (clients can withdraw more funds than expected, and the bank does not have enough short-term flows to deal with it)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Liquidity risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.liquidityRisk || ''}
              onChange={(e) => handleRiskCategoryChange('liquidityRisk', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Reputational Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span>Organizational risk (Workforce, Equipment and Environment)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Reputational risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.reputationalRisk || ''}
              onChange={(e) => handleRiskCategoryChange('reputationalRisk', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Strategic Risk */}
          <div className="form-field">
            <label className="form-label flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span>Specific Heath and Insurance Risk</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Strategic risk exposure"
              min="0"
              step="0.1"
              value={data.riskCategories.strategicRisk || ''}
              onChange={(e) => handleRiskCategoryChange('strategicRisk', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Risk Categories Summary */}
        {totalRiskCategories > 0 && (
          <div className="bg-cfo-card rounded-lg p-4 border border-cfo-border mt-4">
            <h4 className="text-cfo-text font-medium mb-3">Risk Distribution</h4>
            <div className="space-y-2">
              {Object.entries(data.riskCategories).map(([key, value]) => {
                const percentage = totalRiskCategories > 0 ? (value / totalRiskCategories) * 100 : 0;
                const riskNames = {
                  operationalRisk: 'Operational',
                  creditRisk: 'Credit',
                  marketRisk: 'Market',
                  liquidityRisk: 'Liquidity',
                  reputationalRisk: 'Reputational',
                  strategicRisk: 'Strategic'
                };
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-cfo-muted text-sm">{riskNames[key as keyof typeof riskNames]}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-cfo-text text-sm font-medium w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-cfo-border">
              <div className="flex justify-between items-center">
                <span className="text-cfo-text font-medium">Total Risk Exposure</span>
                <span className="text-cfo-accent font-bold">{`${totalRiskCategories.toFixed(1)}k${symbol}`}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h3 className="text-primary font-medium mb-2">Risk Data Configuration</h3>
        <p className="text-primary/80 text-sm">
          Unexpected Loss (UL) data represents potential losses beyond expected levels. Risk categories
          help distribute and analyze different types of operational risks. This data is crucial for
          calculating Value at Risk (VaR) and determining appropriate risk mitigation strategies.
        </p>
      </div>
    </div>
  );
}
