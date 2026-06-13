import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { productosService } from '../../../services/productos.service';
import ProductoCard from '../../../components/ProductoCard';
import EmptyState from '../../../components/EmptyState';
import { COLORS } from '../../../constants/colors';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useResponsive } from '../../../hooks/useResponsive';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

export default function MenuTab({ carrito = [], onAddItem, onDecrementItem }) {
  const { isTablet } = useResponsive();
  const [productos, setProductos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

  // Detalle de Producto Modal
  const [detailProduct, setDetailProduct] = useState(null);

  useEffect(() => {
    async function loadCategorias() {
      try {
        const cats = await productosService.getCategorias();
        setCategorias(cats);
      } catch (err) {
        console.error('Error cargando categorias:', err);
      }
    }
    loadCategorias();
  }, []);

  useEffect(() => {
    async function loadProductos() {
      setLoading(true);
      try {
        const data = await productosService.getProductos({
          categoria: selectedCategoria,
          buscar,
          limit: 30
        });
        const items = data.items || [];
        setProductos(items);
        // Actualizar sugerencias cuando hay texto de búsqueda
        if (buscar && buscar.trim().length > 0) {
          // Tomar primeros 5 coincidencias como sugerencias
          setSuggestions(items.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        setLoading(false);
      }
    }

    const delayDebounce = setTimeout(loadProductos, 300);
    return () => clearTimeout(delayDebounce);
  }, [selectedCategoria, buscar]);

  const numColumns = isTablet ? 3 : 2;

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchWrapper}>
          <FontAwesome5 name="search" size={20} color={COLORS.textMid} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar panes, postres, empanadas..."
            placeholderTextColor="#999999"
            value={buscar}
            onChangeText={setBuscar}
          />
        </View>
        {/* Sugerencias de autocompletado */}
        {suggestions.length > 0 && (
          <ScrollView style={styles.suggestionsContainer}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s.id_producto} onPress={() => { setBuscar(s.nombre); setSuggestions([]); }}>
                <Text style={styles.suggestionText}>{s.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Categorías (Chips horizontales) */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategoria && styles.chipActive]}
            onPress={() => setSelectedCategoria(null)}
          >
            <Text style={[styles.chipText, !selectedCategoria && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {categorias.map(cat => (
            <TouchableOpacity
              key={cat.id_categoria}
              style={[styles.chip, selectedCategoria === cat.id_categoria && styles.chipActive]}
              onPress={() => setSelectedCategoria(cat.id_categoria)}
            >
              <Text style={[styles.chipText, selectedCategoria === cat.id_categoria && styles.chipTextActive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de productos */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : productos.length === 0 ? (
        <EmptyState message="No se encontraron productos coincidentes." icon="🥖" />
      ) : (
        <FlatList
          key={numColumns}
          data={productos}
          keyExtractor={(item) => item.id_producto.toString()}
          renderItem={({ item }) => {
            const cartItem = carrito.find(c => c.id_producto === item.id_producto);
            const quantity = cartItem ? cartItem.cantidad : 0;
            return (
              <ProductoCard
                producto={item}
                quantity={quantity}
                onAdd={() => onAddItem(item)}
                onDecrement={() => onDecrementItem(item)}
                onShowDetails={() => setDetailProduct(item)}
              />
            );
          }}
          numColumns={numColumns}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal Detalle Producto */}
      <Modal visible={!!detailProduct} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailProduct?.imagen_url ? (
              <Image source={{ uri: detailProduct.imagen_url }} style={styles.detailImage} />
            ) : (
              <View style={styles.detailPlaceholderImage}>
                <Text style={{ fontSize: 50 }}>🥐</Text>
              </View>
            )}

            <View style={styles.detailBody}>
              <Text style={styles.detailCategory}>{detailProduct?.categoria}</Text>
              <Text style={styles.detailTitle}>{detailProduct?.nombre}</Text>
              <Text style={styles.detailPrice}>{formatCurrency(detailProduct?.precio_mesa)}</Text>

              <Text style={styles.detailDescTitle}>Descripción del Producto</Text>
              <Text style={styles.detailDesc}>
                {detailProduct?.descripcion || 'Producto artesanal elaborado con los más altos estándares de calidad, ideal para disfrutar en cualquier momento del día.'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailProduct(null)}
              >
                <Text style={styles.closeBtnText}>CERRAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  onAddItem(detailProduct);
                  setDetailProduct(null);
                }}
              >
                <Text style={styles.addBtnText}>AÑADIR AL PEDIDO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.bgScreen,
    overflow: 'visible',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    zIndex: 20, // bring search bar and its overlay to front
    elevation: 20, // Android elevation
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    // Align with searchBarContainer paddingHorizontal (16)
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
    borderRadius: 8,
    maxHeight: 150,
    elevation: 20,
    zIndex: 2000,
  },

  suggestionText: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#222222',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginHorizontal: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#222222',
  },
  categoriesContainer: {
    height: 48,
    marginVertical: 4,
    // lower than search bar overlay
    zIndex: 0,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e1da',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#ffdf9d',
    borderColor: '#745c00',
  },
  chipText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#745c00',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 120,
    zIndex: 5, // ensure below suggestions overlay
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
  },
  detailImage: {
    height: 200,
    width: '100%',
    resizeMode: 'cover',
  },
  detailPlaceholderImage: {
    height: 200,
    width: '100%',
    backgroundColor: '#f3efea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    padding: 20,
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#745c00',
    textTransform: 'uppercase',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222222',
    marginTop: 4,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#745c00',
    marginVertical: 8,
  },
  detailDescTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#666666',
    marginTop: 12,
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3efea',
    padding: 16,
    justifyContent: 'flex-end',
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  closeBtnText: {
    color: '#ba1a1a',
    fontWeight: '800',
    fontSize: 12,
  },
  addBtn: {
    backgroundColor: '#745c00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
});
