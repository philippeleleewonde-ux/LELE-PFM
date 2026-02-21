import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Wallet, PieChart, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0F1014',
        borderTopColor: 'rgba(255,255,255,0.1)',
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: '#FBBF24',
      tabBarInactiveTintColor: '#52525B',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Portefeuille',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: 'Performance',
          tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
