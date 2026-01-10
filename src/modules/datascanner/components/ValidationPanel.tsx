// ============================================
// VALIDATION PANEL - Interactive Oui/Non Validation
// ============================================

import { useState } from 'react';
import { Check, X, Edit2, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinancialDataPoint, ValidationAction } from '../types';

interface ValidationPanelProps {
  dataPoint: FinancialDataPoint;
  onValidate: (action: ValidationAction) => void;
  currentIndex: number;
  totalCount: number;
}

export function ValidationPanel({
  dataPoint,
  onValidate,
  currentIndex,
  totalCount
}: ValidationPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState(dataPoint.amount.toString());
  const [editedYear, setEditedYear] = useState(dataPoint.year.toString());

  const handleAccept = () => {
    onValidate({
      dataPointId: dataPoint.id,
      action: 'accept'
    });
  };

  const handleReject = () => {
    onValidate({
      dataPointId: dataPoint.id,
      action: 'reject'
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onValidate({
      dataPointId: dataPoint.id,
      action: 'edit',
      editedValue: {
        amount: parseFloat(editedAmount),
        year: parseInt(editedYear, 10)
      }
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedAmount(dataPoint.amount.toString());
    setEditedYear(dataPoint.year.toString());
    setIsEditing(false);
  };

  const getCategoryColor = (category: string) => {
    return category === 'revenue' ? 'text-green-400' : 'text-red-400';
  };

  const getCategoryIcon = (category: string) => {
    return category === 'revenue' ? (
      <TrendingUp className="w-6 h-6 text-green-400" />
    ) : (
      <TrendingDown className="w-6 h-6 text-red-400" />
    );
  };

  const getCategoryLabel = (category: string) => {
    return category === 'revenue' ? 'Revenue / Ventes' : 'Expenses / Charges';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const confidencePercentage = Math.round(dataPoint.confidence * 100);
  const confidenceColor =
    confidencePercentage >= 80
      ? 'text-green-400'
      : confidencePercentage >= 60
      ? 'text-yellow-400'
      : 'text-orange-400';

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Validation Progress: {currentIndex + 1} / {totalCount}
        </span>
        <span className="text-cyan-400 font-medium">
          {Math.round(((currentIndex + 1) / totalCount) * 100)}% Complete
        </span>
      </div>

      {/* Main Validation Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(dataPoint.category)}
            <h3 className="text-2xl font-bold text-white">{getCategoryLabel(dataPoint.category)}</h3>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Confidence Score</div>
            <div className={`text-xl font-bold ${confidenceColor}`}>{confidencePercentage}%</div>
          </div>
        </div>

        {/* Data Display / Edit Mode */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Keyword Matched */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Keyword Detected</div>
              <div className="text-lg font-semibold text-white">"{dataPoint.keyword}"</div>
            </div>

            {/* Amount */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <div className="text-sm text-gray-400">Amount</div>
              </div>
              <div className={`text-3xl font-bold ${getCategoryColor(dataPoint.category)}`}>
                {formatAmount(dataPoint.amount)} {dataPoint.currency || '€'}
              </div>
            </div>

            {/* Year */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <div className="text-sm text-gray-400">Year</div>
              </div>
              <div className="text-2xl font-bold text-white">{dataPoint.year}</div>
            </div>

            {/* Position Info */}
            <div className="text-sm text-gray-500 text-center">
              Found at position: Row {dataPoint.position.row + 1}, Column {dataPoint.position.col + 1}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Edit Amount */}
            <div>
              <Label htmlFor="edit-amount" className="text-white mb-2 block">
                Amount
              </Label>
              <Input
                id="edit-amount"
                type="number"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                step="0.01"
              />
            </div>

            {/* Edit Year */}
            <div>
              <Label htmlFor="edit-year" className="text-white mb-2 block">
                Year
              </Label>
              <Input
                id="edit-year"
                type="number"
                value={editedYear}
                onChange={(e) => setEditedYear(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                min="2000"
                max="2100"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {!isEditing ? (
            <>
              {/* Oui / Non Buttons (Orange / Cyan theme) */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleAccept}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-xl py-6 shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Check className="w-6 h-6 mr-2" />
                  Oui
                </Button>

                <Button
                  onClick={handleReject}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl py-6 shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <X className="w-6 h-6 mr-2" />
                  Non
                </Button>
              </div>

              {/* Edit Button */}
              <Button
                onClick={handleEdit}
                variant="outline"
                size="lg"
                className="w-full border-gray-600 text-white hover:bg-slate-700"
              >
                <Edit2 className="w-5 h-5 mr-2" />
                Correct Manually
              </Button>
            </>
          ) : (
            <>
              {/* Save / Cancel Edit */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleSaveEdit}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>

                <Button
                  onClick={handleCancelEdit}
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-400">
        <p>
          <span className="text-cyan-400 font-semibold">Oui</span> = Accept this data point |{' '}
          <span className="text-orange-400 font-semibold">Non</span> = Reject and skip |{' '}
          <span className="text-gray-300 font-semibold">Correct</span> = Manually edit values
        </p>
      </div>
    </div>
  );
}
