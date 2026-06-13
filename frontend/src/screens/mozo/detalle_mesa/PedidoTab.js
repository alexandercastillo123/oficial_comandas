import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import { comandasService } from '../../../services/comandas.service';
import ItemCarrito from '../../../components/ItemCarrito';
import AppButton from '../../../components/AppButton';
import EmptyState from '../../../components/EmptyState';
import { formatCurrency } from '../../../utils/formatCurrency';
import { COLORS } from '../../../constants/colors';

export default function PedidoTab({ mesa, carrito, setCarrito, onComandaCreada }) {
  const { user, id_tienda } = useContext(AuthContext);
  const [nombreCliente, setNombreCliente] = useState('');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);

  // Agregar item al carrito — viene de MenuTab vía DetalleMesaScreen
  const agregarItem = (producto) => {
    setCarrito(prev => {
      const exists = prev.find(i => i.id_producto === producto.id_producto);
      if (exists) {
        return prev.map(i =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { ...producto, cantidad: 1, observacion_item: '' }];
    });
  };

  const incrementar = (idProducto) => {
    setCarrito(prev =>
      prev.map(i => i.id_producto === idProducto ? { ...i, cantidad: i.cantidad + 1 } : i)
    );
  };

  const decrementar = (idProducto) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id_producto === idProducto);
      if (item && item.cantidad <= 1) {
        return prev.filter(i => i.id_producto !== idProducto);
      }
      return prev.map(i =>
        i.id_producto === idProducto ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  };

  const actualizarObservacion = (idProducto, texto) => {
    setCarrito(prev =>
      prev.map(i => i.id_producto === idProducto ? { ...i, observacion_item: texto } : i)
    );
  };

  const totalCalculado = carrito.reduce(
    (sum, i) => sum + i.cantidad * i.precio_mesa, 0
  );

  const handleMandarCocina = async () => {
    if (carrito.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega al menos un producto antes de mandar a cocina.');
      return;
    }

    setLoading(true);
    try {
      await comandasService.crearComanda({
        id_mesa: mesa.id_mesa,
        id_tienda,
        nombre_cliente: nombreCliente.trim() || null,
        observacion: observacion.trim() || null,
        items: carrito.map(i => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          observacion_item: i.observacion_item || null
        }))
      });

      Alert.alert('✓ Pedido Enviado', 'La comanda fue enviada a cocina correctamente.');
      setCarrito([]);
      setNombreCliente('');
      setObservacion('');
      if (onComandaCreada) onComandaCreada();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error?.message || 'No se pudo enviar a cocina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Datos del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Pedido</Text>

          <TextInput
            style={styles.clientInput}
            placeholder="Nombre del cliente (para llamarlo cuando esté listo)"
            placeholderTextColor="#999999"
            value={nombreCliente}
            onChangeText={setNombreCliente}
            maxLength={50}
          />

          <TextInput
            style={[styles.clientInput, styles.obsInput]}
            placeholder="Nota general para cocina (opcional)"
            placeholderTextColor="#999999"
            value={observacion}
            onChangeText={setObservacion}
            multiline
            maxLength={200}
          />
        </View>

        {/* Items del Carrito */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Productos Seleccionados ({carrito.length})
          </Text>

          {carrito.length === 0 ? (
            <EmptyState
              message="Ve al menú y agrega productos para armar el pedido."
              icon="🛒"
            />
          ) : (
            carrito.map(item => (
              <ItemCarrito
                key={item.id_producto}
                item={item}
                onIncrement={() => incrementar(item.id_producto)}
                onDecrement={() => decrementar(item.id_producto)}
                onUpdateObservacion={(text) => actualizarObservacion(item.id_producto, text)}
              />
            ))
          )}
        </View>

        {/* Resumen de Costos */}
        {carrito.length > 0 && (
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Monto Estimado</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalCalculado)}</Text>
            </View>
            <Text style={styles.totalNote}>* El precio final puede incluir IGV y se confirma en caja.</Text>
          </View>
        )}
      </ScrollView>

      {/* Botón Mandar a Cocina */}
      <View style={styles.footerBtn}>
        <AppButton
          title={`MANDAR A COCINA (${carrito.length} ítems)`}
          onPress={handleMandarCocina}
          loading={loading}
          disabled={carrito.length === 0}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Exponer agregarItem para llamarlo desde DetalleMesaScreen al agregar desde MenuTab
PedidoTab.agregarItem = null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  scrollContent: { padding: 16, paddingBottom: 80 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  clientInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#222222',
    marginBottom: 8,
  },
  obsInput: { minHeight: 70, textAlignVertical: 'top' },
  totalCard: {
    backgroundColor: '#fffde7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffecb3',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#444444' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#745c00' },
  totalNote: { fontSize: 11, color: '#888888', marginTop: 6 },
  footerBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.bgScreen,
    borderTopWidth: 1,
    borderTopColor: '#e6e1da',
  },
});
