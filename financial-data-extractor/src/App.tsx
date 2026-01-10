import { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { DataReview } from "./components/DataReview";
import { parseExcel, parsePDF, type ExtractedData } from "./lib/parsers";
import { Loader2, FileText } from "lucide-react";

function App() {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<{ name: string; status: "success" | "error" | "warning"; message: string }[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newProcessedFiles: { name: string; status: "success" | "error" | "warning"; message: string }[] = [];
    const newData: ExtractedData[] = [];

    for (const file of files) {
      try {
        console.log("Processing file:", file.name);
        let data: ExtractedData[] = [];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
          console.log("Parsing as Excel...");
          data = await parseExcel(file);
        } else if (fileName.endsWith(".pdf")) {
          console.log("Parsing as PDF...");
          data = await parsePDF(file);
        } else {
          console.warn("Unsupported file type:", file.name);
          newProcessedFiles.push({ name: file.name, status: "error", message: "Unsupported file type. Please upload .xlsx, .xls, or .pdf." });
          continue;
        }
        console.log("Extracted data:", data);

        if (data.length > 0) {
          newData.push(...data);
          newProcessedFiles.push({ name: file.name, status: "success", message: `Successfully extracted ${data.length} items.` });
        } else {
          newProcessedFiles.push({ name: file.name, status: "warning", message: "File scanned but no matching data found." });
        }
      } catch (err) {
        console.error(err);
        newProcessedFiles.push({ name: file.name, status: "error", message: "Failed to process file." });
      }
    }

    setExtractedData((prev) => [...prev, ...newData]);
    setProcessedFiles((prev) => [...newProcessedFiles, ...prev]);
    setIsProcessing(false);
  };

  const handleValidate = (index: number, value: string) => {
    setExtractedData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], value };
      return newData;
    });
  };

  const handleRemove = (index: number) => {
    setExtractedData((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-secondary">
                Financial Data Extractor
              </h1>
              <p className="text-xs text-muted-foreground">
                HCM Portal V2 Module
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-6 space-y-8">
        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
          {/* Left Column: Upload & Status */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-secondary">
                Upload Documents
              </h2>
              <FileUpload onFilesSelected={handleFilesSelected} />
              {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Processing files...</span>
                </div>
              )}
            </div>

            {/* Processed Files List */}
            {processedFiles.length > 0 && (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-secondary">
                  Processed Files
                </h2>
                <div className="space-y-3">
                  {processedFiles.map((file, index) => (
                    <div key={index} className={`p-3 rounded-lg border text-sm flex flex-col gap-1 ${file.status === "success" ? "bg-green-50 border-green-200 text-green-800" :
                      file.status === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                        "bg-red-50 border-red-200 text-red-800"
                      }`}>
                      <div className="font-medium flex items-center gap-2">
                        {file.name}
                      </div>
                      <div className="text-xs opacity-90">
                        {file.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-secondary">
                Instructions
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Upload Excel (.xlsx) or PDF (.pdf) files.</li>
                <li>
                  The system will automatically search for financial terms (Sales,
                  Spending, Unexpected Loss).
                </li>
                <li>Review and validate the extracted values in the table.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary">
                Extracted Data
              </h2>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {extractedData.length} items found
              </span>
            </div>
            <DataReview
              data={extractedData}
              onValidate={handleValidate}
              onRemove={handleRemove}
            />
            {extractedData.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,"
                      + "Category,Label,Year,Value,Source\n"
                      + extractedData.map(e => `"${e.category}","${e.label}","${e.year || ""}","${e.value}","${e.source}"`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "extracted_financial_data.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Validate & Export to CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
