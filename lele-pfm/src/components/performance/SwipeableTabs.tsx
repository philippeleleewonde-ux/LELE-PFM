import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { PF } from './shared';

export interface TabConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}

interface SwipeableTabsProps {
  tabs: TabConfig[];
  children: React.ReactNode[];
  initialTab?: number;
}

export function SwipeableTabs({ tabs, children, initialTab = 0 }: SwipeableTabsProps) {
  const [activeIndex, setActiveIndex] = useState(initialTab);
  const [pageWidth, setPageWidth] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const pillScrollRef = useRef<ScrollView>(null);
  const pillLayouts = useRef<Record<number, { x: number; width: number }>>({});
  const pageWidthRef = useRef(0);

  // Measure actual container width (not window width)
  const onRootLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0 && w !== pageWidthRef.current) {
        pageWidthRef.current = w;
        setPageWidth(w);
        // Scroll to initial tab once we know the width
        if (initialTab > 0) {
          setTimeout(() => {
            pagerRef.current?.scrollTo({ x: initialTab * w, animated: false });
          }, 50);
        }
      }
    },
    [initialTab],
  );

  // Scroll pill into view when tab changes
  const scrollPillIntoView = useCallback((index: number) => {
    const layout = pillLayouts.current[index];
    if (layout && pillScrollRef.current) {
      pillScrollRef.current.scrollTo({
        x: Math.max(0, layout.x - 16),
        animated: true,
      });
    }
  }, []);

  // Handle pager scroll end → detect which page we landed on
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = pageWidthRef.current;
      if (w <= 0) return;
      const offsetX = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / w);
      if (newIndex >= 0 && newIndex < tabs.length) {
        setActiveIndex(newIndex);
        scrollPillIntoView(newIndex);
      }
    },
    [tabs.length, scrollPillIntoView],
  );

  // Also track scroll position for web (onScroll fires, momentum may not)
  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const w = pageWidthRef.current;
      if (w <= 0) return;
      const offsetX = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / w);
      if (newIndex >= 0 && newIndex < tabs.length) {
        setActiveIndex(newIndex);
        scrollPillIntoView(newIndex);
      }
    },
    [tabs.length, scrollPillIntoView],
  );

  // Tap on pill → scroll pager to that page
  const goToTab = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const w = pageWidthRef.current;
      setActiveIndex(index);
      scrollPillIntoView(index);
      if (w > 0) {
        pagerRef.current?.scrollTo({ x: index * w, animated: true });
      }
    },
    [activeIndex, scrollPillIntoView],
  );

  const onPillLayout = (index: number) => (e: LayoutChangeEvent) => {
    pillLayouts.current[index] = {
      x: e.nativeEvent.layout.x,
      width: e.nativeEvent.layout.width,
    };
  };

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      {/* ─── Pill Tab Bar ─── */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          ref={pillScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                onPress={() => goToTab(index)}
                onLayout={onPillLayout(index)}
                style={[styles.pill, isActive && styles.pillActive]}
              >
                <Icon size={16} color={isActive ? '#000' : tab.iconColor} />
                <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {tabs.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* ─── Swipeable Pages (horizontal pager) ─── */}
      {pageWidth > 0 && (
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollEndDrag={onScrollEnd}
          onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
          style={styles.pager}
        >
          {children.map((child, index) => (
            <View
              key={tabs[index]?.key ?? index}
              style={{ width: pageWidth, height: pagerHeight || '100%' }}
            >
              {child}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: PF.darkBg,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
    paddingTop: 8,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PF.textMuted,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PF.accent,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PF.cardBg,
  },
  pillActive: {
    backgroundColor: PF.accent,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PF.textSecondary,
  },
  pillLabelActive: {
    color: '#000',
    fontWeight: '700',
  },
  pager: {
    flex: 1,
  },
});
