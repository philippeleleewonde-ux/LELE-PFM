import React from "react";
import type { ExtractedData } from "@/lib/parsers";
import { X } from "lucide-react";

interface DataReviewProps {
    data: ExtractedData[];
    onValidate: (index: number, value: string) => void;
    onRemove: (index: number) => void;
}

export const DataReview: React.FC<DataReviewProps> = ({ data, onValidate, onRemove }) => {
    if (data.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                No data extracted yet. Upload a file to begin.
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Found Label (Synonym)</th>
                            <th className="px-4 py-3">Year</th>
                            <th className="px-4 py-3">Extracted Value</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item, index) => (
                            <tr key={index} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">
                                    {item.label}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent/50 text-accent-foreground text-xs">
                                        {item.match}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-sm">
                                    {item.year || "-"}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={item.value}
                                        onChange={(e) => onValidate(index, e.target.value)}
                                        className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full font-mono text-primary"
                                    />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {item.source}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => onRemove(index)}
                                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                                        title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
