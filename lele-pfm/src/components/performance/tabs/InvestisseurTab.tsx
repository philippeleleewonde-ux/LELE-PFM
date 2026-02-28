import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { InvestorGPS } from '../investor/InvestorGPS';

export function InvestisseurTab() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <InvestorGPS />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
});
