import { createContext, useContext, useEffect, useState } from 'react';
import googleAuth from '../services/googleAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(null);

  useEffect(() => {
    const unsubscribe = googleAuth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Escuchar eventos de acceso denegado
    const handleAccessDenied = (event) => {
      setAccessDenied({
        correo: event.detail.correo,
        mensaje: event.detail.mensaje
      });
    };

    window.addEventListener('accessDenied', handleAccessDenied);

    return () => {
      unsubscribe();
      window.removeEventListener('accessDenied', handleAccessDenied);
    };
  }, []);

  const clearAccessDenied = () => {
    setAccessDenied(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    accessDenied,
    clearAccessDenied
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
