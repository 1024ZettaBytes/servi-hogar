import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled,
} from "@mui/material";
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import HailIcon from "@mui/icons-material/Hail";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

const AvatarWrapperWarning = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.warning.lighter};
        color:  ${theme.colors.warning.main};
  `
);

const AvatarWrapperError = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.error.lighter};
        color:  ${theme.colors.error.main};
  `
);

const AvatarWrapperInfo = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.info.lighter};
        color:  ${theme.colors.info.main};
  `
);

interface ResumenPendientesProps {
  unassigned: any[];
  overdue: any[];
  overdueRents: any[];
  overdueSales: any[];
}

function ResumenPendientes({ 
  unassigned = [], 
  overdue = [], 
  overdueRents = [], 
  overdueSales = [] 
}: ResumenPendientesProps) {
  const unassignedByType = {
    entregas: unassigned.filter(a => a.type === 'ENTREGA').length,
    cambios: unassigned.filter(a => a.type === 'CAMBIO').length,
    recolecciones: unassigned.filter(a => a.type === 'RECOLECCION').length,
  };

  const overdueByType = {
    entregas: overdue.filter(a => a.type === 'ENTREGA').length,
    cambios: overdue.filter(a => a.type === 'CAMBIO').length,
    recolecciones: overdue.filter(a => a.type === 'RECOLECCION').length,
  };

  const totalUnassigned = unassigned.length;
  const totalOverdue = overdue.length;
  const totalOverdueRents = overdueRents.length;
  const totalOverdueSales = overdueSales.length;
  const totalPending = totalUnassigned + totalOverdue + totalOverdueRents + totalOverdueSales;

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ pb: 3 }}>
        <Typography variant="h4">Resumen de Acciones Pendientes</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={2.4} item>
          <Card sx={{ px: 1, height: "auto", minHeight: "200px" }}>
            <CardContent>
              <Grid container alignItems="center" justifyItems="center" textAlign={{ lg: "center" }}>
                <Grid item lg={3} md={3} xs={3}>
                  <AvatarWrapperWarning><AssignmentLateIcon /></AvatarWrapperWarning>
                </Grid>
                <Grid item lg={8} md={3} xs={3}>
                  <Typography variant="h2" gutterBottom noWrap>{totalUnassigned}</Typography>
                </Grid>
                <Grid item lg={12} md={6} xs={6}>
                  <Typography variant="h4" noWrap textAlign="left">Sin Asignar</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Entregas: <strong>{unassignedByType.entregas}</strong></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ChangeCircleIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">Cambios: <strong>{unassignedByType.cambios}</strong></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HailIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="body2">Recolecciones: <strong>{unassignedByType.recolecciones}</strong></Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4} item>
          <Card sx={{ px: 1, height: "auto", minHeight: "200px" }}>
            <CardContent>
              <Grid container alignItems="center" justifyItems="center" textAlign={{ lg: "center" }}>
                <Grid item lg={3} md={3} xs={3}>
                  <AvatarWrapperError><AssignmentIndIcon /></AvatarWrapperError>
                </Grid>
                <Grid item lg={9} md={3} xs={3}>
                  <Typography variant="h2" gutterBottom noWrap>{totalOverdue}</Typography>
                </Grid>
                <Grid item lg={12} md={6} xs={6}>
                  <Typography variant="h4" noWrap textAlign="left">Vencidas (+3 días)</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">Entregas: <strong>{overdueByType.entregas}</strong></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ChangeCircleIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="body2">Cambios: <strong>{overdueByType.cambios}</strong></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HailIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="body2">Recolecciones: <strong>{overdueByType.recolecciones}</strong></Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4} item>
          <Card sx={{ px: 1, height: "auto", minHeight: "200px" }}>
            <CardContent>
              <Grid container alignItems="center" justifyItems="center" textAlign={{ lg: "center" }}>
                <Grid item lg={3} md={3} xs={3}>
                  <AvatarWrapperError><MoneyOffIcon /></AvatarWrapperError>
                </Grid>
                <Grid item lg={9} md={3} xs={3}>
                  <Typography variant="h2" gutterBottom noWrap>{totalOverdueRents}</Typography>
                </Grid>
                <Grid item lg={12} md={6} xs={6}>
                  <Typography variant="h4" noWrap textAlign="left">Rentas Vencidas</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Clientes con pagos pendientes</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={2.4} item>
          <Card sx={{ px: 1, height: "auto", minHeight: "200px" }}>
            <CardContent>
              <Grid container alignItems="center" justifyItems="center" textAlign={{ lg: "center" }}>
                <Grid item lg={3} md={3} xs={3}>
                  <AvatarWrapperError><PointOfSaleIcon /></AvatarWrapperError>
                </Grid>
                <Grid item lg={9} md={3} xs={3}>
                  <Typography variant="h2" gutterBottom noWrap>{totalOverdueSales}</Typography>
                </Grid>
                <Grid item lg={12} md={6} xs={6}>
                  <Typography variant="h4" noWrap textAlign="left">Ventas Vencidas</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Pagos semanales atrasados</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={12} md={2.4} item>
          <Card sx={{ px: 1, height: "auto", minHeight: "200px", background: (theme) => theme.palette.mode === 'dark' ? theme.colors.alpha.black[10] : theme.colors.alpha.black[5] }}>
            <CardContent>
              <Grid container alignItems="center" justifyItems="center" textAlign="center">
                <Grid item xs={12}>
                  <AvatarWrapperInfo sx={{ width: 64, height: 64, margin: '0 auto', mb: 2 }}>
                    <AssignmentIndIcon sx={{ fontSize: 40 }} />
                  </AvatarWrapperInfo>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h1" gutterBottom>{totalPending}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h3" color="text.secondary">Total de Acciones Pendientes</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default ResumenPendientes;
