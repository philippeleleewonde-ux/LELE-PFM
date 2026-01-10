/**
 * ============================================
 * HCM COST SAVINGS - KPI CONFIGURATION
 * ============================================
 */

import React from 'react';
import { UserCircle, AlertTriangle, Zap, Target, Activity } from 'lucide-react';

export const KPI_CONFIG: Record<string, {
  label: string;
  labelFr: string;
  color: string;
  icon: React.ReactNode;
  gradient: string;
  bgClass: string;
}> = {
  'abs': {
    label: 'Absenteeism',
    labelFr: 'Absentéisme',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    bgClass: 'bg-orange-500/10',
    icon: <UserCircle className="w-5 h-5" />
  },
  'qd': {
    label: 'Quality Defects',
    labelFr: 'Défauts Qualité',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    bgClass: 'bg-rose-500/10',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  'oa': {
    label: 'Occupational Accidents',
    labelFr: 'Accidents du Travail',
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
    bgClass: 'bg-red-500/10',
    icon: <Zap className="w-5 h-5" />
  },
  'ddp': {
    label: 'Direct Productivity',
    labelFr: 'Écarts Productivité',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    bgClass: 'bg-violet-500/10',
    icon: <Target className="w-5 h-5" />
  },
  'ekh': {
    label: 'Know-How Gaps',
    labelFr: 'Écarts Know-How',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    bgClass: 'bg-cyan-500/10',
    icon: <Activity className="w-5 h-5" />
  }
};
