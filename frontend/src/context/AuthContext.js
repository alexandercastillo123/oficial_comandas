import React, { createContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';
import { api } from '../services/api';

const AUTH_KEY = '@la_ideal_auth_state';

const initialState = {
  isLoading: true,
  user: null,
  token: null,
  id_tienda: null
};

export const AuthContext = createContext({
  ...initialState,
  login: async (usuario, clave) => {},
  logout: async () => {},
  cambiarTienda: async (tiendaId) => {}
});

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        id_tienda: action.payload.id_tienda
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        id_tienda: action.payload.id_tienda
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        id_tienda: null
      };
    case 'CHANGE_TIENDA':
      return {
        ...state,
        id_tienda: action.payload.id_tienda,
        user: {
          ...state.user,
          id_tienda: action.payload.id_tienda
        }
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    async function loadStoredState() {
      const stored = await storage.get(AUTH_KEY);
      if (stored && stored.token) {
        dispatch({ type: 'RESTORE_TOKEN', payload: stored });
      } else {
        dispatch({ type: 'RESTORE_TOKEN', payload: { user: null, token: null, id_tienda: null } });
      }
    }
    loadStoredState();
  }, []);

  const login = async (usuario, clave) => {
    try {
      const res = await api.post('/auth/login', { usuario, clave });
      if (res.data && res.data.success) {
        const { token, user } = res.data.data;
        // La tienda por defecto activa es la principal asignada
        const principalTienda = user.tiendas.find(t => t.es_principal) || user.tiendas[0];
        const payload = {
          user,
          token,
          id_tienda: principalTienda ? principalTienda.id_tienda : null
        };
        await storage.set(AUTH_KEY, payload);
        dispatch({ type: 'LOGIN', payload });
        return { success: true };
      }
      return { success: false, error: 'Respuesta inválida del servidor' };
    } catch (error) {
      console.error('Error en el login:', error);
      const msg = error.response?.data?.error?.message || 'Error de conexión con el servidor';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignorar fallo al invalidar token en backend
    }
    await storage.remove(AUTH_KEY);
    dispatch({ type: 'LOGOUT' });
  };

  const cambiarTienda = async (tiendaId) => {
    const stored = await storage.get(AUTH_KEY);
    if (stored) {
      stored.id_tienda = tiendaId;
      await storage.set(AUTH_KEY, stored);
    }
    dispatch({ type: 'CHANGE_TIENDA', payload: { id_tienda: tiendaId } });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        cambiarTienda
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
