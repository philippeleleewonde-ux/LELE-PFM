import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Star, ShieldCheck, Lock, Award, ChevronRight, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AccessKeyService } from '@/modules/module2/services/AccessKeyService';
import {
  SURVEY_QUESTIONS,
  SURVEY_SECTIONS,
  type SurveyOption,
} from '@/modules/module2/data/surveyQuestions';

// ============================================================================
// SATISFACTION SURVEY — Full-page dark premium questionnaire
// Design: slate-900 bg, #FF4530 accent, circular progress, trust badges
// Modes: standalone (/survey) ou embedded (dans Module2Dashboard)
// ============================================================================

const ACCENT = '#FF4530';

interface SatisfactionSurveyProps {
  onBack?: () => void;
  bypassAccessKey?: boolean;
}

export default function SatisfactionSurvey({ onBack, bypassAccessKey }: SatisfactionSurveyProps) {
  const { accessCode } = useParams<{ accessCode: string }>();

  // --- State -----------------------------------------------------------------
  const [phase, setPhase] = useState<'welcome' | 'survey' | 'theme-intro' | 'completed'>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [progress, setProgress] = useState(0);
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [businessLines, setBusinessLines] = useState<string[]>([]);
  const [accessKey, setAccessKey] = useState('');
  const [accessKeyError, setAccessKeyError] = useState<string | null>(null);
  const [validatingKey, setValidatingKey] = useState(false);

  // --- Fetch business lines from Module 1 (table business_lines) -------------
  useEffect(() => {
    const fetchLines = async () => {
      const { data } = await supabase
        .from('business_lines')
        .select('activity_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data && data.length > 0) {
        setBusinessLines(data.map(bl => bl.activity_name));
      }
    };
    fetchLines();
  }, []);

  // --- Build questions with dynamic Q1 options from Module 1 -----------------
  const questions = useMemo(() => {
    if (businessLines.length === 0) return SURVEY_QUESTIONS;
    return SURVEY_QUESTIONS.map(q => {
      if (q.code === 'D1') {
        return {
          ...q,
          options: businessLines.map((name): SurveyOption => ({
            text: name,
            value: name,
            type: 'secondary',
          })),
        };
      }
      return q;
    });
  }, [businessLines]);

  const totalQuestions = questions.length;

  // --- Load survey from Supabase (if access code provided) -------------------
  useEffect(() => {
    if (!accessCode) return;
    const load = async () => {
      const { data } = await supabase
        .from('surveys')
        .select('id')
        .eq('access_code', accessCode)
        .eq('is_active', true)
        .single();
      if (data) setSurveyId(data.id);
    };
    load();
  }, [accessCode]);

  // --- Animate progress bar --------------------------------------------------
  useEffect(() => {
    const target = phase === 'completed' ? 100 : Math.round((currentIndex / totalQuestions) * 100);
    const timer = setTimeout(() => setProgress(target), 120);
    return () => clearTimeout(timer);
  }, [currentIndex, phase, totalQuestions]);

  // --- Derived ---------------------------------------------------------------
  const currentQuestion = questions[currentIndex];
  const currentSection =
    phase === 'theme-intro'
      ? SURVEY_SECTIONS.find(s => s.id === pendingThemeId)
      : SURVEY_SECTIONS.find(s => s.id === currentQuestion?.themeId);

  // SVG circle
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // --- Handlers --------------------------------------------------------------
  const handleStart = async () => {
    // If bypass mode (demo) or no surveyId, skip key validation
    if (bypassAccessKey || !surveyId) {
      setPhase('survey');
      return;
    }

    // Validate access key
    if (!accessKey.trim()) {
      setAccessKeyError("Veuillez saisir votre clé d'accès");
      return;
    }

    setValidatingKey(true);
    setAccessKeyError(null);

    const result = await AccessKeyService.validateAndConsume(surveyId, accessKey);
    setValidatingKey(false);

    if (!result.valid) {
      setAccessKeyError(result.error || "Clé d'accès invalide");
      return;
    }

    setPhase('survey');
  };

  const handleAnswer = (value: number | string) => {
    const q = questions[currentIndex];
    const newAnswers = { ...answers, [q.code]: value };
    setAnswers(newAnswers);

    if (currentIndex < totalQuestions - 1) {
      const next = questions[currentIndex + 1];
      if (next.themeId !== q.themeId) {
        setPendingThemeId(next.themeId);
        setCurrentIndex(currentIndex + 1);
        setPhase('theme-intro');
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      setPhase('completed');
      submitAnswers(newAnswers);
    }
  };

  const handleContinueFromIntro = () => {
    setPendingThemeId(null);
    setPhase('survey');
  };

  const submitAnswers = async (finalAnswers: Record<string, number | string>) => {
    if (!surveyId) return;
    try {
      await supabase.from('survey_responses').insert({
        survey_id: surveyId,
        responses: finalAnswers as unknown as Record<string, unknown>,
      });
    } catch (err) {
      console.error('Survey submit error:', err);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-red-500 selection:text-white overflow-hidden relative">
      {/* --- Background layers --- */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80" />
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,69,48,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.1) 0%, transparent 50%)',
        }}
      />

      {/* --- Top accent bar --- */}
      <div className="relative z-20 w-full h-1.5 bg-[#FF4530] shadow-[0_0_20px_rgba(255,69,48,0.5)]" />

      {/* --- Content container --- */}
      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 flex flex-col min-h-[calc(100vh-6px)]">
        {/* Brand header + Back button */}
        <div className="flex items-center justify-between mb-12 lg:mb-0 lg:absolute lg:top-8 lg:left-8 lg:right-8">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour au tableau de bord
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2 text-white/80 text-sm uppercase tracking-widest font-semibold">
            <div className="w-2 h-2 rounded-full bg-[#FF4530]" />
            LELE HCM — Satisfaction Employés
          </div>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-6xl mx-auto w-full flex-1">
          {/* ================================================================
              LEFT COLUMN — Content
           ================================================================ */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:pr-12">

            {/* ---- WELCOME ---- */}
            {phase === 'welcome' && (
              <div key="welcome" className="space-y-6" style={{ animation: 'surveyFadeIn 0.6s ease-out' }}>
                <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                  Améliorez votre{' '}
                  <span className="text-[#FF4530] inline-block border-b-4 border-[#FF4530]/30 pb-1">
                    Bien-être au Travail
                  </span>{' '}
                  grâce à vos retours
                </h1>
                <p className="text-slate-300 text-lg lg:text-xl font-light">
                  Participez à cette enquête <span className="text-[#FF4530]">100% anonyme</span> pour
                  contribuer à l'amélioration de votre environnement de travail.
                </p>
                <div className="space-y-2 text-slate-400 text-sm">
                  <p>• 33 questions réparties en 4 thèmes</p>
                  <p>• Durée estimée : 5–8 minutes</p>
                  <p>• Vos réponses sont strictement confidentielles</p>
                </div>

                {/* Access Key Input (only in production mode with a surveyId) */}
                {!bypassAccessKey && surveyId && (
                  <div className="mt-4 space-y-3 max-w-md">
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                      <KeyRound className="w-4 h-4 text-[#FF4530]" />
                      Saisissez votre clé d'accès
                    </div>
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => {
                        setAccessKey(e.target.value.toUpperCase().slice(0, 6));
                        setAccessKeyError(null);
                      }}
                      placeholder="Ex: A3K7NP"
                      maxLength={6}
                      className="w-full px-5 py-4 bg-white/5 border border-slate-600 rounded-xl text-white text-lg font-mono tracking-[0.3em] text-center placeholder:text-slate-600 placeholder:tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#FF4530] focus:border-transparent transition-all"
                    />
                    {accessKeyError && (
                      <p className="text-red-400 text-sm">{accessKeyError}</p>
                    )}
                    <p className="text-slate-500 text-xs">
                      Cette clé unique garantit l'anonymat de vos réponses. Elle sera invalidée après soumission.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleStart}
                  disabled={validatingKey}
                  className="mt-4 px-10 py-5 bg-[#FF4530] hover:bg-[#ff5745] text-white rounded-full transition-all duration-300 transform hover:translate-x-1 font-bold text-lg shadow-lg shadow-[#FF4530]/30 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF4530] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatingKey ? 'Vérification...' : "Commencer l'enquête"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ---- THEME INTRO ---- */}
            {phase === 'theme-intro' && currentSection && (
              <div
                key={`intro-${pendingThemeId}`}
                className="space-y-6"
                style={{ animation: 'surveyFadeIn 0.6s ease-out' }}
              >
                <p className="text-[#FF4530] text-sm font-medium uppercase tracking-wider">
                  Thème {currentSection.number} sur 4
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold text-white">{currentSection.title}</h2>
                <p className="text-slate-300 text-lg">{currentSection.subtitle}</p>
                <p className="text-slate-500">{currentSection.questionCount} questions dans cette section</p>
                <button
                  onClick={handleContinueFromIntro}
                  className="mt-4 px-10 py-5 bg-[#FF4530] hover:bg-[#ff5745] text-white rounded-full transition-all duration-300 transform hover:translate-x-1 font-bold text-lg shadow-lg shadow-[#FF4530]/30 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF4530]"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ---- QUESTION ---- */}
            {phase === 'survey' && currentQuestion && (
              <div
                key={`q-${currentIndex}`}
                className="space-y-4"
                style={{ animation: 'surveyFadeIn 0.5s ease-out' }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[#FF4530] text-sm font-medium uppercase tracking-wider">
                    {currentQuestion.themeTitle}
                  </p>
                  <span className="text-slate-600">—</span>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                    Question {currentIndex + 1} sur {totalQuestions}
                  </p>
                </div>

                <h2 className="text-2xl text-white font-medium mb-6">
                  {currentQuestion.id}. {currentQuestion.question}
                </h2>

                <div className="flex flex-col gap-3 max-w-lg">
                  {currentQuestion.options.map((option: SurveyOption, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.value)}
                      className={`
                        group relative w-full text-left px-8 py-4 rounded-full
                        transition-all duration-300 transform hover:translate-x-1
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF4530]
                        ${
                          option.type === 'primary'
                            ? 'bg-[#FF4530] hover:bg-[#ff5745] text-white shadow-lg shadow-[#FF4530]/30 font-bold'
                            : 'bg-transparent border border-slate-500 hover:border-white text-slate-300 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center justify-between">
                        {option.text}
                        {option.type === 'primary' && (
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- COMPLETED ---- */}
            {phase === 'completed' && (
              <div key="completed" style={{ animation: 'surveyFadeIn 0.6s ease-out' }}>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm space-y-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Award className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white">
                    Merci pour votre participation !
                  </h2>
                  <p className="text-slate-300 text-lg">
                    Vos réponses ont été enregistrées de manière anonyme. Nous analysons ces données pour
                    créer un meilleur environnement de travail pour tous.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-white/5 rounded-xl px-4 py-2 text-slate-400 text-sm">
                      33 questions complétées
                    </span>
                    <span className="bg-white/5 rounded-xl px-4 py-2 text-slate-400 text-sm">
                      4 thèmes analysés
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================
              RIGHT COLUMN — Progress circle + Trust badges
           ================================================================ */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {/* Decorative spinning circles */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-700/30 rounded-full pointer-events-none"
              style={{ animation: 'surveySpin 60s linear infinite' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-slate-700/50 rounded-full rotate-45 pointer-events-none" />

            {/* Circular progress */}
            <div className="relative w-64 h-64 mb-12 group cursor-default">
              <div className="absolute inset-0 bg-[#FF4530]/5 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700" />
              <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-700/50"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  stroke="#ffffff"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  stroke={ACCENT}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${circumference * 0.01} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-5xl font-bold tracking-tighter transition-all duration-500">
                  {progress}%
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">Complété</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
              <p className="text-center text-slate-400 text-xs mb-2">
                100% Anonyme & Sécurisé • Impact Direct
              </p>

              {/* Anonymat */}
              <div className="bg-[#1e293b]/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-blue-500/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg leading-none">Anonymat</div>
                  <div className="flex text-yellow-500 text-xs mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Confidentialité */}
              <div className="bg-[#1e293b]/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-red-500/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg leading-none">Confidentialité</div>
                  <div className="flex text-yellow-500 text-xs mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Impact */}
              <div className="bg-[#1e293b]/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-green-500/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-all">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg leading-none">Impact Réel</div>
                  <div className="flex text-green-500 text-xs mt-1 font-bold tracking-wide uppercase">
                    Garanti
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Keyframe animations --- */}
      <style>{`
        @keyframes surveyFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes surveySpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
