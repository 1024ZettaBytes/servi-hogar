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
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BuildIcon from "@mui/icons-material/Build";
import MapIcon from "@mui/icons-material/Map";
import NextLink from "next/link";

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
                    <HourglassEmptyIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {waiting?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En espera
                  </Typography>
                </Grid>
                {waiting?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {waiting?.byWarehouse.map((warehouse) => (
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
                    <BuildIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {onMaintenance?.total}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En mantenimiento
                  </Typography>
                </Grid>
                {onMaintenance?.byWarehouse?.length > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {onMaintenance?.byWarehouse.map((warehouse) => (
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
