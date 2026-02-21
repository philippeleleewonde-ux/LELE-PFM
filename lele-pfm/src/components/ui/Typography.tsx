import React from 'react';
import { Text, TextProps } from 'react-native';
import { styled } from 'nativewind';

const StyledText = styled(Text);

interface TypoProps extends TextProps {
    className?: string;
    children: React.ReactNode;
}

export const H1 = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-3xl font-bold text-white tracking-tight ${className}`} {...props} />
);

export const H2 = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-xl font-semibold text-white tracking-wide ${className}`} {...props} />
);

export const H3 = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-lg font-medium text-gray-200 ${className}`} {...props} />
);

export const Body = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-base text-gray-400 font-normal ${className}`} {...props} />
);

export const Caption = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-xs text-gray-500 font-medium uppercase tracking-wider ${className}`} {...props} />
);

export const KPI = ({ className = "", ...props }: TypoProps) => (
    <StyledText className={`text-4xl font-extrabold text-white tracking-tighter ${className}`} {...props} />
);

export const NeonText = ({ color = 'cyan', className = "", ...props }: TypoProps & { color?: 'cyan' | 'purple' | 'lime' }) => {
    const shadowColor = color === 'cyan' ? '#FBBF24' : color === 'purple' ? '#D9A11B' : '#4ADE80';
    const textColor = color === 'cyan' ? 'text-neonCyan' : color === 'purple' ? 'text-neonPurple' : 'text-neonLime';

    return (
        <StyledText
            className={`font-bold ${textColor} ${className}`}
            style={{
                textShadowColor: shadowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            }}
            {...props}
        />
    );
};
