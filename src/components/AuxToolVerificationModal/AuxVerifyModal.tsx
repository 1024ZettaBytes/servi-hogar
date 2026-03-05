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
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { MuiFileInput } from 'mui-file-input';
import Image from 'next/image';
import { compressImage } from 'lib/client/utils';
import { auxVerifyToolAssignment } from '../../../lib/client/toolsFetch';

function AuxVerifyModal(props) {
  const { handleOnClose, open, assignment } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [photo, setPhoto] = useState<any>({ file: null, url: null });
  const [badFormat, setBadFormat] = useState(false);

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!photo.file) {
      setHasError({
        error: true,
        msg: 'La foto de verificación es requerida.'
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    const body = {
      assignmentId: assignment._id
    };
    formData.append('body', JSON.stringify(body));
    formData.append('photo', photo.file);

    const result = await auxVerifyToolAssignment(formData);
    setIsLoading(false);

    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  return (
    <Dialog fullWidth maxWidth="md" open={open} scroll={'body'}>
      <Card>
        <CardHeader
          title={`Verificar herramientas de ${assignment?.technician?.name}`}
          subheader={
            assignment?.replacedTechnician
              ? `Reemplaza a: ${assignment.replacedTechnician.name}`
              : 'Verificación de herramientas asignadas'
          }
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Lista de herramientas asignadas
                </Typography>
                <List dense>
                  {assignment?.tools?.map((t, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={t.tool?.name || 'Herramienta'}
                        secondary={`Cantidad: ${t.quantity}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  Tome una foto de las herramientas junto con el técnico como
                  evidencia de la entrega. Una vez guardada, todos los
                  auxiliares serán desbloqueados.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Foto de evidencia *
                </Typography>
              </Grid>

              {photo.url && (
                <Grid item xs={12}>
                  <Image
                    src={photo.url}
                    alt="Foto de verificación"
                    width={300}
                    height={200}
                    style={{ objectFit: 'contain' }}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <MuiFileInput
                  placeholder="No seleccionada"
                  label="Foto de verificación"
                  value={photo.file}
                  onChange={async (file) => {
                    if (!file) {
                      setPhoto({ file: null, url: null });
                      return;
                    }
                    if (!file.type.includes('image/')) {
                      setBadFormat(true);
                      setPhoto({ file: null, url: null });
                      return;
                    }
                    const result = await compressImage(file);
                    if (result) {
                      setPhoto({ file: result.file, url: result.url });
                    } else {
                      const url = URL.createObjectURL(file);
                      setPhoto({ file, url });
                    }
                    setBadFormat(false);
                  }}
                />
                {badFormat && (
                  <Typography color="error" variant="caption">
                    Seleccione una imagen válida (*.jpg, *.jpeg, *.png).
                  </Typography>
                )}
              </Grid>

              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Grid
                  container
                  direction="row"
                  justifyContent="flex-end"
                  spacing={2}
                >
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={() => handleOnClose(false)}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                      disabled={!photo.file}
                    >
                      Verificar y Guardar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AuxVerifyModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  assignment: PropTypes.object.isRequired
};

export default AuxVerifyModal;
