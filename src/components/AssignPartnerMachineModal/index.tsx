import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  assignMachineToPartner,
  getAvailableMachinesForPartnerAssignment
} from '../../../lib/client/partnersFetch';

function AssignPartnerMachineModal(props) {
  const { handleOnClose, open, partnersList = [] } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [availableMachines, setAvailableMachines] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  useEffect(() => {
    if (!open) {
      setSelectedPartner(null);
      setSelectedMachine(null);
      setHasError({ error: false, msg: '' });
      return;
    }

    let active = true;

    const loadAssignableMachines = async () => {
      setIsLoadingMachines(true);
      const result = await getAvailableMachinesForPartnerAssignment();
      if (!active) return;

      if (!result.error) {
        setAvailableMachines(result.data || []);
      } else {
        setHasError({ error: true, msg: result.msg });
      }

      setIsLoadingMachines(false);
    };

    loadAssignableMachines();

    return () => {
      active = false;
    };
  }, [open]);

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setSelectedPartner(null);
    setSelectedMachine(null);
    handleOnClose(false);
  };

  async function submitHandler(event) {
    event.preventDefault();

    if (!selectedPartner) {
      setHasError({ error: true, msg: 'Debe seleccionar un socio.' });
      return;
    }

    if (!selectedMachine) {
      setHasError({ error: true, msg: 'Debe seleccionar un equipo disponible.' });
      return;
    }

    setIsSubmitting(true);
    setHasError({ error: false, msg: '' });

    const result = await assignMachineToPartner({
      userId: selectedPartner?.user?._id || selectedPartner?._id,
      machineId: selectedMachine?._id
    });

    setIsSubmitting(false);

    if (!result.error) {
      setSelectedPartner(null);
      setSelectedMachine(null);
      handleOnClose(true, result.msg);
      return;
    }

    setHasError({ error: true, msg: result.msg });
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" scroll="body">
      <Card>
        <CardHeader title="Asignar equipo a socio" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={partnersList}
                  value={selectedPartner}
                  onChange={(_event, newValue) => {
                    setSelectedPartner(newValue);
                    setSelectedMachine(null);
                  }}
                  getOptionLabel={(partner) => partner?.user?.name || 'Sin nombre'}
                  isOptionEqualToValue={(option, value) =>
                    option?._id === value?._id
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Socio" required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                {isLoadingMachines ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Autocomplete
                    options={availableMachines}
                    value={selectedMachine}
                    onChange={(_event, newValue) => setSelectedMachine(newValue)}
                    getOptionLabel={(machine) =>
                      machine?.label || `#${machine?.machineNum || ''}`
                    }
                    noOptionsText="No hay equipos activos disponibles"
                    isOptionEqualToValue={(option, value) =>
                      option?._id === value?._id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Equipo disponible"
                        required
                      />
                    )}
                  />
                )}
              </Grid>

              {availableMachines.length === 0 && !isLoadingMachines ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No hay equipos activos sin socio asignado.
                  </Typography>
                </Grid>
              ) : null}

              {hasError.error ? (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              ) : null}

              <Grid item xs={12} container spacing={2} justifyContent="flex-end">
                <Grid item>
                  <Button onClick={handleClose} color="error">
                    Cancelar
                  </Button>
                </Grid>
                <Grid item>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    disabled={isLoadingMachines || !selectedPartner || !selectedMachine}
                  >
                    Guardar
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

AssignPartnerMachineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  partnersList: PropTypes.array
};

export default AssignPartnerMachineModal;
