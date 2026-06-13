import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getSseBaseUrl } from '../constants/config';
import { comandasService } from '../services/comandas.service';

export function useSSE() {
  const { id_tienda, token } = useContext(AuthContext);
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCocina = useCallback(async () => {
    if (!id_tienda) return;
    try {
      const data = await comandasService.getComandasCocina();
      setComandas(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cocina queue:', err);
      setError('Error al obtener cola de cocina');
    } finally {
      setLoading(false);
    }
  }, [id_tienda]);

  useEffect(() => {
    let eventSource = null;
    let fallbackInterval = null;
    let isMounted = true;

    const initConnection = async () => {
      await fetchCocina();
      if (!isMounted) return;

      try {
        if (global.EventSource) {
          const sseBase = await getSseBaseUrl();
          const url = `${sseBase}/cocina?id_tienda=${id_tienda}&token=${encodeURIComponent(token)}`;
          
          if (!isMounted) return;

          eventSource = new global.EventSource(url, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          eventSource.addEventListener('nueva_comanda', (e) => {
            if (!isMounted) return;
            const comanda = JSON.parse(e.data);
            setComandas(prev => {
              // Evitar duplicados
              if (prev.some(c => c.id_comanda_cab === comanda.id_comanda_cab)) return prev;
              return [...prev, comanda].sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
            });
          });

          eventSource.addEventListener('comanda_entregada', (e) => {
            if (!isMounted) return;
            const { id_comanda_cab } = JSON.parse(e.data);
            setComandas(prev => prev.filter(c => c.id_comanda_cab !== id_comanda_cab));
          });

          eventSource.onerror = (err) => {
            console.warn('[SSE] Error en stream de cocina, usando fallback de polling:', err);
            if (isMounted && !fallbackInterval) {
              fallbackInterval = setInterval(fetchCocina, 5000);
            }
          };
        } else {
          // Fallback directo si no hay EventSource en el global context
          console.log('[SSE] EventSource no disponible en la plataforma, usando polling de 5s.');
          if (isMounted) {
            fallbackInterval = setInterval(fetchCocina, 5000);
          }
        }
      } catch (err) {
        console.error('[SSE] Error al inicializar:', err);
        if (isMounted) {
          fallbackInterval = setInterval(fetchCocina, 5000);
        }
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [id_tienda, token, fetchCocina]);

  return {
    comandas,
    loading,
    error,
    refetch: fetchCocina
  };
}
