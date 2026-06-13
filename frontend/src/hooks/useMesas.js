import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { mesasService } from '../services/mesas.service';

export function useMesas() {
  const { id_tienda } = useContext(AuthContext);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMesas = useCallback(async () => {
    if (!id_tienda) return;
    try {
      const data = await mesasService.getMesas(id_tienda);
      setMesas(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching mesas:', err);
      setError('No se pudieron cargar las mesas');
    } finally {
      setLoading(false);
    }
  }, [id_tienda]);

  useEffect(() => {
    fetchMesas();
    
    // Polling cada 10 segundos
    const interval = setInterval(fetchMesas, 10000);
    return () => clearInterval(interval);
  }, [fetchMesas]);

  return {
    mesas,
    loading,
    error,
    refetch: fetchMesas
  };
}
