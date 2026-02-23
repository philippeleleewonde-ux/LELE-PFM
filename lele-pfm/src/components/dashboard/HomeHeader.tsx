import React from 'react';
import { View, Text, Image } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface HomeHeaderProps {
    userName?: string;
    userImage?: string;
    onNotificationPress?: () => void;
    onProfilePress?: () => void;
}

export function HomeHeader({
    userName,
    userImage = 'https://i.pravatar.cc/150?u=main',
    onNotificationPress,
    onProfilePress
}: HomeHeaderProps) {
    const { t } = useTranslation('app');
    const displayName = userName || t('dashboard.user');
    return (
        <View className="flex-row justify-between items-center px-6 pt-16 pb-6">
            <View>
                <Text className="text-white/60 text-sm">{t('dashboard.greeting')}</Text>
                <Text className="text-white text-xl font-bold">{displayName}</Text>
            </View>
            <View className="flex-row items-center gap-4">
                <View className="relative">
                    <Bell size={24} color="white" onPress={onNotificationPress} />
                    <View className="absolute top-0 right-0 w-2 h-2 bg-gold rounded-full border border-darkBg" />
                </View>
                <View className="w-10 h-10 rounded-full bg-gray-700 border border-white/20 overflow-hidden">
                    <Image
                        source={{ uri: userImage }}
                        className="w-full h-full"
                    />
                </View>
            </View>
        </View>
    );
}
