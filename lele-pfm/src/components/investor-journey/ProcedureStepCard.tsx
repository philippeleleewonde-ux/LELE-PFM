import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, FileText, Clock, Lightbulb, Building2 } from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import { ProcedureStep } from '@/types/investor-journey';

interface ProcedureStepCardProps {
  step: ProcedureStep;
  isCompleted: boolean;
  onToggle: () => void;
  stepNumber: number;
}

export function ProcedureStepCard({ step, isCompleted, onToggle, stepNumber }: ProcedureStepCardProps) {
  return (
    <Pressable onPress={onToggle} style={styles.container}>
      {/* Checkbox */}
      <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
        {isCompleted && <Check size={14} color="#0F1014" />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {stepNumber}. {step.titleKey}
        </Text>

        {step.descriptionKey ? (
          <Text style={styles.description}>{step.descriptionKey}</Text>
        ) : null}

        {/* Institution */}
        {step.institution ? (
          <View style={styles.metaRow}>
            <Building2 size={12} color={PF.blue} />
            <Text style={styles.metaText}>{step.institution}</Text>
          </View>
        ) : null}

        {/* Documents */}
        {step.documents.length > 0 && (
          <View style={styles.docsContainer}>
            <View style={styles.metaRow}>
              <FileText size={12} color={PF.orange} />
              <Text style={styles.metaLabel}>Documents :</Text>
            </View>
            {step.documents.map((doc, idx) => (
              <Text key={idx} style={styles.docItem}>  - {doc}</Text>
            ))}
          </View>
        )}

        {/* Cost + Duration row */}
        <View style={styles.infoRow}>
          {step.estimatedCostXOF != null && step.estimatedCostXOF > 0 && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>
                ~{step.estimatedCostXOF.toLocaleString()} FCFA
              </Text>
            </View>
          )}
          {step.estimatedDays > 0 && (
            <View style={styles.infoBadge}>
              <Clock size={10} color={PF.textSecondary} />
              <Text style={styles.infoBadgeText}>
                ~{step.estimatedDays} jour{step.estimatedDays > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        {step.tips.length > 0 && (
          <View style={styles.tipsContainer}>
            {step.tips.map((tip, idx) => (
              <View key={idx} style={styles.tipRow}>
                <Lightbulb size={11} color={PF.accent} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PF.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: PF.green,
    borderColor: PF.green,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: PF.textMuted,
  },
  description: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    color: PF.blue,
    fontSize: 11,
    fontWeight: '500',
  },
  metaLabel: {
    color: PF.orange,
    fontSize: 11,
    fontWeight: '600',
  },
  docsContainer: {
    marginTop: 4,
  },
  docItem: {
    color: PF.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  infoBadgeText: {
    color: PF.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: 6,
    gap: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    color: PF.accent,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
