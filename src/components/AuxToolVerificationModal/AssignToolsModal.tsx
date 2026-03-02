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
  Checkbox,
  FormControlLabel,
  Typography,
  TextField
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { MuiFileInput } from 'mui-file-input';
import Image from 'next/image';
import { compressImage } from 'lib/client/utils';
import { assignToolsToTechnician } from '../../../lib/client/toolsFetch';

function AssignToolsModal(props) {
  const { handleOnClose, open, technician, tools, currentAssignment } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedTools, setSelectedTools] = useState(() => {
    // Build a map of currently assigned tools: toolId -> quantity
    const assignedMap = new Map();
    if (currentAssignment?.tools) {
      for (const at of currentAssignment.tools) {
        const toolId = at.tool?._id || at.tool;
        assignedMap.set(toolId, at.quantity || 1);
      }
    }
    const hasAssignment = assignedMap.size > 0;
    return tools.map((t) => ({
      tool: t._id,
      name: t.name,
      selected: hasAssignment ? assignedMap.has(t._id) : true,
      quantity: hasAssignment ? (assignedMap.get(t._id) || 1) : 1
    }));
  });
  const [photo, setPhoto] = useState<any>({ file: null, url: null });
  const [badFormat, setBadFormat] = useState(false);

  const handleToolToggle = (toolId) => {
    setSelectedTools((prev) =>
      prev.map((t) =>
        t.tool === toolId ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const handleQuantityChange = (toolId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelectedTools((prev) =>
      prev.map((t) => (t.tool === toolId ? { ...t, quantity: qty } : t))
    );
  };

  const selectedCount = selectedTools.filter((t) => t.selected).length;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    const toolsList = selectedTools
      .filter((t) => t.selected)
      .map((t) => ({ tool: t.tool, quantity: t.quantity }));

    if (toolsList.length === 0) {
      setHasError({ error: true, msg: 'Seleccione al menos una herramienta.' });
      setIsLoading(false);
      return;
    }

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
      technicianId: technician._id,
      toolsList
    };
    formData.append('body', JSON.stringify(body));
    formData.append('photo', photo.file);

    const result = await assignToolsToTechnician(formData);
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
          title={`Asignar herramientas a ${technician?.name}`}
          subheader="Seleccione las herramientas y tome una foto como evidencia"
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Herramientas ({selectedCount} seleccionadas)
                </Typography>
              </Grid>
              {selectedTools.map((t) => (
                <Grid item xs={12} sm={6} key={t.tool}>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: t.selected ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: t.selected ? 'primary.lighter' : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={t.selected}
                          onChange={() => handleToolToggle(t.tool)}
                        />
                      }
                      label={t.name}
                      sx={{ flex: 1 }}
                    />
                    {t.selected && (
                      <TextField
                        type="number"
                        size="small"
                        label="Cant."
                        value={t.quantity}
                        onChange={(e) =>
                          handleQuantityChange(t.tool, e.target.value)
                        }
                        sx={{ width: 80 }}
                        inputProps={{ min: 1 }}
                      />
                    )}
                  </Box>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
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
                      disabled={selectedCount === 0 || !photo.file}
                    >
                      Guardar
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

AssignToolsModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  technician: PropTypes.object.isRequired,
  tools: PropTypes.array.isRequired,
  currentAssignment: PropTypes.object
};

export default AssignToolsModal;
