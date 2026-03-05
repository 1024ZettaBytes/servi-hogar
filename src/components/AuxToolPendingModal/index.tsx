import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useRouter } from 'next/router';

interface PendingItem {
  techName: string;
  type: 'NO_TOOLS' | 'PENDING_AUX_VERIFICATION';
}

interface AuxToolPendingModalProps {
  open: boolean;
  pending: PendingItem[];
}

export default function AuxToolPendingModal({
  open,
  pending
}: AuxToolPendingModalProps) {
  const router = useRouter();

  const noTools = pending.filter((p) => p.type === 'NO_TOOLS');
  const pendingVerification = pending.filter(
    (p) => p.type === 'PENDING_AUX_VERIFICATION'
  );

  return (
    <Dialog open={open} disableEscapeKeyDown maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h4" component="span">
            Herramientas Pendientes
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Existen técnicos que requieren atención en sus herramientas. Debes
          resolver estos pendientes desde la página de Herramientas.
        </Alert>

        {noTools.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
              Sin herramientas asignadas:
            </Typography>
            <List dense>
              {noTools.map((item, idx) => (
                <ListItem key={`no-${idx}`}>
                  <ListItemIcon>
                    <BuildIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.techName} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {pendingVerification.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
              Pendientes de verificación con foto:
            </Typography>
            <List dense>
              {pendingVerification.map((item, idx) => (
                <ListItem key={`pv-${idx}`}>
                  <ListItemIcon>
                    <HourglassTopIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.techName} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="warning"
          size="large"
          fullWidth
          onClick={() => router.push('/herramientas')}
        >
          Ir a Herramientas
        </Button>
      </DialogActions>
    </Dialog>
  );
}
