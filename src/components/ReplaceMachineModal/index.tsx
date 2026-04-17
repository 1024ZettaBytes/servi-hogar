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
  replaceRentalMachine,
  getInactiveRentalMachines
} from '../../../lib/client/warehouseMachinesFetch';
import {
  useGetAllWarehousesOverview,
  getFetcher
} from '../../../pages/api/useRequest';

interface ReplaceMachineModalProps {
  open: boolean;
  handleOnClose: (replaced: boolean, msg?: string) => void;
  machine: any;
}

const ReplaceMachineModal: FC<ReplaceMachineModalProps> = ({
  open,
  handleOnClose,
  machine
}) => {
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactiveMachines, setInactiveMachines] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadError, setLoadError] = useState('');

  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);

  useEffect(() => {
    if (open) {
      loadInactiveMachines();
    }
  }, [open]);

  const loadInactiveMachines = async () => {
    setLoadingMachines(true);
    setLoadError('');
    const result = await getInactiveRentalMachines();
    setLoadingMachines(false);
    if (!result.error) {
      setInactiveMachines(result.data || []);
    } else {
      setLoadError(result.msg);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMachine || !selectedWarehouse) return;
    setIsSubmitting(true);
    const result = await replaceRentalMachine(
      machine._id,
      selectedMachine,
      selectedWarehouse
    );
    setIsSubmitting(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      handleOnClose(false, result.msg);
    }
  };

  const handleClose = () => {
    setSelectedMachine('');
    setSelectedWarehouse('');
    handleOnClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reemplazar equipo de renta</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Máquina de almacén <strong>#{machine?.entryNumber}</strong> — {machine?.brand}
            {machine?.serialNumber ? ` (Serie: ${machine.serialNumber})` : ''}
          </Alert>
          <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>ATENCIÓN</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta máquina acondicionada tomará el número del equipo de numerado en bodega que seleccione.
            El equipo seleccionado quedará marcado como reemplazado y la nueva máquina
            quedará con estado LISTO en la ubicación seleccionada.
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
            <>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>Equipo a reemplazar</InputLabel>
                <Select
                  value={selectedMachine}
                  label="Equipo a reemplazar"
                  onChange={(e) => setSelectedMachine(e.target.value)}
                >
                  {inactiveMachines.length === 0 && (
                    <MenuItem value="" disabled>
                      No hay equipos inactivos disponibles
                    </MenuItem>
                  )}
                  {inactiveMachines.map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      #{m.machineNum} — {m.brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Ubicación destino</InputLabel>
                <Select
                  value={selectedWarehouse}
                  label="Almacén destino"
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  {(warehousesList || []).map((wh) => (
                    <MenuItem key={wh._id} value={wh._id}>
                      {wh.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
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
          disabled={!selectedMachine || !selectedWarehouse || isSubmitting || loadingMachines}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Reemplazando...' : 'Reemplazar equipo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ReplaceMachineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  machine: PropTypes.object.isRequired
};

export default ReplaceMachineModal;
