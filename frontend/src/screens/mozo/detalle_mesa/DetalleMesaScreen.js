import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../constants/colors';
import MenuTab from './MenuTab';
import PedidoTab from './PedidoTab';
import TicketsTab from './TicketsTab';
import { useComandas } from '../../../hooks/useComandas';


const TABS = ['Menú', 'Pedido', 'Tickets'];

export default function DetalleMesaScreen({ route, navigation }) {
  const { id_mesa, numero } = route.params;
  const [activeTab, setActiveTab] = useState(0);
  const [carrito, setCarrito] = useState([]);

  const mesa = { id_mesa, numero };

  // Fetch tickets for this mesa to show count badge
  const { comandas: tickets, loading: ticketsLoading } = useComandas(mesa.id_mesa);

  const handleAddItem = (producto) => {
    // Agregar el producto al carrito local
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

  const handleDecrementItem = (producto) => {
    setCarrito(prev => {
      const exists = prev.find(i => i.id_producto === producto.id_producto);
      if (exists) {
        if (exists.cantidad <= 1) {
          return prev.filter(i => i.id_producto !== producto.id_producto);
        }
        return prev.map(i =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad - 1 }
            : i
        );
      }
      return prev;
    });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 0:
        return (
          <MenuTab
            carrito={carrito}
            onAddItem={handleAddItem}
            onDecrementItem={handleDecrementItem}
          />
        );
      case 1:
        return (
          <PedidoTab
            mesa={mesa}
            carrito={carrito}
            setCarrito={setCarrito}
            onComandaCreada={() => setActiveTab(2)}
          />
        );
      case 2:
        return (
          <TicketsTab
            mesa={mesa}
            navigation={navigation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar personalizada */}
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === idx && styles.tabActive]}
            onPress={() => setActiveTab(idx)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
              {tab}
              {idx === 1 && carrito.length > 0 && (
                <Text style={styles.cartBadge}> ({carrito.length})</Text>
              )}
              {idx === 2 && tickets && tickets.length > 0 && (
                <Text style={styles.ticketBadge}> ({tickets.length})</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido de la pestaña activa */}
      <View style={styles.content}>
        {renderTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e1da',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  cartBadge: {
    color: '#ba1a1a',
    fontWeight: '900',
  },
  ticketBadge: {
    color: '#00695c',
    fontWeight: '900',
  },
  content: { flex: 1 },
});
