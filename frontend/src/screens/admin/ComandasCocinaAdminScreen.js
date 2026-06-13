import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { comandasService } from '../../services/comandas.service';
import ComandaChefCard from '../../components/ComandaChefCard';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';

export default function ComandasCocinaAdminScreen() {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCocina = useCallback(async () => {
    setLoading(true);
    try {
      const data = await comandasService.getComandasCocina();
      setComandas(data);
    } catch (err) {
      console.error('Error fetching cocina:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCocina();
    const interval = setInterval(fetchCocina, 15000);
    return () => clearInterval(interval);
  }, [fetchCocina]);

  if (loading && comandas.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando pedidos en cocina...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>🍳 Pedidos en Cocina</Text>
        <Text style={styles.headerCount}>
          {comandas.length} {comandas.length === 1 ? 'pedido' : 'pedidos'}
        </Text>
      </View>

      {comandas.length === 0 ? (
        <EmptyState message="No hay pedidos en cocina en este momento." icon="✔️" />
      ) : (
        <FlatList
          data={comandas}
          keyExtractor={(item) => item.id_comanda_cab.toString()}
          renderItem={({ item }) => <ComandaChefCard comanda={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchCocina} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.bgScreen },
  loadingText: { marginTop: 12, color: COLORS.textMid, fontWeight: '600' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  headerCount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  list: { padding: 8, paddingBottom: 80 },
});
