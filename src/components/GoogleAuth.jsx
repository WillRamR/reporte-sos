import { useState } from 'react';
import googleAuth from '../services/googleAuth';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Stack
} from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';

const GoogleAuth = ({ user, onAuthStateChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = await googleAuth.signInWithPopup();
      console.log('Usuario autenticado:', user);
      onAuthStateChange?.(user);
      
    } catch (error) {
      console.error('Error en autenticación:', error);
      setError('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await googleAuth.signOut();
      onAuthStateChange?.(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario está autenticado, mostrar información del usuario
  if (user) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={user.picture} alt={user.name}>
              {user.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Stack>
          
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Cerrar Sesión'}
          </Button>
        </Stack>
      </Paper>
    );
  }

  // Si no está autenticado, mostrar pantalla de login
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50'
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reportes de Pánico
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Inicia sesión con tu cuenta de Google para acceder al sistema
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
          onClick={signInWithGoogle}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Solo usuarios autorizados pueden acceder al sistema
        </Typography>
      </Paper>
    </Box>
  );
};

export default GoogleAuth;
