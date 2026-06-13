import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../utils/formatDate';

export default function ComandaChefCard({ comanda }) {
  const { nro_ticket, numero_mesa, nombre_cliente, observacion, fecha_creacion, items } = comanda;

  // Calcular tiempo transcurrido en minutos
  const elapsedMinutes = Math.floor((new Date() - new Date(fecha_creacion)) / 60000);
  const isDelayed = elapsedMinutes >= 15;

  return (
    <View style={[styles.card, isDelayed && styles.delayedCard]}>
      <View style={styles.header}>
        <Text style={styles.tableNum}>{numero_mesa}</Text>
        <Text style={styles.timeText}>{formatTime(fecha_creacion)} ({elapsedMinutes}m)</Text>
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
    borderColor: '#ba1a1a', // Rojo de retraso en cocina
    backgroundColor: '#fffbe9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f3efea',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#745c00',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  },
  itemQtyCol: {
    width: 36,
  },
  itemQty: {
    fontSize: 16,
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
