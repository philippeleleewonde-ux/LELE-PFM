// ============================================
// SCAN CONVERSATION - Animated Scanning Progress
// ============================================

import { useEffect, useState } from 'react';
import { Loader2, FileSearch, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScanConversationProps {
  fileName: string;
  status: 'scanning' | 'completed' | 'error';
  progress: number;
  dataPointsFound: number;
  errorMessage?: string;
}

export function ScanConversation({
  fileName,
  status,
  progress,
  dataPointsFound,
  errorMessage
}: ScanConversationProps) {
  const [scanningMessages, setScanningMessages] = useState<string[]>([]);

  // Simulate conversational scanning messages
  useEffect(() => {
    if (status === 'scanning') {
      const messages: string[] = [
        `📄 Opening ${fileName}...`,
        '🔍 Analyzing document structure...',
        '🎯 Searching for financial keywords...',
        '💰 Extracting revenue data...',
        '📊 Extracting expense data...',
        '📅 Detecting years in range N-1 to N-5...',
        '🧮 Calculating confidence scores...',
        '✨ Preparing validation data...'
      ];

      let messageIndex = 0;
      const interval = setInterval(() => {
        if (messageIndex < messages.length) {
          setScanningMessages((prev) => [...prev, messages[messageIndex]]);
          messageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [status, fileName]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-cyan-500/30 p-6">
        <div className="flex items-center space-x-4">
          {status === 'scanning' && (
            <>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div>
                <h3 className="text-xl font-bold text-white">Scanning in Progress</h3>
                <p className="text-gray-400">Please wait while we analyze your document...</p>
              </div>
            </>
          )}

          {status === 'completed' && (
            <>
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Scan Completed Successfully</h3>
                <p className="text-gray-400">Found {dataPointsFound} data points for validation</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Scan Failed</h3>
                <p className="text-gray-400">{errorMessage || 'An error occurred during scanning'}</p>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'scanning' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-medium text-cyan-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </Card>

      {/* Scanning Messages (Conversational) */}
      {status === 'scanning' && scanningMessages.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="space-y-3">
            {scanningMessages.map((message, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 animate-pulse"></div>
                <p className="text-white">{message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {status === 'completed' && dataPointsFound > 0 && (
        <Card className="bg-gradient-to-r from-green-900/20 to-cyan-900/20 border-green-500/30 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400">{dataPointsFound}</div>
              <div className="text-sm text-gray-400 mt-1">Data Points Found</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">
                <FileSearch className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-sm text-gray-400 mt-1">AI Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">35+</div>
              <div className="text-sm text-gray-400 mt-1">Keywords Matched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">100%</div>
              <div className="text-sm text-gray-400 mt-1">Scan Complete</div>
            </div>
          </div>
        </Card>
      )}

      {/* No Data Found */}
      {status === 'completed' && dataPointsFound === 0 && (
        <Card className="bg-yellow-900/20 border-yellow-500/30 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No Financial Data Found</h4>
          <p className="text-gray-400 text-sm">
            The scanner did not find any revenue or expense data in the expected format.
            Please check if the document contains financial keywords and numerical values.
          </p>
        </Card>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
