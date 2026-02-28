import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PF } from './shared';
import { useAssetStore } from '@/stores/asset-store';
import {
  AssetClass,
  ASSET_CLASSES,
  ASSET_CLASS_CODES,
  ASSET_SUBCATEGORIES,
  SubcategoryConfig,
} from '@/constants/patrimoine-buckets';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddAssetModal({ visible, onClose }: AddAssetModalProps) {
  const { t } = useTranslation('performance');
  const addAsset = useAssetStore((s) => s.addAsset);

  const [selectedClass, setSelectedClass] = useState<AssetClass>('epargne_securisee');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [yieldPercent, setYieldPercent] = useState('');
  const [notes, setNotes] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const subcategories = ASSET_SUBCATEGORIES[selectedClass];

  const isValid =
    label.trim().length > 0 &&
    parseFloat(value) > 0 &&
    !isNaN(parseFloat(value));

  function handleClassSelect(code: AssetClass) {
    setSelectedClass(code);
    setSelectedSubcategory(null);
    setYieldPercent(String(ASSET_CLASSES[code].defaultYield));
  }

  function handleSubcategorySelect(sub: SubcategoryConfig) {
    setSelectedSubcategory(sub.code);
    setYieldPercent(String(sub.defaultYield));
  }

  function handleSave() {
    if (!isValid) return;

    const parsedYield = parseFloat(yieldPercent);
    addAsset({
      assetClass: selectedClass,
      subcategory: selectedSubcategory,
      label: label.trim(),
      currentValue: parseFloat(value),
      annualYieldPercent: isNaN(parsedYield) ? ASSET_CLASSES[selectedClass].defaultYield : parsedYield,
      notes: notes.trim(),
    });

    resetAndClose();
  }

  function resetAndClose() {
    setSelectedClass('epargne_securisee');
    setSelectedSubcategory(null);
    setLabel('');
    setValue('');
    setYieldPercent('');
    setNotes('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={resetAndClose}>
      <Pressable style={styles.overlay} onPress={resetAndClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetInner}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {t('patrimoine.assets.addTitle')}
                </Text>
                <Pressable onPress={resetAndClose} hitSlop={12}>
                  <X size={22} color={PF.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Asset class selector — 2-column grid */}
                <Text style={styles.fieldLabel}>
                  {t('patrimoine.assets.classLabel')}
                </Text>
                <View style={styles.classGrid}>
                  {ASSET_CLASS_CODES.map((code) => {
                    const cfg = ASSET_CLASSES[code];
                    const Icon = cfg.icon;
                    const selected = selectedClass === code;
                    return (
                      <Pressable
                        key={code}
                        style={[
                          styles.classCell,
                          selected && { borderColor: cfg.color, backgroundColor: cfg.color + '15' },
                        ]}
                        onPress={() => handleClassSelect(code)}
                      >
                        <Icon
                          size={20}
                          color={selected ? cfg.color : PF.textMuted}
                        />
                        <Text
                          style={[
                            styles.classCellText,
                            selected && { color: cfg.color },
                          ]}
                          numberOfLines={1}
                        >
                          {t(cfg.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Subcategory selector */}
                {subcategories.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>
                      {t('patrimoine.assets.subcategoryLabel')}
                    </Text>
                    <View style={styles.subcategoryList}>
                      {subcategories.map((sub) => {
                        const selected = selectedSubcategory === sub.code;
                        const classColor = ASSET_CLASSES[selectedClass].color;
                        return (
                          <Pressable
                            key={sub.code}
                            style={[
                              styles.subcategoryChip,
                              selected && { borderColor: classColor, backgroundColor: classColor + '15' },
                            ]}
                            onPress={() => handleSubcategorySelect(sub)}
                          >
                            <View style={[
                              styles.subcategoryRadio,
                              selected && { borderColor: classColor, backgroundColor: classColor },
                            ]} />
                            <Text
                              style={[
                                styles.subcategoryText,
                                selected && { color: classColor },
                              ]}
                              numberOfLines={1}
                            >
                              {t(sub.labelKey)}
                            </Text>
                            <Text style={[
                              styles.subcategoryYield,
                              selected && { color: classColor },
                            ]}>
                              ~{sub.defaultYield}%
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Label */}
                <Text style={styles.fieldLabel}>
                  {t('patrimoine.assets.labelField')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={label}
                  onChangeText={setLabel}
                  placeholder={t('patrimoine.assets.labelPlaceholder')}
                  placeholderTextColor={PF.textMuted}
                />

                {/* Current value */}
                <Text style={styles.fieldLabel}>
                  {t('patrimoine.assets.valueField')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={PF.textMuted}
                />

                {/* Annual yield */}
                <Text style={styles.fieldLabel}>
                  {t('patrimoine.assets.yieldField')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={yieldPercent}
                  onChangeText={setYieldPercent}
                  keyboardType="numeric"
                  placeholder={String(ASSET_CLASSES[selectedClass].defaultYield)}
                  placeholderTextColor={PF.textMuted}
                />

                {/* Notes */}
                <Text style={styles.fieldLabel}>
                  {t('patrimoine.assets.notesField')}
                </Text>
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('patrimoine.assets.notesPlaceholder')}
                  placeholderTextColor={PF.textMuted}
                  multiline
                />

                {/* Save button */}
                <Pressable
                  style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!isValid}
                >
                  <Text style={styles.saveButtonText}>
                    {t('patrimoine.assets.save')}
                  </Text>
                </Pressable>

                <View style={{ height: 24 }} />
              </ScrollView>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1014',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden' as const,
  },
  sheetInner: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PF.textMuted,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    color: PF.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  classCellText: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  subcategoryList: {
    gap: 6,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: PF.cardBg,
  },
  subcategoryRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: PF.textMuted,
  },
  subcategoryText: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  subcategoryYield: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PF.border,
    color: PF.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: PF.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: PF.darkBg,
    fontSize: 15,
    fontWeight: '700',
  },
});
