/**
 * ============================================
 * BULLETIN - SECTION BENCHMARK
 * ============================================
 *
 * Affiche le positionnement de l'employé par rapport à son équipe.
 * Inclut le classement, la comparaison visuelle et les conseils.
 *
 * @module BenchmarkSection
 * @version 3.1.0
 */

import React from 'react';
import { Users, Trophy, Lightbulb, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BenchmarkData } from './bulletinHelpers';

// ============================================
// PROPS
// ============================================

interface BenchmarkSectionProps {
  benchmark: BenchmarkData;
  departmentName: string;
}

// ============================================
// COMPOSANT BENCHMARK SECTION
// ============================================

/**
 * Section de positionnement dans l'équipe.
 * Affiche le classement, la comparaison visuelle et les objectifs.
 */
export const BenchmarkSection: React.FC<BenchmarkSectionProps> = ({ benchmark, departmentName }) => {
  const {
    rank,
    totalInDepartment,
    percentile,
    employeeNote,
    departmentAverage,
    departmentMin,
    departmentMax,
    bestPerformer,
    gapToAverage,
    pointsToNextRank
  } = benchmark;

  const isAboveAverage = gapToAverage >= 0;

  // Calcul de la position sur la barre (éviter division par zéro)
  const range = departmentMax - departmentMin;
  const employeePosition = range > 0 ? ((employeeNote - departmentMin) / range) * 100 : 50;
  const averagePosition = range > 0 ? ((departmentAverage - departmentMin) / range) * 100 : 50;

  return (
    <section
      className="mb-6 animate-fade-in-up animate-delay-400"
      role="region"
      aria-labelledby="benchmark-title"
    >
      <h3
        id="benchmark-title"
        className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-l-4 border-purple-500 pl-3 flex items-center gap-2"
      >
        <Users className="w-4 h-4 text-purple-500" aria-hidden="true" />
        Positionnement dans l'Équipe
      </h3>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm card-hover-lift">

        {/* Ligne 1 : Classement principal */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              role="img"
              aria-label={`Classement: ${rank}${rank === 1 ? 'er' : 'ème'} sur ${totalInDepartment}`}
            >
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {rank}<sup className="text-sm">{rank === 1 ? 'er' : 'e'}</sup>
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {rank}{rank === 1 ? 'er' : 'ème'} sur {totalInDepartment} salariés
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {departmentName}
              </p>
            </div>
          </div>

          {/* Badge Top X% avec animation pop */}
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold animate-badge-pop",
            percentile <= 25
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : percentile <= 50
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : percentile <= 75
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            Top {percentile}%
          </div>
        </div>

        {/* Ligne 2 : Comparaison visuelle (gauge/slider) */}
        <div className="mb-6" role="figure" aria-label="Comparaison des notes dans le département">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Min: {departmentMin.toFixed(1)}</span>
            <span>Moyenne: {departmentAverage.toFixed(1)}</span>
            <span>Max: {departmentMax.toFixed(1)}</span>
          </div>

          {/* Barre de positionnement */}
          <div className="relative h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900/50 dark:via-yellow-900/50 dark:to-green-900/50 rounded-full">
            {/* Marqueur moyenne */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400"
              style={{ left: `${averagePosition}%` }}
              aria-hidden="true"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 dark:bg-gray-400 rotate-45" />
            </div>

            {/* Position du salarié - Animée */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-lg animate-marker-slide"
              style={{
                left: `calc(${Math.min(95, Math.max(5, employeePosition))}% - 10px)`,
                backgroundColor: isAboveAverage ? '#10B981' : '#F59E0B'
              }}
              aria-hidden="true"
            />
          </div>

          {/* Labels sous la barre */}
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Dernier</span>
            <span className={cn(
              "text-sm font-semibold",
              isAboveAverage ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
            )}>
              Vous: {employeeNote.toFixed(1)}/10
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Premier</span>
          </div>
        </div>

        {/* Ligne 3 : Stats en grille */}
        <div className="grid grid-cols-3 gap-4 mb-6" role="list" aria-label="Statistiques de comparaison">
          {/* Votre note */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg" role="listitem">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Votre note</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{employeeNote.toFixed(1)}</p>
          </div>

          {/* Moyenne */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg" role="listitem">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Moyenne équipe</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{departmentAverage.toFixed(1)}</p>
          </div>

          {/* Écart */}
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg" role="listitem">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Écart</p>
            <p className={cn(
              "text-xl font-bold",
              gapToAverage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {gapToAverage >= 0 ? '+' : ''}{gapToAverage.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Ligne 4 : Meilleur performeur */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Meilleure performance :</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white">{bestPerformer.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">({bestPerformer.note.toFixed(1)}/10)</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold",
              bestPerformer.grade.startsWith('A')
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                : bestPerformer.grade.startsWith('B')
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
            )}>
              {bestPerformer.grade}
            </span>
          </div>
        </div>

        {/* Ligne 5 : Conseil pour progresser */}
        {rank > 1 && pointsToNextRank > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Pour monter d'un rang :</span> il vous faut
              <span className="font-bold text-blue-600 dark:text-blue-400"> +{pointsToNextRank.toFixed(2)} pts</span>
            </p>
          </div>
        )}

        {rank === 1 && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Star className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Félicitations !</span> Vous êtes le meilleur performeur de votre département !
            </p>
          </div>
        )}

      </div>
    </section>
  );
};

// ============================================
// COMPOSANT EMPTY BENCHMARK
// ============================================

/**
 * Affichage quand il n'y a pas assez de données pour le benchmark.
 */
export const EmptyBenchmark: React.FC = () => (
  <section className="mb-6" role="region" aria-labelledby="empty-benchmark-title">
    <h3
      id="empty-benchmark-title"
      className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 border-l-4 border-purple-500 pl-3 flex items-center gap-2"
    >
      <Users className="w-4 h-4 text-purple-500" aria-hidden="true" />
      Positionnement dans l'Équipe
    </h3>
    <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-xl text-center border border-gray-200 dark:border-gray-700">
      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">
        Comparaison non disponible
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
        Vous êtes le seul salarié évalué dans ce département
      </p>
    </div>
  </section>
);

export default BenchmarkSection;
