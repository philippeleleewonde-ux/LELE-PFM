// ============================================
// SCAN RESULTS - Data Table with Statistics
// ============================================

import { Download, TrendingUp, TrendingDown, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FinancialDataPoint, ScanStatistics } from '../types';
import { getYearLabel } from '../lib/yearDetector';

interface ScanResultsProps {
  dataPoints: FinancialDataPoint[];
  statistics: ScanStatistics;
  onExport: () => void;
}

export function ScanResults({ dataPoints, statistics, onExport }: ScanResultsProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    return category === 'revenue'
      ? 'text-green-400 bg-green-900/20'
      : 'text-red-400 bg-red-900/20';
  };

  const getCategoryIcon = (category: string) => {
    return category === 'revenue' ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getCategoryLabel = (category: string) => {
    return category === 'revenue' ? 'Revenue' : 'Expenses';
  };

  // Group data by year and category
  const groupedData = dataPoints.reduce((acc, dp) => {
    const key = `${dp.year}-${dp.category}`;
    if (!acc[key]) {
      acc[key] = {
        year: dp.year,
        category: dp.category,
        total: 0,
        count: 0,
        items: []
      };
    }
    acc[key].total += dp.amount;
    acc[key].count += 1;
    acc[key].items.push(dp);
    return acc;
  }, {} as Record<string, any>);

  const groupedArray = Object.values(groupedData).sort((a: any, b: any) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.category.localeCompare(b.category);
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-cyan-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Data Points</p>
              <p className="text-2xl font-bold text-white">{statistics.totalDataPoints}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-cyan-400" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Revenue Entries</p>
              <p className="text-2xl font-bold text-green-400">{statistics.categoriesBreakdown.revenue}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Expense Entries</p>
              <p className="text-2xl font-bold text-red-400">{statistics.categoriesBreakdown.expenses}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-orange-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-orange-400">
                {Math.round(statistics.averageConfidence * 100)}%
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={onExport}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Grouped Data Table */}
      <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Validated Financial Data</h3>

          <div className="space-y-4">
            {groupedArray.map((group: any, index) => (
              <div key={index} className="border border-slate-700 rounded-lg overflow-hidden">
                {/* Group Header */}
                <div className={`p-4 ${getCategoryColor(group.category)} border-b border-slate-700`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(group.category)}
                      <div>
                        <h4 className="font-semibold text-white">
                          {getCategoryLabel(group.category)} - {group.year}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {getYearLabel(group.year)} • {group.count} {group.count === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatAmount(group.total)} €
                      </div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-slate-900/50">
                  {group.items.map((item: FinancialDataPoint, itemIndex: number) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-center justify-between ${
                        itemIndex !== group.items.length - 1 ? 'border-b border-slate-700/50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-400">Keyword:</div>
                          <div className="text-white font-medium">"{item.keyword}"</div>
                          {item.manuallyEdited && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              Edited
                            </span>
                          )}
                          {item.sheetName && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                              📄 {item.sheetName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Position: Row {item.position.row + 1}, Col {item.position.col + 1} •
                          Confidence: {Math.round(item.confidence * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          {formatAmount(item.amount)} €
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {dataPoints.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No validated data points yet</p>
            </div>
          )}
        </div>
      </Card>

      {/* Years Coverage */}
      {statistics.yearsCovered.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h4 className="text-lg font-semibold text-white mb-3">Years Covered</h4>
          <div className="flex flex-wrap gap-2">
            {statistics.yearsCovered.sort((a, b) => b - a).map((year) => (
              <div
                key={year}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg"
              >
                <span className="text-white font-medium">{year}</span>
                <span className="text-cyan-400 text-sm ml-2">({getYearLabel(year)})</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
