import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, className }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx", ".xls"],
            "application/vnd.ms-excel": [".xls"],
            "application/pdf": [".pdf"],
        },
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ease-in-out",
                isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-background rounded-full shadow-sm ring-1 ring-border">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-foreground">
                        {isDragActive ? "Drop files here" : "Drag & drop files here"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Supports Excel (.xlsx, .xls) and PDF (.pdf)
                    </p>
                </div>
                <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        <FileSpreadsheet className="w-3 h-3" /> Excel
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        <FileText className="w-3 h-3" /> PDF
                    </div>
                </div>
            </div>
        </div>
    );
};
