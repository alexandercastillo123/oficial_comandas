import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

export default function TicketCard({ ticket, onPress }) {
  const { nro_ticket, estado_comanda, total, fecha_creacion, nombre_cliente } = ticket;

  const statusCfg = {
    EN_COCINA: { color: COLORS.warning, label: 'En Cocina', dotText: '🍳' },
    ENTREGADO: { color: COLORS.libre, label: 'Entregado', dotText: '✓' },
    PRE_CUENTA: { color: COLORS.preCuenta, label: 'Pre-cuenta', dotText: '#' },
    CERRADO:   { color: '#9e9e9e', label: 'Pagado', dotText: '✓' },
    DEFAULT:   { color: '#cccccc', label: estado_comanda, dotText: '•' },
  }[estado_comanda] || { color: '#cccccc', label: estado_comanda, dotText: '•' };

  const dotBgStyle = { backgroundColor: statusCfg.color };
  const isDelivered = estado_comanda === 'ENTREGADO';
  const isPreCuenta = estado_comanda === 'PRE_CUENTA';

  return (
    <TouchableOpacity
      style={[styles.card, (isDelivered || isPreCuenta) && { borderLeftWidth: 4, borderLeftColor: statusCfg.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, dotBgStyle]}>
            <Text style={styles.dotText}>{statusCfg.dotText}</Text>
          </View>
          <View>
            <Text style={styles.ticketNum}>{nro_ticket}</Text>
            <Text style={styles.statusLabel}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Cliente: <Text style={styles.value}>{nombre_cliente || 'N/A'}</Text></Text>
        <Text style={styles.label}>Creado: <Text style={styles.value}>{formatDate(fecha_creacion)}</Text></Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Monto Estimado</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e6e1da',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
  },
  dotText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  ticketNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222222',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#666666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  body: {
    marginBottom: 12,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: '#666666',
  },
  value: {
    color: '#222222',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3efea',
  },
  totalLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#745c00',
  },
});
