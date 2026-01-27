'use client';

import { useState } from 'react';
import { BusinessLine } from '@/modules/module1/types';
import { getCurrencySymbol } from '@/modules/module1/utils/formatting';
import { Plus, Trash2, Users, DollarSign, Target } from 'lucide-react';

interface BusinessLinesSectionProps {
  data: BusinessLine[];
  onChange: (data: BusinessLine[]) => void;
  currency: string;
}

export function BusinessLinesSection({ data, onChange, currency }: BusinessLinesSectionProps) {
  const addBusinessLine = () => {
    // Prevent adding more than 8 business lines (original application limit)
    if (data.length >= 8) {
      return;
    }
    
    const newLine: BusinessLine = {
      id: data.length + 1,
      activityName: '',
      staffCount: 0,
      teamCount: 0,
      budget: 0
    };
    // Add new line at the beginning of the array for better UX
    onChange([newLine, ...data]);
  };

  const removeBusinessLine = (id: number) => {
    onChange(data.filter(line => line.id !== id));
  };

  const updateBusinessLine = (id: number, field: keyof BusinessLine, value: string | number) => {
    onChange(data.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const totalBudget = data.reduce((sum, line) => sum + (line.budget || 0), 0);
  const totalStaff = data.reduce((sum, line) => sum + (line.staffCount || 0), 0);
  const maxBusinessLines = 8; // Maximum 8 business lines as per original application

  return (
    <div className="space-y-6">
      {/* Add Business Line Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-cfo-text">Business Activity Lines</h3>
        <button
          onClick={addBusinessLine}
          disabled={data.length >= maxBusinessLines}
          className={`form-button flex items-center space-x-2 ${
            data.length >= maxBusinessLines 
              ? 'form-button-disabled cursor-not-allowed opacity-50' 
              : 'form-button-primary'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>
            {data.length >= maxBusinessLines 
              ? `Maximum ${maxBusinessLines} Lines` 
              : 'Add Line'
            }
          </span>
        </button>
      </div>

      {/* Business Lines */}
      <div className="space-y-4">
        {data.map((line, index) => {
          // Calculate logical line number (newest lines appear first but are numbered from bottom)
          const logicalLineNumber = data.length - index;
          return (
            <div key={line.id} className="bg-gray-800/50 rounded-lg p-4 border border-cfo-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-cfo-text font-medium">Line {logicalLineNumber}</h4>
              {data.length > 1 && (
                <button
                  onClick={() => removeBusinessLine(line.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Remove this line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="form-grid">
              {/* Activity Name */}
              <div className="form-field form-grid-full">
                <label className="form-label flex items-center space-x-2">
                  <Target className="w-4 h-4 text-cfo-accent" />
                  <span>Activity Name</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Operations Management, Sales & Marketing"
                  value={line.activityName}
                  onChange={(e) => updateBusinessLine(line.id, 'activityName', e.target.value)}
                />
              </div>

              {/* Staff Count */}
              <div className="form-field">
                <label className="form-label flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cfo-accent" />
                  <span>Staff Count</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Number of staff"
                  min="0"
                  value={line.staffCount || ''}
                  onChange={(e) => updateBusinessLine(line.id, 'staffCount', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Team Count */}
              <div className="form-field">
                <label className="form-label flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cfo-accent" />
                  <span>Team Count</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Number of teams"
                  min="0"
                  value={line.teamCount || ''}
                  onChange={(e) => updateBusinessLine(line.id, 'teamCount', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Budget */}
              <div className="form-field">
                <label className="form-label flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-cfo-accent" />
                  <span>Budget (k{getCurrencySymbol(currency)})</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Budget in thousands"
                  min="0"
                  step="0.1"
                  value={line.budget || ''}
                  onChange={(e) => updateBusinessLine(line.id, 'budget', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Rate Displays */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Staff Rate Display */}
              {totalStaff > 0 && (
                <div className="p-3 bg-cfo-accent/10 rounded border border-cfo-accent/20">
                  <p className="text-cfo-accent text-sm font-medium">
                    Staff Rate: {((line.staffCount / totalStaff) * 100).toFixed(2)}%
                  </p>
                </div>
              )}
              {/* Budget Rate Display */}
              {totalBudget > 0 && (
                <div className="p-3 bg-cfo-accent/10 rounded border border-cfo-accent/20">
                  <p className="text-cfo-accent text-sm font-medium">
                    Budget Rate: {((line.budget / totalBudget) * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className="bg-cfo-card rounded-lg p-4 border border-cfo-border">
          <h4 className="text-cfo-text font-medium mb-3">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-cfo-accent">{data.length}</p>
              <p className="text-cfo-muted text-sm">Business Lines</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cfo-accent">{totalStaff}</p>
              <p className="text-cfo-muted text-sm">Total Staff</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cfo-accent">
                {data.reduce((sum, line) => sum + (line.teamCount || 0), 0)}
              </p>
              <p className="text-cfo-muted text-sm">Total Teams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cfo-accent">{totalBudget.toFixed(1)}k{getCurrencySymbol(currency)}</p>
              <p className="text-cfo-muted text-sm">Total Budget</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">Business Lines Configuration</h3>
        <p className="text-blue-300 text-sm">
          Define your business activity lines with their respective staff allocation, team structure, 
          and budget distribution. These values will be used to calculate budget rates and 
          performance metrics across your organization.
        </p>
        <p className="text-blue-300 text-xs mt-2 font-medium">
          ⚠️ Maximum {maxBusinessLines} business activity lines allowed (as per original application specifications).
        </p>
      </div>
    </div>
  );
}
