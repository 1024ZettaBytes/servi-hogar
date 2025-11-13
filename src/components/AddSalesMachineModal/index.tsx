import PropTypes from 'prop-types';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { saveSalesMachine } from '../../../lib/client/salesMachinesFetch';
import { compressImage } from '../../../lib/client/utils';

function AddSalesMachineModal(props) {
  const { handleOnClose, open } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [brand, setBrand] = useState('');
  const [capacity, setCapacity] = useState('');
  const [cost, setCost] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!brand || !cost || !photo1 || !photo2) {
      setHasError({ 
        error: true, 
        msg: 'Por favor complete todos los campos requeridos y suba ambas fotos' 
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('capacity', capacity);
    formData.append('cost', cost);
    formData.append('serialNumber', serialNumber);
    formData.append('photo1', photo1);
    formData.append('photo2', photo2);

    const result = await saveSalesMachine(formData);

    setIsLoading(false);
    if (!result.error) {
      handleSaved(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setBrand('');
    setCapacity('');
    setCost('');
    setSerialNumber('');
    setPhoto1(null);
    setPhoto2(null);
    handleOnClose(false);
  };

  const handleSaved = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader 
          title="Agregar Equipo de Venta" 
          subheader="El número de equipo se asignará automáticamente"
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="xs"
            >
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="brand"
                  name="brand"
                  label="Marca"
                  fullWidth={true}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="capacity"
                  name="capacity"
                  label="Capacidad"
                  fullWidth={true}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="cost"
                  name="cost"
                  label="Costo ($)"
                  fullWidth={true}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="serialNumber"
                  name="serialNumber"
                  label="Número de Serie"
                  fullWidth={true}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  color={photo1 ? "success" : "primary"}
                >
                  {photo1 ? `Foto 1: ${photo1.name}` : 'Seleccionar Foto 1 *'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const result = await compressImage(e.target.files[0]);
                        if (result) {
                          setPhoto1(result.file);
                        }
                      }
                    }}
                  />
                </Button>
              </Grid>

              <Grid item lg={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  color={photo2 ? "success" : "primary"}
                >
                  {photo2 ? `Foto 2: ${photo2.name}` : 'Seleccionar Foto 2 *'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const result = await compressImage(e.target.files[0]);
                        if (result) {
                          setPhoto2(result.file);
                        }
                      }
                    }}
                  />
                </Button>
              </Grid>

              {hasError.error && (
                <Grid item lg={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid
                item
                container
                direction="row"
                justifyContent="center"
                lg={12}
                spacing={2}
              >
                <Grid item>
                  <Button onClick={handleClose} color="error">
                    Cancelar
                  </Button>
                </Grid>
                <Grid item>
                  <LoadingButton
                    loading={isLoading}
                    type="submit"
                    variant="contained"
                  >
                    Guardar
                  </LoadingButton>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AddSalesMachineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired
};

export default AddSalesMachineModal;
