import React from 'react';
import { BarChart3, Calendar, TrendingUp, Coins } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface Page13DashboardProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

export function Page13Dashboard({ calculated, selectedCurrency }: Page13DashboardProps) {
  const dashboardData = [
    {
      year: 'N+1',
      totalBonus: calculated.primesN1 || 0,
      quarterlyBonus: calculated.quarterlyBonusN1 || 0,
      monthlyBonus: calculated.monthlyBonusN1 || 0,
      weeklyBonus: calculated.weeklyBonusN1 || 0,
    },
    {
      year: 'N+2',
      totalBonus: calculated.primesN2 || 0,
      quarterlyBonus: calculated.quarterlyBonusN2 || 0,
      monthlyBonus: calculated.monthlyBonusN2 || 0,
      weeklyBonus: calculated.weeklyBonusN2 || 0,
    },
    {
      year: 'N+3',
      totalBonus: calculated.primesN3 || 0,
      quarterlyBonus: calculated.quarterlyBonusN3 || 0,
      monthlyBonus: calculated.monthlyBonusN3 || 0,
      weeklyBonus: calculated.weeklyBonusN3 || 0,
    }
  ];

  const quarterOrdinal = (q: number) => (q === 1 ? '1st' : q === 2 ? '2nd' : q === 3 ? '3rd' : '4th');
  const monthOrdinal = (m: number) => (m === 1 ? '1st' : m === 2 ? '2nd' : '3rd');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
        <h3 className="text-lg font-bold text-white">13- Dashboard of the real-time driving plan and feedback of the internal financial performance scheduled for the counterpart of the Incentivized Pay</h3>
        <p className="text-sm text-gray-400">(Bonus or variable salary)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardData.map((yearData) => (
          <div key={yearData.year} className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700 hover:border-blue-500 transition-colors duration-300">
            <div className="text-lg font-bold text-blue-400 mb-2">{yearData.year}</div>
            <div className="text-2xl font-bold text-white mb-2">{formatCurrency(yearData.totalBonus, selectedCurrency)}</div>
            <div className="text-xs text-gray-400">Total Annual Bonuses</div>
          </div>
        ))}
      </div>

      {/* Detailed Dashboard */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="space-y-8">
          {dashboardData.map((yearData) => (
            <div key={yearData.year}>
              <h4 className="text-xl font-bold text-white mb-4">Details for year {yearData.year}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quarterly */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <h5 className="font-bold text-gray-300 mb-2">By Quarter</h5>
                  <p className="text-2xl font-mono text-green-400">{formatCurrency(yearData.quarterlyBonus, selectedCurrency)}</p>
                </div>
                {/* Monthly */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <h5 className="font-bold text-gray-300 mb-2">By Month</h5>
                  <p className="text-2xl font-mono text-green-400">{formatCurrency(yearData.monthlyBonus, selectedCurrency)}</p>
                </div>
                {/* Weekly */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <h5 className="font-bold text-gray-300 mb-2">By Week</h5>
                  <p className="text-2xl font-mono text-green-400">{formatCurrency(yearData.weeklyBonus, selectedCurrency)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time schedule: QUARTER -> Months -> Weeks */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="space-y-10">
          {dashboardData.map((y) => (
            <div key={`quarters-${y.year}`} className="space-y-6">
              {[1,2,3,4].map((q) => (
                <div key={`q-${y.year}-${q}`} className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
                  <h5 className="font-bold text-white mb-4">QUARTER {q} - {y.year}: Cash outflows to generate inflows - Staff Incentivized Pay (variable salary)</h5>
                  <div className="space-y-4">
                    {[1,2,3].map((m) => (
                      <div key={`m-${y.year}-${q}-${m}`} className="bg-gray-900/30 rounded-md border border-gray-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-300">{monthOrdinal(m)} month of the {quarterOrdinal(q)} quarter of year {y.year}</div>
                          <div className="text-lg font-mono text-blue-300">{formatCurrency(y.monthlyBonus, selectedCurrency)}</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[1,2,3,4].map((w) => (
                            <div key={`w-${y.year}-${q}-${m}-${w}`} className="bg-gray-800/60 rounded-md border border-gray-700 p-3">
                              <div className="text-xs text-gray-400 mb-1">Week {w}</div>
                              <div className="text-lg font-mono text-green-400">{formatCurrency(y.weeklyBonus, selectedCurrency)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}