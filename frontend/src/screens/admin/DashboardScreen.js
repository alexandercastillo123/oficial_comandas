import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDashboard } from '../../hooks/useDashboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatCard from '../../components/StatCard';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';

import { useNavigation } from '@react-navigation/native';



export default function DashboardScreen() {
  const { stats, loading, error, refetch } = useDashboard();
  const navigation = useNavigation();

  // Find max sales hour for progress/bar percentages
  const maxVentaHora = stats.ventas_por_hora && stats.ventas_por_hora.length > 0
    ? Math.max(...stats.ventas_por_hora.map(h => parseFloat(h.monto || 0)))
    : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />
      }
    >
      {/* Encabezado del día */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateLabel}>Resumen de Hoy</Text>
        <Text style={styles.dateValue}>
          {new Date().toLocaleDateString('es-PE', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
          })}
        </Text>
      </View>

      {/* Fila 1: Ventas y Tickets */}
      <View style={styles.row}>
        <StatCard
          title="Ventas del Día"
          value={formatCurrency(stats.total_ventas)}
          icon={<MaterialCommunityIcons name="cash" size={24} color={COLORS.success} />}
          color={COLORS.success}
          onPress={() => navigation.navigate('TicketsCerrados')}
        />
        <StatCard
          title="Tickets Emitidos"
          value={stats.total_tickets.toString()}
          icon={<MaterialCommunityIcons name="receipt" size={24} color={COLORS.info} />}
          color={COLORS.info}
          onPress={() => navigation.navigate('TicketsCerrados')}
        />
      </View>

      {/* Fila 2: Mesas y Cocina */}
      <View style={styles.row}>
        <StatCard
          title="Mesas Ocupadas"
          value={stats.mesas_ocupadas.toString()}
          icon={<MaterialCommunityIcons name="seat" size={24} color={COLORS.warning} />}
          color={COLORS.warning}
          onPress={() => navigation.navigate('MesasAdmin')}
        />
        <StatCard
          title="En Cocina Ahora"
          value={stats.comandas_en_cocina.toString()}
          icon={<MaterialCommunityIcons name="chef-hat" size={24} color={stats.comandas_en_cocina > 5 ? COLORS.error : COLORS.primary} />}
          color={stats.comandas_en_cocina > 5 ? COLORS.error : COLORS.primary}
          onPress={() => navigation.navigate('ComandasCocinaAdmin')}
        />
      </View>

      {/* Producto más vendido */}
      <View style={styles.topProductCard}>
        <Text style={styles.topProductLabel}>⭐ Producto Más Vendido Hoy</Text>
        <Text style={styles.topProductName}>{stats.producto_mas_vendido}</Text>
      </View>

      {/* Top 5 productos */}
      {stats.productos_top_5 && stats.productos_top_5.length > 0 && (
        <View style={styles.top5Card}>
          <Text style={styles.top5Title}>🏆 Top 5 Productos Más Vendidos Hoy</Text>
          {stats.productos_top_5.map((item, index) => {
            const maxCantidad = stats.productos_top_5[0]?.total_cantidad || 1;
            const percentage = (item.total_cantidad / maxCantidad) * 100;
            return (
              <View key={item.nombre + index} style={styles.top5Row}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.top5Info}>
                  <View style={styles.top5HeaderRow}>
                    <Text style={styles.top5Name} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.top5Qty}>{parseFloat(item.total_cantidad)} unds</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Banner de estado del día */}
      <View style={[
        styles.statusBanner,
        stats.total_ventas > 0 ? styles.statusGood : styles.statusNeutral
      ]}>
        <Text style={styles.statusBannerText}>
          {stats.total_ventas > 0
            ? `✅ Sucursal activa · ${stats.total_tickets} pedido${stats.total_tickets !== 1 ? 's' : ''} procesado${stats.total_tickets !== 1 ? 's' : ''}`
            : '⏸️ Sin ventas registradas aún hoy'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 16, paddingBottom: 32 },
  dateHeader: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  topProductCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  topProductLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  topProductName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  top5Card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  top5Title: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  top5Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  top5Info: {
    flex: 1,
  },
  top5HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  top5Name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    marginRight: 8,
  },
  top5Qty: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  statusGood: { backgroundColor: '#e8f5e9' },
  statusNeutral: { backgroundColor: COLORS.surfaceContainerHigh },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },

});
