import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChefMonitorScreen from '../screens/chef/ChefMonitorScreen';
import PerfilScreen from '../screens/admin/PerfilScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function ChefStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e6e1da',
          paddingBottom: 6,
          height: 60,
        },
        headerTintColor: COLORS.primary,
      }}
    >
      <Tab.Screen
        name="ChefMonitor"
        component={ChefMonitorScreen}
        options={{
          headerShown: false,
          title: 'Cocina',
          tabBarLabel: 'Monitor',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chef-hat" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Mi Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
