import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../utils/formatDate';
import { COLORS } from '../constants/colors';

export default function ComandaChefCard({ comanda }) {
  const { nro_ticket, numero_mesa, nombre_cliente, observacion, fecha_creacion, items, estado_comanda } = comanda;

  const elapsedMinutes = Math.floor((new Date() - new Date(fecha_creacion)) / 60000);
  const isDelayed = elapsedMinutes >= 15;
  const isDelivered = estado_comanda === 'ENTREGADO';
  const isPreCuenta = estado_comanda === 'PRE_CUENTA';

  const cardStyle = [
    styles.card,
    isDelayed && styles.delayedCard,
    isDelivered && styles.deliveredCard,
  ];

  const tachoStyle = [
    styles.tachoCircle,
    isDelivered && { backgroundColor: COLORS.libre },
    isPreCuenta && { backgroundColor: COLORS.preCuenta },
  ];

  const tachoIconStyle = [styles.tachoIcon, isDelivered && styles.tachoIconLight];

  return (
    <View style={cardStyle}>
      <View style={styles.headerRow}>
        <View style={tachoStyle}>
          <Text style={tachoIconStyle}>
            {isPreCuenta ? '#' : (isDelivered ? '✓' : '🍳')}
          </Text>
        </View>
        <View style={styles.headerTexts}>
          <Text style={styles.estadoLabel}>
            {isPreCuenta ? 'Pre-cuenta' : (isDelivered ? 'Entregado' : 'En Cocina')}
          </Text>
          {isPreCuenta && (
            <Text style={styles.estadoSublabel}>Mesa solicitó la cuenta</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Ticket: <Text style={styles.boldText}>{nro_ticket}</Text></Text>
        <Text style={styles.metaText}>Cliente: <Text style={styles.boldText}>{nombre_cliente || 'Sin Nombre'}</Text></Text>
      </View>

      {observacion ? (
        <View style={styles.obsContainer}>
          <Text style={styles.obsText}>⚠️ Nota Gral: {observacion}</Text>
        </View>
      ) : null}

      <View style={styles.itemsList}>
        {items && items.map((item, idx) => (
          <View key={item.id_comanda_det || idx} style={styles.itemRow}>
            <View style={styles.itemQtyCol}>
              <Text style={styles.itemQty}>x{Math.floor(item.cantidad)}</Text>
            </View>
            <View style={styles.itemDetailsCol}>
              <Text style={styles.itemName}>{item.nombre_producto}</Text>
              {item.observacion_item ? (
                <Text style={styles.itemNote}>• {item.observacion_item}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e6e1da',
    padding: 16,
    margin: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  delayedCard: {
    borderColor: '#ba1a1a',
    backgroundColor: '#fffbe9',
  },
  deliveredCard: {
    borderColor: '#d4b896',
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.libre,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  tachoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
  },
  tachoIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  tachoIconLight: {
    color: '#ffffff',
  },
  headerTexts: {
    flex: 1,
  },
  estadoLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222222',
  },
  estadoSublabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.info,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
  },
  boldText: {
    fontWeight: '700',
    color: '#222222',
  },
  obsContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  obsText: {
    fontSize: 11,
    color: '#c62828',
    fontWeight: '700',
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#faf8f5',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemQtyCol: {
    width: 36,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '900',
    color: '#745c00',
  },
  itemDetailsCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  itemNote: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '600',
    marginTop: 2,
  },
});
