// ============================================
// UPLOAD ZONE - Drag & Drop File Upload
// ============================================

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadedFile } from '../types';

interface UploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
}

export function UploadZone({ onFilesUploaded, uploadedFiles, onRemoveFile }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/pdf' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.pdf')
    );

    if (files.length > 0) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return <FileText className="w-8 h-8 text-red-400" />;
    }
    return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-400';
      case 'ready':
        return 'text-cyan-400';
      case 'scanning':
        return 'text-orange-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'ready':
        return 'Ready to scan';
      case 'scanning':
        return 'Scanning...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-cyan-500 bg-cyan-500/10 scale-105'
            : 'border-gray-600 bg-slate-800/50 hover:border-cyan-500/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div className="mb-6">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                isDragging
                  ? 'bg-gradient-to-r from-orange-500 to-cyan-500 scale-110'
                  : 'bg-slate-700'
              }`}
            >
              <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            {isDragging ? 'Drop files here' : 'Upload Your Financial Documents'}
          </h3>

          <p className="text-gray-400 mb-6">
            Drag and drop Excel or PDF files here, or click to browse
          </p>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.pdf"
            multiple
            onChange={handleFileInput}
          />

          <label htmlFor="file-upload">
            <Button
              type="button"
              className="bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 text-white font-semibold cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </label>

          <p className="text-sm text-gray-500 mt-4">
            Supported formats: Excel (.xlsx, .xls) and PDF (.pdf)
          </p>
        </div>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">Uploaded Files ({uploadedFiles.length})</h4>

          {uploadedFiles.map((file) => (
            <Card key={file.id} className="bg-slate-800/50 border-slate-700 p-4">
              <div className="flex items-center space-x-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.file.name)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-white font-medium truncate">{file.file.name}</h5>
                    <span className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                      {getStatusText(file.status)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">
                      {(file.file.size / 1024).toFixed(2)} KB
                    </span>

                    {file.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(file.status === 'uploading' || file.status === 'scanning') && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.errorMessage && (
                    <p className="text-sm text-red-400 mt-1">{file.errorMessage}</p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="flex-shrink-0 hover:bg-red-500/20 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
