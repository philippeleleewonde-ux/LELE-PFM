'use client';

import React from 'react';
import { Building2, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Currency selector removed per user request

interface CFOHeaderProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSave?: () => void;
  onLoad?: () => void;
}

export function CFOHeader({
  currentPage,
  totalPages,
  onPageChange,
  onSave,
  onLoad,
}: CFOHeaderProps) {
  return (
    <div className="form-header">
      {/* Logo and Title Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cfo-accent rounded-xl">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="form-title text-xl sm:text-3xl">
              CFO's SAF FinTech Platform
            </h1>
            <p className="form-subtitle text-sm sm:text-lg">
              Driving Internal Financial Performance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          {onSave && (
            <Button
              onClick={onSave}
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none !text-slate-900 dark:!text-slate-900"
            >
              Save
            </Button>
          )}
          {onLoad && (
            <Button
              onClick={onLoad}
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none !text-slate-900 dark:!text-slate-900"
            >
              Load
            </Button>
          )}
        </div>
      </div>

      {/* Feature Icons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
        <div className="flex items-center space-x-2 text-cfo-muted">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cfo-accent" />
          <span className="text-xs sm:text-sm font-medium">Performance Analytics</span>
        </div>
        <div className="flex items-center space-x-2 text-cfo-muted">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cfo-accent" />
          <span className="text-xs sm:text-sm font-medium">Risk Management</span>
        </div>
        <div className="flex items-center space-x-2 text-cfo-muted">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-cfo-accent" />
          <span className="text-xs sm:text-sm font-medium">Financial Reporting</span>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <p className="text-cfo-muted text-sm sm:text-base lg:text-lg leading-relaxed">
          Comprehensive financial performance analysis platform designed for CFOs to drive
          internal financial performance through advanced risk assessment, business line analysis,
          and predictive modeling.
        </p>
      </div>
    </div>
  );
}
