import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AvatarWrapperPrimary = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.primary.lighter};
    color: ${theme.colors.primary.main};
  `
);
const AvatarWrapperWarning = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.warning.lighter};
    color: ${theme.colors.warning.main};
  `
);
const AvatarWrapperError = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.error.lighter};
    color: ${theme.colors.error.main};
  `
);
const AvatarWrapperInfo = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.info.lighter};
    color: ${theme.colors.info.main};
  `
);
const AvatarWrapperSuccess = styled(Avatar)(
  ({ theme }) => `
    background-color: ${theme.colors.success.lighter};
    color: ${theme.colors.success.main};
  `
);

function ResumenAlmacen({ summary }) {
  if (!summary) return null;

  const { statusCounts, originCounts } = summary;

  const getCountByStatus = (status) => {
    const found = statusCounts?.find((s) => s._id === status);
    return found ? found.count : 0;
  };

  const getCountByOrigin = (origin) => {
    const found = originCounts?.find((o) => o._id === origin);
    return found ? found.count : 0;
  };

  const almacenadas = getCountByStatus('ALMACENADA');
  const enVehiculo = getCountByStatus('EN_VEHICULO');
  const enAcondicionamiento = getCountByStatus('EN_ACONDICIONAMIENTO');
  const acondicionadas = getCountByStatus('ACONDICIONADA');
  const desmanteladas = getCountByStatus('DESMANTELADA');
  const listaVenta = getCountByStatus('LISTA_VENTA');
  const asignadaRenta = getCountByStatus('ASIGNADA_RENTA');

  const cards = [
    {
      label: 'Almacenadas',
      count: almacenadas,
      icon: <WarehouseIcon />,
      AvatarComponent: AvatarWrapperPrimary,
      sub: [
        { label: 'Nuevas', count: getCountByOrigin('NUEVA') },
        { label: 'Repuestas', count: getCountByOrigin('REPUESTA') },
        { label: 'Compras calle', count: getCountByOrigin('COMPRA_CALLE') }
      ]
    },
    {
      label: 'Acondicionadas',
      count: acondicionadas,
      icon: <CheckCircleIcon />,
      AvatarComponent: AvatarWrapperSuccess
    },
    {
      label: 'En vehículo',
      count: enVehiculo,
      icon: <LocalShippingIcon />,
      AvatarComponent: AvatarWrapperInfo
    },
    {
      label: 'En acondicionamiento',
      count: enAcondicionamiento,
      icon: <BuildIcon />,
      AvatarComponent: AvatarWrapperWarning
    },
    {
      label: 'Listas para venta',
      count: listaVenta,
      icon: <ShoppingBagIcon />,
      AvatarComponent: AvatarWrapperSuccess
    },
    {
      label: 'Asignadas a renta',
      count: asignadaRenta,
      icon: <SwapHorizIcon />,
      AvatarComponent: AvatarWrapperSuccess
    },
    {
      label: 'Desmanteladas',
      count: desmanteladas,
      icon: <DeleteIcon />,
      AvatarComponent: AvatarWrapperError
    }
  ];

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pb: 3 }}
      >
        <Typography variant="h4">Resumen de Almacén</Typography>
      </Box>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid xs={12} sm={6} md={4} lg={3} item key={card.label}>
            <Card sx={{ px: 1, height: 'auto' }}>
              <CardContent>
                <Grid
                  container
                  alignItems="center"
                  justifyItems="center"
                  textAlign={{ lg: 'center' }}
                >
                  <Grid item lg={3} md={3} xs={3}>
                    <card.AvatarComponent>{card.icon}</card.AvatarComponent>
                  </Grid>
                  <Grid item lg={3} md={3} xs={3}>
                    <Typography variant="h3" gutterBottom noWrap>
                      {card.count}
                    </Typography>
                  </Grid>
                  <Grid item lg={6} md={6} xs={6}>
                    <Typography variant="subtitle2" noWrap textAlign="left">
                      {card.label}
                    </Typography>
                  </Grid>
                  {card.sub && (
                    <Grid item lg={12} md={12} xs={12} sx={{ mt: 1 }}>
                      {card.sub.map((s) => (
                        <Typography
                          key={s.label}
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {s.label}: {s.count}
                        </Typography>
                      ))}
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default ResumenAlmacen;
