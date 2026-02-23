import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../ui/GlassCard';
import { H3 } from '../ui/Typography';
import { useEngineStore } from '@/stores/engine-store';
import { formatGrade } from '@/services/format-helpers';

export function InvestmentCard() {
    const { t } = useTranslation('app');
    const engineOutput = useEngineStore((s) => s.engineOutput);
    const hasData = !!engineOutput;
    const score = hasData ? engineOutput.globalScore : null;
    const grade = hasData ? engineOutput.grade : null;
    const gradeInfo = grade ? formatGrade(grade) : null;

    return (
        <View className="px-6 mb-6">
            <H3 className="text-xs uppercase text-gray-400 tracking-wider mb-4">{t('dashboard.financialPerformance')}</H3>
            <GlassCard variant="dark" className="p-0 overflow-hidden">
                <LinearGradient
                    colors={['rgba(26,44,36,0.9)', 'rgba(15,20,18,1)']}
                    className="p-5 flex-row justify-between items-center"
                >
                    <View className="flex-row items-center gap-4">
                        <View className="w-12 h-12 rounded-xl bg-gold/20 justify-center items-center shadow-lg shadow-gold/30">
                            <TrendingUp size={24} color={gradeInfo?.color ?? '#FBBF24'} />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">{t('dashboard.globalScore')}</Text>
                            <Text style={{ color: gradeInfo?.color ?? '#FBBF24', fontWeight: '700' }}>
                                {score !== null ? `${score} / 100` : '-- / 100'}
                            </Text>
                        </View>
                    </View>

                    <View className="items-end">
                        <View className="mb-1">
                            <Text className="text-white/40 text-xs">{t('dashboard.gradeLabel')}</Text>
                        </View>
                        <View>
                            <Text
                                style={{ color: gradeInfo?.color ?? '#FFFFFF' }}
                                className="font-bold text-2xl text-right"
                            >
                                {grade ?? '--'}
                            </Text>
                            {!hasData && (
                                <Text className="text-white/40 text-xs text-right">{t('dashboard.completeWizardGrade')}</Text>
                            )}
                            {hasData && gradeInfo && (
                                <Text style={{ color: gradeInfo.color }} className="text-xs text-right">
                                    {gradeInfo.label}
                                </Text>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </GlassCard>
        </View>
    );
}
