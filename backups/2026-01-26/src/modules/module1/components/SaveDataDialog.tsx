import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, CheckCircle2 } from 'lucide-react';

import { Loader2 } from 'lucide-react';

interface SaveDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export function SaveDataDialog({ open, onOpenChange, onSave, onCancel, isSaving = false }: SaveDataDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl bg-card border-border shadow-elegant p-0 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center border-b border-border">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-foreground mb-2">
                        Merci d'avoir utilisé le module HCM Performance Plan
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-lg">
                        Votre analyse est prête à être sécurisée.
                    </AlertDialogDescription>
                </div>

                <div className="p-8 space-y-8">
                    {/* Option 1: Save */}
                    <div
                        className={`bg-primary/5 rounded-xl p-6 border border-primary/10 transition-colors group cursor-pointer ${isSaving ? 'opacity-70 pointer-events-none' : 'hover:border-primary/30'}`}
                        onClick={isSaving ? undefined : onSave}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary rounded-lg shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                                {isSaving ? (
                                    <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                                ) : (
                                    <Save className="w-6 h-6 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {isSaving ? 'SAUVEGARDE EN COURS...' : 'SAVE YOUR DATA'}
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Si vous êtes satisfait, cliquez ici. Vous ne pourrez plus changer ces données qui seront enregistrées dans votre base de données et serviront à l'exécution du plan de performances dans les autres modules.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Option 2: Cancel */}
                    <div className="bg-muted/30 rounded-xl p-6 border border-transparent hover:border-border hover:bg-muted/50 transition-colors group cursor-pointer" onClick={onCancel}>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-muted rounded-lg group-hover:scale-105 transition-transform">
                                <RotateCcw className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-foreground mb-1 group-hover:text-destructive transition-colors">
                                    ANNULER ET REVENIR
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Si vous souhaitez faire une autre analyse, cliquez ici pour revenir sur la page 1 : <strong>CFO's SAF FinTech Platform</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-muted/20 p-4 text-center text-xs text-muted-foreground border-t border-border">
                    LELE HCM - High Performance Analytics
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
