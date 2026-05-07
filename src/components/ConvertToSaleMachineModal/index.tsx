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
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { convertMachineToSale } from '../../../lib/client/machinesFetch';
import { compressImage } from '../../../lib/client/utils';

function ConvertToSaleMachineModal(props) {
  const { handleOnClose, open, machineId, machineNum } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [serialNumber, setSerialNumber] = useState('');
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!photo1 || !photo2) {
      setHasError({
        error: true,
        msg: 'Por favor suba ambas fotos del equipo'
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('machineId', machineId);
    formData.append('serialNumber', serialNumber);
    formData.append('photo1', photo1);
    formData.append('photo2', photo2);

    const result = await convertMachineToSale(formData);

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
    setSerialNumber('');
    setPhoto1(null);
    setPhoto2(null);
    handleOnClose(false);
  };

  const handleSaved = (successMessage) => {
    setSerialNumber('');
    setPhoto1(null);
    setPhoto2(null);
    setHasError({ error: false, msg: '' });
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader
          title="Convertir a Equipo de Venta"
          subheader={`Equipo #${machineNum}`}
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
                <Alert severity="warning">
                  Esta acción desactivará el equipo de renta actual y creará un
                  nuevo equipo de venta con sus datos.
                </Alert>
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="serialNumber"
                  name="serialNumber"
                  label="Número de Serie"
                  fullWidth={true}
                  value={serialNumber}
                  required
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  color={photo1 ? 'success' : 'primary'}
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
                  color={photo2 ? 'success' : 'primary'}
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
                    color="success"
                  >
                    Convertir
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

ConvertToSaleMachineModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  machineId: PropTypes.string,
  machineNum: PropTypes.number
};

ConvertToSaleMachineModal.defaultProps = {
  open: false,
  machineId: '',
  machineNum: 0
};

export default ConvertToSaleMachineModal;
