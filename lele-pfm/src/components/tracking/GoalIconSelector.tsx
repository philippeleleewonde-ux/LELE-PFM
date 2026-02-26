import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_CATEGORIES, GOAL_ICON_CODES, GoalIcon } from '@/constants/goal-categories';

interface GoalIconSelectorProps {
  selected: GoalIcon | null;
  onSelect: (icon: GoalIcon) => void;
}

export function GoalIconSelector({ selected, onSelect }: GoalIconSelectorProps) {
  const { t } = useTranslation('tracking');
  return (
    <View style={styles.grid}>
      {GOAL_ICON_CODES.map((code) => {
        const cat = GOAL_CATEGORIES[code];
        const isSelected = selected === code;
        const Icon = cat.icon;
        return (
          <Pressable
            key={code}
            onPress={() => onSelect(code)}
            style={[
              styles.button,
              { backgroundColor: isSelected ? `${cat.color}20` : 'rgba(255,255,255,0.05)' },
              isSelected && { borderColor: '#22D3EE', borderWidth: 2 },
            ]}
          >
            <Icon size={22} color={isSelected ? '#22D3EE' : cat.color} />
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#22D3EE' : '#A1A1AA' },
              ]}
              numberOfLines={1}
            >
              {t(cat.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    width: 72,
    height: 68,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
