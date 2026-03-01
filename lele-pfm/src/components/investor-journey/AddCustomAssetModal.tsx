import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, Switch, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { ASSET_TO_PILLAR } from '@/constants/pillar-mapping';
import { AssetClass } from '@/types/investment';
import { SelectedAsset } from '@/types/investor-journey';

const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: 'savings_account', label: 'Compte epargne' },
  { value: 'term_deposit', label: 'Depot a terme' },
  { value: 'government_bonds', label: 'Obligations souveraines' },
  { value: 'corporate_bonds', label: 'Obligations entreprise' },
  { value: 'stock_index', label: 'Indice boursier' },
  { value: 'local_stocks', label: 'Actions locales' },
  { value: 'real_estate_fund', label: 'Fonds immobilier' },
  { value: 'gold', label: 'Or' },
  { value: 'crypto', label: 'Crypto-actifs' },
  { value: 'tontine', label: 'Tontine' },
  { value: 'micro_enterprise', label: 'Micro-entreprise' },
  { value: 'money_market', label: 'Marche monetaire' },
  { value: 'sukuk', label: 'Sukuk' },
  { value: 'mutual_fund', label: 'Fonds mutuel' },
  { value: 'municipal_bonds', label: 'Obligations municipales' },
  { value: 'private_equity', label: 'Private Equity' },
  { value: 'agrobusiness', label: 'Agrobusiness' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'commodities', label: 'Matieres premieres' },
  { value: 'esg_bonds', label: 'Obligations ESG' },
];

const RISK_LEVELS = [1, 2, 3, 4, 5] as const;

const LIQUIDITY_OPTIONS: { value: SelectedAsset['liquidity']; label: string }[] = [
  { value: 'immediate', label: 'Immediat' },
  { value: 'days', label: 'Jours' },
  { value: 'weeks', label: 'Semaines' },
  { value: 'months', label: 'Mois' },
  { value: 'locked', label: 'Bloque' },
];

interface AddCustomAssetModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddCustomAssetModal({ visible, onClose }: AddCustomAssetModalProps) {
  const { addCustomAsset } = useInvestorJourney();

  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('savings_account');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [volatility, setVolatility] = useState('');
  const [riskLevel, setRiskLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [liquidity, setLiquidity] = useState<SelectedAsset['liquidity']>('days');
  const [shariaCompliant, setShariaCompliant] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setAssetClass('savings_account');
    setExpectedReturn('');
    setVolatility('');
    setRiskLevel(2);
    setLiquidity('days');
    setShariaCompliant(false);
    setShowAssetPicker(false);
  }, []);

  const isValid = name.trim().length > 0 && expectedReturn.trim().length > 0;

  const handleAdd = useCallback(() => {
    if (!isValid) return;

    const pillar = ASSET_TO_PILLAR[assetClass] ?? 'base_arriere';

    const asset: SelectedAsset = {
      id: `custom_${Date.now()}`,
      assetClass,
      name: name.trim(),
      status: 'custom',
      expectedReturnRate: parseFloat(expectedReturn) || 0,
      volatility: parseFloat(volatility) || 0,
      riskLevel,
      allocationPercent: 10,
      pillar,
      isCustom: true,
      shariaCompliant,
      liquidity,
    };

    addCustomAsset(asset);
    resetForm();
    onClose();
  }, [name, assetClass, expectedReturn, volatility, riskLevel, liquidity, shariaCompliant, isValid, addCustomAsset, onClose, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const selectedClassLabel = ASSET_CLASS_OPTIONS.find((o) => o.value === assetClass)?.label ?? assetClass;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ajouter un actif</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={PF.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom de l'actif</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Livret epargne BNP"
                placeholderTextColor={PF.textMuted}
              />
            </View>

            {/* Asset Class picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Classe d'actif</Text>
              <Pressable
                style={styles.pickerBtn}
                onPress={() => setShowAssetPicker(!showAssetPicker)}
              >
                <Text style={styles.pickerBtnText}>{selectedClassLabel}</Text>
              </Pressable>
              {showAssetPicker && (
                <View style={styles.pickerList}>
                  {ASSET_CLASS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pickerOption,
                        assetClass === opt.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setAssetClass(opt.value);
                        setShowAssetPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          assetClass === opt.value && { color: PF.accent },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Expected Return */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Rendement attendu (%)</Text>
              <TextInput
                style={styles.input}
                value={expectedReturn}
                onChangeText={setExpectedReturn}
                placeholder="Ex: 7.5"
                placeholderTextColor={PF.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Volatility */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Volatilite (%)</Text>
              <TextInput
                style={styles.input}
                value={volatility}
                onChangeText={setVolatility}
                placeholder="Ex: 12"
                placeholderTextColor={PF.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Risk Level */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Niveau de risque</Text>
              <View style={styles.riskRow}>
                {RISK_LEVELS.map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.riskBtn,
                      riskLevel === level && {
                        backgroundColor: getRiskColor(level) + '25',
                        borderColor: getRiskColor(level),
                      },
                    ]}
                    onPress={() => setRiskLevel(level)}
                  >
                    <Text
                      style={[
                        styles.riskBtnText,
                        riskLevel === level && { color: getRiskColor(level) },
                      ]}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Liquidity */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Liquidite</Text>
              <View style={styles.liquidityRow}>
                {LIQUIDITY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.liquidityBtn,
                      liquidity === opt.value && {
                        backgroundColor: PF.accent + '20',
                        borderColor: PF.accent,
                      },
                    ]}
                    onPress={() => setLiquidity(opt.value)}
                  >
                    <Text
                      style={[
                        styles.liquidityBtnText,
                        liquidity === opt.value && { color: PF.accent },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sharia compliant toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Conforme Sharia</Text>
              <Switch
                value={shariaCompliant}
                onValueChange={setShariaCompliant}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: PF.green + '60' }}
                thumbColor={shariaCompliant ? PF.green : PF.textMuted}
              />
            </View>
          </ScrollView>

          {/* Submit button */}
          <Pressable
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleAdd}
            disabled={!isValid}
          >
            <Plus size={18} color={isValid ? '#0F1014' : PF.textMuted} />
            <Text style={[styles.submitBtnText, !isValid && { color: PF.textMuted }]}>
              Ajouter
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getRiskColor(level: number): string {
  if (level <= 2) return PF.green;
  if (level === 3) return PF.accent;
  return PF.red;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1C23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  headerTitle: {
    color: PF.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    maxHeight: 480,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    paddingBottom: 8,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: PF.textPrimary,
    fontSize: 14,
  },
  pickerBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerBtnText: {
    color: PF.textPrimary,
    fontSize: 14,
  },
  pickerList: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 10,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  pickerOptionActive: {
    backgroundColor: PF.accent + '15',
  },
  pickerOptionText: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  riskBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  riskBtnText: {
    color: PF.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  liquidityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  liquidityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PF.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  liquidityBtnText: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: PF.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  submitBtnText: {
    color: '#0F1014',
    fontSize: 15,
    fontWeight: '700',
  },
});
