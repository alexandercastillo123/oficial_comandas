import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Platform
} from 'react-native';
import { usuariosService } from '../../services/usuarios.service';
import EmptyState from '../../components/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const ROLE_LABELS = { ADMIN: 'Admin', MOZO: 'Mozo', CHEF: 'Chef', null: 'Sin Rol' };
const ROLE_COLORS = { ADMIN: '#1565c0', MOZO: '#2e7d32', CHEF: '#ba1a1a' };

export default function TrabajadoresScreen({ navigation }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRol, setFilterRol] = useState(null);

  const fetchTrabajadores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getTrabajadores(filterRol);
      setTrabajadores(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la lista de trabajadores.');
    } finally {
      setLoading(false);
    }
  }, [filterRol]);

  useEffect(() => {
    fetchTrabajadores();
  }, [fetchTrabajadores]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchTrabajadores);
    return unsubscribe;
  }, [navigation, fetchTrabajadores]);

  const renderItem = ({ item }) => {
    const rolColor = ROLE_COLORS[item.rol_app] || '#888888';
    return (
      <TouchableOpacity
        style={styles.workerCard}
        onPress={() => navigation.navigate('TrabajadorForm', { trabajador: item, isEdit: true })}
        activeOpacity={0.8}
      >
        <View style={styles.workerHeader}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{item.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.workerTextInfo}>
            <Text style={styles.workerName} numberOfLines={1}>{item.nombre}</Text>
            <Text style={styles.workerUsername}>@{item.usuario}</Text>
            {item.telefono ? <Text style={styles.workerPhone}>📞 {item.telefono}</Text> : null}
          </View>
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primary} />
        </View>
        <View style={[styles.rolBadge, { backgroundColor: rolColor }]}>
          <Text style={styles.rolBadgeText}>{item.rol_app || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {[null, 'ADMIN', 'MOZO', 'CHEF'].map(rol => (
          <TouchableOpacity
            key={rol ?? 'TODOS'}
            style={[styles.filterChip, filterRol === rol && styles.filterChipActive]}
            onPress={() => setFilterRol(rol)}
          >
            <Text style={[styles.filterChipText, filterRol === rol && styles.filterChipTextActive]}>
              {rol ?? 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : trabajadores.length === 0 ? (
        <EmptyState message="No hay trabajadores registrados con este filtro." icon="👥" />
      ) : (
        <FlatList
          data={trabajadores}
          keyExtractor={(item) => item.id_usuario.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchTrabajadores} tintColor={COLORS.primary} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TrabajadorForm', { isEdit: false })}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMid },
  filterChipTextActive: { color: COLORS.primary },
  list: { padding: 16, paddingBottom: 90 },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  workerTextInfo: { flex: 1 },
  workerName: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  workerUsername: { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  workerPhone: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  rolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rolBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
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
