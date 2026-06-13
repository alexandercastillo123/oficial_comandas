import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useMesas } from '../../hooks/useMesas';
import { useResponsive } from '../../hooks/useResponsive';
import MesaCard from '../../components/MesaCard';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/colors';

export default function MesasMapaScreen({ navigation }) {
  const { user, id_tienda, cambiarTienda, logout } = useContext(AuthContext);
  const { mesas, loading, error, refetch } = useMesas();
  const { isTablet } = useResponsive();
  const [showTiendaModal, setShowTiendaModal] = useState(false);

  const numColumns = isTablet ? 4 : 2;

  // Encontrar tienda activa
  const tiendaActiva = user?.tiendas?.find(t => t.id_tienda === id_tienda);

  const handleMesaPress = (mesa) => {
    navigation.navigate('DetalleMesa', {
      id_mesa: mesa.id_mesa,
      numero: mesa.numero
    });
  };

  const handleSelectTienda = async (tiendaId) => {
    await cambiarTienda(tiendaId);
    setShowTiendaModal(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Cerrar sesión? Se cerrará tu sesión actual.');
      if (confirm) logout();
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout }
        ]
      );
    }
  };

  if (loading && mesas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabecera de Tienda */}
      <View style={styles.storeHeader}>
        <View style={styles.storeHeaderLeft}>
          <Text style={styles.welcomeText}>Hola, {user?.nombre?.split(' ')[0]} 👋</Text>
          <Text style={styles.storeText}>📍 {tiendaActiva?.descripcion || 'Cargando Sucursal...'}</Text>
        </View>

        <View style={styles.storeHeaderRight}>
          {user?.tiendas?.length > 1 && (
            <TouchableOpacity
              style={styles.changeStoreBtn}
              onPress={() => setShowTiendaModal(true)}
            >
              <Text style={styles.changeStoreBtnText}>Cambiar Sede</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : mesas.length === 0 ? (
        <EmptyState message="No hay mesas registradas para esta sucursal." icon="🪑" />
      ) : (
        <FlatList
          key={numColumns} // Forzar re-render si cambia el número de columnas (responsive layout)
          data={mesas}
          keyExtractor={(item) => item.id_mesa.toString()}
          renderItem={({ item }) => (
            <MesaCard
              numero={item.numero}
              capacidad={item.capacidad}
              estado_mesa={item.estado_mesa}
              comandas_activas={item.comandas_activas}
              onPress={() => handleMesaPress(item)}
            />
          )}
          numColumns={numColumns}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}

      {/* Selector de Tienda Modal */}
      <Modal visible={showTiendaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
            {user?.tiendas?.map((tienda) => (
              <TouchableOpacity
                key={tienda.id_tienda}
                style={[
                  styles.tiendaOption,
                  tienda.id_tienda === id_tienda && styles.tiendaOptionActive
                ]}
                onPress={() => handleSelectTienda(tienda.id_tienda)}
              >
                <Text style={[
                  styles.tiendaOptionText,
                  tienda.id_tienda === id_tienda && styles.tiendaOptionTextActive
                ]}>
                  {tienda.descripcion} {tienda.es_principal ? '⭐️' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowTiendaModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgScreen,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e1da',
  },
  storeHeaderLeft: {
    flex: 1,
  },
  storeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
  },
  storeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#745c00',
    marginTop: 2,
  },
  changeStoreBtn: {
    backgroundColor: '#ffdf9d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#745c00',
  },
  changeStoreBtnText: {
    color: '#745c00',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#fff0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ba1a1a',
  },
  logoutBtnText: {
    color: '#ba1a1a',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    padding: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ba1a1a',
    fontWeight: '700',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#745c00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 16,
    textAlign: 'center',
  },
  tiendaOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginVertical: 4,
  },
  tiendaOptionActive: {
    borderColor: '#745c00',
    backgroundColor: '#fffde7',
  },
  tiendaOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  tiendaOptionTextActive: {
    color: '#745c00',
    fontWeight: '700',
  },
  closeModalBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#ba1a1a',
    fontWeight: '700',
  },
});
