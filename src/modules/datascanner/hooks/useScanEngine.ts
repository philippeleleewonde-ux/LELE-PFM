// ============================================
// USE SCAN ENGINE - Main Orchestration Hook
// ============================================

import { useState, useCallback } from 'react';
import { extractFinancialDataFromExcel } from '../lib/excelParser';
// ⚠️ TEMPORARILY DISABLED: pdfParser causes "superclass is not a constructor" error
// import { extractFinancialDataFromPDF } from '../lib/pdfParser';
import {
  FinancialDataPoint,
  UploadedFile,
  ScanResult,
  ValidationAction,
  ScanStatistics,
  DEFAULT_SCAN_CONFIG
} from '../types';

export function useScanEngine() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentValidationIndex, setCurrentValidationIndex] = useState(0);
  const [validatedDataPoints, setValidatedDataPoints] = useState<FinancialDataPoint[]>([]);
  const [allDataPoints, setAllDataPoints] = useState<FinancialDataPoint[]>([]);

  /**
   * Handle file upload
   */
  const handleFilesUploaded = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'ready'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  /**
   * Remove uploaded file
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setScanResults(prev => prev.filter(r => r.fileId !== fileId));
  }, []);

  /**
   * Scan a single file
   */
  const scanFile = useCallback(async (uploadedFile: UploadedFile) => {
    const fileId = uploadedFile.id;
    const file = uploadedFile.file;

    // Update file status to scanning
    setUploadedFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, status: 'scanning', progress: 0 } : f))
    );

    try {
      // Determine file type
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isPDF = file.name.endsWith('.pdf');

      if (!isExcel && !isPDF) {
        throw new Error('Unsupported file format');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 300);

      // Extract financial data
      let dataPoints: FinancialDataPoint[];

      if (isExcel) {
        dataPoints = await extractFinancialDataFromExcel(file, DEFAULT_SCAN_CONFIG);
      } else {
        // ⚠️ TEMPORARILY DISABLED: PDF parsing causes crash
        // dataPoints = await extractFinancialDataFromPDF(file, DEFAULT_SCAN_CONFIG);
        throw new Error('PDF parsing is temporarily disabled due to technical issues. Please use Excel files (.xlsx) for now.');
      }

      clearInterval(progressInterval);

      // Update file status to completed
      setUploadedFiles(prev =>
        prev.map(f => (f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f))
      );

      // Create scan result
      const scanResult: ScanResult = {
        fileId,
        fileName: file.name,
        fileType: isExcel ? 'excel' : 'pdf',
        scanDate: new Date(),
        dataPoints,
        status: dataPoints.length > 0 ? 'pending_validation' : 'validated'
      };

      setScanResults(prev => [...prev, scanResult]);
      setAllDataPoints(prev => [...prev, ...dataPoints]);

      return scanResult;
    } catch (error) {
      console.error('Error scanning file:', error);

      // Update file status to error
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                progress: 0
              }
            : f
        )
      );

      const errorResult: ScanResult = {
        fileId,
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'excel',
        scanDate: new Date(),
        dataPoints: [],
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      setScanResults(prev => [...prev, errorResult]);

      return errorResult;
    }
  }, []);

  /**
   * Scan all uploaded files
   */
  const scanAllFiles = useCallback(async () => {
    const filesToScan = uploadedFiles.filter(f => f.status === 'ready');

    for (const file of filesToScan) {
      await scanFile(file);
    }
  }, [uploadedFiles, scanFile]);

  /**
   * Handle validation action
   */
  const handleValidation = useCallback((action: ValidationAction) => {
    const dataPoint = allDataPoints.find(dp => dp.id === action.dataPointId);

    if (!dataPoint) return;

    if (action.action === 'accept') {
      // Accept as-is
      const validated: FinancialDataPoint = {
        ...dataPoint,
        validated: true
      };
      setValidatedDataPoints(prev => [...prev, validated]);
    } else if (action.action === 'edit' && action.editedValue) {
      // Accept with edits
      const validated: FinancialDataPoint = {
        ...dataPoint,
        amount: action.editedValue.amount ?? dataPoint.amount,
        year: action.editedValue.year ?? dataPoint.year,
        category: action.editedValue.category ?? dataPoint.category,
        validated: true,
        manuallyEdited: true
      };
      setValidatedDataPoints(prev => [...prev, validated]);
    }
    // If 'reject', we just skip it (don't add to validated)

    // Move to next data point
    setCurrentValidationIndex(prev => prev + 1);
  }, [allDataPoints]);

  /**
   * Calculate statistics
   */
  const calculateStatistics = useCallback((): ScanStatistics => {
    const totalDataPoints = validatedDataPoints.length;
    const validatedCount = totalDataPoints;

    const revenueCount = validatedDataPoints.filter(dp => dp.category === 'revenue').length;
    const expensesCount = validatedDataPoints.filter(dp => dp.category === 'expenses').length;

    const avgConfidence =
      totalDataPoints > 0
        ? validatedDataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / totalDataPoints
        : 0;

    const yearsCovered = [...new Set(validatedDataPoints.map(dp => dp.year))].sort((a, b) => b - a);

    return {
      totalScans: scanResults.length,
      totalDataPoints,
      validatedDataPoints: validatedCount,
      averageConfidence: avgConfidence,
      categoriesBreakdown: {
        revenue: revenueCount,
        expenses: expensesCount
      },
      yearsCovered
    };
  }, [validatedDataPoints, scanResults]);

  /**
   * Get pending data points for validation
   */
  const getPendingDataPoints = useCallback((): FinancialDataPoint[] => {
    const validatedIds = new Set(validatedDataPoints.map(dp => dp.id));
    return allDataPoints.filter(dp => !validatedIds.has(dp.id));
  }, [allDataPoints, validatedDataPoints]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setUploadedFiles([]);
    setScanResults([]);
    setCurrentValidationIndex(0);
    setValidatedDataPoints([]);
    setAllDataPoints([]);
  }, []);

  /**
   * Export validated data to JSON
   */
  const exportToJSON = useCallback(() => {
    const data = {
      exportDate: new Date().toISOString(),
      statistics: calculateStatistics(),
      dataPoints: validatedDataPoints
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [validatedDataPoints, calculateStatistics]);

  return {
    // State
    uploadedFiles,
    scanResults,
    validatedDataPoints,
    currentValidationIndex,
    pendingDataPoints: getPendingDataPoints(),
    statistics: calculateStatistics(),

    // Actions
    handleFilesUploaded,
    handleRemoveFile,
    scanFile,
    scanAllFiles,
    handleValidation,
    reset,
    exportToJSON
  };
}
