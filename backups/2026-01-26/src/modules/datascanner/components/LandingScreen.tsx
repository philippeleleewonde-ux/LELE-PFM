// ============================================
// LANDING SCREEN - Elite UX Welcome
// ============================================

import { FileSpreadsheet, FileText, Zap, Target, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LandingScreenProps {
  onGetStarted: () => void;
}

export function LandingScreen({ onGetStarted }: LandingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 mb-6 animate-pulse">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">
            HCM Data Scanner
          </h1>

          <p className="text-xl text-blue-200 mb-4 max-w-3xl mx-auto">
            Automated Financial Data Extraction Platform
          </p>

          <p className="text-lg text-blue-300 max-w-2xl mx-auto">
            Scan Excel and PDF documents to automatically extract Revenue and Expenses data
            from the last 5 years. Powered by intelligent AI algorithms and validated by you.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-800/50 border-cyan-500/30 p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Format Support</h3>
            </div>
            <p className="text-blue-200 text-sm">
              Automatically processes Excel (.xlsx, .xls) and PDF files with intelligent parsing
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-orange-500/30 p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">35+ Keywords Recognition</h3>
            </div>
            <p className="text-blue-200 text-sm">
              Recognizes Revenue and Expenses keywords in French and English with fuzzy matching
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-cyan-500/30 p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Interactive Validation</h3>
            </div>
            <p className="text-blue-200 text-sm">
              Review and validate each detected data point with intuitive Oui/Non interface
            </p>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-slate-800/50 border-blue-500/30 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-blue-400" />
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                1
              </div>
              <h4 className="text-white font-semibold mb-2">Upload Documents</h4>
              <p className="text-blue-200 text-sm">
                Drag & drop your Excel or PDF financial documents
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                2
              </div>
              <h4 className="text-white font-semibold mb-2">AI Scanning</h4>
              <p className="text-blue-200 text-sm">
                Intelligent 4-directional algorithm extracts data automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                3
              </div>
              <h4 className="text-white font-semibold mb-2">Validate Results</h4>
              <p className="text-blue-200 text-sm">
                Review each detected item with Oui/Non or manual correction
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-lg">
                4
              </div>
              <h4 className="text-white font-semibold mb-2">Export & Use</h4>
              <p className="text-blue-200 text-sm">
                Validated data is saved to your profile and ready to use
              </p>
            </div>
          </div>
        </Card>

        {/* Key Data Points */}
        <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-orange-500/30 rounded-xl p-6 mb-12">
          <h3 className="text-xl font-bold text-white mb-4">What We Extract</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Revenue & Sales Data</h4>
                <p className="text-blue-200 text-sm">
                  Chiffre d'affaires, Revenus, Ventes, CA, Sales, Revenue, Turnover, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Expenses & Costs Data</h4>
                <p className="text-blue-200 text-sm">
                  Charges, Dépenses, Coûts, Frais, Expenses, Costs, OPEX, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Historical Years</h4>
                <p className="text-blue-200 text-sm">
                  Automatically detects data from N-1 to N-5 (last 5 years)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <h4 className="text-white font-semibold">Multi-Language</h4>
                <p className="text-blue-200 text-sm">
                  Supports French and English keywords with fuzzy matching
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 text-white font-bold px-12 py-6 text-xl rounded-xl shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <Zap className="w-6 h-6 mr-3" />
            Start Scanning Documents
          </Button>

          <p className="text-blue-300 text-sm mt-4">
            No credit card required • Instant results • User-scoped storage
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
