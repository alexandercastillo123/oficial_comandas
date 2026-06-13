import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

export default function TicketCard({ ticket, onPress }) {
  const { nro_ticket, estado_comanda, total, fecha_creacion, nombre_cliente } = ticket;

  let badgeColor = COLORS.warning;
  let statusText = 'En Cocina';

  if (estado_comanda === 'ENTREGADO') {
    badgeColor = COLORS.libre;
    statusText = 'Entregado';
  } else if (estado_comanda === 'PRE_CUENTA') {
    badgeColor = COLORS.preCuenta;
    statusText = 'Pre-cuenta';
  } else if (estado_comanda === 'CERRADO') {
    badgeColor = '#9e9e9e';
    statusText = 'Pagado';
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.ticketNum}>{nro_ticket}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{statusText}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3efea',
    paddingBottom: 8,
    marginBottom: 10,
  },
  ticketNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222222',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#666666',
    marginVertical: 1,
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
