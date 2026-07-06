import { FC, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import {
  applyRentalReplacement,
  getConditionedWarehouseMachines
} from '../../../lib/client/warehouseMachinesFetch';

interface ApplyReplacementModalProps {
  open: boolean;
  handleOnClose: (replaced: boolean, msg?: string) => void;
  machine: any;
}

const ApplyReplacementModal: FC<ApplyReplacementModalProps> = ({
  open,
  handleOnClose,
  machine
}) => {
  const [selectedWarehouseMachine, setSelectedWarehouseMachine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conditionedMachines, setConditionedMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (open) {
      loadConditionedMachines();
    }
  }, [open]);

  const loadConditionedMachines = async () => {
    setLoadingMachines(true);
    setLoadError('');
    const result = await getConditionedWarehouseMachines();
    setLoadingMachines(false);
    if (!result.error) {
      setConditionedMachines(result.data || []);
    } else {
      setLoadError(result.msg);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWarehouseMachine) return;
    setIsSubmitting(true);
    const result = await applyRentalReplacement(
      selectedWarehouseMachine,
      machine._id
    );
    setIsSubmitting(false);
    handleOnClose(!result.error, result.msg);
    if (!result.error) {
      setSelectedWarehouseMachine('');
    }
  };

  const handleClose = () => {
    setSelectedWarehouseMachine('');
    handleOnClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aplicar reemplazo de equipo rentado</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Equipo rentado <strong>#{machine?.machineNum}</strong> — {machine?.brand}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El equipo de almacén acondicionado que selecciones pasará a ser el
            equipo de renta con el número <strong>#{machine?.machineNum}</strong>.
            El equipo actual quedará desactivado y marcado como reemplazado.
          </Typography>

          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

          {loadingMachines ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : (
            <FormControl fullWidth required>
              <InputLabel>Equipo de almacén acondicionado</InputLabel>
              <Select
                value={selectedWarehouseMachine}
                label="Equipo de almacén acondicionado"
                onChange={(e) => setSelectedWarehouseMachine(e.target.value)}
              >
                {conditionedMachines.length === 0 && (
                  <MenuItem value="" disabled>
                    No hay equipos acondicionados disponibles
                  </MenuItem>
                )}
                {conditionedMachines.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    Entrada #{m.entryNumber} — {m.brand}
                    {m.serialNumber ? ` (Serie: ${m.serialNumber})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!selectedWarehouseMachine || isSubmitting || loadingMachines}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Aplicando...' : 'Aplicar reemplazo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ApplyReplacementModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  machine: PropTypes.object.isRequired
};

export default ApplyReplacementModal;
