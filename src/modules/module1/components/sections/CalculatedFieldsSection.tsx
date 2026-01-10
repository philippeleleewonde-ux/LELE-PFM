'use client';

import { CalculatedFields, FormData } from '@/modules/module1/types';
import { CFOCalculationUtils } from '@/modules/module1/lib/calculations';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calculator, AlertTriangle, Target } from 'lucide-react';

interface CalculatedFieldsSectionProps {
  data: CalculatedFields;
  formData: FormData;
}

export function CalculatedFieldsSection({ data, formData }: CalculatedFieldsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Budget Rates */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-cfo-accent" />
          <span>Budget Distribution Rates</span>
        </h3>
        
        <div className="form-grid">
          {formData.businessLines.map((line, index) => {
            const rateField = `tauxL${index + 1}Budget` as keyof CalculatedFields;
            const rate = data[rateField] as number || 0;
            
            return (
              <div key={line.id} className="form-field">
                <label className="form-label">{line.activityName || `Line ${index + 1}`}</label>
                <div className="calculation-field">
                  {CFOCalculationUtils.formatPercentage(rate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Calculations */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <Users className="w-5 h-5 text-cfo-accent" />
          <span>Staff & Productivity Metrics</span>
        </h3>
        
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Total Staff (N-1)</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatNumber(data.effectifN1 || 0, 0)} employees
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Total Hours (N-1)</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatNumber(data.volumehoraireN1 || 0, 0)} hours
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">UL Losses per Person</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatCurrency(data.pertesULPersonnes || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Rates */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-cfo-accent" />
          <span>Year-over-Year Evolution Rates</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Evolution */}
          <div>
            <h4 className="text-cfo-text font-medium mb-3">Sales Evolution</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-1 to N-2</span>
                <span className={`font-medium ${(data.tauxEvolutionCAN1N2 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionCAN1N2 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-2 to N-3</span>
                <span className={`font-medium ${(data.tauxEvolutionCAN2N3 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionCAN2N3 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-3 to N-4</span>
                <span className={`font-medium ${(data.tauxEvolutionCAN3N4 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionCAN3N4 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-4 to N-5</span>
                <span className={`font-medium ${(data.tauxEvolutionCAN4N5 || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionCAN4N5 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cfo-accent/10 rounded border border-cfo-accent/20 mt-3">
                <span className="text-cfo-accent font-medium text-sm">Average Rate</span>
                <span className="text-cfo-accent font-bold">
                  {CFOCalculationUtils.formatPercentage(data.tauxMoyenCA || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Evolution */}
          <div>
            <h4 className="text-cfo-text font-medium mb-3">Expenses Evolution</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-1 to N-2</span>
                <span className={`font-medium ${(data.tauxEvolutionChargesN1N2 || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionChargesN1N2 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-2 to N-3</span>
                <span className={`font-medium ${(data.tauxEvolutionChargesN2N3 || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionChargesN2N3 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-3 to N-4</span>
                <span className={`font-medium ${(data.tauxEvolutionChargesN3N4 || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionChargesN3N4 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-cfo-muted text-sm">N-4 to N-5</span>
                <span className={`font-medium ${(data.tauxEvolutionChargesN4N5 || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {CFOCalculationUtils.formatPercentage(data.tauxEvolutionChargesN4N5 || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-900/10 rounded border border-orange-500/20 mt-3">
                <span className="text-orange-400 font-medium text-sm">Average Rate</span>
                <span className="text-orange-400 font-bold">
                  {CFOCalculationUtils.formatPercentage(data.tauxMoyenCharges || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Potential vs Actual Analysis */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <Target className="w-5 h-5 text-cfo-accent" />
          <span>Potential vs Actual Performance</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Gaps */}
          <div>
            <h4 className="text-cfo-text font-medium mb-3">Sales Performance Gaps</h4>
            <div className="space-y-2">
              {formData.employeeEngagement.financialHistory.slice(0, 5).map((year, index) => {
                const potentialField = `potentielCAN${index + 1}` as keyof CalculatedFields;
                const gapField = `ecartCAN${index + 1}` as keyof CalculatedFields;
                const potential = data[potentialField] as number || 0;
                const gap = data[gapField] as number || 0;
                
                return (
                  <div key={year.year} className="p-3 bg-gray-800/50 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-cfo-muted text-sm">{year.year}</span>
                      <span className="text-cfo-text text-sm font-medium">
                        Actual: {CFOCalculationUtils.formatCurrency(year.sales, 'k€')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-blue-400 text-sm">Potential</span>
                      <span className="text-blue-400 text-sm">
                        {CFOCalculationUtils.formatCurrency(potential, 'k€')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Gap
                      </span>
                      <span className={`text-sm font-bold ${gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {CFOCalculationUtils.formatCurrency(gap, 'k€')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense Gaps */}
          <div>
            <h4 className="text-cfo-text font-medium mb-3">Expense Optimization Gaps</h4>
            <div className="space-y-2">
              {formData.employeeEngagement.financialHistory.slice(0, 5).map((year, index) => {
                const predictedField = `depensesPreviN${index + 1}` as keyof CalculatedFields;
                const gapField = `ecartDepensesN${index + 1}` as keyof CalculatedFields;
                const predicted = data[predictedField] as number || 0;
                const gap = data[gapField] as number || 0;
                
                return (
                  <div key={year.year} className="p-3 bg-gray-800/50 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-cfo-muted text-sm">{year.year}</span>
                      <span className="text-cfo-text text-sm font-medium">
                        Actual: {CFOCalculationUtils.formatCurrency(year.spending, 'k€')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-orange-400 text-sm">Predicted</span>
                      <span className="text-orange-400 text-sm">
                        {CFOCalculationUtils.formatCurrency(predicted, 'k€')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${gap <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Gap
                      </span>
                      <span className={`text-sm font-bold ${gap <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {CFOCalculationUtils.formatCurrency(gap, 'k€')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expected Loss & Risk Metrics */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-cfo-accent" />
          <span>Risk & Loss Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-500/30">
            <DollarSign className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">
              {CFOCalculationUtils.formatCurrency(data.elCA || 0, 'k€')}
            </p>
            <p className="text-red-300 text-sm">EL Sales</p>
          </div>

          <div className="text-center p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
            <TrendingDown className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-400">
              {CFOCalculationUtils.formatCurrency(data.elDepenses || 0, 'k€')}
            </p>
            <p className="text-orange-300 text-sm">EL Expenses</p>
          </div>

          <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <Calculator className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-400">
              {CFOCalculationUtils.formatCurrency(data.totalEL || 0, 'k€')}
            </p>
            <p className="text-purple-300 text-sm">Total EL</p>
          </div>

          <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
            <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">
              {CFOCalculationUtils.formatCurrency(data.var || 0, 'k€')}
            </p>
            <p className="text-yellow-300 text-sm">VaR (99%)</p>
          </div>
        </div>
      </div>

      {/* Statistical Analysis */}
      <div className="form-section">
        <h3 className="form-section-title flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-cfo-accent" />
          <span>Statistical Analysis</span>
        </h3>
        
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Mean</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatCurrency(data.mean || 0, 'k€')}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Variance</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatNumber(data.variance || 0)}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Standard Deviation</label>
            <div className="calculation-field">
              {CFOCalculationUtils.formatNumber(data.standardDeviation || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* UL Analysis */}
      {formData.riskData.totalUL > 0 && (
        <div className="form-section">
          <h3 className="form-section-title flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-cfo-accent" />
            <span>Unexpected Loss Analysis</span>
          </h3>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">External UL</label>
              <div className="calculation-field">
                {CFOCalculationUtils.formatCurrency(data.ulExterne || 0, 'k€')}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Internal UL</label>
              <div className="calculation-field">
                {CFOCalculationUtils.formatCurrency(data.ulInterne || 0, 'k€')}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Calculated UL</label>
              <div className="calculation-field">
                {CFOCalculationUtils.formatCurrency(data.ulCalcul || 0, 'k€')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">Calculated Financial Metrics</h3>
        <p className="text-blue-300 text-sm">
          All calculations use the exact same formulas as the original CFO platform. These metrics 
          provide comprehensive financial performance analysis, risk assessment, and predictive modeling 
          to support strategic decision-making processes.
        </p>
      </div>
    </div>
  );
}
