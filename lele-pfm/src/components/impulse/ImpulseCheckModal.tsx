import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useImpulseCheck } from '@/hooks/useImpulseCheck';
import { PurchaseInput } from './PurchaseInput';
import { ModeSelector } from './ModeSelector';
import { WealthVerdict } from './WealthVerdict';
import { ImpactSimulation } from './ImpactSimulation';

type Step = 'input' | 'mode' | 'wealth' | 'impact';

const STEP_INDEX: Record<Step, number> = { input: 0, mode: 1, wealth: 2, impact: 2 };
const TOTAL_STEPS = 3;

interface ImpulseCheckModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ImpulseCheckModal({ visible, onClose }: ImpulseCheckModalProps) {
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;

  const [step, setStep] = useState<Step>('input');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);

  const analysis = useImpulseCheck(amount);

  // Animate open/close
  useEffect(() => {
    if (visible) {
      setStep('input');
      setLabel('');
      setAmount(0);

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

  const handleClose = () => {
    onClose();
  };

  const progressWidth = `${((STEP_INDEX[step] + 1) / TOTAL_STEPS) * 100}%`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * 0.92, transform: [{ translateY }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header with progress */}
          <View style={styles.header}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth as any }]} />
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'input' && (
              <PurchaseInput
                label={label}
                amount={amount}
                onLabelChange={setLabel}
                onAmountChange={setAmount}
                onNext={() => setStep('mode')}
              />
            )}

            {step === 'mode' && (
              <ModeSelector
                label={label}
                amount={amount}
                onSelectWealth={() => setStep('wealth')}
                onSelectControl={() => setStep('impact')}
                onBack={() => setStep('input')}
              />
            )}

            {step === 'wealth' && (
              <WealthVerdict
                label={label}
                amount={amount}
                analysis={analysis}
                onBack={() => setStep('mode')}
                onClose={handleClose}
              />
            )}

            {step === 'impact' && (
              <ImpactSimulation
                label={label}
                amount={amount}
                analysis={analysis}
                onBack={() => setStep('mode')}
                onClose={handleClose}
              />
            )}
          </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#A78BFA',
    borderRadius: 2,
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
});
