import { useColorScheme } from 'react-native';
import { lightColors, darkColors, Colors } from './colors';
import { typography, spacing, borderRadius } from './typography';

export type Theme = {
  colors: Colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
};

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
};

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

export { lightColors, darkColors };
export { typography, spacing, borderRadius };
