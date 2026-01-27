'use client';

import { EmployeeEngagementData, FinancialData, Currency } from '@/modules/module1/types';
import { getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { Clock, TrendingUp, DollarSign, Plus, Trash2 } from 'lucide-react';

interface EmployeeEngagementSectionProps {
  data: EmployeeEngagementData;
  onChange: (data: EmployeeEngagementData) => void;
  selectedCurrency: Currency;
}

export function EmployeeEngagementSection({ data, onChange, selectedCurrency }: EmployeeEngagementSectionProps) {
  const maxFinancialPeriods = 5; // Maximum 5 periods (N-1 to N-5) as per original application
  const symbol = getCurrencySymbol(selectedCurrency);
  
  const handleHoursChange = (hours: number) => {
    onChange({ ...data, annualHoursPerPerson: hours });
  };

  const addFinancialYear = () => {
    // Prevent adding more than 5 financial periods (N-1 to N-5 as per original application)
    if (data.financialHistory.length >= maxFinancialPeriods) {
      return;
    }
    
    const newYear: FinancialData = {
      year: `N-${data.financialHistory.length + 1}`,
      sales: 0,
      spending: 0
    };
    onChange({
      ...data,
      financialHistory: [...data.financialHistory, newYear]
    });
  };

  const removeFinancialYear = (index: number) => {
    const newHistory = data.financialHistory.filter((_, i) => i !== index);
    onChange({ ...data, financialHistory: newHistory });
  };

  const updateFinancialYear = (index: number, field: keyof FinancialData, value: string | number) => {
    const newHistory = data.financialHistory.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...data, financialHistory: newHistory });
  };

  return (
    <div className="space-y-6">
      {/* Annual Hours */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <Clock className="w-5 h-5 text-cfo-accent" />
          <span>Employee Engagement</span>
        </h3>
        
        <div className="form-field">
          <label className="form-label">Annual Hours per Person</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g., 1800"
            min="0"
            max="3000"
            value={data.annualHoursPerPerson || ''}
            onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
          />
          <p className="text-cfo-muted text-sm mt-1">
            Standard working hours per employee per year (typically 1600-2200 hours)
          </p>
        </div>
      </div>

      {/* Financial History */}
      <div className="form-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="form-section-title flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cfo-accent" />
            <span>Financial History</span>
          </h3>
          <button
            onClick={addFinancialYear}
            disabled={data.financialHistory.length >= maxFinancialPeriods}
            className={`form-button flex items-center space-x-2 ${
              data.financialHistory.length >= maxFinancialPeriods 
                ? 'form-button-disabled cursor-not-allowed opacity-50' 
                : 'form-button-primary'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {data.financialHistory.length >= maxFinancialPeriods 
                ? `Maximum ${maxFinancialPeriods} Periods` 
                : 'Add Year'
              }
            </span>
          </button>
        </div>

        <div className="space-y-4">
          {data.financialHistory.map((yearData, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-cfo-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-cfo-text font-medium">{yearData.year}</h4>
                {data.financialHistory.length > 2 && (
                  <button
                    onClick={() => removeFinancialYear(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Remove this year"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="form-grid">
                {/* Sales */}
                <div className="form-field">
                  <label className="form-label flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>{`Sales/Turnover (k${symbol})`}</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Sales in thousands"
                    min="0"
                    step="0.1"
                    value={yearData.sales || ''}
                    onChange={(e) => updateFinancialYear(index, 'sales', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Spending */}
                <div className="form-field">
                  <label className="form-label flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-red-400" />
                    <span>{`Total Spending (k${symbol})`}</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Spending in thousands"
                    min="0"
                    step="0.1"
                    value={yearData.spending || ''}
                    onChange={(e) => updateFinancialYear(index, 'spending', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Profit/Loss Indicator */}
              {yearData.sales > 0 && yearData.spending > 0 && (
                <div className="mt-3 p-3 rounded border">
                  {yearData.sales > yearData.spending ? (
                    <div className="bg-green-900/20 border-green-500/30">
                      <p className="text-green-400 text-sm font-medium">
                        {`Profit: ${(yearData.sales - yearData.spending).toFixed(1)}k${symbol} `}
                        ({(((yearData.sales - yearData.spending) / yearData.sales) * 100).toFixed(1)}% margin)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border-red-500/30">
                      <p className="text-red-400 text-sm font-medium">
                        {`Loss: ${(yearData.spending - yearData.sales).toFixed(1)}k${symbol}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        {data.financialHistory.length > 1 && (
          <div className="bg-cfo-card rounded-lg p-4 border border-cfo-border mt-4">
            <h4 className="text-cfo-text font-medium mb-3">Financial Trends</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-cfo-muted text-sm">Average Annual Sales</p>
                <p className="text-xl font-bold text-green-400">
                  {`${(data.financialHistory.reduce((sum, year) => sum + year.sales, 0) / data.financialHistory.length).toFixed(1)}k${symbol}`}
                </p>
              </div>
              <div>
                <p className="text-cfo-muted text-sm">Average Annual Spending</p>
                <p className="text-xl font-bold text-red-400">
                  {`${(data.financialHistory.reduce((sum, year) => sum + year.spending, 0) / data.financialHistory.length).toFixed(1)}k${symbol}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">Employee Engagement & Financial History</h3>
        <p className="text-blue-300 text-sm">
          Annual hours per person will be used to calculate productivity metrics and staff utilization rates. 
          Financial history (minimum 2 years required) enables trend analysis, evolution rate calculations, 
          and predictive modeling for future performance assessment.
        </p>
        <p className="text-blue-300 text-xs mt-2 font-medium">
          ⚠️ Maximum {maxFinancialPeriods} financial periods allowed (N-1 to N-5, as per original application specifications).
        </p>
      </div>
    </div>
  );
}
