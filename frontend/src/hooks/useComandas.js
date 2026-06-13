import { useState, useEffect, useCallback } from 'react';
import { comandasService } from '../services/comandas.service';

export function useComandas(mesaId) {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComandas = useCallback(async () => {
    if (!mesaId) return;
    setLoading(true);
    try {
      const data = await comandasService.getComandas(mesaId);
      setComandas(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching comandas for table:', err);
      setError('Error al obtener comandas');
    } finally {
      setLoading(false);
    }
  }, [mesaId]);

  useEffect(() => {
    fetchComandas();
  }, [fetchComandas]);

  return {
    comandas,
    loading,
    error,
    refetch: fetchComandas
  };
}
