import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  TextField,
  IconButton,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { completeSaleDelivery } from '../../../lib/client/salesFetch';

interface CompleteSaleDeliveryModalProps {
  open: boolean;
  sale: any;
  handleOnClose: (saved: boolean, message?: string) => void;
}

const CompleteSaleDeliveryModal: React.FC<CompleteSaleDeliveryModalProps> = ({
  open,
  sale,
  handleOnClose
}) => {
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image states
  const [ineImage, setIneImage] = useState<File | null>(null);
  const [frontalImage, setFrontalImage] = useState<File | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);
  
  // Image preview URLs
  const [inePreview, setInePreview] = useState<string | null>(null);
  const [frontalPreview, setFrontalPreview] = useState<string | null>(null);
  const [labelPreview, setLabelPreview] = useState<string | null>(null);

  const handleClose = () => {
    if (!loading) {
      setDeliveryDate(new Date());
      setError(null);
      // Clear images
      setIneImage(null);
      setFrontalImage(null);
      setLabelImage(null);
      setInePreview(null);
      setFrontalPreview(null);
      setLabelPreview(null);
      handleOnClose(false);
    }
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (
    setImage: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!deliveryDate) {
      setError('Debe seleccionar una fecha de entrega');
      return;
    }

    // Validate images
    if (!ineImage) {
      setError('Debe subir la foto del INE');
      return;
    }
    if (!frontalImage) {
      setError('Debe subir la foto frontal');
      return;
    }
    if (!labelImage) {
      setError('Debe subir la foto de la etiqueta o serie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('saleId', sale._id);
      formData.append('deliveryDate', deliveryDate.toISOString());
      formData.append('ineImage', ineImage);
      formData.append('frontalImage', frontalImage);
      formData.append('labelImage', labelImage);

      const result = await completeSaleDelivery(formData);

      if (result.error) {
        setError(result.msg || 'Error al completar la entrega');
      } else {
        setDeliveryDate(new Date());
        setIneImage(null);
        setFrontalImage(null);
        setLabelImage(null);
        setInePreview(null);
        setFrontalPreview(null);
        setLabelPreview(null);
        handleOnClose(true, result.msg || 'Entrega completada exitosamente');
      }
    } catch (err: any) {
      console.error('Error completing delivery:', err);
      setError(err.message || 'Error al completar la entrega. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Completar Entrega de Venta
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Sale Information */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Información de la Venta
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Folio:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {sale.saleNum}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Equipo:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {sale.machine?.machineNum || sale.serialNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Cliente:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {sale.customer?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${sale.totalAmount?.toLocaleString('es-MX')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Pago Inicial:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${sale.initialPayment?.toLocaleString('es-MX')}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Delivery Date */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de Entrega"
              value={deliveryDate}
              onChange={(newValue) => setDeliveryDate(newValue as Date | null)}
              renderInput={(params) => (
                <Box sx={{ width: '100%' }}>
                  <TextField
                    {...params}
                    fullWidth
                    required
                    helperText="Esta será la fecha oficial de la venta y el inicio de los pagos"
                  />
                </Box>
              )}
            />
          </LocalizationProvider>

          {/* Image Upload Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Fotos Requeridas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {/* INE Image */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Foto de INE *
                  </Typography>
                  {inePreview ? (
                    <Card>
                      <CardMedia
                        component="img"
                        height="150"
                        image={inePreview}
                        alt="INE"
                      />
                      <CardActions sx={{ justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(setIneImage, setInePreview)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<PhotoCamera />}
                      sx={{ height: 150 }}
                    >
                      Subir Foto
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setIneImage, setInePreview)}
                      />
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Frontal Image */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Frente *
                  </Typography>
                  {frontalPreview ? (
                    <Card>
                      <CardMedia
                        component="img"
                        height="150"
                        image={frontalPreview}
                        alt="Frente"
                      />
                      <CardActions sx={{ justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(setFrontalImage, setFrontalPreview)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<PhotoCamera />}
                      sx={{ height: 150 }}
                    >
                      Subir Foto
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setFrontalImage, setFrontalPreview)}
                      />
                    </Button>
                  )}
                </Box>
              </Grid>

              {/* Label/Serial Image */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Etiqueta o Serie *
                  </Typography>
                  {labelPreview ? (
                    <Card>
                      <CardMedia
                        component="img"
                        height="150"
                        image={labelPreview}
                        alt="Etiqueta"
                      />
                      <CardActions sx={{ justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveImage(setLabelImage, setLabelPreview)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<PhotoCamera />}
                      sx={{ height: 150 }}
                    >
                      Subir Foto
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setLabelImage, setLabelPreview)}
                      />
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Al completar la entrega:
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>La venta se registrará como activa</li>
              <li>El equipo se marcará como vendido</li>
              <li>Se iniciará el calendario de pagos semanales</li>
            </ul>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !deliveryDate || !ineImage || !frontalImage || !labelImage}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Completando...' : 'Completar Entrega'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteSaleDeliveryModal;
