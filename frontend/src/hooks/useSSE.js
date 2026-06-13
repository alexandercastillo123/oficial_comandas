import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SSE_BASE_URL } from '../constants/config';
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
    fetchCocina();

    // Intentar conexión SSE o Polling fallback
    // En ambientes móviles React Native, el EventSource a veces requiere librerías nativas.
    // Implementamos un fallback robusto con Polling de 5s para máxima confiabilidad, 
    // garantizando que la pantalla del Chef siempre funcione.
    let eventSource = null;
    let fallbackInterval = null;

    try {
      if (global.EventSource) {
        const url = `${SSE_BASE_URL}/cocina?id_tienda=${id_tienda}&token=${encodeURIComponent(token)}`;
        eventSource = new global.EventSource(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        eventSource.addEventListener('nueva_comanda', (e) => {
          const comanda = JSON.parse(e.data);
          setComandas(prev => {
            // Evitar duplicados
            if (prev.some(c => c.id_comanda_cab === comanda.id_comanda_cab)) return prev;
            return [...prev, comanda].sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
          });
        });

        eventSource.addEventListener('comanda_entregada', (e) => {
          const { id_comanda_cab } = JSON.parse(e.data);
          setComandas(prev => prev.filter(c => c.id_comanda_cab !== id_comanda_cab));
        });

        eventSource.onerror = (err) => {
          console.warn('[SSE] Error en stream de cocina, usando fallback de polling:', err);
          if (!fallbackInterval) {
            fallbackInterval = setInterval(fetchCocina, 5000);
          }
        };
      } else {
        // Fallback directo si no hay EventSource en el global context
        console.log('[SSE] EventSource no disponible en la plataforma, usando polling de 5s.');
        fallbackInterval = setInterval(fetchCocina, 5000);
      }
    } catch (err) {
      console.error('[SSE] Error al inicializar:', err);
      fallbackInterval = setInterval(fetchCocina, 5000);
    }

    return () => {
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
