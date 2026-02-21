import { useWindowDimensions } from 'react-native';

/**
 * Responsive breakpoints utility hook for LELE PFM.
 * Provides screen-size-aware values for padding, fonts, gaps.
 *
 * Breakpoints:
 * - small:  < 360px (iPhone SE, old Androids)
 * - medium: 360–599px (standard phones)
 * - large:  >= 600px (tablets, web)
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 600;
  const isLarge = width >= 600;

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,

    // Horizontal padding for cards/sections
    hp: isSmall ? 12 : isMedium ? 16 : 20,

    // Gaps between elements
    gap: isSmall ? 6 : isMedium ? 8 : 10,

    // Font sizes
    fs: {
      hero: isSmall ? 22 : isMedium ? 26 : 28,
      title: isSmall ? 16 : isMedium ? 18 : 20,
      subtitle: isSmall ? 13 : 14,
      body: isSmall ? 12 : isMedium ? 13 : 14,
      label: isSmall ? 10 : 11,
      small: isSmall ? 9 : 10,
    },

    // Modal max height ratio
    sheetMaxH: isSmall ? 0.95 : 0.9,

    // Card margin horizontal
    mx: isSmall ? 10 : 16,
  };
}
