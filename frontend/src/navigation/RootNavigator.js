import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { ROLES } from '../constants/roles';

// Stacks
import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import MozoStack from './MozoStack';
import ChefStack from './ChefStack';

export default function RootNavigator() {
  const { token, user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!token || !user) {
    return <AuthStack />;
  }

  // Redirigir según el rol
  switch (user.rol_app) {
    case ROLES.ADMIN:
      return <AdminStack />;
    case ROLES.MOZO:
      return <MozoStack />;
    case ROLES.CHEF:
      return <ChefStack />;
    default:
      // Fallback a Login si el rol no es compatible con el módulo comandas
      return <AuthStack />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgScreen,
  }
});
