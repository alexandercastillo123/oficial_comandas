import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { comandasService } from '../../services/comandas.service';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function TicketsCerradosScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await comandasService.getComandasTienda('CERRADO');
      setTickets(data);
    } catch (err) {
      console.error('Error fetching closed tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TicketDetalleAdmin', { id: item.id_comanda_cab })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.ticketNum}>{item.nro_ticket}</Text>
          <Text style={styles.dateText}>📅 {formatDate(item.fecha_creacion)}</Text>
        </View>
        <View style={styles.mesaBadge}>
          <Text style={styles.mesaText}>{item.numero_mesa}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.infoCol}>
          <Text style={styles.label}>Mozo</Text>
          <Text style={styles.value} numberOfLines={1}>{item.mozo}</Text>
        </View>
        {item.nombre_cliente ? (
          <View style={styles.infoCol}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value} numberOfLines={1}>{item.nombre_cliente}</Text>
          </View>
        ) : null}
        <View style={styles.amountCol}>
          <Text style={styles.label}>Total Pagado</Text>
          <Text style={styles.amountText}>{formatCurrency(item.total)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && tickets.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : tickets.length === 0 ? (
        <EmptyState message="No hay tickets cerrados hoy." icon="receipt" />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id_comanda_cab.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchTickets} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 2,
    shadowColor: COLORS.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  mesaBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mesaText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.success,
  },
});
