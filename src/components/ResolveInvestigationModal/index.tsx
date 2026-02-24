import React, { FC, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { MuiFileInput } from 'mui-file-input';
import { compressImage } from '../../../lib/client/utils';
import { useSnackbar } from 'notistack';
import { useGetAllWarehousesOverview, useGetAllVehicles, useGetMachinesStatus } from '../../../pages/api/useRequest';
import { getFetcher } from '../../../pages/api/useRequest';
import { resolveInvestigationReq } from '../../../lib/client/pickupsFetch';

interface ResolveInvestigationModalProps {
  open: boolean;
  pickup: any;
  onClose: () => void;
  onConfirm: () => void;
  userRole: string;
}

const ResolveInvestigationModal: FC<ResolveInvestigationModalProps> = ({
  open,
  pickup,
  onClose,
  onConfirm,
  userRole
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const [statusId, setStatusId] = useState<string>('');
  const [locationType, setLocationType] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [attached, setAttached] = useState<any>({
    evidence: { file: null, url: null, error: false }
  });
  const [isLoading, setIsLoading] = useState(false);

  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);
  const { vehiclesList } = useGetAllVehicles(getFetcher);
  const { machinesStatusList } = useGetMachinesStatus(getFetcher);

  const canSubmit = statusId && locationType && locationId && reason.trim() && attached.evidence?.file && !attached.evidence?.error;

  const handleClose = () => {
    setStatusId('');
    setLocationType('');
    setLocationId('');
    setReason('');
    setAttached({ evidence: { file: null, url: null, error: false } });
    onClose();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const resolveData = {
        pickupId: pickup._id,
        statusId,
        locationType,
        locationId,
        reason
      };

      const result = await resolveInvestigationReq(resolveData, attached.evidence.file);

      if (!result.error) {
        enqueueSnackbar(result.msg || 'Investigación resuelta exitosamente', {
          variant: 'success',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          },
          autoHideDuration: 2000
        });
        onConfirm();
        handleClose();
      } else {
        throw new Error(result.msg || 'Error al resolver la investigación');
      }
    } catch (e: any) {
      enqueueSnackbar(e.message, {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Marcar Equipo #{pickup?.machine?.machineNum || pickup?.rent?.machine?.machineNum} como Encontrado</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa los detalles sobre el estado del equipo y su confirmación de paradero para finalizar su estado de investigación.
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Estado Físico Actual</InputLabel>
            <Select
              value={statusId}
              label="Estado Físico Actual"
              onChange={(e) => setStatusId(e.target.value)}
              disabled={isLoading}
            >
              {machinesStatusList &&
                machinesStatusList
                  .filter((s: any) => !['RENTADO', 'INVES', 'PERDIDO'].includes(s.id))
                  .map((status: any) => (
                    <MenuItem key={status._id} value={status._id}>
                      {status.description}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Ubicación</InputLabel>
            <Select
              value={locationType}
              label="Tipo de Ubicación"
              onChange={(e) => {
                setLocationType(e.target.value);
                setLocationId('');
              }}
              disabled={isLoading}
            >
              <MenuItem value="warehouse">Bodega</MenuItem>
              <MenuItem value="vehicle">Vehículo</MenuItem>
            </Select>
          </FormControl>

          {locationType === 'warehouse' && (
            <FormControl fullWidth size="small">
              <InputLabel>Bodega</InputLabel>
              <Select
                value={locationId}
                label="Bodega"
                onChange={(e) => setLocationId(e.target.value)}
                disabled={isLoading}
              >
                {warehousesList &&
                  warehousesList
                    .filter((warehouse: any) =>
                      userRole !== 'ADMIN'
                        ? !(
                          warehouse.name.includes('Chica') ||
                          warehouse.name === 'Desconocida'
                        )
                        : true
                    )
                    .map((warehouse: any) => (
                      <MenuItem key={warehouse._id} value={warehouse._id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          )}

          {locationType === 'vehicle' && (
            <FormControl fullWidth size="small">
              <InputLabel>Vehículo (Operador)</InputLabel>
              <Select
                value={locationId}
                label="Vehículo (Operador)"
                onChange={(e) => setLocationId(e.target.value)}
                disabled={isLoading}
              >
                {vehiclesList &&
                  vehiclesList.map((vehicle: any) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.operator?.name || 'Vehículo sin operador'}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            size="small"
            label="Explicación / Razón"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            placeholder="Describe brevemente cómo o por qué el equipo apareció, o la razón por la que estuvo como 'En investigación'."
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fotografía Evidencia
            </Typography>
            <MuiFileInput
              fullWidth
              size="small"
              inputProps={{ capture: 'environment', accept: 'image/*,application/pdf' }}
              value={attached.evidence?.file}
              disabled={isLoading}
              placeholder={'Subir Evidencia...'}
              onChange={async (file) => {
                if (!file) {
                  setAttached({
                    evidence: { file: null, url: null, error: false }
                  });
                  return;
                }

                if (!file.type.includes('image/') && !file.type.includes('/pdf')) {
                  setAttached({
                    evidence: { ...attached.evidence, error: true }
                  });
                  return;
                }

                if (file.type.includes('/pdf')) {
                  const url = URL.createObjectURL(file);
                  setAttached({ evidence: { file, url, error: false } });
                } else {
                  const result = await compressImage(file);
                  if (result) {
                    setAttached({ evidence: { file: result.file, url: result.url, error: false } });
                  } else {
                    const url = URL.createObjectURL(file);
                    setAttached({ evidence: { file, url, error: false } });
                  }
                }
              }}
            />
            {attached.evidence?.error && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                Seleccione un archivo válido (*.jpg, *.jpeg, *.png, *.pdf).
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!canSubmit}
        >
          Guardar y Encontrar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ResolveInvestigationModal;
