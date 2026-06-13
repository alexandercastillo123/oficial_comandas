import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Text } from 'react-native';
import DashboardScreen from '../screens/admin/DashboardScreen';
import TrabajadoresScreen from '../screens/admin/TrabajadoresScreen';
import TrabajadorFormScreen from '../screens/admin/TrabajadorFormScreen';
import MesasScreen from '../screens/admin/MesasScreen';
import MesaFormScreen from '../screens/admin/MesaFormScreen';
import PerfilScreen from '../screens/admin/PerfilScreen';
import { COLORS } from '../constants/colors';


import TicketsCerradosScreen from '../screens/admin/TicketsCerradosScreen';
import TicketDetalleAdminScreen from '../screens/admin/TicketDetalleAdminScreen';
import ComandasCocinaAdminScreen from '../screens/admin/ComandasCocinaAdminScreen';

const Tab = createBottomTabNavigator();
const WorkerStack = createStackNavigator();
const TableStack = createStackNavigator();
const DashboardStack = createStackNavigator();

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Resumen Diario' }} />
      <DashboardStack.Screen name="TicketsCerrados" component={TicketsCerradosScreen} options={{ title: 'Tickets Emitidos' }} />
      <DashboardStack.Screen name="TicketDetalleAdmin" component={TicketDetalleAdminScreen} options={{ title: 'Detalle del Ticket' }} />
      <DashboardStack.Screen name="ComandasCocinaAdmin" component={ComandasCocinaAdminScreen} options={{ title: 'Pedidos en Cocina' }} />
    </DashboardStack.Navigator>
  );
}

function TrabajadoresNavigator() {
  return (
    <WorkerStack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <WorkerStack.Screen name="TrabajadoresList" component={TrabajadoresScreen} options={{ title: 'Personal de Sucursal' }} />
      <WorkerStack.Screen name="TrabajadorForm" component={TrabajadorFormScreen} options={{ title: 'Detalles Trabajador' }} />
    </WorkerStack.Navigator>
  );
}

function MesasNavigator() {
  return (
    <TableStack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <TableStack.Screen name="MesasList" component={MesasScreen} options={{ title: 'Gestión de Mesas' }} />
      <TableStack.Screen name="MesaForm" component={MesaFormScreen} options={{ title: 'Detalles Mesa' }} />
    </TableStack.Navigator>
  );
}

export default function AdminStack() {
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
        name="Dashboard"
        component={DashboardNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'DashboardMain';
          const isNestedScreen = ['TicketsCerrados', 'TicketDetalleAdmin', 'ComandasCocinaAdmin'].includes(routeName);
          return {
            headerShown: false,
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />,
            tabBarStyle: isNestedScreen
              ? { position: 'absolute', height: 0, overflow: 'hidden', borderTopWidth: 0 }
              : {
                  backgroundColor: '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: '#e6e1da',
                  paddingBottom: 6,
                  height: 60,
                },
          };
        }}
      />
      <Tab.Screen
        name="Trabajadores"
        component={TrabajadoresNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'TrabajadoresList';
          const isNestedScreen = routeName === 'TrabajadorForm';
          return {
            headerShown: false,
            tabBarLabel: 'Personal',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={24} color={color} />,
            tabBarStyle: isNestedScreen
              ? { position: 'absolute', height: 0, overflow: 'hidden', borderTopWidth: 0 }
              : {
                  backgroundColor: '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: '#e6e1da',
                  paddingBottom: 6,
                  height: 60,
                },
          };
        }}
      />
      <Tab.Screen
        name="MesasAdmin"
        component={MesasNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MesasList';
          const isNestedScreen = routeName === 'MesaForm';
          return {
            headerShown: false,
            tabBarLabel: 'Mesas',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="table-chair" size={24} color={color} />,
            tabBarStyle: isNestedScreen
              ? { position: 'absolute', height: 0, overflow: 'hidden', borderTopWidth: 0 }
              : {
                  backgroundColor: '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: '#e6e1da',
                  paddingBottom: 6,
                  height: 60,
                },
          };
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
