import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, StatusBar, TouchableOpacity, Platform, Alert
} from 'react-native';
import { useSSE } from '../../hooks/useSSE';
import ComandaChefCard from '../../components/ComandaChefCard';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';
import { AuthContext } from '../../context/AuthContext';

export default function ChefMonitorScreen() {
  const { comandas, loading, error } = useSSE();
  const { isTablet } = useResponsive();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header fijo de cocina */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>🍞</Text>
          <View style={{ flex: 1 }}>
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

      {/* Estado de conexión */}
      <View style={[styles.connectionBar, { backgroundColor: error ? '#ba1a1a' : '#2e7d32' }]}>
        <Text style={styles.connectionText}>
          {error ? '⚠️ Sin conexión con servidor' : '● Conectado y actualizando en tiempo real'}
        </Text>
      </View>

      {/* Lista de comandas */}
      {loading && comandas.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.warning} />
          <Text style={styles.loadingText}>Conectando con cocina...</Text>
        </View>
      ) : comandas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✅</Text>
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
          // Sin onRefresh intencionalmente: el chef no debe interactuar
        />
      )}

      {/* Footer informativo */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Orden de preparación: más antiguo → más reciente (FIFO)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerLogo: { fontSize: 24 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.goldLight,
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
    minWidth: 48,
  },
  queueCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 20,
  },
  queueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  connectionBar: {
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
