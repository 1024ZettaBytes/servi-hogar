import Head from "next/head";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Typography,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import Footer from "@/components/Footer";
import useSWR from "swr";
import numeral from "numeral";
import { formatTZDate } from "../../lib/client/utils";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NextLink from "next/link";

function SaleDetail() {
  const router = useRouter();
  const { saleId } = router.query;

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: saleData, error: saleError } = useSWR(
    saleId ? `/api/sales/${saleId}` : null,
    fetcher
  );

  const sale = saleData?.data;
  const paths = ["Inicio", "Ventas", sale ? `Folio #${sale.saleNum}` : "Detalle"];

  const machineInfo = sale?.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand} (${sale.machine.capacity}kg)`
    : sale?.serialNumber || 'N/A';

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVA':
        return 'info';
      case 'PAGADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVA':
        return 'Activa';
      case 'PAGADA':
        return 'Pagada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <>
      <Head>
        <title>Detalle de Venta</title>
      </Head>
      <PageTitleWrapper>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <NextLink href="/ventas" passHref legacyBehavior>
            <Button
              component="a"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Volver
            </Button>
          </NextLink>
        </Box>
        <PageHeader
          title={sale ? `Venta #${sale.saleNum}` : "Detalle de Venta"}
          sutitle=""
        />
        <NextBreadcrumbs paths={paths} lastLoaded={!saleError && !!sale} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          {saleError ? (
            <Grid item xs={12}>
              <Alert severity="error">
                {saleError?.message || "Error al cargar los datos de la venta"}
              </Alert>
            </Grid>
          ) : !sale ? (
            <Grid item xs={12}>
              <Skeleton variant="rectangular" width="100%" height={400} animation="wave" />
            </Grid>
          ) : (
            <>
              {/* General Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <Box p={3}>
                    <Typography variant="h4" gutterBottom>
                      Información General
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Folio
                        </Typography>
                        <Typography variant="h6">#{sale.saleNum}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Estado
                        </Typography>
                        <Box mt={0.5}>
                          <Chip
                            label={getStatusLabel(sale.status)}
                            color={getStatusColor(sale.status)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Equipo
                        </Typography>
                        <Typography variant="body1">{machineInfo}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Cliente
                        </Typography>
                        <Typography variant="body1">
                          {sale.customer?.name || 'Sin cliente'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Fecha de venta
                        </Typography>
                        <Typography variant="body2">
                          {formatTZDate(sale.saleDate, "DD/MM/YYYY")}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Creado por
                        </Typography>
                        <Typography variant="body2">
                          {sale.createdBy?.name || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <Box p={3}>
                    <Typography variant="h4" gutterBottom>
                      Información de Pagos
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total de la venta
                        </Typography>
                        <Typography variant="h6">
                          ${numeral(sale.totalAmount).format('0,0.00')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Pago inicial
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          ${numeral(sale.initialPayment).format('0,0.00')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Saldo restante
                        </Typography>
                        <Typography variant="h6" color={sale.remainingAmount > 0 ? "warning.main" : "success.main"}>
                          ${numeral(sale.remainingAmount).format('0,0.00')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Pago semanal
                        </Typography>
                        <Typography variant="body1">
                          ${numeral(sale.weeklyPayment).format('0,0.00')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Semanas totales
                        </Typography>
                        <Typography variant="body1">{sale.totalWeeks}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Semanas pagadas
                        </Typography>
                        <Typography variant="body1">
                          {sale.paidWeeks} / {sale.totalWeeks}
                        </Typography>
                      </Grid>
                      {sale.lastPaymentDate && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Último pago
                          </Typography>
                          <Typography variant="body2">
                            {formatTZDate(sale.lastPaymentDate, "DD/MM/YYYY")}
                          </Typography>
                        </Grid>
                      )}
                      {sale.nextPaymentDate && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Próximo pago
                          </Typography>
                          <Typography variant="body2">
                            {formatTZDate(sale.nextPaymentDate, "DD/MM/YYYY")}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              {/* Payment History */}
              <Grid item xs={12}>
                <Card>
                  <Box p={3}>
                    <Typography variant="h4" gutterBottom>
                      Historial de Pagos
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    {!sale.payments || sale.payments.length === 0 ? (
                      <Alert severity="info">
                        {sale.initialPayment > 0 
                          ? "Solo se ha registrado el pago inicial" 
                          : "No se han registrado pagos aún"}
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>#</strong></TableCell>
                              <TableCell><strong>Fecha</strong></TableCell>
                              <TableCell align="right"><strong>Monto</strong></TableCell>
                              <TableCell align="center"><strong>Semanas cubiertas</strong></TableCell>
                              <TableCell><strong>Registrado por</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {/* Payment History */}
                            {sale.payments.map((payment, index) => (
                              <TableRow key={payment._id}>
                                <TableCell>{sale.payments.length - index}</TableCell>
                                <TableCell>{formatTZDate(payment.paymentDate, "DD/MM/YYYY HH:mm")}</TableCell>
                                <TableCell align="right">
                                  ${numeral(payment.amount).format('0,0.00')}
                                </TableCell>
                                <TableCell align="center">{payment.weeksCovered}</TableCell>
                                <TableCell>{payment.createdBy?.name || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                                                        {/* Initial Payment */}
                            {sale.initialPayment > 0 && (
                              <TableRow>
                                <TableCell>-</TableCell>
                                <TableCell>{formatTZDate(sale.saleDate, "DD/MM/YYYY HH:mm")}</TableCell>
                                <TableCell align="right">
                                  <Typography color="success.main" fontWeight="bold">
                                    ${numeral(sale.initialPayment).format('0,0.00')}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label="Pago inicial" size="small" color="success" />
                                </TableCell>
                                <TableCell>{sale.createdBy?.name || 'N/A'}</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

SaleDetail.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default SaleDetail;
