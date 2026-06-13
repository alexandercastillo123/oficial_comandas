import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MesasMapaScreen from '../screens/mozo/MesasMapaScreen';
import DetalleMesaScreen from '../screens/mozo/detalle_mesa/DetalleMesaScreen';
import TicketDetalleScreen from '../screens/mozo/TicketDetalleScreen';
import PedidosCocinaScreen from '../screens/mozo/PedidosCocinaScreen';
import PerfilScreen from '../screens/mozo/PerfilScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();
const MozoFlowStack = createStackNavigator();

function MesasFlowNavigator() {
  return (
    <MozoFlowStack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <MozoFlowStack.Screen 
        name="MesasMapa" 
        component={MesasMapaScreen} 
        options={{ title: 'Mesas Deleite S.A.C.' }} 
      />
      <MozoFlowStack.Screen 
        name="DetalleMesa" 
        component={DetalleMesaScreen} 
        options={({ route }) => ({ title: `Mesa: ${route.params?.numero || ''}` })} 
      />
      <MozoFlowStack.Screen 
        name="TicketDetalle" 
        component={TicketDetalleScreen} 
        options={{ title: 'Detalle de Ticket' }} 
      />
    </MozoFlowStack.Navigator>
  );
}

export default function MozoStack() {
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
        name="MesasTab"
        component={MesasFlowNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MesasMapa';
          const isNestedScreen = routeName === 'DetalleMesa' || routeName === 'TicketDetalle';

          return {
            headerShown: false,
            tabBarLabel: 'Mapa Mesas',
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
        name="CocinaTab"
        component={PedidosCocinaScreen}
        options={{
          title: 'Cola de Cocina',
          tabBarLabel: 'Cocina',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chef-hat" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="PerfilTab"
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
