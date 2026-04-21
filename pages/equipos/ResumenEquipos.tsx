import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BuildIcon from "@mui/icons-material/Build";
import MapIcon from "@mui/icons-material/Map";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StorefrontIcon from "@mui/icons-material/Storefront";
import NextLink from "next/link";

const saleStatuses = ['DISPONIBLE', 'PENDIENTE', 'LISTO', 'EN_REPARACION', 'EN_CAMBIO', 'RECOLECTADA'];
const saleStatusLabels = {
  DISPONIBLE: 'Disponibles para venta',
  PENDIENTE: 'Entrega pendiente',
  EN_REPARACION: 'En reparación',
  LISTO: 'Reparada y lista',
  EN_CAMBIO: 'En cambio por garantía',
  RECOLECTADA: 'Recolectada'
};
const AvatarWrapperSuccess = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.success.lighter};
        color:  ${theme.colors.success.main};
  `
);

const AvatarWrapperError = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.error.lighter};
        color:  ${theme.colors.error.main};
  `
);
const AvatarWrapperWarning = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.warning.lighter};
        color:  ${theme.colors.warning.main};
  `
);
function ResumenEquipos({
  onRent,
  inVehicles,
  ready,
  waiting,
  onMaintenance,
  lost,
  total,
  stored,
  sale,
  activeTotal,
}) {
  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pb: 3,
        }}
      >
        <Typography variant="h4">Resumen</Typography>
      </Box>
      <Grid container spacing={1}>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "auto",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperSuccess>
                    <CurrencyExchangeIcon />
                  </AvatarWrapperSuccess>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {onRent?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    Rentados
                  </Typography>
                </Grid>
                {onRent?.byCity?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {onRent?.byCity.map((city) => (
                        <ListItem disablePadding key={city?.id}>
                          <ListItemText
                            primary={`- ${city?.name}: ${city?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                <Grid item lg={12} md={12} xs={12} textAlign="center">
                  <br />
                </Grid>
                <Grid item lg={12} md={12} xs={12} textAlign="center">
                  <NextLink href="/equipos/mapa">
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MapIcon />}
                    >
                      Ver Mapa
                    </Button>
                  </NextLink>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "150px",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperWarning>
                    <LocalShippingIcon />
                  </AvatarWrapperWarning>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {inVehicles?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En vehículos
                  </Typography>
                </Grid>
                {inVehicles?.byVehicle?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {inVehicles?.byVehicle.map((vehicle) => (
                        <ListItem disablePadding key={vehicle?.id}>
                          <ListItemText
                            primary={`- ${vehicle?.name}: ${vehicle?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "150px",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperError>
                    <EventAvailableIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {ready?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    Listos para renta
                  </Typography>
                </Grid>
                {ready?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {ready?.byWarehouse.map((warehouse) => (
                        <ListItem disablePadding key={warehouse?.id}>
                          <ListItemText
                            primary={`- ${warehouse?.name}: ${warehouse?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "auto",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperError>
                    <BuildIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {(waiting?.total || 0) + (onMaintenance?.total || 0)}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    Mant. Pendientes
                  </Typography>
                </Grid>
                {waiting?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      En espera:
                    </Typography>
                    <List dense>
                      {waiting.byWarehouse.map((warehouse) => (
                        <ListItem disablePadding key={`w-${warehouse?.id}`}>
                          <ListItemText
                            primary={`- ${warehouse?.name}: ${warehouse?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                {onMaintenance?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      En mantenimiento:
                    </Typography>
                    <List dense>
                      {onMaintenance.byWarehouse.map((warehouse) => (
                        <ListItem disablePadding key={`m-${warehouse?.id}`}>
                          <ListItemText
                            primary={`- ${warehouse?.name}: ${warehouse?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "150px",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperError>
                    <SearchIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {lost?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En investigación
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "auto",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperWarning>
                    <WarehouseIcon />
                  </AvatarWrapperWarning>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {stored?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    Almacenadas
                  </Typography>
                </Grid>
                {stored?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Por almacén:
                    </Typography>
                    <List dense>
                      {stored.byWarehouse.map((warehouse) => (
                        <ListItem disablePadding key={warehouse?.id}>
                          <ListItemText
                            primary={`- ${warehouse?.name}: ${warehouse?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                {stored?.byVehicle?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      En vehículos:
                    </Typography>
                    <List dense>
                      {stored.byVehicle.map((vehicle) => (
                        <ListItem disablePadding key={vehicle?.id}>
                          <ListItemText
                            primary={`- ${vehicle?.name}: ${vehicle?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Card
            sx={{
              px: 1,
              height: "auto",
              overflowY: "auto",
            }}
          >
            <CardContent>
              <Grid
                container
                alignItems="center"
                justifyItems="center"
                textAlign={{ lg: "center" }}
              >
                <Grid item lg={2} md={2} xs={2}>
                  <AvatarWrapperSuccess>
                    <StorefrontIcon />
                  </AvatarWrapperSuccess>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {sale?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    DE VENTA
                  </Typography>
                </Grid>
                {saleStatuses.map((status) => {
                  const statusData = sale?.[status];
                  if (statusData?.total > 0)  return (<>
                  <Grid item lg={12} md={12} xs={12} textAlign="left">
                    <Typography variant="overline" fontWeight="bold" sx={{ mt: 1 }}>
                      {saleStatusLabels[status]+" (" + statusData.total + ")"}:
                    </Typography>
                  </Grid>
                {statusData?.byWarehouse?.length > 0 && (
                    <Grid item lg={12} md={12} xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>
                        Por bodega:
                      </Typography>
                    <List dense>
                      {statusData.byWarehouse.map((warehouse) => (
                        <ListItem disablePadding key={warehouse?.id}>
                          <ListItemText
                            primary={`- ${warehouse?.name}: ${warehouse?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                {statusData?.byVehicle?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      En vehículos:
                    </Typography>
                    <List dense>
                      {statusData.byVehicle.map((vehicle) => (
                        <ListItem disablePadding key={vehicle?.id}>
                          <ListItemText
                            primary={`- ${vehicle?.name}: ${vehicle?.total}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                {statusData?.noLocation > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      {`Sin ubicación: ${statusData.noLocation}`}
                    </Typography>
                  </Grid>
                )}
                </>)

                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container>
        <Grid xs={12} md={4} item></Grid>
        <Grid xs={12} md={4} item>
          <Card
            sx={{
              background: "transparent",
              color: "none",
              boxShadow: "none",
            }}
          >
            <CardContent
              sx={{
                background: "transparent",
              }}
            >
              <Grid container alignItems="center" justifyItems="center">
                <Grid item lg={5} md={4} xs={4}>
                  <Typography variant="h3" textAlign="center">
                    TOTAL:
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="h3" noWrap>
                    {total}
                  </Typography>
                </Grid>
                <Grid item lg={5} md={4} xs={4}>
                  <Typography variant="h3" textAlign="center">
                    ACTIVAS:
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="h3" noWrap>
                    {activeTotal}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={4} item></Grid>
      </Grid>
    </>
  );
}

export default ResumenEquipos;
