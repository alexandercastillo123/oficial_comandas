import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { mesasService } from '../../services/mesas.service';
import { AuthContext } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';

const ESTADO_STYLES = {
  LIBRE: { borderColor: COLORS.success, badgeBg: '#e8f5e9', badgeText: COLORS.success, label: 'Disponible' },
  OCUPADA: { borderColor: COLORS.warning, badgeBg: COLORS.secondaryFixed, badgeText: COLORS.onSecondaryFixed, label: 'Ocupada' },
  PRE_CUENTA: { borderColor: COLORS.info, badgeBg: '#e1f5fe', badgeText: COLORS.info, label: 'Pre-cuenta' },
  INACTIVA: { borderColor: '#9e9e9e', badgeBg: '#f5f5f5', badgeText: '#9e9e9e', label: 'Desactivada' },
};

export default function MesasScreen({ navigation }) {
  const { id_tienda } = useContext(AuthContext);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMesas = useCallback(async () => {
    if (!id_tienda) return;
    setLoading(true);
    try {
      const data = await mesasService.getMesas(id_tienda);
      setMesas(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar las mesas.');
    } finally {
      setLoading(false);
    }
  }, [id_tienda]);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchMesas);
    return unsubscribe;
  }, [navigation, fetchMesas]);

  const renderItem = ({ item }) => {
    const inactiva = item.estado === 0 || item.estado === false;
    const est = inactiva ? ESTADO_STYLES.INACTIVA : (ESTADO_STYLES[item.estado_mesa] || ESTADO_STYLES.LIBRE);
    return (
      <TouchableOpacity
        style={[styles.mesaCard, { borderLeftColor: est.borderColor }]}
        onPress={() => navigation.navigate('MesaForm', { mesa: item, isEdit: true })}
        activeOpacity={0.8}
      >
        <View style={styles.mesaHeader}>
          <Text style={styles.mesaNumero}>{item.numero}</Text>
          <View style={[styles.statusDot, { backgroundColor: est.borderColor }]} />
        </View>
        <Text style={styles.mesaCapacidad}>
          <MaterialCommunityIcons name="account-group" size={14} color={COLORS.textMid} /> {item.capacidad} pax
        </Text>
        <View style={[styles.estadoBadge, { backgroundColor: est.badgeBg }]}>
          <Text style={[styles.estadoBadgeText, { color: est.badgeText }]}>
            {est.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && mesas.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : mesas.length === 0 ? (
        <EmptyState message="No hay mesas registradas." icon="table_restaurant" />
      ) : (
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id_mesa.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMesas} tintColor={COLORS.primary} />}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MesaForm', { isEdit: false })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.onSecondaryFixed} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 90 },
  mesaCard: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    elevation: 2,
    minHeight: 110,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  mesaNumero: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3
  },
  mesaCapacidad: {
    fontSize: 12,
    color: COLORS.textMid,
    marginBottom: 10,
    fontWeight: '500',
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estadoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
