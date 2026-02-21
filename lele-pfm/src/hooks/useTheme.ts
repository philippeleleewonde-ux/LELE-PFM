import { useColorScheme } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius, shadows } from '@/theme';

export const useThemeHook = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    borderRadius,
    shadows,
    isDark,
    scheme,
  };
};

export default useThemeHook;
