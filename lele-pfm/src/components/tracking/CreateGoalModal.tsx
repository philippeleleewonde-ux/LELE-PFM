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
import { X } from 'lucide-react-native';
import { GoalIcon, GOAL_CATEGORIES } from '@/constants/goal-categories';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { GoalIconSelector } from './GoalIconSelector';
import { AmountInput } from './AmountInput';
import { MiniCalendar } from './MiniCalendar';

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGoalModal({ visible, onClose }: CreateGoalModalProps) {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const addGoal = useSavingsGoalStore((s) => s.addGoal);
  const translateY = useRef(new Animated.Value(height)).current;

  const [icon, setIcon] = useState<GoalIcon | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadlineMode, setDeadlineMode] = useState<'none' | 'date'>('none');
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setIcon(null);
      setName('');
      setTargetAmount(0);
      setDeadlineMode('none');
      setDeadlineDate(null);

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

  const isValid = icon !== null && name.trim().length > 0 && targetAmount > 0 &&
    (deadlineMode !== 'date' || deadlineDate !== null);

  const handleSubmit = useCallback(() => {
    if (!isValid || !icon) return;

    const cat = GOAL_CATEGORIES[icon];
    addGoal({
      name: name.trim(),
      targetAmount,
      deadline: deadlineMode === 'date' && deadlineDate
        ? deadlineDate.toISOString()
        : null,
      icon,
      color: cat.color,
    });

    onClose();
  }, [isValid, icon, name, targetAmount, deadlineMode, deadlineDate, addGoal, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { maxHeight: height * (isSmall ? 0.95 : 0.88), transform: [{ translateY }] }]}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>Nouvel objectif</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isSmall ? 14 : 20 }]}>
            <Text style={styles.sectionLabel}>Categorie</Text>
            <GoalIconSelector selected={icon} onSelect={setIcon} />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Nom du projet</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Voyage Douala, Nouveau telephone..."
              placeholderTextColor="#52525B"
              returnKeyType="done"
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Montant objectif</Text>
            <AmountInput value={targetAmount} onChange={setTargetAmount} />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Echeance</Text>
            <View style={styles.deadlineRow}>
              <Pressable
                onPress={() => setDeadlineMode('none')}
                style={[styles.deadlineBtn, deadlineMode === 'none' && styles.deadlineBtnActive]}
              >
                <Text style={[styles.deadlineBtnText, deadlineMode === 'none' && styles.deadlineBtnTextActive]}>
                  Pas d'echeance
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDeadlineMode('date')}
                style={[styles.deadlineBtn, deadlineMode === 'date' && styles.deadlineBtnActive]}
              >
                <Text style={[styles.deadlineBtnText, deadlineMode === 'date' && styles.deadlineBtnTextActive]}>
                  Choisir date
                </Text>
              </Pressable>
            </View>
            {deadlineMode === 'date' && (
              <View>
                <MiniCalendar selected={deadlineDate} onSelect={setDeadlineDate} />
                {deadlineDate && (
                  <Text style={styles.deadlineDateConfirm}>
                    {deadlineDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
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
              Creer l'objectif
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
  deadlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deadlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineBtnActive: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34,211,238,0.1)',
  },
  deadlineBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  deadlineBtnTextActive: {
    color: '#22D3EE',
  },
  deadlineDateConfirm: {
    color: '#22D3EE',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  submitBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22D3EE',
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
