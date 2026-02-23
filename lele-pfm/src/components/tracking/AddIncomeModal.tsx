import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { X, CalendarDays } from 'lucide-react-native';
import { IncomeCode } from '@/constants/income-categories';
import { useIncomeStore } from '@/stores/income-store';
import { getWeekNumber, getISOYear, formatDateISO, getYesterday } from '@/utils/week-helpers';
import { IncomeCategorySelector } from './IncomeCategorySelector';
import { AmountInput } from './AmountInput';
import { useTransactionStore } from '@/stores/transaction-store';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  defaultSource?: IncomeCode;
}

const DATE_LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-PT',
};

export function AddIncomeModal({ visible, onClose, defaultSource }: AddIncomeModalProps) {
  const { t } = useTranslation('tracking');
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const addIncome = useIncomeStore((s) => s.addIncome);
  const setCurrentWeek = useTransactionStore((s) => s.setCurrentWeek);
  const translateY = useRef(new Animated.Value(height)).current;

  const [source, setSource] = useState<IncomeCode | null>(defaultSource ?? null);
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState('');
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDateText, setCustomDateText] = useState('');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setSource(defaultSource ?? null);
      setAmount(0);
      setLabel('');
      setSelectedDate('today');
      setCustomDateText('');
      setCustomDate(null);

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
  }, [visible, defaultSource]);

  const handleCustomDateInput = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setCustomDateText(formatted);

    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2), 10);
      const month = parseInt(digits.slice(2, 4), 10);
      const year = parseInt(digits.slice(4, 8), 10);
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day &&
        date <= new Date()
      ) {
        setCustomDate(date);
      } else {
        setCustomDate(null);
      }
    } else {
      setCustomDate(null);
    }
  }, []);

  const getTransactionDate = useCallback((): Date => {
    if (selectedDate === 'yesterday') return getYesterday();
    if (selectedDate === 'custom' && customDate) return customDate;
    return new Date();
  }, [selectedDate, customDate]);

  const isValid = source !== null && amount > 0 && label.trim().length > 0 &&
    (selectedDate !== 'custom' || customDate !== null);

  const handleSubmit = useCallback(() => {
    if (!isValid || !source) return;

    const txDate = getTransactionDate();
    const txWeek = getWeekNumber(txDate);
    const txYear = getISOYear(txDate);

    addIncome({
      source,
      label: label.trim(),
      amount,
      transaction_date: formatDateISO(txDate),
      week_number: txWeek,
      year: txYear,
      notes: null,
    });

    setCurrentWeek(txWeek, txYear);
    onClose();
  }, [isValid, source, amount, label, getTransactionDate, addIncome, setCurrentWeek, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
      <Animated.View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.85), transform: [{ translateY }] }]}>
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('addIncome.title')}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#A1A1AA" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isSmall ? 14 : 20 }]}>
          <Text style={styles.sectionLabel}>{t('addIncome.source')}</Text>
          <IncomeCategorySelector selected={source} onSelect={setSource} />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('addIncome.amount')}</Text>
          <AmountInput value={amount} onChange={setAmount} />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('addIncome.description')}</Text>
          <TextInput
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder={t('addIncome.placeholder')}
            placeholderTextColor="#52525B"
            returnKeyType="done"
          />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('addIncome.date')}</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setSelectedDate('today')}
              style={[styles.dateBtn, selectedDate === 'today' && styles.dateBtnActive]}
            >
              <Text style={[styles.dateBtnText, selectedDate === 'today' && styles.dateBtnTextActive]}>
                {t('addIncome.today')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedDate('yesterday')}
              style={[styles.dateBtn, selectedDate === 'yesterday' && styles.dateBtnActive]}
            >
              <Text style={[styles.dateBtnText, selectedDate === 'yesterday' && styles.dateBtnTextActive]}>
                {t('addIncome.yesterday')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedDate('custom')}
              style={[styles.dateBtn, selectedDate === 'custom' && styles.dateBtnActive]}
            >
              <CalendarDays size={16} color={selectedDate === 'custom' ? '#4ADE80' : '#A1A1AA'} />
              <Text style={[styles.dateBtnText, { fontSize: 12 }, selectedDate === 'custom' && styles.dateBtnTextActive]}>
                {t('addIncome.other')}
              </Text>
            </Pressable>
          </View>
          {selectedDate === 'custom' && (
            <View style={styles.customDateRow}>
              <TextInput
                style={[
                  styles.customDateInput,
                  customDate ? styles.customDateInputValid : customDateText.length === 10 ? styles.customDateInputError : null,
                ]}
                value={customDateText}
                onChangeText={handleCustomDateInput}
                placeholder={t('addIncome.datePlaceholder')}
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={10}
              />
              {customDate && (
                <Text style={styles.customDateConfirm}>
                  {customDate.toLocaleDateString(DATE_LOCALE_MAP[i18n.language] || 'fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
              {!customDate && customDateText.length === 10 && (
                <Text style={styles.customDateError}>{t('addIncome.invalidDate')}</Text>
              )}
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid}
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
        >
          <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
            {t('addIncome.submit')}
          </Text>
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
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 500,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 50,
    color: '#FFFFFF',
    fontSize: 15,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnActive: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  dateBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  dateBtnTextActive: {
    color: '#4ADE80',
  },
  customDateRow: {
    marginTop: 10,
  },
  customDateInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  customDateInputValid: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  customDateInputError: {
    borderColor: '#F87171',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  customDateConfirm: {
    color: '#4ADE80',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  customDateError: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  submitBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '800',
  },
  submitTextDisabled: {
    color: '#52525B',
  },
});
