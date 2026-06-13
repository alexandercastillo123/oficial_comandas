import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSSE } from '../../hooks/useSSE';
import ComandaChefCard from '../../components/ComandaChefCard';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';

export default function PedidosCocinaScreen() {
  const { comandas, loading, error, refetch } = useSSE();
  const { isTablet } = useResponsive();

  if (loading && comandas.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Conectando con cocina...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Cola de Cocina</Text>
        <Text style={styles.headerCount}>
          {comandas.length} {comandas.length === 1 ? 'pedido' : 'pedidos'} pendiente{comandas.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {comandas.length === 0 ? (
        <EmptyState message="No hay pedidos en cocina en este momento." icon="✓" />
      ) : (
        <FlatList
          key={isTablet ? 2 : 1}
          data={comandas}
          keyExtractor={(item) => item.id_comanda_cab.toString()}
          renderItem={({ item }) => <ComandaChefCard comanda={item} />}
          numColumns={isTablet ? 2 : 1}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#888888', fontWeight: '600' },
  errorText: { color: '#ba1a1a', fontWeight: '700', fontSize: 14 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e1da',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#222222' },
  headerCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#745c00',
    backgroundColor: '#ffdf9d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  list: { padding: 8 },
});
