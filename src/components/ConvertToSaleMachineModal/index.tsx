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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { convertMachineToSale } from '../../../lib/client/machinesFetch';
import { compressImage } from '../../../lib/client/utils';
import { getFetcher, useGetUsers } from '../../../pages/api/useRequest';

function ConvertToSaleMachineModal(props) {
  const { handleOnClose, open, machineId, machineNum } = props;

  const { userList } = useGetUsers(getFetcher);
  const technicians = (userList || []).filter(
    (u) => u.isActive && u.role?.id === 'TEC'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [serialNumber, setSerialNumber] = useState('');
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!selectedTechnician) {
      setHasError({ error: true, msg: 'Por favor seleccione un técnico para el acondicionamiento' });
      setIsLoading(false);
      return;
    }

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
    formData.append('technicianId', selectedTechnician);
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
    setSelectedTechnician('');
    handleOnClose(false);
  };

  const handleSaved = (successMessage) => {
    setSerialNumber('');
    setPhoto1(null);
    setPhoto2(null);
    setSelectedTechnician('');
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
                  Esta acción desactivará el equipo de renta y lo enviará a
                  acondicionamiento. Una vez que el técnico lo termine, el equipo
                  estará disponible para venta.
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
                <FormControl fullWidth required>
                  <InputLabel id="technician-label">Técnico de Acondicionamiento</InputLabel>
                  <Select
                    labelId="technician-label"
                    id="technicianId"
                    value={selectedTechnician}
                    label="Técnico de Acondicionamiento"
                    onChange={(e) => setSelectedTechnician(e.target.value as string)}
                  >
                    {technicians.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>
                        {tech.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    Enviar a Acondicionamiento
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

