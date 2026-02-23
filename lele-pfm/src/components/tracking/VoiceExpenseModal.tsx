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
import { X, Mic, MicOff, RotateCcw, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COICOPCode, TransactionType } from '@/types';
import { useTransactionStore } from '@/stores/transaction-store';
import { useAppStore } from '@/stores/app.store';
import { getWeekNumber, getISOYear, formatDateISO } from '@/utils/week-helpers';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getNumberParser } from '@/services/number-parsers';
import { mapLabelToCOICOP } from '@/services/wizard-to-engine.mapper';
import { CategorySelector, CATEGORY_COLOR_MAP } from './CategorySelector';
import { AmountInput } from './AmountInput';

const SPEECH_LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

const TYPE_BY_CATEGORY: Record<COICOPCode, TransactionType> = {
  '01': 'Variable',
  '02': 'Variable',
  '03': 'Fixe',
  '04': 'Variable',
  '05': 'Variable',
  '06': 'Fixe',
  '07': 'Variable',
  '08': 'Fixe',
};

interface VoiceExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'listening' | 'confirm';

export function VoiceExpenseModal({ visible, onClose }: VoiceExpenseModalProps) {
  const { t } = useTranslation(['wizard', 'app']);
  const language = useAppStore((s) => s.language);
  const { width, height } = useWindowDimensions();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const setCurrentWeek = useTransactionStore((s) => s.setCurrentWeek);
  const translateY = useRef(new Animated.Value(height)).current;

  const speechLocale = SPEECH_LOCALES[language] ?? 'fr-FR';
  const speech = useSpeechRecognition(speechLocale);

  const [step, setStep] = useState<Step>('listening');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<COICOPCode>('07');
  const [label, setLabel] = useState('');
  const [originalTranscript, setOriginalTranscript] = useState('');

  // Pulse animation for mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      setStep('listening');
      setAmount(0);
      setCategory('07');
      setLabel('');
      setOriginalTranscript('');
      speech.reset();

      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: false,
      }).start();
    } else {
      speech.reset();
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  // Pulse animation when listening
  useEffect(() => {
    if (speech.isListening) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      pulseRef.current = anim;
      anim.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseRef.current?.stop();
    };
  }, [speech.isListening]);

  // When transcript is finalized, transition to confirm step
  useEffect(() => {
    if (speech.transcript && step === 'listening') {
      const timer = setTimeout(() => {
        const parser = getNumberParser(language);
        const parsed = parser.parseVoiceExpense(speech.transcript);
        setAmount(parsed.amount);
        setLabel(parsed.description);
        setOriginalTranscript(speech.transcript);
        if (parsed.description) {
          setCategory(mapLabelToCOICOP(parsed.description, language));
        }
        setStep('confirm');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [speech.transcript, step]);

  const handleMicPress = useCallback(() => {
    if (speech.isListening) {
      speech.stop();
    } else {
      speech.start();
    }
  }, [speech]);

  const handleRetry = useCallback(() => {
    setStep('listening');
    setAmount(0);
    setCategory('07');
    setLabel('');
    setOriginalTranscript('');
    speech.reset();
  }, [speech]);

  const handleSubmit = useCallback(() => {
    if (amount <= 0 || !label.trim()) return;

    const now = new Date();
    addTransaction({
      profile_id: 'local',
      type: TYPE_BY_CATEGORY[category],
      category,
      label: label.trim(),
      amount,
      payment_method: 'Espèces',
      transaction_date: formatDateISO(now),
      week_number: getWeekNumber(now),
      year: getISOYear(now),
      is_reconciled: false,
      notes: `[Vocal] ${originalTranscript}`,
    });

    setCurrentWeek(getWeekNumber(now), getISOYear(now));
    onClose();
  }, [amount, label, category, originalTranscript, addTransaction, setCurrentWeek, onClose]);

  const categoryInfo = CATEGORY_COLOR_MAP[category];
  const isValid = amount > 0 && label.trim().length > 0;
  const displayText = speech.interimTranscript || speech.transcript || '';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { maxHeight: height * 0.9, transform: [{ translateY }] }]}>
          {/* Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'listening' ? t('voice.title') : t('voice.confirm')}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          {/* Not supported message */}
          {!speech.isSupported && (
            <View style={styles.unsupportedContainer}>
              <MicOff size={48} color="#52525B" />
              <Text style={styles.unsupportedText}>
                {t('voice.unsupported')}
              </Text>
              <Text style={styles.unsupportedSubtext}>
                {t('voice.unsupportedHint')}
              </Text>
              <Pressable onPress={onClose} style={styles.closeFullBtn}>
                <Text style={styles.closeFullBtnText}>{t('voice.close')}</Text>
              </Pressable>
            </View>
          )}

          {/* Step 1: Listening */}
          {speech.isSupported && step === 'listening' && (
            <View style={styles.listeningContainer}>
              {/* Mic button */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                  onPress={handleMicPress}
                  style={[
                    styles.micButton,
                    speech.isListening && styles.micButtonActive,
                  ]}
                >
                  <Mic size={36} color="#FFFFFF" />
                </Pressable>
              </Animated.View>

              {/* Status text */}
              <Text style={styles.statusText}>
                {speech.isListening
                  ? t('voice.listening')
                  : speech.error
                    ? speech.error
                    : t('voice.tapToSpeak')}
              </Text>

              {/* Live transcript */}
              {displayText.length > 0 && (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>
                    {displayText}
                  </Text>
                </View>
              )}

              {/* Error retry */}
              {speech.error && (
                <Pressable onPress={handleRetry} style={styles.retryBtn}>
                  <RotateCcw size={16} color="#F97316" />
                  <Text style={styles.retryBtnText}>{t('voice.retry')}</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Step 2: Confirm */}
          {speech.isSupported && step === 'confirm' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.confirmContent}
            >
              {/* Detected category badge */}
              {categoryInfo && (
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryInfo.color}20` }]}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryInfo.color }]} />
                  <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                    {t(`app:categories.${categoryInfo.labelKey}`)} {t('voice.auto')}
                  </Text>
                </View>
              )}

              {/* Amount */}
              <Text style={styles.sectionLabel}>{t('voice.amount')}</Text>
              <AmountInput value={amount} onChange={setAmount} />

              {/* Category selector */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('voice.category')}</Text>
              <CategorySelector selected={category} onSelect={setCategory} />

              {/* Description */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('voice.description')}</Text>
              <TextInput
                style={styles.textInput}
                value={label}
                onChangeText={setLabel}
                placeholder={t('voice.descriptionPlaceholder')}
                placeholderTextColor="#52525B"
                returnKeyType="done"
              />

              {/* Original transcript */}
              <Text style={styles.transcriptOriginal}>
                {t('voice.transcript')} : "{originalTranscript}"
              </Text>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <Pressable onPress={handleRetry} style={styles.retryActionBtn}>
                  <RotateCcw size={18} color="#A1A1AA" />
                  <Text style={styles.retryActionText}>{t('voice.redo')}</Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid}
                  style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
                >
                  <Check size={20} color={isValid ? '#0F1014' : '#52525B'} />
                  <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
                    {t('voice.validate')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
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

  // Unsupported
  unsupportedContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  unsupportedText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  unsupportedSubtext: {
    color: '#52525B',
    fontSize: 13,
    textAlign: 'center',
  },
  closeFullBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  closeFullBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },

  // Listening
  listeningContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#EA580C',
  },
  statusText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 360,
  },
  transcriptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '600',
  },

  // Confirm
  confirmContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
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
  transcriptOriginal: {
    color: '#52525B',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  retryActionText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FBBF24',
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
