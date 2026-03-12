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
import { assignTechnician } from '../../../lib/client/warehouseMachinesFetch';
import {
  useGetAllWarehousesOverview,
  getFetcher
} from '../../../pages/api/useRequest';

interface AssignTechnicianModalProps {
  open: boolean;
  handleOnClose: (assigned: boolean, msg?: string) => void;
  machine: any;
  techniciansList: any[];
}

const AssignTechnicianModal: FC<AssignTechnicianModalProps> = ({
  open,
  handleOnClose,
  machine,
  techniciansList
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);

  const handleSubmit = async () => {
    if (!selectedTechnician || !selectedWarehouse) return;
    setIsSubmitting(true);
    const result = await assignTechnician(machine._id, selectedTechnician, selectedWarehouse);
    setIsSubmitting(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      handleOnClose(false, result.msg);
    }
  };

  return (
    <Dialog open={open} onClose={() => handleOnClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar técnico para acondicionamiento</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Máquina <strong>#{machine?.entryNumber}</strong> — {machine?.brand}
            {machine?.serialNumber ? ` (Serie: ${machine.serialNumber})` : ''}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccione el técnico que realizará el acondicionamiento de esta máquina.
            Una vez asignado, el técnico tendrá 72 horas para completar el proceso.
          </Typography>
          <FormControl fullWidth required>
            <InputLabel>Técnico</InputLabel>
            <Select
              value={selectedTechnician}
              label="Técnico"
              onChange={(e) => setSelectedTechnician(e.target.value)}
            >
              {techniciansList.map((tec) => (
                <MenuItem key={tec._id} value={tec._id}>
                  {tec.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required sx={{ mt: 2 }}>
            <InputLabel>Ubicación destino</InputLabel>
            <Select
              value={selectedWarehouse}
              label="Ubicación destino"
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              {(warehousesList || []).map((wh) => (
                <MenuItem key={wh._id} value={wh._id}>
                  {wh.name}
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
          disabled={!selectedTechnician || !selectedWarehouse || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Asignando...' : 'Asignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AssignTechnicianModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  machine: PropTypes.object.isRequired,
  techniciansList: PropTypes.array.isRequired
};

export default AssignTechnicianModal;
