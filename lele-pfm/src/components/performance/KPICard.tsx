import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LucideIcon, Info } from 'lucide-react-native';
import { PerfGlassCard, PF } from './shared';

type AlertLevel = 'green' | 'yellow' | 'red' | 'cyan' | 'violet' | 'orange';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  alertLevel?: AlertLevel;
  tooltip?: string;
}

const ALERT_COLORS: Record<AlertLevel, string> = {
  green: PF.green,
  yellow: PF.yellow,
  red: PF.red,
  cyan: PF.cyan,
  violet: PF.violet,
  orange: PF.orange,
};

export function KPICard({ icon: Icon, label, value, alertLevel = 'green', tooltip }: KPICardProps) {
  const color = ALERT_COLORS[alertLevel];
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <PerfGlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        {tooltip ? (
          <Pressable onPress={() => setShowTooltip(true)} hitSlop={8}>
            <View style={styles.infoBubble}>
              <Info size={13} color={PF.textMuted} />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.dot, { backgroundColor: color }]} />
        )}
      </View>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>

      {tooltip && (
        <Modal
          visible={showTooltip}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTooltip(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowTooltip(false)}>
            <View style={styles.tooltipCard}>
              <View style={[styles.tooltipIconBox, { backgroundColor: color + '20' }]}>
                <Icon size={22} color={color} />
              </View>
              <Text style={[styles.tooltipTitle, { color }]}>{label}</Text>
              <Text style={styles.tooltipText}>{tooltip}</Text>
              <Pressable onPress={() => setShowTooltip(false)} style={styles.tooltipClose}>
                <Text style={styles.tooltipCloseText}>OK</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </PerfGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    color: PF.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tooltipCard: {
    backgroundColor: '#1A1C23',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  tooltipIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipText: {
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  tooltipClose: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(251,189,35,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.3)',
  },
  tooltipCloseText: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
});
