import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Switch, StyleSheet } from 'react-native';
import { X, Bell } from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import { RendezVousConfig, RendezVousFrequency } from '@/types/investor-journey';

const FREQUENCIES: { key: RendezVousFrequency; label: string }[] = [
  { key: 'weekly', label: 'Hebdomadaire' },
  { key: 'biweekly', label: 'Bihebdomadaire' },
  { key: 'monthly', label: 'Mensuel' },
  { key: 'quarterly', label: 'Trimestriel' },
];

const DAYS = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mer' },
  { day: 4, label: 'Jeu' },
  { day: 5, label: 'Ven' },
  { day: 6, label: 'Sam' },
  { day: 0, label: 'Dim' },
];

const REMINDER_OPTIONS = [
  { hours: 12, label: '12h' },
  { hours: 24, label: '24h' },
  { hours: 48, label: '48h' },
];

interface RendezVousConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: RendezVousConfig;
  onSave: (config: RendezVousConfig) => void;
}

export function RendezVousConfigModal({ visible, onClose, config, onSave }: RendezVousConfigModalProps) {
  const [frequency, setFrequency] = useState<RendezVousFrequency>(config.frequency);
  const [dayOfWeek, setDayOfWeek] = useState<number>(config.dayOfWeek);
  const [reminderHours, setReminderHours] = useState(config.reminderHoursBefore);
  const [enabled, setEnabled] = useState(config.enabled);

  const handleSave = () => {
    onSave({
      frequency,
      dayOfWeek: dayOfWeek as RendezVousConfig['dayOfWeek'],
      reminderHoursBefore: reminderHours,
      enabled,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configurer les rendez-vous</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={PF.textSecondary} />
            </Pressable>
          </View>

          {/* Enable toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activer les rappels</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: PF.textMuted, true: PF.accent + '60' }}
              thumbColor={enabled ? PF.accent : '#ccc'}
            />
          </View>

          {/* Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequence</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((f) => {
                const isSelected = frequency === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFrequency(f.key)}
                    style={[styles.freqBtn, isSelected && styles.freqBtnActive]}
                  >
                    <Text style={[styles.freqText, isSelected && styles.freqTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Day of week */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Jour de la semaine</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d) => {
                const isSelected = dayOfWeek === d.day;
                return (
                  <Pressable
                    key={d.day}
                    onPress={() => setDayOfWeek(d.day)}
                    style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <View style={styles.reminderHeader}>
              <Bell size={14} color={PF.accent} />
              <Text style={styles.sectionTitle}>Rappel avant le bilan</Text>
            </View>
            <View style={styles.reminderRow}>
              {REMINDER_OPTIONS.map((r) => {
                const isSelected = reminderHours === r.hours;
                return (
                  <Pressable
                    key={r.hours}
                    onPress={() => setReminderHours(r.hours)}
                    style={[styles.reminderBtn, isSelected && styles.reminderBtnActive]}
                  >
                    <Text style={[styles.reminderText, isSelected && styles.reminderTextActive]}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save */}
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Enregistrer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1C23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
  },
  toggleLabel: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  freqBtnActive: {
    borderColor: PF.accent,
    backgroundColor: PF.accent + '20',
  },
  freqText: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  freqTextActive: {
    color: PF.accent,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PF.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  dayCircleActive: {
    borderColor: PF.accent,
    backgroundColor: PF.accent + '20',
  },
  dayText: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  dayTextActive: {
    color: PF.accent,
    fontWeight: '700',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.border,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  reminderBtnActive: {
    borderColor: PF.accent,
    backgroundColor: PF.accent + '20',
  },
  reminderText: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  reminderTextActive: {
    color: PF.accent,
  },
  saveBtn: {
    backgroundColor: PF.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
});
