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
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BuildIcon from "@mui/icons-material/Build";
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';

/*const AvatarWrapperSuccess = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.success.lighter};
        color:  ${theme.colors.success.main};
  `
);*/

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
function MovementsSummary({
  
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
        <Typography variant="h4">Pendientes</Typography>
      </Box>
      <Grid container spacing={1}>
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
                    {40}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2"  textAlign="left">
                    Entregas pendientes
                  </Typography>
                </Grid>
                {0 > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {[].map((vehicle) => (
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
                    <ChangeCircleIcon />
                  </AvatarWrapperError>
                </Grid>
                <Grid item lg={3} md={2} xs={2}>
                  <Typography variant="h3" gutterBottom noWrap>
                    {30}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" textAlign="left">
                    Cambios Pendientes
                  </Typography>
                </Grid>
                {0 > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {[].map((warehouse) => (
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
                    {10}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En espera
                  </Typography>
                </Grid>
                {0 > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {[].map((warehouse) => (
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
                    {15}
                  </Typography>
                </Grid>
                <Grid item lg={7} md={8} xs={8}>
                  <Typography variant="subtitle2" noWrap textAlign="left">
                    En mantenimiento
                  </Typography>
                </Grid>
                {0 > 0 && (
                  <Grid item lg={12} md={12} xs={12}>
                    <List>
                      {[].map((warehouse) => (
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
                    {200}
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

export default MovementsSummary;
