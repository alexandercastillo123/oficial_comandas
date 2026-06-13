import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductoCard({ producto, quantity = 0, onAdd, onDecrement, onShowDetails }) {
  const { nombre, precio_mesa, imagen_url } = producto;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onShowDetails} style={styles.imageContainer} activeOpacity={0.9}>
        {imagen_url ? (
          <Image source={{ uri: imagen_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🍞</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.details}>
        <TouchableOpacity onPress={onShowDetails} activeOpacity={0.7}>
          <Text style={styles.title} numberOfLines={2}>{nombre}</Text>
          <Text style={styles.price}>{formatCurrency(precio_mesa)}</Text>
        </TouchableOpacity>
        
        {quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement} activeOpacity={0.7}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onAdd} activeOpacity={0.7}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>+ AGREGAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#e6e1da',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 110,
    width: '100%',
    backgroundColor: '#faf8f5',
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3efea',
  },
  placeholderText: {
    fontSize: 32,
  },
  details: {
    padding: 12,
    justifyContent: 'space-between',
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
    height: 36,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#745c00',
    marginVertical: 4,
  },
  addButton: {
    backgroundColor: '#745c00',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    marginTop: 6,
    height: 34,
    borderWidth: 1,
    borderColor: '#ffdf9d',
  },
  qtyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#745c00',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
    minWidth: 24,
    textAlign: 'center',
  },
});
