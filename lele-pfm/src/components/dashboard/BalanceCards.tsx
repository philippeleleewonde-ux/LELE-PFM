import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../ui/GlassCard';
import { NeonText, Caption, H2 } from '../ui/Typography';

export function BalanceCards() {
    const { t } = useTranslation('app');
    return (
        <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
                <H2>{t('dashboard.accounts')}</H2>
                <Pressable className="flex-row items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                    <Text className="text-white text-xs font-semibold">{t('dashboard.addAccount')}</Text>
                    <View className="bg-gold rounded-full p-0.5">
                        <Plus size={12} color="black" />
                    </View>
                </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
                {/* Carte Principale */}
                <View className="mr-4 w-[280px] h-[180px] rounded-3xl bg-gray-200 overflow-hidden relative shadow-lg shadow-black/50">
                    <LinearGradient colors={['#1A1C23', '#0F1014']} className="absolute inset-0" />
                    <View className="p-6 justify-between h-full">
                        <View className="flex-row justify-between items-start">
                            <View className="flex-row items-center gap-2">
                                <Text className="font-bold text-white text-lg">LELE PFM</Text>
                            </View>
                            <View>
                                <Text className="text-white/50 font-bold text-lg">)))</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-center items-center my-2">
                            <View className="w-12 h-8 bg-yellow-400/80 rounded-md" />
                        </View>
                        <View className="flex-row gap-2">
                            <View className="w-12 h-2 bg-white/10 rounded-full" />
                            <View className="w-12 h-2 bg-white/10 rounded-full" />
                            <View className="w-12 h-2 bg-white/10 rounded-full" />
                            <View className="w-12 h-2 bg-white/10 rounded-full" />
                        </View>
                    </View>
                </View>

                {/* Carte Solde Neon */}
                <GlassCard variant="neon" className="mr-4 w-[280px] h-[180px] justify-between relative">
                    <View className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/20" />
                    <View className="p-1">
                        <NeonText color="cyan" className="text-3xl font-bold tracking-widest">0 FCFA</NeonText>
                        <Caption className="text-white/60">{t('dashboard.totalBalance')}</Caption>
                    </View>
                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text className="text-white/80 font-mono">**** ----</Text>
                        </View>
                        <View className="bg-gold/20 px-3 py-1 rounded-lg border border-gold/30">
                            <Text className="text-gold font-bold text-xs">--</Text>
                        </View>
                    </View>
                </GlassCard>

                <View className="w-6" />
            </ScrollView>
        </View>
    );
}
