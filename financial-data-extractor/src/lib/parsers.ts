import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import { SYNONYMS } from "./synonyms";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedData {
    category: string;
    label: string;
    value: number | string;
    source: string; // "Excel" or "PDF"
    match: string; // The synonym that matched
    year?: string; // Associated year if found
}

// Helper to check if a value looks like a year (e.g., 2020-2030)
const isYear = (val: any): boolean => {
    if (!val) return false;
    const str = String(val).trim();
    return /^(20\d{2})$/.test(str);
};

// Helper to check if a value looks like a financial number
const isFinancialNumber = (val: any): boolean => {
    if (val === undefined || val === null || val === "") return false;
    const str = String(val).trim().replace(/[,\s]/g, ""); // Remove spaces and commas
    return !isNaN(parseFloat(str)) && isFinite(Number(str)) && !isYear(val); // Exclude years
};

export const parseExcel = async (file: File): Promise<ExtractedData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const extracted: ExtractedData[] = [];

                workbook.SheetNames.forEach((sheetName) => {
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                    // First pass: Find all years and their positions
                    const yearPositions: { year: string; row: number; col: number }[] = [];
                    json.forEach((row, rowIndex) => {
                        row.forEach((cell, colIndex) => {
                            if (isYear(cell)) {
                                yearPositions.push({ year: String(cell), row: rowIndex, col: colIndex });
                            }
                        });
                    });

                    json.forEach((row, rowIndex) => {
                        row.forEach((cell, colIndex) => {
                            if (typeof cell === "string") {
                                const match = findMatch(cell);
                                if (match) {
                                    // Search directions: Right, Left, Down, Up
                                    const directions = [
                                        { r: 0, c: 1 },  // Right
                                        { r: 0, c: -1 }, // Left
                                        { r: 1, c: 0 },  // Down
                                        { r: -1, c: 0 }, // Up
                                    ];

                                    directions.forEach((dir) => {
                                        const targetRow = rowIndex + dir.r;
                                        const targetCol = colIndex + dir.c;

                                        if (
                                            targetRow >= 0 &&
                                            targetRow < json.length &&
                                            targetCol >= 0 &&
                                            targetCol < json[targetRow]?.length
                                        ) {
                                            const val = json[targetRow][targetCol];
                                            if (isFinancialNumber(val)) {
                                                // Try to find the closest year associated with this value
                                                // Strategy: Look for year in the same column (header) or same row (header)
                                                let associatedYear = undefined;

                                                // 1. Check column header (same col, row < current)
                                                const colYear = yearPositions.find(y => y.col === targetCol && y.row < targetRow);
                                                // 2. Check row header (same row, col < current)
                                                const rowYear = yearPositions.find(y => y.row === targetRow && y.col < targetCol);

                                                // Prioritize column header for vertical lists, row header for horizontal
                                                if (colYear) associatedYear = colYear.year;
                                                else if (rowYear) associatedYear = rowYear.year;

                                                extracted.push({
                                                    category: match.category,
                                                    label: match.label,
                                                    value: val,
                                                    source: `Excel - ${sheetName}`,
                                                    match: match.synonym,
                                                    year: associatedYear
                                                });
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    });
                });
                resolve(extracted);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const parsePDF = async (file: File): Promise<ExtractedData[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const extracted: ExtractedData[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        // Map items to a simplified grid-like structure based on transform[5] (y) and transform[4] (x)
        // This is a heuristic approach since PDF doesn't have rows/cols

        // Find years first
        const years: { year: string; x: number; y: number }[] = [];
        items.forEach(item => {
            if (isYear(item.str)) {
                years.push({ year: item.str.trim(), x: item.transform[4], y: item.transform[5] });
            }
        });

        items.forEach((item) => {
            const text = item.str;
            const match = findMatch(text);

            if (match) {
                const itemX = item.transform[4];
                const itemY = item.transform[5];
                // Define search zones (pixels)
                const tolerance = 50; // Vertical/Horizontal alignment tolerance
                const maxDist = 300; // Max distance to look for value

                // Find potential values nearby
                const nearbyValues = items.filter(otherItem => {
                    if (otherItem === item) return false;
                    if (!isFinancialNumber(otherItem.str)) return false;

                    const otherX = otherItem.transform[4];
                    const otherY = otherItem.transform[5];

                    // Right: Same Y (approx), X > itemX
                    const isRight = Math.abs(otherY - itemY) < tolerance && otherX > itemX && (otherX - itemX) < maxDist;
                    // Left: Same Y (approx), X < itemX
                    const isLeft = Math.abs(otherY - itemY) < tolerance && otherX < itemX && (itemX - otherX) < maxDist;
                    // Down: Same X (approx), Y < itemY (PDF Y origin is bottom-left, so lower Y is "down" visually on page?) 
                    // Wait, PDF coordinate system: (0,0) is usually bottom-left. So "Down" means smaller Y.
                    const isDown = Math.abs(otherX - itemX) < tolerance && otherY < itemY && (itemY - otherY) < maxDist;
                    // Up: Same X (approx), Y > itemY
                    const isUp = Math.abs(otherX - itemX) < tolerance && otherY > itemY && (otherY - itemY) < maxDist;

                    return isRight || isLeft || isDown || isUp;
                });

                nearbyValues.forEach(valItem => {
                    // Find closest year to this value
                    // Heuristic: Year should be aligned with value (column or row)
                    let associatedYear = undefined;
                    const valX = valItem.transform[4];
                    const valY = valItem.transform[5];

                    // Check for column header year (Same X, Higher Y)
                    const colYear = years.find(y => Math.abs(y.x - valX) < tolerance && y.y > valY);
                    // Check for row header year (Same Y, Left of val)
                    const rowYear = years.find(y => Math.abs(y.y - valY) < tolerance && y.x < valX);

                    if (colYear) associatedYear = colYear.year;
                    else if (rowYear) associatedYear = rowYear.year;

                    extracted.push({
                        category: match.category,
                        label: match.label,
                        value: valItem.str,
                        source: `PDF - Page ${i}`,
                        match: match.synonym,
                        year: associatedYear
                    });
                });
            }
        });
    }

    return extracted;
};

const findMatch = (text: string) => {
    // Normalize text: remove colons, trim spaces, lowercase
    const normalizedText = text.replace(/[:]/g, "").trim().toLowerCase();

    for (const [key, data] of Object.entries(SYNONYMS)) {
        const allSynonyms = [...data.fr, ...data.en];
        // Check for exact match on normalized text
        const match = allSynonyms.find((s) => s.toLowerCase() === normalizedText);
        if (match) {
            return { category: key, label: data.label, synonym: match };
        }
    }
    return null;
};
