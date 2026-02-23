import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Alert, Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { signOut, useSession } from 'next-auth/react';

interface UserBlockedModalProps {
  open: boolean;
}

export default function UserBlockedModal({ open }: UserBlockedModalProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="error" />
          <Typography variant="h4" component="span">
            Usuario Bloqueado
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          Tu cuenta ha sido bloqueada temporalmente
        </Alert>
        {userRole === 'ADMIN' ? (
          <>
            <DialogContentText>
              Has sido bloqueado debido a que existen equipos en investigación
              que superan el tiempo límite permitido de 24 horas.
            </DialogContentText>
            <DialogContentText sx={{ mt: 2 }}>
              Por regla de negocio, mientras existan casos sin resolver,
              no podrás acceder al sistema. Por favor, contacta a un Super Usuario para que
              te desbloquee, y luego acude al panel de Investigaciones a resolver los pendientes.
            </DialogContentText>
          </>
        ) : (
          <>
            <DialogContentText>
              Has sido bloqueado debido a que el tiempo promedio entre las acciones que realizaste
              excede el límite permitido.
            </DialogContentText>
            <DialogContentText sx={{ mt: 2 }}>
              Por favor, contacta a un administrador para que desbloquee tu cuenta.
            </DialogContentText>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          fullWidth
        >
          Cerrar Sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}
