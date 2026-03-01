import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import { AdvisoryMessage, AdvisorySeverity } from '@/types/investor-journey';

const SEVERITY_COLORS: Record<AdvisorySeverity, string> = {
  info: '#60A5FA',
  warning: '#FBBF24',
  success: '#4ADE80',
  urgent: '#F87171',
};

function SeverityIcon({ severity, color }: { severity: AdvisorySeverity; color: string }) {
  const size = 18;
  switch (severity) {
    case 'info':
      return <Info size={size} color={color} />;
    case 'warning':
      return <AlertTriangle size={size} color={color} />;
    case 'success':
      return <CheckCircle size={size} color={color} />;
    case 'urgent':
      return <AlertOctagon size={size} color={color} />;
  }
}

interface AdvisoryBannerProps {
  advisory: AdvisoryMessage;
  onDismiss: (id: string) => void;
}

export function AdvisoryBanner({ advisory, onDismiss }: AdvisoryBannerProps) {
  const color = SEVERITY_COLORS[advisory.severity];

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <SeverityIcon severity={advisory.severity} color={color} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color }]}>{advisory.titleKey}</Text>
          <Text style={styles.message}>{advisory.messageKey}</Text>
        </View>

        <Pressable
          onPress={() => onDismiss(advisory.id)}
          style={styles.dismissBtn}
          hitSlop={8}
        >
          <X size={16} color={PF.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
  },
});
