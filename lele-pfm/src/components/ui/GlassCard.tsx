import React from 'react';
import { View, Pressable, Platform, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
    intensity?: number;
    onPress?: () => void;
    className?: string;
    variant?: 'dark' | 'light' | 'neon' | 'gold-active';
}

const StyledView = styled(View);
const StyledPressable = styled(Pressable);
const StyledBlurView = styled(BlurView);
const StyledLinearGradient = styled(LinearGradient);

export function GlassCard({
    children,
    intensity = 30,
    onPress,
    className = "",
    variant = 'dark',
    style,
    ...props
}: GlassCardProps) {

    const Container = onPress ? StyledPressable : StyledView;

    // Gradient colors based on variant
    let gradientColors = ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'];
    if (variant === 'light') {
        gradientColors = ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'];
    } else if (variant === 'neon') {
        gradientColors = ['rgba(251, 189, 35, 0.15)', 'rgba(217, 161, 27, 0.05)'];
    } else if (variant === 'gold-active') {
        gradientColors = ['rgba(251, 189, 35, 0.08)', 'rgba(251, 189, 35, 0.03)'];
    }

    return (
        <Container
            onPress={onPress}
            className={`overflow-hidden rounded-3xl ${variant === 'gold-active' ? 'border' : 'border border-white/10'} ${className}`}
            style={[{
                shadowColor: variant === 'gold-active' ? 'rgba(251,189,35,0.15)' : '#000',
                shadowOffset: { width: 0, height: variant === 'gold-active' ? 0 : 10 },
                shadowOpacity: variant === 'gold-active' ? 1 : 0.3,
                shadowRadius: variant === 'gold-active' ? 20 : 20,
                elevation: 10,
                ...(variant === 'gold-active' ? { borderWidth: 1, borderColor: 'rgba(251,189,35,0.3)' } : {}),
            }, style]}
            {...props}
        >
            <StyledBlurView intensity={variant === 'gold-active' ? 16 : intensity} tint="dark" className="absolute inset-0" />
            <StyledLinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-5"
            >
                {children}
            </StyledLinearGradient>
        </Container>
    );
}
