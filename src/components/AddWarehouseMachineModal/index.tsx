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
  Alert,
  MenuItem
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { saveWarehouseMachine } from '../../../lib/client/warehouseMachinesFetch';
import { compressImage } from '../../../lib/client/utils';
import {
  useGetAllWarehousesOverview,
  getFetcher
} from '../../../pages/api/useRequest';

const PHOTO_LABELS = ['Frente', 'Tablero', 'Etiqueta', 'Debajo'];

function AddWarehouseMachineModal(props) {
  const { handleOnClose, open } = props;
  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [brand, setBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cost, setCost] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [photos, setPhotos] = useState([null, null, null, null]);

  const handlePhotoChange = async (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const result = await compressImage(e.target.files[0]);
      if (result) {
        setPhotos((prev) => {
          const updated = [...prev];
          updated[index] = result.file;
          return updated;
        });
      }
    }
  };

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!brand || !photos[0] || !photos[1] || !photos[2] || !photos[3]) {
      setHasError({
        error: true,
        msg: 'Por favor complete la marca y suba las 4 fotos obligatorias'
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('serialNumber', serialNumber);
    formData.append('cost', cost);
    if (warehouseId) formData.append('warehouseId', warehouseId);
    photos.forEach((photo, i) => {
      if (photo) formData.append(`photo${i + 1}`, photo);
    });

    const result = await saveWarehouseMachine(formData);

    setIsLoading(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setBrand('');
    setSerialNumber('');
    setCost('');
    setWarehouseId('');
    setPhotos([null, null, null, null]);
    handleOnClose(false);
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader
          title="Registrar Máquina en Almacén"
          subheader="Ingreso de máquina nueva (Mexicali). El número de ingreso se asignará automáticamente."
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
                  id="serialNumber"
                  name="serialNumber"
                  label="Número de Serie"
                  fullWidth={true}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
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
                  select
                  id="warehouseId"
                  name="warehouseId"
                  label="Ubicación"
                  fullWidth={true}
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  {warehousesList?.map((wh) => (
                    <MenuItem key={wh._id} value={wh._id}>
                      {wh.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {PHOTO_LABELS.map((label, index) => (
                <Grid item lg={12} key={index}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    color={photos[index] ? 'success' : 'primary'}
                  >
                    {photos[index]
                      ? `${label}: ${photos[index].name}`
                      : `Foto ${label} *`}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(index, e)}
                    />
                  </Button>
                </Grid>
              ))}

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
                    Registrar
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

AddWarehouseMachineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired
};

export default AddWarehouseMachineModal;
