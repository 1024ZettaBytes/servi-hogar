import { FC, useState } from 'react';
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
import { loadToVehicle } from '../../../lib/client/warehouseMachinesFetch';
import {
  useGetOperators,
  getFetcher
} from '../../../pages/api/useRequest';

interface LoadToVehicleModalProps {
  open: boolean;
  handleOnClose: (loaded: boolean, msg?: string) => void;
  machine: any;
}

const LoadToVehicleModal: FC<LoadToVehicleModalProps> = ({
  open,
  handleOnClose,
  machine
}) => {
  const [selectedOperator, setSelectedOperator] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { operatorsList } = useGetOperators(getFetcher);

  const handleSubmit = async () => {
    if (!selectedOperator) return;
    setIsSubmitting(true);
    const result = await loadToVehicle(machine._id, selectedOperator);
    setIsSubmitting(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      handleOnClose(false, result.msg);
    }
  };

  return (
    <Dialog open={open} onClose={() => handleOnClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Cargar máquina al vehículo</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Máquina <strong>#{machine?.entryNumber}</strong> — {machine?.brand}
            {machine?.serialNumber ? ` (Serie: ${machine.serialNumber})` : ''}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccione el operador a cuyo vehículo se cargará esta máquina.
            La máquina estará disponible para reemplazos en las rentas asignadas a este operador.
          </Typography>
          <FormControl fullWidth required>
            <InputLabel>Operador</InputLabel>
            <Select
              value={selectedOperator}
              label="Operador"
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              {(operatorsList || []).map((op) => (
                <MenuItem key={op._id} value={op._id}>
                  {op.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => handleOnClose(false)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedOperator || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Cargando...' : 'Cargar al vehículo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

LoadToVehicleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  machine: PropTypes.object.isRequired
};

export default LoadToVehicleModal;
