'use client';

import React from 'react';

export function StatCard({ title, value, subtitle, accent = 'text-cfo-accent' }: { title: string; value: React.ReactNode; subtitle?: string; accent?: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-700 shadow-inner">
      <p className="text-sm text-cfo-muted mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}
