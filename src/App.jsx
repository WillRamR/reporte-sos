import { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
//import { AuthProvider, useAuth } from './contexts/AuthContext';
//import GoogleAuth from './components/GoogleAuth';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  CircularProgress,
  Alert,
  Link,
  Divider,
  Stack,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import './App.css';

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs para español
dayjs.locale('es');

// Componente principal protegido
function ReportsApp() {
  //const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editedFields, setEditedFields] = useState({
    description: '',
    actions: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "panic-reports"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const reportsData = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setReports(reportsData);
    } catch (err) {
      setError('Error cargando reportes: ' + err.message);
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-MX');
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'in_progress': 'En Proceso',
      'resolved': 'Resuelto',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const openReportDetails = (report) => {
    setSelectedReport(report);
    setEditedFields({
      description: report.description_facts || '',
      actions: report.actions_realized || ''
    });
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      setUpdating(true);

      if (newStatus === 'resolved') {
        // Obtener el reporte actual para validar
        const reportToUpdate = reports.find(report => report.id === reportId);

        // Validar que los campos requeridos estén llenos
        if (!editedFields.description || editedFields.description.trim() === '') {
          alert('Error: Debe completar la descripción de lo sucedido antes de marcar como resuelto.');
          setUpdating(false);
          return;
        }

        if (!editedFields.actions || editedFields.actions.trim() === '') {
          alert('Error: Debe completar las acciones realizadas antes de marcar como resuelto.');
          setUpdating(false);
          return;
        }
      }

      // Actualizar en Firestore
      const reportRef = doc(db, "panic-reports", reportId);

      // Crear objeto con los datos a actualizar
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Si es resuelto, incluir los campos editados
      if (newStatus === 'resolved') {
        updateData.description_facts = editedFields.description;
        updateData.actions_realized = editedFields.actions;
      }

      await updateDoc(reportRef, updateData);

      // Actualizar en el estado local
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId
            ? {
              ...report,
              status: newStatus,
              updatedAt: new Date(),
              ...(newStatus === 'resolved' ? {
                description: editedFields.description,
                actions: editedFields.actions
              } : {})
            }
            : report
        )
      );

      // Actualizar el reporte seleccionado si está abierto
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date(),
          ...(newStatus === 'resolved' ? {
            description: editedFields.description,
            actions: editedFields.actions
          } : {})
        }));
      }

      alert(`Reporte actualizado a: ${getStatusText(newStatus)}`);
    } catch (err) {
      console.error('Error actualizando reporte:', err);
      alert('Error actualizando el reporte: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (reportId, newStatus) => {
    const confirmMessage = `¿Estás seguro de cambiar el estatus a "${getStatusText(newStatus)}"?`;
    if (window.confirm(confirmMessage)) {
      updateReportStatus(reportId, newStatus);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  // Aplicar filtros
  const filteredReports = reports.filter(report => {
    // Filtro por estatus
    if (statusFilter && report.status !== statusFilter) {
      return false;
    }

    // Filtro por fecha
    if (startDate || endDate) {
      const reportDate = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }
    }

    return true;
  });

  // Cálculos de paginación con reportes filtrados
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  };

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    handleFilterChange();
  }, [statusFilter, startDate, endDate]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reportes de Pánico
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Cargando reportes...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reportes de Pánico
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Si no está autenticado, mostrar componente de login
  // if (!user) {
  //   return <GoogleAuth />;
  // }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con información del usuario */}
      {/* <GoogleAuth user={user} /> */}

      <Typography variant="h4" component="h1" gutterBottom>
        Reportes de Pánico
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {reports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reportes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {filteredReports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reportes Filtrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {reports.filter(r => r.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {reports.filter(r => r.status === 'resolved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resueltos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterIcon />
          <Typography variant="h6">Filtros</Typography>
        </Stack>
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estatus</InputLabel>
              <Select
                value={statusFilter}
                label="Estatus"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos los estatus</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="in_progress">En Proceso</MenuItem>
                <MenuItem value="resolved">Resuelto</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha inicio"
                value={startDate ? dayjs(startDate) : null}
                onChange={(newValue) => setStartDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha fin"
                value={endDate ? dayjs(endDate) : null}
                onChange={(newValue) => setEndDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredReports.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {reports.length === 0 ? 'No hay reportes disponibles' : 'No hay reportes que coincidan con los filtros aplicados'}
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Facultad</TableCell>
                  <TableCell>Estatus</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {report.fullname || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.enrollmentNumber || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.campus || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(report.status)}
                        color={
                          report.status === 'pending' ? 'warning' :
                            report.status === 'in_progress' ? 'info' :
                              report.status === 'resolved' ? 'success' :
                                'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.latitude && report.longitude ? (
                        <Link
                          href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <LocationIcon fontSize="small" />
                          Ver mapa
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => openReportDetails(report)}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              {currentReports.length} elemento(s) - Página {currentPage} de {totalPages}
            </Typography>

            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => goToPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Modal de detalles del reporte */}
      <Dialog
        open={!!selectedReport}
        onClose={closeReportDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Detalles del Reporte</Typography>
          <IconButton onClick={closeReportDetails}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Información General</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>ID:</strong> {selectedReport.id}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Fecha:</strong> {formatDate(selectedReport.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2"><strong>Estatus:</strong></Typography>
                      <Chip
                        label={getStatusText(selectedReport.status)}
                        color={
                          selectedReport.status === 'pending' ? 'warning' :
                            selectedReport.status === 'in_progress' ? 'info' :
                              selectedReport.status === 'resolved' ? 'success' :
                                'default'
                        }
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Información del Estudiante</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Nombre:</strong> {selectedReport.fullname || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Matrícula:</strong> {selectedReport.enrollmentNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Carrera:</strong> {selectedReport.programName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Facultad:</strong> {selectedReport.campus || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Correo:</strong> {selectedReport.email || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Box>


              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Ubicación</Typography>
                {selectedReport.latitude && selectedReport.longitude ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Coordenadas:</strong> {selectedReport.latitude}, {selectedReport.longitude}
                    </Typography>
                    <Link
                      href={`https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 'fit-content' }}
                    >
                      <LocationIcon fontSize="small" />
                      Abrir en Google Maps
                    </Link>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay información de ubicación disponible
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Archivos Adjuntos</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Fotos ({selectedReport.photos?.length || 0})
                  </Typography>
                  {selectedReport.photos && selectedReport.photos.length > 0 ? (
                    <Grid container spacing={2}>
                      {selectedReport.photos.map((photoUrl, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Link href={photoUrl} target="_blank" rel="noopener noreferrer">
                            <Box
                              component="img"
                              src={photoUrl}
                              alt={`Foto ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                            />
                          </Link>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay fotos disponibles
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Audios ({selectedReport.audios?.length || 0})
                  </Typography>
                  {selectedReport.audios && selectedReport.audios.length > 0 ? (
                    <Stack spacing={2}>
                      {selectedReport.audios.map((audioUrl, index) => (
                        <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Box component="audio" controls sx={{ width: '100%', mb: 1 }}>
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/mp4" />
                            Tu navegador no soporta el elemento de audio.
                          </Box>
                          <Link href={audioUrl} target="_blank" rel="noopener noreferrer">
                            Descargar Audio {index + 1}
                          </Link>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay audios disponibles
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom gutterTop>
                    Descripción de lo sucedido
                  </Typography>
                  <TextField
                    name="description"
                    fullWidth
                    multiline
                    rows={4}
                    value={editedFields.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    disabled={selectedReport.status !== 'pending' || selectedReport.status !== 'in_progress'}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Acciones realizadas
                  </Typography>
                  <TextField
                    name="actions"
                    fullWidth
                    multiline
                    rows={4}
                    value={editedFields.actions}
                    onChange={(e) => handleFieldChange('actions', e.target.value)}
                    disabled={selectedReport.status !== 'pending' || selectedReport.status !== 'in_progress'}
                  />
                </Box>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center' }}>
          {selectedReport && (
            <>
              {selectedReport.status === 'pending' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={{ xs: 'center', sm: 'flex-end' }} spacing={1}>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => handleStatusChange(selectedReport.id, 'in_progress')}
                    disabled={updating}
                  >
                    {updating ? 'Actualizando...' : 'Marcar En Proceso'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleStatusChange(selectedReport.id, 'resolved')}
                    disabled={updating}
                  >
                    {updating ? 'Actualizando...' : 'Marcar Resuelto'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleStatusChange(selectedReport.id, 'cancelled')}
                    disabled={updating}
                  >
                    {updating ? 'Actualizando...' : 'Cancelar Reporte'}
                  </Button>
                </Stack>
              )}
              {selectedReport.status === 'in_progress' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={{ xs: 'center', sm: 'flex-end' }} spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleStatusChange(selectedReport.id, 'resolved')}
                    disabled={updating}
                  >
                    {updating ? 'Actualizando...' : 'Marcar Resuelto'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleStatusChange(selectedReport.id, 'cancelled')}
                    disabled={updating}
                  >
                    {updating ? 'Actualizando...' : 'Cancelar Reporte'}
                  </Button>
                </Stack>
              )}
              {selectedReport.status === 'resolved' && (
                <Stack sx={{ width: '100%' }} direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <Typography variant="h4" align="center" color="success.main">
                    Este reporte ya ha sido resuelto
                  </Typography>
                </Stack>
              )}
              {selectedReport.status === 'cancelled' && (
                <Stack sx={{ width: '100%' }} direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <Typography variant="h4" align="center" color="error.main">
                    Este reporte ha sido cancelado
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Componente principal con AuthProvider
function App() {
  return (
    // <AuthProvider>
    <ReportsApp />
    // </AuthProvider>
  );
}

export default App;
