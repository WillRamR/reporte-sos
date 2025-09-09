import { useState, useEffect } from 'react';
import googleAuth from '../services/googleAuth';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  Stack
} from '@mui/material';
import { Google as GoogleIcon, Logout as LogoutIcon } from '@mui/icons-material';

const GoogleAuth = () => {
  const { user, accessDenied, clearAccessDenied } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('GoogleAuth montado');
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      clearAccessDenied();
      googleAuth.clearAccessDeniedData();

      const user = await googleAuth.oauth2callback();

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
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Error al cerrar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Si hay acceso denegado, mostrar el componente AccessDenied
  if (accessDenied) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(/background-photo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 600, width: '100%', textAlign: 'left' }}>
          <Typography variant="h5"> Reportes de SOS </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Parece que hubo un errror, no tienes acceso a esta aplicacion.
          </Typography>
          <Button
            style={{ width: '100%' }}
            variant="contained"
            color="primary"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Acceder'}
          </Button>
        </Paper>
      </Box>
    );
  }

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
        backgroundImage: 'url(/background-photo.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, width: '100%', textAlign: 'left' }}>
        <Typography variant="h5"> Reportes de SOS </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Accede con tu correo electrónico (@unicach.mx)
        </Typography>
        <Button
          style={{ width: '100%' }}
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={signInWithGoogle}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Acceder'}
        </Button>
      </Paper>
    </Box>
  );
};

export default GoogleAuth;
