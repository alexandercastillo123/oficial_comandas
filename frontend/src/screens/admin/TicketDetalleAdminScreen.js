import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { comandasService } from '../../services/comandas.service';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function TicketDetalleAdminScreen({ route }) {
  const { id } = route.params;
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComanda() {
      try {
        const data = await comandasService.getComanda(id);
        setComanda(data);
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar el detalle del ticket.');
      } finally {
        setLoading(false);
      }
    }
    loadComanda();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!comanda) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró la información del ticket.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.ticketCard}>
        <View style={styles.headerRow}>
          <Text style={styles.ticketNum}>{comanda.nro_ticket}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{comanda.estado_comanda}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mesa</Text>
            <Text style={styles.metaValue}>{comanda.numero_mesa}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{formatDate(comanda.fecha_creacion)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mozo</Text>
            <Text style={styles.metaValue}>{comanda.mozo}</Text>
          </View>
          {comanda.nombre_cliente ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Cliente</Text>
              <Text style={styles.metaValue}>{comanda.nombre_cliente}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Items List */}
      <Text style={styles.sectionTitle}>Productos Consumidos</Text>
      <View style={styles.itemsCard}>
        {comanda.items && comanda.items.map((item, index) => (
          <View key={item.id_comanda_det || index}>
            <View style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemQty}>{parseInt(item.cantidad)}x</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.nombre_producto}</Text>
                  {item.observacion_item ? (
                    <Text style={styles.itemObs}>📝 {item.observacion_item}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemTotal}>{formatCurrency(item.subtotal)}</Text>
                <Text style={styles.itemUnit}>{formatCurrency(item.precio_unitario)}/u</Text>
              </View>
            </View>
            {index < comanda.items.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalVal}>{formatCurrency(comanda.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IGV (18%)</Text>
          <Text style={styles.totalVal}>{formatCurrency(comanda.igv)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total General</Text>
          <Text style={styles.grandTotalVal}>{formatCurrency(comanda.total)}</Text>
        </View>
      </View>

      {comanda.observacion ? (
        <View style={styles.obsCard}>
          <Text style={styles.obsLabel}>Observación General:</Text>
          <Text style={styles.obsText}>{comanda.observacion}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  content: { padding: 16, paddingBottom: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgScreen },
  errorText: { color: COLORS.error, fontWeight: '700' },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginVertical: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    width: '45%',
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  itemsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemMain: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 10,
    marginTop: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  itemObs: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPricing: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  itemUnit: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginVertical: 8,
  },
  totalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.textMid,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.success,
  },
  obsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  obsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMid,
    marginBottom: 4,
  },
  obsText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
});
