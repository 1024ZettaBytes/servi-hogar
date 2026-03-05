import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import BuildIcon from '@mui/icons-material/Build';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Image from 'next/image';
import { techConfirmTools } from '../../../lib/client/toolsFetch';
import { refreshData } from '../../../pages/api/useRequest';
import { ROUTES } from '../../../lib/consts/API_URL_CONST';

interface TechToolConfirmationModalProps {
  open: boolean;
  statusType: 'PENDING_TECH_CONFIRMATION' | 'PENDING_AUX_VERIFICATION' | 'NO_TOOLS';
  assignment?: any;
}

export default function TechToolConfirmationModal({
  open,
  statusType,
  assignment
}: TechToolConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState('');

  const handleConfirm = async () => {
    setIsLoading(true);
    setHasError('');
    const result = await techConfirmTools(assignment._id);
    setIsLoading(false);

    if (!result.error) {
      refreshData(ROUTES.TECHNICIAN_TOOLS_CONFIRM);
      window.location.reload();
    } else {
      setHasError(result.msg);
    }
  };

  // --- NO_TOOLS state ---
  if (statusType === 'NO_TOOLS') {
    return (
      <Dialog open={open} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorOutlineIcon color="warning" />
            <Typography variant="h4" component="span">
              Herramientas No Asignadas
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tienes herramientas de trabajo asignadas. No podrás utilizar el
            sistema hasta que un auxiliar te asigne tus herramientas.
          </Alert>
          <Typography variant="body1">
            Por favor contacta a un auxiliar o a la oficina para que te asignen
            las herramientas correspondientes.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // --- PENDING_AUX_VERIFICATION state ---
  if (statusType === 'PENDING_AUX_VERIFICATION') {
    return (
      <Dialog open={open} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HourglassTopIcon color="info" />
            <Typography variant="h4" component="span">
              Verificación Pendiente
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Tus herramientas están pendientes de verificación con foto por parte
            de un auxiliar. No podrás utilizar el sistema hasta que se complete
            este paso.
          </Alert>
          <Typography variant="body1">
            Una vez que el auxiliar suba la foto de verificación, podrás
            confirmar que recibiste las herramientas.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // --- PENDING_TECH_CONFIRMATION state ---
  return (
    <Dialog open={open} disableEscapeKeyDown maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BuildIcon color="info" />
          <Typography variant="h4" component="span">
            Confirmación de Herramientas
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Se te han asignado herramientas de trabajo. Por favor revisa la lista
          y la foto de evidencia, y confirma que las has recibido para poder
          continuar.
        </Alert>

        {assignment?.auxVerifiedBy && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Verificado por: {assignment.auxVerifiedBy.name}
          </Typography>
        )}

        <Typography variant="h6" gutterBottom>
          Herramientas asignadas:
        </Typography>
        <List dense>
          {assignment?.tools?.map((t, idx) => (
            <ListItem key={idx}>
              <ListItemIcon>
                <BuildIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t.tool?.name || 'Herramienta'}
                secondary={`Cantidad: ${t.quantity}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {assignment?.photoUrl && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Foto de evidencia:
            </Typography>
            <Box sx={{ textAlign: 'center', my: 1 }}>
              <Image
                src={assignment.photoUrl}
                alt="Evidencia de herramientas"
                width={450}
                height={350}
                style={{ objectFit: 'contain' }}
              />
            </Box>
          </Box>
        )}

        {hasError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {hasError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <LoadingButton
          loading={isLoading}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={handleConfirm}
        >
          Confirmar Recibido
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
