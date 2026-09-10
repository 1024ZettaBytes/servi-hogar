import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  Grid,
  Skeleton,
  Alert,
  Box,
  Stack,
  Avatar,
  Typography,
  Switch,
  Chip,
  CircularProgress,
  TextField,
  Button,
  useTheme,
  alpha,
} from "@mui/material";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import Footer from "@/components/Footer";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import { useGetFeatureFlags, useGetPrices, getFetcher } from "../api/useRequest";
import { updateFeatureFlag } from "../../lib/client/featureFlagsFetch";
import { updateVueltaPrice } from "../../lib/client/pricesFetch";
import { useSnackbar } from "notistack";

function Configuraciones() {
  const theme = useTheme();
  const paths = ["Inicio", "Configuraciones"];
  const { enqueueSnackbar } = useSnackbar();
  const { featureFlags, featureFlagsError } = useGetFeatureFlags(getFetcher);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const { prices, pricesError } = useGetPrices(getFetcher);
  const [vueltaPriceInput, setVueltaPriceInput] = useState<string>("");
  const [isSavingVueltaPrice, setIsSavingVueltaPrice] = useState(false);

  useEffect(() => {
    if (prices?.vueltaPrice != null) {
      setVueltaPriceInput(String(prices.vueltaPrice));
    }
  }, [prices?.vueltaPrice]);

  const handleToggle = async (key: string, enabled: boolean) => {
    setUpdatingKey(key);
    const result = await updateFeatureFlag(key, enabled);
    setUpdatingKey(null);
    enqueueSnackbar(result.msg, {
      variant: result.error ? "error" : "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
      autoHideDuration: 2000,
    });
  };

  const handleSaveVueltaPrice = async () => {
    const parsed = Number(vueltaPriceInput);
    if (isNaN(parsed) || parsed < 0) {
      enqueueSnackbar("Indique un precio por vuelta válido.", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
        autoHideDuration: 2000,
      });
      return;
    }
    setIsSavingVueltaPrice(true);
    const result = await updateVueltaPrice(parsed);
    setIsSavingVueltaPrice(false);
    enqueueSnackbar(result.msg, {
      variant: result.error ? "error" : "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
      autoHideDuration: 2000,
    });
  };

  const isLoading = !featureFlags && !featureFlagsError;
  const flags = featureFlags || [];
  const isLoadingPrices = !prices && !pricesError;
  const vueltaPriceUnchanged =
    prices?.vueltaPrice != null &&
    Number(vueltaPriceInput) === prices.vueltaPrice;

  return (
    <>
      <Head>
        <title>Configuraciones</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Configuraciones"}
          sutitle={"Activa o desactiva funcionalidades del sistema"}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="md">
        <Grid container direction="row" spacing={3}>
          <Grid item xs={12}>
            {pricesError ? (
              <Alert severity="error">
                Hubo un problema al cargar los precios.
              </Alert>
            ) : isLoadingPrices ? (
              <Skeleton variant="rounded" width={"100%"} height={110} animation="wave" />
            ) : (
              <Card>
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor: theme.colors.success.lighter,
                        color: theme.palette.success.main,
                      }}
                      variant="rounded"
                    >
                      <PaidRoundedIcon />
                    </Avatar>
                  }
                  title="Precio por vuelta (operadores)"
                  subheader="Monto que se paga a un operador por cada vuelta completada (entrega, recolección, cambio, cobranza, etc.)"
                />
                <Divider />
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Precio por vuelta"
                      type="number"
                      size="small"
                      value={vueltaPriceInput}
                      onChange={(e) => setVueltaPriceInput(e.target.value)}
                      InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                      sx={{ width: 200 }}
                    />
                    <Button
                      variant="contained"
                      disabled={
                        isSavingVueltaPrice ||
                        !vueltaPriceInput ||
                        vueltaPriceUnchanged
                      }
                      onClick={handleSaveVueltaPrice}
                      startIcon={
                        isSavingVueltaPrice ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : null
                      }
                    >
                      Guardar
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>
          <Grid item xs={12}>
            {featureFlagsError ? (
              <Alert severity="error">
                Hubo un problema al cargar las configuraciones.
              </Alert>
            ) : isLoading ? (
              <Stack spacing={2}>
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rounded"
                    width={"100%"}
                    height={110}
                    animation="wave"
                  />
                ))}
              </Stack>
            ) : flags.length === 0 ? (
              <Card>
                <CardContent>
                  <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                    <TuneRoundedIcon
                      sx={{ fontSize: 48, color: "text.disabled" }}
                    />
                    <Typography variant="h4" color="text.secondary">
                      No hay configuraciones disponibles
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {flags.map((flag) => {
                  const enabled = !!flag.enabled;
                  const isUpdating = updatingKey === flag.key;
                  return (
                    <Card
                      key={flag.key}
                      sx={{
                        transition: "border-color .2s, box-shadow .2s",
                        border: "1px solid",
                        borderColor: enabled
                          ? alpha(theme.palette.success.main, 0.5)
                          : "transparent",
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="flex-start"
                        >
                          <Avatar
                            sx={{
                              bgcolor: enabled
                                ? theme.colors.success.lighter
                                : theme.colors.alpha.black[10],
                              color: enabled
                                ? theme.palette.success.main
                                : theme.palette.text.secondary,
                              width: 50,
                              height: 50,
                            }}
                            variant="rounded"
                          >
                            <ToggleOnRoundedIcon />
                          </Avatar>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mb: 0.5 }}
                              flexWrap="wrap"
                            >
                              <Typography variant="h4" fontWeight="bold">
                                {flag.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={enabled ? "Activado" : "Desactivado"}
                                color={enabled ? "success" : "default"}
                                variant={enabled ? "filled" : "outlined"}
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {flag.description}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              minWidth: 48,
                              justifyContent: "flex-end",
                            }}
                          >
                            {isUpdating ? (
                              <CircularProgress size={22} />
                            ) : (
                              <Switch
                                color="success"
                                checked={enabled}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleToggle(flag.key, e.target.checked)
                                }
                              />
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

Configuraciones.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  const props = await validateServerSideSession(getSession, req, resolvedUrl);
  // Admin-only page
  if (props?.props?.session && props.props.session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }
  return props;
}

export default Configuraciones;
