import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useComandas } from '../../../hooks/useComandas';
import TicketCard from '../../../components/TicketCard';
import EmptyState from '../../../components/EmptyState';
import { COLORS } from '../../../constants/colors';

export default function TicketsTab({ mesa, navigation, onRefreshMesa }) {
  const { comandas, loading, refetch } = useComandas(mesa.id_mesa);

  const handleTicketPress = (ticket) => {
    navigation.navigate('TicketDetalle', {
      id_comanda: ticket.id_comanda_cab,
      nro_ticket: ticket.nro_ticket,
      onEntregado: () => {
        refetch();
        if (onRefreshMesa) onRefreshMesa();
      }
    });
  };

  if (loading && comandas.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (comandas.length === 0) {
    return <EmptyState message="Esta mesa no tiene tickets activos aún." icon="🧾" />;
  }

  return (
    <FlatList
      data={comandas}
      keyExtractor={(item) => item.id_comanda_cab.toString()}
      renderItem={({ item }) => (
        <TicketCard ticket={item} onPress={() => handleTicketPress(item)} />
      )}
      contentContainerStyle={styles.listContent}
      refreshing={loading}
      onRefresh={refetch}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
});
