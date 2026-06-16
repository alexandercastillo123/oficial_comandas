import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, StatusBar
} from 'react-native';
import { useSSE } from '../../hooks/useSSE';
import ComandaChefCard from '../../components/ComandaChefCard';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChefMonitorScreen() {
  const { comandas, loading, error } = useSSE();
  const { isTablet } = useResponsive();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>🍞</Text>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>MONITOR DE COCINA</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>La Ideal S.A.C. · En Tiempo Real</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.queueBadge,
            { backgroundColor: comandas.length > 0 ? COLORS.error : COLORS.success }
          ]}>
            <Text style={styles.queueCount}>{comandas.length}</Text>
            <Text style={styles.queueLabel}>EN COLA</Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.connectionBarError}>
          <Text style={styles.connectionText}>⚠️ Sin conexión con servidor</Text>
        </View>
      )}

      {loading && comandas.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.warning} />
          <Text style={styles.loadingText}>Conectando con cocina...</Text>
        </View>
      ) : comandas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>Cocina al día</Text>
          <Text style={styles.emptySubtitle}>No hay pedidos pendientes en este momento.</Text>
        </View>
      ) : (
        <FlatList
          key={isTablet ? 2 : 1}
          data={comandas}
          keyExtractor={(item) => item.id_comanda_cab.toString()}
          renderItem={({ item }) => <ComandaChefCard comanda={item} />}
          numColumns={isTablet ? 2 : 1}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Orden de preparación: más antiguo → más reciente (FIFO)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgScreen,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e1da',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: { fontSize: 22 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222222',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#745c00',
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 18,
  },
  queueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  connectionBarError: {
    backgroundColor: '#ba1a1a',
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: COLORS.textMid,
    fontWeight: '700',
    marginTop: 16,
    fontSize: 14,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '600',
  },
  list: { padding: 8 },
  footer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.cream,
    fontSize: 11,
    fontWeight: '600',
  },
});
