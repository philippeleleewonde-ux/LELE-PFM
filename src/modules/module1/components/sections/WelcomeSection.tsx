'use client';

import { useState } from 'react';
import { CheckCircle, FileText, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeSectionProps {
  onAccept: () => void;
}

export function WelcomeSection({ onAccept }: WelcomeSectionProps) {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAcceptance = () => {
    setIsAccepted(true);
    onAccept();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="mb-6">
          <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-green-400 to-green-500 rounded-full mb-6"></div>
          <h1 className="text-4xl font-bold text-gradient mb-4">
            CFO M1: CFO Platform to drive the Internal Financial Performance
          </h1>
          <p className="text-xl text-cfo-accent font-medium">
            CFO's SAF FinTech Platform
          </p>
        </div>
      </div>

      {/* General Conditions Section */}
      <div className="bg-cfo-card rounded-2xl p-8 border border-cfo-border shadow-cfo">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-cfo-accent" />
          <h2 className="text-2xl font-bold text-cfo-text">General Conditions</h2>
        </div>

        <div className="space-y-6 text-cfo-text">
          {/* Thank you message */}
          <p className="text-lg">
            Thank you for having chosen <span className="text-cfo-accent font-semibold">Sustainability Accounting FinTech (SAF)</span>:
          </p>

          {/* Agreement clause */}
          <div className="flex items-start space-x-3 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <Shield className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <p className="text-blue-300">
              - Your agreement gives you the right of use according to the general conditions of this Agreement.
            </p>
          </div>

          {/* Risk mitigation process */}
          <div className="p-6 bg-gray-800/50 rounded-lg border border-cfo-border">
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-yellow-400">Risk Mitigation Process</h3>
            </div>
            <p className="text-cfo-muted leading-relaxed">
              - <span className="text-cfo-text font-medium">THE PROCESS OF MITIGATING OPERATION RISK LOSSES</span> (Carrying value accounts or Expected "Economic Benefits" accounts) is 
              programmed and carried out for each reporting date at the rate of <span className="text-green-400 font-bold">99.98% for banks and Financial Companies</span> and <span className="text-green-400 font-bold">95.5% for 
              Insurance Companies and Credit Risk Counterparties</span> (Industries, Services and Local Authorities). The Risk Appetite Threshold Driven 
              by the CFO is Therefore <span className="text-red-400 font-bold">0.02% for Banks and Financial Companies</span> and <span className="text-red-400 font-bold">0.5% for Insurers and Credit Risk Counterparties</span>.
            </p>
          </div>

          {/* CFO Interaction Modules */}
          <div className="p-6 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <div className="flex items-start space-x-3 mb-4">
              <CheckCircle className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-purple-400">CFO Interaction Modules</h3>
            </div>
            <p className="text-purple-300 leading-relaxed">
              - This form is completed by CFO for <span className="text-cfo-text font-medium">Five Interaction Modules for Integrated Reporting from the CFO's Perspective</span> (access to capital, 
              profitability and growth, compliance and risk management) considering the risk appetite threshold.
            </p>
          </div>


        </div>

        {/* Acceptance Section */}
        <div className="mt-8 pt-6 border-t border-cfo-border">
          <div className="flex items-center justify-center">
            <Button
              onClick={handleAcceptance}
              variant="default"
              size="lg"
              className="!text-slate-900 dark:!text-slate-900 text-lg px-8 py-4"
              disabled={isAccepted}
            >
              {isAccepted ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Conditions Accepted</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Load of your request</span>
                </>
              )}
            </Button>
          </div>
          
          {!isAccepted && (
            <p className="text-center text-cfo-muted text-sm mt-3">
              Please accept the general conditions to proceed with the CFO platform
            </p>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-cfo-muted text-sm">
          By proceeding, you acknowledge that you have read and understood the general conditions 
          and risk appetite thresholds for the CFO's SAF FinTech Platform.
        </p>
      </div>
    </div>
  );
}
