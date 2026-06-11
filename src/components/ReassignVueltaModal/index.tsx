import PropTypes from 'prop-types';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Grid,
  Alert,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useSWR from 'swr';
import { reassignVuelta } from '../../../lib/client/vueltasFetch';

const fetcher = (url) => fetch(url).then((res) => res.json());

interface ReassignVueltaModalProps {
  open: boolean;
  task: any;
  handleOnClose: (saved: boolean, msg?: string) => void;
}

const TYPE_LABELS = {
  ENTREGA: 'Entrega (renta)',
  RECOLECCION: 'Recolección (renta)',
  CAMBIO: 'Cambio (renta)',
  RECOLECCION_VENTA: 'Recolección de garantía',
  CAMBIO_VENTA: 'Cambio de garantía',
  COBRANZA: 'Cobranza',
  ENTREGA_VENTA: 'Entrega de venta',
  VUELTA_EXTRA: 'Vuelta extra'
};

export default function ReassignVueltaModal({
  open,
  task,
  handleOnClose
}: ReassignVueltaModalProps) {
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: operatorsData } = useSWR(
    open ? '/api/operators' : null,
    fetcher
  );
  const operatorsList = operatorsData?.data || [];

  const customerName =
    task?.rent?.customer?.name ||
    task?.sale?.customer?.name ||
    task?.destination ||
    'N/A';
  const currentOperator =
    task?.operator?.name || task?.assignedTo?.name || 'Sin asignar';

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setSelectedOperator(null);
    handleOnClose(false);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });
    if (!selectedOperator) {
      setHasError({ error: true, msg: 'Debe seleccionar un operador' });
      return;
    }
    setIsSubmitting(true);
    const result = await reassignVuelta({
      taskType: task.type,
      taskId: task._id,
      operatorId: selectedOperator._id || selectedOperator.id
    });
    setIsSubmitting(false);
    if (!result.error) {
      setSelectedOperator(null);
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth="xs" scroll="body">
      <Card>
        <CardHeader title="Reasignar vuelta" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tipo de vuelta
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {TYPE_LABELS[task?.type] || task?.type}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Cliente / destino
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {customerName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Operador actual
                  </Typography>
                  <Typography variant="body2">{currentOperator}</Typography>
                </Box>
              </Grid>

              <Grid item>
                <Autocomplete
                  options={operatorsList}
                  getOptionLabel={(option) => option.name}
                  value={selectedOperator}
                  onChange={(_event, newValue) => {
                    setSelectedOperator(newValue);
                    setHasError({ error: false, msg: '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nuevo operador"
                      required
                      error={hasError.error && !selectedOperator}
                    />
                  )}
                  disabled={isSubmitting}
                />
              </Grid>

              {hasError.error && (
                <Grid item>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid item>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                  >
                    Reasignar
                  </LoadingButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

ReassignVueltaModal.propTypes = {
  open: PropTypes.bool.isRequired,
  task: PropTypes.object,
  handleOnClose: PropTypes.func.isRequired
};
