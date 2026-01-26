import Head from "next/head";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
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
  IconButton,
  Tooltip
} from "@mui/material";
import Footer from "@/components/Footer";
import useSWR from "swr";
import numeral from "numeral";
import { formatTZDate } from "../../lib/client/utils";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import NextLink from "next/link";
import ImagesModal from "@/components/ImagesModal";

function SaleDetail() {
  const router = useRouter();
  const { saleId } = router.query;
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canEditImages = ['ADMIN', 'AUX'].includes(userRole);
  
  const [openImages, setOpenImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  const [openDeliveryImages, setOpenDeliveryImages] = useState(false);

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: saleData, error: saleError } = useSWR(
    saleId ? `/api/sales/${saleId}` : null,
    fetcher
  );

  const handleOnCloseImages = () => {
    setOpenImages(false);
  };

  const handleCloseDeliveryImages = () => {
    setOpenDeliveryImages(false);
    // Refresh data after closing the modal (in case images were updated)
    router.replace(router.asPath);
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImages({ payment: imageUrl });
    setOpenImages(true);
  };

  // Helper function to check if a string is a valid URL
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  // Filter only valid image URLs
  const getValidDeliveryImages = () => {
    if (!sale?.delivery?.imagesUrl) return {};
    const validImages = {};
    Object.entries(sale.delivery.imagesUrl).forEach(([key, url]) => {
      if (isValidUrl(url)) {
        validImages[key] = url;
      }
    });
    return validImages;
  };

  const handleViewDeliveryImages = () => {
    const validImages = getValidDeliveryImages();
    if (Object.keys(validImages).length > 0) {
      setSelectedImages(validImages);
      setOpenDeliveryImages(true);
    }
  };

  // Check if there are valid delivery images
  const hasValidDeliveryImages = () => {
    const validImages = getValidDeliveryImages();
    return Object.keys(validImages).length > 0;
  };

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
                        <Box mt={0.5} display="flex" alignItems="center" gap={0.5}>
                          <Chip
                            label={getStatusLabel(sale.status)}
                            color={getStatusColor(sale.status)}
                            size="small"
                          />
                          {sale.status === 'CANCELADA' && (
                            <Tooltip 
                              title={sale.delivery?.cancellationReason || "SIN RAZÓN"} 
                              arrow
                            >
                              <InfoOutlinedIcon 
                                fontSize="small" 
                                color="action" 
                                sx={{ cursor: 'default' }} 
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Equipo
                        </Typography>
                        <Typography variant="body1">{machineInfo}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Garantía
                        </Typography>
                        <Typography variant="body2">
                          {sale.machine?.warranty ? (
                            formatTZDate(new Date(sale.machine.warranty), 'DD/MM/YYYY')
                          ) : (
                            'N/A'
                          )}
                        </Typography>
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
                              <TableCell align="center"><strong>Fotos</strong></TableCell>
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
                                <TableCell align="center">
                                  {payment.imageUrl && (
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleViewImage(payment.imageUrl)}
                                    >
                                      <ImageSearchIcon />
                                    </IconButton>
                                  )}
                                </TableCell>
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
                                <TableCell align="center">-</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* Delivery Information - Only show if delivery exists and is completed */}
              {sale.delivery && sale.delivery.status === 'COMPLETADA' && (
                <Grid item xs={12}>
                  <Card>
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h4" gutterBottom>
                          Información de Entrega
                        </Typography>
                        {hasValidDeliveryImages() && (
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<PhotoCameraIcon />}
                            onClick={handleViewDeliveryImages}
                          >
                            Ver Fotos de Entrega
                          </Button>
                        )}
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Estado de Entrega
                          </Typography>
                          <Box mt={0.5}>
                            <Chip
                              label="Completada"
                              color="success"
                              size="small"
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Fecha de Entrega
                          </Typography>
                          <Typography variant="body2">
                            {sale.delivery.completedAt 
                              ? formatTZDate(sale.delivery.completedAt, "DD/MM/YYYY HH:mm")
                              : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Entregado por
                          </Typography>
                          <Typography variant="body2">
                            {sale.delivery.completedBy?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Fotos de Entrega
                          </Typography>
                          <Typography variant="body2">
                            {hasValidDeliveryImages()
                              ? `${Object.keys(getValidDeliveryImages()).length} foto(s)`
                              : 'Sin fotos'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Container>
      <Footer />
      <ImagesModal
        open={openImages}
        onClose={handleOnCloseImages}
        title="Comprobante de Pago"
        text="Imagen del comprobante de pago"
        imagesObj={selectedImages}
      />
      {/* Modal for delivery images with edit capability */}
      <ImagesModal
        open={openDeliveryImages}
        onClose={handleCloseDeliveryImages}
        title="Fotos de Entrega"
        text="Imágenes de la entrega de venta"
        imagesObj={selectedImages}
        canEdit={canEditImages && sale?.delivery?.status === 'COMPLETADA'}
      />
    </>
  );
}

SaleDetail.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default SaleDetail;
