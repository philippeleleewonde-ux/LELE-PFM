import React, { useState, lazy, Suspense } from 'react';
import { FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { CalculatedFields, Currency, BusinessLine, SocioeconomicImprovement, QualitativeAssessment } from '@/modules/module1/types';
// ✅ PERFORMANCE: html2canvas et jsPDF sont maintenant chargés dynamiquement uniquement lors de l'export
import { Loader2 } from 'lucide-react';
import { FiscalCalendarWidget } from '@/components/shared/FiscalCalendarWidget';

// ✅ PERFORMANCE: Lazy loading des sections pour réduire le bundle initial
// Seules les sections visibles sont chargées à la demande
const SectionA_ValueAtRisk = lazy(() => import('./sections/SectionA_ValueAtRisk').then(m => ({ default: m.SectionA_ValueAtRisk })));
const SectionB_DistributionSavings = lazy(() => import('./sections/SectionB_DistributionSavings').then(m => ({ default: m.SectionB_DistributionSavings })));
const SectionC_VaRBasel = lazy(() => import('./sections/SectionC_VaRBasel').then(m => ({ default: m.SectionC_VaRBasel })));
const SectionD_EconomicBreakdown = lazy(() => import('./sections/SectionD_EconomicBreakdown').then(m => ({ default: m.SectionD_EconomicBreakdown })));
const SectionE_RiskThreshold = lazy(() => import('./sections/SectionE_RiskThreshold').then(m => ({ default: m.SectionE_RiskThreshold })));
const SectionF_IPLEPlan = lazy(() => import('./sections/SectionF_IPLEPlan').then(m => ({ default: m.SectionF_IPLEPlan })));
const SectionG_RealTimeDashboard = lazy(() => import('./sections/SectionG_RealTimeDashboard').then(m => ({ default: m.SectionG_RealTimeDashboard })));
const SectionH_PriorityActionsN1 = lazy(() => import('./sections/SectionH_PriorityActionsN1').then(m => ({ default: m.SectionH_PriorityActionsN1 })));
const SectionI_PriorityActionsN2 = lazy(() => import('./sections/SectionI_PriorityActionsN2').then(m => ({ default: m.SectionI_PriorityActionsN2 })));
const SectionJ_PriorityActionsN3 = lazy(() => import('./sections/SectionJ_PriorityActionsN3').then(m => ({ default: m.SectionJ_PriorityActionsN3 })));

// ✅ Composant de fallback pour le lazy loading des sections
const SectionSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-32 bg-muted rounded"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
  </div>
);

interface Page17GlobalReportingProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
  businessLines: BusinessLine[];
  socioeconomicData: SocioeconomicImprovement;
  qualitativeData: QualitativeAssessment;
}

// ...

export function Page17GlobalReporting({
  calculated,
  selectedCurrency,
  businessLines,
  socioeconomicData,
  qualitativeData
}: Page17GlobalReportingProps) {

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']));
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleAll = () => {
    if (expandedSections.size === 10) { // Updated to 10 sections (A-J)
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']));
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // ✅ PERFORMANCE: Chargement dynamique de html2canvas et jsPDF uniquement lors de l'export
      // Ces librairies font ~33MB au total et ne sont plus chargées au démarrage
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;

      // 1. Sauvegarder l'état actuel des sections
      const previousExpandedState = new Set(expandedSections);

      // 2. Tout développer pour la capture
      setExpandedSections(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']));

      // 3. Attendre que le DOM se mette à jour (petit délai pour le rendu)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Capturer l'élément
      const element = document.getElementById('global-reporting-content');
      if (!element) throw new Error('Element not found');

      const canvas = await html2canvas(element, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff' // Fond blanc pour le PDF
      });

      // 5. Générer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Gérer le multipage si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('LELE-HCM-Global-Reporting.pdf');

      // 6. Restaurer l'état précédent (optionnel, ici on laisse ouvert ou on restaure)
      // setExpandedSections(previousExpandedState);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const sections = [
    { id: 'A', title: 'Value at Risk (VaR)', component: SectionA_ValueAtRisk },
    { id: 'B', title: 'Distribution of Costs Savings', component: SectionB_DistributionSavings },
    { id: 'C', title: 'Distribution VaR Basel II', component: SectionC_VaRBasel },
    { id: 'D', title: 'Economic Benefit Breakdown', component: SectionD_EconomicBreakdown },
    { id: 'E', title: 'Breakdown of Losses & Risk Appetite', component: SectionE_RiskThreshold },
    { id: 'F', title: 'IPLE Plan & Performance Indicators', component: SectionF_IPLEPlan },
    { id: 'G', title: 'Real-Time Driving Plan Dashboard', component: SectionG_RealTimeDashboard },
    { id: 'H', title: 'Priority Actions N+1', component: SectionH_PriorityActionsN1 },
    { id: 'I', title: 'Priority Actions N+2', component: SectionI_PriorityActionsN2 },
    { id: 'J', title: 'Priority Actions N+3', component: SectionJ_PriorityActionsN3 }
  ];

  return (
    <div className="space-y-6" id="global-reporting-content">
      {/* Main Header */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-elegant">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              17 - GLOBAL REPORTING HCM PERFORMANCE PLAN
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Synthèse complète de l'analyse socio-économique et planification stratégique sur 3 ans
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>📊 10 sections analytiques</span>
              <span>•</span>
              <span>📈 Consolidation Pages 1-16</span>
              <span>•</span>
              <span>🎯 Vision stratégique complète</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier Fiscal - Planning sur 3 ans */}
      <FiscalCalendarWidget
        title="Planning Stratégique 3 Ans"
        showInfo={true}
        className="print:hidden"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors text-primary-foreground"
        >
          {expandedSections.size === 10 ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm font-medium">Tout réduire</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm font-medium">Tout développer</span>
            </>
          )}
        </button>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isExporting ? 'Génération...' : 'Exporter en PDF'}
          </span>
        </button>
      </div>

      {/* Sections Collapsibles */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const SectionComponent = section.component;

          return (
            <div
              key={section.id}
              className="bg-card rounded-lg border border-border overflow-hidden shadow-sm"
            >
              {/* Section Header - Always visible */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary dark:!text-blue-400">{section.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground dark:!text-white">{section.title}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Section Content - Collapsible avec Suspense pour lazy loading */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-border/50">
                  <div className="pt-4">
                    <Suspense fallback={<SectionSkeleton />}>
                      <SectionComponent
                        calculated={calculated}
                        selectedCurrency={selectedCurrency}
                        businessLines={businessLines}
                        socioeconomicData={socioeconomicData}
                        qualitativeData={qualitativeData}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-primary">📌 Note:</strong> Ce rapport global consolide automatiquement toutes les données
          des 16 pages précédentes. Toute modification des pages sources (1-16) sera instantanément
          reflétée dans ce reporting. Les formules Excel de la feuille "13-REPORTING M1-Pdf" ont été
          fidèlement transposées en TypeScript pour garantir l'exactitude des calculs.
        </p>
      </div>
    </div>
  );
}
