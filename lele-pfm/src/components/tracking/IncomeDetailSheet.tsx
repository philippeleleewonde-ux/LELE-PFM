import React, { useRef, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { IncomeSourceTracking } from '@/hooks/useWeeklyIncome';
import { DailyIncomeRow } from './DailyIncomeRow';
import { formatCurrency } from '@/services/format-helpers';
import { useIncomeStore } from '@/stores/income-store';

interface IncomeDetailSheetProps {
  visible: boolean;
  source: IncomeSourceTracking | null;
  onClose: () => void;
  onAddIncome: () => void;
}

export function IncomeDetailSheet({ visible, source, onClose, onAddIncome }: IncomeDetailSheetProps) {
  const { t } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const translateY = useRef(new Animated.Value(height)).current;
  const deleteIncome = useIncomeStore((s) => s.deleteIncome);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  if (!source) return null;

  const barPercent = Math.min(source.progressPercent, 100);
  const barColor = source.progressPercent >= 100 ? '#4ADE80' : '#FBBF24';

  const sortedTxs = [...source.transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
      <Animated.View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.85 : 0.75), transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t(source.label)}</Text>
            <Text style={styles.subtitle}>
              {formatCurrency(source.weeklyActual)}
              {source.weeklyExpected > 0 && ` / ${formatCurrency(source.weeklyExpected)} ${t('incomeDetail.expected')}`}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#A1A1AA" />
          </Pressable>
        </View>

        {source.weeklyExpected > 0 && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${barPercent}%`, backgroundColor: barColor }]} />
          </View>
        )}

        <ScrollView style={[styles.list, { maxHeight: height * (isSmall ? 0.5 : 0.4) }]} showsVerticalScrollIndicator={false}>
          {sortedTxs.length === 0 ? (
            <Text style={styles.empty}>{t('incomeDetail.emptyIncome')}</Text>
          ) : (
            sortedTxs.map((inc) => (
              <DailyIncomeRow
                key={inc.id}
                income={inc}
                onDelete={deleteIncome}
              />
            ))
          )}
        </ScrollView>

        <Pressable onPress={onAddIncome} style={styles.addBtn}>
          <Plus size={20} color="#0F1014" />
          <Text style={styles.addBtnText}>{t('incomeDetail.addIncome')}</Text>
        </Pressable>
      </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#1A1C23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 14,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  list: {},
  empty: {
    color: '#52525B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
});
