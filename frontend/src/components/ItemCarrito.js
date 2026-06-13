import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

export default function ItemCarrito({ item, onIncrement, onDecrement, onUpdateObservacion }) {
  const { nombre, cantidad, precio_mesa, observacion_item } = item;
  const subtotal = cantidad * precio_mesa;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.infoCol}>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.price}>{formatCurrency(precio_mesa)} c/u</Text>
        </View>

        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement} activeOpacity={0.7}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{cantidad}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement} activeOpacity={0.7}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subtotalCol}>
          <Text style={styles.subtotalVal}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>

      <TextInput
        style={styles.observacionInput}
        placeholder="Añadir nota especial (ej. sin cebolla, bien caliente)"
        placeholderTextColor="#999999"
        value={observacion_item || ''}
        onChangeText={onUpdateObservacion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e6e1da',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 2,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  price: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf8f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e1da',
    padding: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#745c00',
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    paddingHorizontal: 8,
    textAlign: 'center',
    minWidth: 24,
  },
  subtotalCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subtotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
  },
  observacionInput: {
    borderTopWidth: 1,
    borderTopColor: '#f3efea',
    marginTop: 10,
    paddingTop: 8,
    fontSize: 12,
    color: '#555555',
  },
});
