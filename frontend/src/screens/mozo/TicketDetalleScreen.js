import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { comandasService } from '../../services/comandas.service';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function TicketDetalleScreen({ route, navigation }) {
  const { id_comanda, nro_ticket, onEntregado } = route.params;
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadComanda();
  }, [id_comanda]);

  const loadComanda = async () => {
    try {
      const data = await comandasService.getComanda ? null : null;
      // Usamos el endpoint /comandas/:id
      const res = await import('../../services/api').then(m => m.api.get(`/comandas/${id_comanda}`));
      setComanda(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el ticket.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async () => {
    const runEntregar = async () => {
      setActionLoading(true);
      try {
        await comandasService.entregarComanda(id_comanda);
        if (onEntregado) onEntregado();
        navigation.goBack();
      } catch (err) {
        Alert.alert('Error', 'No se pudo marcar como entregado.');
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Marcar como Entregado? Confirma que entregaste todos los productos de este ticket al cliente.');
      if (confirm) runEntregar();
    } else {
      Alert.alert(
        '¿Marcar como Entregado?',
        'Confirma que entregaste todos los productos de este ticket al cliente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar Entrega', onPress: runEntregar }
        ]
      );
    }
  };

  const handlePreCuenta = async () => {
    const runPreCuenta = async () => {
      setActionLoading(true);
      try {
        await comandasService.preCuentaComanda(id_comanda);
        await loadComanda();
      } catch (err) {
        Alert.alert('Error', 'No se pudo generar la pre-cuenta.');
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Generar Pre-Cuenta? El cliente pidió la cuenta. La mesa pasará a estado celeste.');
      if (confirm) runPreCuenta();
    } else {
      Alert.alert(
        '¿Generar Pre-Cuenta?',
        'El cliente pidió la cuenta. La mesa pasará a estado celeste.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Generar Pre-Cuenta', onPress: runPreCuenta }
        ]
      );
    }
  };

  const handleCerrar = async () => {
    const runCerrar = async () => {
      setActionLoading(true);
      try {
        await comandasService.cerrarComanda(id_comanda);
        if (onEntregado) onEntregado();
        navigation.goBack();
      } catch (err) {
        Alert.alert('Error', 'No se pudo cerrar la comanda.');
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Cerrar comanda y liberar mesa? Confirma que el cliente pagó.');
      if (confirm) runCerrar();
    } else {
      Alert.alert(
        '¿Cerrar Comanda?',
        'Confirma que el cliente pagó. La mesa se liberará.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar Cierre', onPress: runCerrar }
        ]
      );
    }
  };


  const handleReimprimir = async () => {
    setActionLoading(true);
    try {
      await comandasService.reimprimirComanda(id_comanda);
      Alert.alert('✅ Reimpresión Enviada', 'El ticket fue enviado nuevamente a cocina.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo reimprimir el ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!comanda) return null;

  const isEnCocina = comanda.estado_comanda === 'EN_COCINA';
  const isEntregado = comanda.estado_comanda === 'ENTREGADO';
  const isPreCuenta = comanda.estado_comanda === 'PRE_CUENTA';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cabecera del Ticket */}
      <View style={styles.header}>
        <Text style={styles.ticketNum}>{comanda.nro_ticket}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(comanda.estado_comanda) }]}>
          <Text style={styles.statusText}>{getStatusLabel(comanda.estado_comanda)}</Text>
        </View>
      </View>

      <View style={styles.metaCard}>
        <MetaRow label="Mesa" value={comanda.numero_mesa} />
        <MetaRow label="Cliente" value={comanda.nombre_cliente || 'Sin nombre'} />
        <MetaRow label="Atendido por" value={comanda.mozo} />
        <MetaRow label="Fecha" value={formatDate(comanda.fecha_creacion)} />
        {comanda.observacion && (
          <MetaRow label="Nota general" value={comanda.observacion} highlight />
        )}
      </View>

      {/* Items del Ticket */}
      <Text style={styles.sectionTitle}>Detalle de Productos</Text>
      <View style={styles.itemsCard}>
        {comanda.items && comanda.items.map((item, idx) => (
          <View key={item.id_comanda_det || idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>x{Math.floor(item.cantidad)}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.nombre_producto}</Text>
              {item.observacion_item && (
                <Text style={styles.itemNote}>• {item.observacion_item}</Text>
              )}
            </View>
            <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totalesCard}>
        <View style={styles.totalesRow}>
          <Text style={styles.totalesLabel}>Subtotal (sin IGV)</Text>
          <Text style={styles.totalesValue}>{formatCurrency(comanda.subtotal)}</Text>
        </View>
        <View style={styles.totalesRow}>
          <Text style={styles.totalesLabel}>IGV (18%)</Text>
          <Text style={styles.totalesValue}>{formatCurrency(comanda.igv)}</Text>
        </View>
        <View style={[styles.totalesRow, styles.totalFinalRow]}>
          <Text style={styles.totalFinalLabel}>TOTAL</Text>
          <Text style={styles.totalFinalValue}>{formatCurrency(comanda.total)}</Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        {isEnCocina && (
          <AppButton
            title="✅  PEDIDO ENTREGADO"
            onPress={handleEntregar}
            loading={actionLoading}
          />
        )}
        {(isEnCocina || isEntregado) && (
          <AppButton
            title="🧾  GENERAR PRE-CUENTA"
            variant="secondary"
            onPress={handlePreCuenta}
            loading={actionLoading}
          />
        )}
        <AppButton
          title="🖨️  REIMPRIMIR TICKET"
          variant="secondary"
          onPress={handleReimprimir}
          loading={actionLoading}
        />
      </View>
    </ScrollView>
  );
}

function MetaRow({ label, value, highlight }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, highlight && styles.metaHighlight]}>{value}</Text>
    </View>
  );
}

function getStatusColor(estado) {
  switch (estado) {
    case 'EN_COCINA': return COLORS.warning;
    case 'ENTREGADO': return COLORS.libre;
    case 'PRE_CUENTA': return COLORS.preCuenta;
    case 'CERRADO': return '#9e9e9e';
    default: return '#cccccc';
  }
}

function getStatusLabel(estado) {
  switch (estado) {
    case 'EN_COCINA': return 'EN COCINA';
    case 'ENTREGADO': return 'ENTREGADO';
    case 'PRE_CUENTA': return 'PRE-CUENTA';
    case 'CERRADO': return 'PAGADO';
    default: return estado;
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketNum: { fontSize: 20, fontWeight: '900', color: '#222222' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { color: '#ffffff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  metaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#faf8f5',
  },
  metaLabel: { fontSize: 13, color: '#888888', fontWeight: '600' },
  metaValue: { fontSize: 13, color: '#222222', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  metaHighlight: { color: '#e65100' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#faf8f5',
  },
  itemQty: { fontSize: 15, fontWeight: '900', color: '#745c00', width: 36 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#222222' },
  itemNote: { fontSize: 12, color: '#e65100', marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '800', color: '#222222' },
  totalesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e1da',
    marginBottom: 20,
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalesLabel: { fontSize: 13, color: '#888888' },
  totalesValue: { fontSize: 13, color: '#444444', fontWeight: '600' },
  totalFinalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e6e1da',
  },
  totalFinalLabel: { fontSize: 16, fontWeight: '900', color: '#222222' },
  totalFinalValue: { fontSize: 20, fontWeight: '900', color: '#745c00' },
  actions: { gap: 4 },
});
