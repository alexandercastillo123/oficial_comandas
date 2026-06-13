const { useState, useEffect, useContext, useCallback } = require('react');
const { AuthContext } = require('../context/AuthContext');
const { dashboardService } = require('../services/dashboard.service');

export function useDashboard() {
  const { id_tienda } = useContext(AuthContext);
  const [stats, setStats] = useState({
    total_ventas: 0,
    total_tickets: 0,
    mesas_ocupadas: 0,
    comandas_en_cocina: 0,
    producto_mas_vendido: 'Ninguno',
    productos_top_5: [],
    ventas_por_hora: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!id_tienda) return;
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [id_tienda]);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
