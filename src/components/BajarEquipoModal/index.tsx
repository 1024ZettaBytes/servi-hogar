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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

interface BajarEquipoModalProps {
  open: boolean;
  machine: any;
  pickupImages: any;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (arrived: boolean) => void;
  userRole: string;
}

const BajarEquipoModal: FC<BajarEquipoModalProps> = ({
  open,
  machine,
  pickupImages,
  isLoading,
  onClose,
  onConfirm,
  userRole
}) => {
  const [arrived, setArrived] = useState<string>('');
  const [hasMissingParts, setHasMissingParts] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allowSaveOnMissingParts = ['ADMIN', 'AUX'].includes(userRole);
  const handleSubmit = () => {
    // All validations passed - call parent handler
    onConfirm(arrived === 'yes');
  };

  const handleClose = () => {
    setArrived('');
    setHasMissingParts('');
    setCurrentImageIndex(0);
    onClose();
  };

  const images = pickupImages ? Object.values(pickupImages) : [];
  const currentImage = images[currentImageIndex];

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const showNoArrivalAlert = arrived === 'no';
  const showMissingPartsAlert = arrived === 'yes' && hasMissingParts === 'yes';

  const optionsWereSelected =
    arrived !== '' &&
    (arrived === 'no' || (arrived === 'yes' && hasMissingParts !== ''));
  const machineArrived = arrived === 'yes';

  const canSave = optionsWereSelected && (machineArrived
    ? hasMissingParts === 'no' ||
      (hasMissingParts === 'yes' && allowSaveOnMissingParts)
    : userRole === 'ADMIN');
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Recepción de Equipo #{machine?.machineNum}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* Images Section */}
          {images.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Fotos del Equipo
              </Typography>
              <img
                src={currentImage as string}
                alt={`Foto ${currentImageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px'
                }}
              />
              {images.length > 1 && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1
                  }}
                >
                  <Button
                    size="small"
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                  >
                    Anterior
                  </Button>
                  <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                    {currentImageIndex + 1} / {images.length}
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleNextImage}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    Siguiente
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <Divider />

          {/* Question 1: Did it arrive? */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              ¿Llegó el equipo?
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={arrived}
                onChange={(e) => setArrived(e.target.value)}
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio />}
                  label="Sí, llegó el equipo"
                  disabled={isLoading}
                />
                <FormControlLabel
                  value="no"
                  control={<Radio />}
                  label="No llegó"
                  disabled={isLoading}
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Alert: Equipment didn't arrive */}
          {showNoArrivalAlert && (
            <Alert severity="error">
              <Typography variant="body1" fontWeight="bold">
                El equipo no llegó
              </Typography>
              <Typography variant="body2">
                {userRole === 'ADMIN'
                  ? '| Se creará un registro de seguimiento para investigar la situación del equipo.'
                  : '| Por favor LLAMAR AL SUPERVISOR, ya que no se permite crear un registro de seguimiento sin autorización. '}
              </Typography>
            </Alert>
          )}

          {/* Question 2: Missing parts? (only show if arrived) */}
          {arrived === 'yes' && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ¿Le falta alguna pieza al equipo?
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={hasMissingParts}
                    onChange={(e) => setHasMissingParts(e.target.value)}
                  >
                    <FormControlLabel
                      value="no"
                      control={<Radio />}
                      label="No, está completo"
                      disabled={isLoading}
                    />
                    <FormControlLabel
                      value="yes"
                      control={<Radio />}
                      label="Sí, le faltan piezas"
                      disabled={isLoading}
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            </>
          )}

          {showMissingPartsAlert && (
            <Alert severity={allowSaveOnMissingParts ? 'warning' : 'error'}>
              <Typography variant="body1" fontWeight="bold">
                El equipo tiene piezas faltantes
              </Typography>

              <Typography variant="body2">
                {allowSaveOnMissingParts
                  ? '| Puede proceder a ingresar el equipo a bodega, pero asegúrese de reponer las piezas faltantes para su seguimiento.'
                  : '| Por favor LLAMAR AL PERSONAL DE OFICINA, ya que no se permite ingresar el equipo a bodega con piezas faltantes.'}
              </Typography>
            </Alert>
          )}
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
          disabled={!canSave}
        >
          {machineArrived
            ? 'Ingresar a Bodega'
            : 'Crear registro de seguimiento'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default BajarEquipoModal;
