import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import Footer from '@/components/Footer';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import {
  getFetcher,
  useGetExternalRepairById,
  useGetProducts,
  useGetOperators,
  useGetPaymentAccounts,
  useGetAllWarehousesOverview
} from '../../pages/api/useRequest';
import { PAYMENT_METHODS } from '../../lib/consts/OBJ_CONTS';
import {
  submitExternalRepairBudget,
  addUsedProductToExternalRepair,
  removeUsedProductFromExternalRepair,
  authorizeExternalRepair,
  rejectExternalRepair,
  completeExternalRepair,
  scheduleExternalRepairDelivery,
  postponeExternalRepairDelivery,
  completeExternalRepairDelivery,
  completeExternalRepairPickup,
  receiveExternalRepairInWarehouse,
  cancelExternalRepair
} from '../../lib/client/externalRepairsFetch';
import { compressImage, formatTZDate } from '../../lib/client/utils';
import { EXTERNAL_REPAIR_STATUS_LABELS } from './index';

const fmt = (d) => (d ? formatTZDate(d, 'DD MMMM YYYY') : '—');

function ExternalRepairDetail({ session }) {
  const router = useRouter();
  const { repairId } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  const { externalRepairData: repair, isLoadingExternalRepair } =
    useGetExternalRepairById(getFetcher, repairId);
  const { productsList } = useGetProducts(getFetcher);
  const { operatorsList } = useGetOperators(
    ['AUX', 'ADMIN'].includes(role) ? getFetcher : () => null
  );
  const { paymentAccounts } = useGetPaymentAccounts(getFetcher);
  const { warehousesList } = useGetAllWarehousesOverview(
    ['AUX', 'ADMIN', 'TEC'].includes(role) ? getFetcher : () => null
  );

  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [laborAmount, setLaborAmount] = useState('0');
  const [operatorId, setOperatorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeNote, setPostponeNote] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<any>(null);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deliveryFolio, setDeliveryFolio] = useState('');
  const [deliveryAccount, setDeliveryAccount] = useState('');
  const [voucherFile, setVoucherFile] = useState<any>(null);
  const [pickupPhotos, setPickupPhotos] = useState<any[]>([
    null,
    null,
    null,
    null
  ]);
  const [conditionNote, setConditionNote] = useState('');
  const [pickupBrand, setPickupBrand] = useState('');
  const [pickupSerial, setPickupSerial] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [repairPhotos, setRepairPhotos] = useState<any[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const notify = (msg, error = false) =>
    enqueueSnackbar(msg, {
      variant: error ? 'error' : 'success',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 3000
    });

  if (isLoadingExternalRepair || !repair) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const status = EXTERNAL_REPAIR_STATUS_LABELS[repair.status] || {
    label: repair.status,
    color: 'default'
  };
  const usedParts = repair.usedInventory || [];
  const partsTotal = usedParts.reduce(
    (sum, u) => sum + (u.qty || 0) * (u.price || 0),
    0
  );

  const idEq = (ref) => String(ref?._id || ref) === String(userId);

  // Pickup
  const canCompletePickup =
    repair.status === 'RECOLECCION_AGENDADA' &&
    (role === 'ADMIN' || (role === 'OPE' && idEq(repair.pickupAssignedTo)));
  // Warehouse drop-off
  const canReceiveWarehouse =
    repair.status === 'RECOLECTADA' && ['ADMIN', 'AUX', 'TEC'].includes(role);
  // Office can cancel the pickup before it is collected.
  const canCancel =
    repair.status === 'RECOLECCION_AGENDADA' &&
    ['ADMIN', 'AUX'].includes(role);
  // Budget
  const canEdit =
    ['TEC', 'ADMIN'].includes(role) && repair.status === 'POR_EVALUAR';
  const canDecide =
    ['AUX', 'ADMIN'].includes(role) &&
    repair.status === 'ESPERANDO_AUTORIZACION';
  const canRepair =
    ['TEC', 'ADMIN'].includes(role) && repair.status === 'AUTORIZADA';
  // Delivery / return (unified)
  const isReturn = repair.status === 'NO_AUTORIZADA';
  const isDeliverable = repair.status === 'REPARADA' || isReturn;
  const isScheduled = isDeliverable && !!repair.deliveryAssignedTo;
  const canSchedule =
    ['AUX', 'ADMIN'].includes(role) && isDeliverable && !isScheduled;
  const canPostpone = ['AUX', 'ADMIN'].includes(role) && isScheduled;
  const canDeliver =
    isScheduled &&
    (['AUX', 'ADMIN'].includes(role) ||
      (role === 'OPE' && idEq(repair.deliveryAssignedTo)));

  async function handleAddPart() {
    if (!selectedProduct || Number(qty) <= 0) return;
    setIsWorking(true);
    const result = await addUsedProductToExternalRepair(
      repairId,
      selectedProduct,
      Number(qty)
    );
    setIsWorking(false);
    notify(result.msg, result.error);
    if (!result.error) {
      setSelectedProduct('');
      setQty('1');
    }
  }

  async function handleRemovePart(usedInventoryId) {
    setIsWorking(true);
    const result = await removeUsedProductFromExternalRepair(
      usedInventoryId,
      repairId
    );
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleSubmitBudget() {
    setIsWorking(true);
    const result = await submitExternalRepairBudget(
      repairId,
      Number(laborAmount)
    );
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleAuthorize() {
    setIsWorking(true);
    const result = await authorizeExternalRepair(repairId);
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleReject() {
    setIsWorking(true);
    const result = await rejectExternalRepair(repairId);
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleRepairPhotos(e) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const compressed = [];
    for (const file of selected) {
      const result = await compressImage(file as File);
      if (result) compressed.push(result.file);
    }
    setRepairPhotos((prev) => [...prev, ...compressed]);
  }

  async function handleCompleteRepair() {
    if (!repairDescription.trim()) {
      notify('Describa el trabajo realizado en la reparación.', true);
      return;
    }
    if (repairPhotos.length === 0) {
      notify('Suba al menos una foto de evidencia de la reparación.', true);
      return;
    }
    const formData = new FormData();
    formData.append('repairId', String(repairId));
    formData.append('description', repairDescription);
    repairPhotos.forEach((p, i) => {
      if (p) formData.append(`photo${i + 1}`, p);
    });
    setIsWorking(true);
    const result = await completeExternalRepair(formData);
    setIsWorking(false);
    notify(result.msg, result.error);
    if (!result.error) {
      setRepairDescription('');
      setRepairPhotos([]);
    }
  }

  async function handlePickupPhoto(index, e) {
    if (e.target.files && e.target.files[0]) {
      const result = await compressImage(e.target.files[0]);
      if (result) {
        setPickupPhotos((prev) => {
          const next = [...prev];
          next[index] = result.file;
          return next;
        });
      }
    }
  }

  async function handleCompletePickup() {
    if (!pickupBrand.trim()) {
      notify('Indique la marca de la lavadora.', true);
      return;
    }
    if (pickupPhotos.some((p) => !p)) {
      notify('Suba las 4 fotos de la lavadora.', true);
      return;
    }
    const formData = new FormData();
    formData.append('repairId', String(repairId));
    formData.append('brand', pickupBrand);
    formData.append('serialNumber', pickupSerial);
    formData.append('conditionNote', conditionNote);
    pickupPhotos.forEach((p, i) => {
      if (p) formData.append(`photo${i + 1}`, p);
    });
    setIsWorking(true);
    const result = await completeExternalRepairPickup(formData);
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setIsWorking(true);
    const result = await cancelExternalRepair(repairId, cancelReason);
    setIsWorking(false);
    notify(result.msg, result.error);
    if (!result.error) {
      setCancelOpen(false);
      setCancelReason('');
    }
  }

  async function handleReceiveWarehouse() {
    if (!warehouseId) return;
    setIsWorking(true);
    const result = await receiveExternalRepairInWarehouse(repairId, warehouseId);
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handleSchedule() {
    if (!operatorId || !scheduledDate) return;
    setIsWorking(true);
    const result = await scheduleExternalRepairDelivery(
      repairId,
      operatorId,
      scheduledDate
    );
    setIsWorking(false);
    notify(result.msg, result.error);
  }

  async function handlePostpone() {
    if (!postponeDate || !postponeNote.trim()) return;
    setIsWorking(true);
    const result = await postponeExternalRepairDelivery(
      repairId,
      postponeDate,
      postponeNote
    );
    setIsWorking(false);
    notify(result.msg, result.error);
    if (!result.error) {
      setPostponeDate('');
      setPostponeNote('');
    }
  }

  async function handleEvidenceChange(e) {
    if (e.target.files && e.target.files[0]) {
      const result = await compressImage(e.target.files[0]);
      if (result) setEvidenceFile(result.file);
    }
  }

  async function handleVoucherChange(e) {
    if (e.target.files && e.target.files[0]) {
      const result = await compressImage(e.target.files[0]);
      if (result) setVoucherFile(result.file);
    }
  }

  async function handleCompleteDelivery() {
    if (!isReturn) {
      const isCash = ['CASH', 'CASH_OFFICE'].includes(deliveryMethod);
      if (!deliveryMethod) {
        notify('Seleccione el método de pago.', true);
        return;
      }
      if (!isCash && (!deliveryFolio.trim() || !deliveryAccount || !voucherFile)) {
        notify(
          'Para pagos que no son en efectivo indique folio, cuenta y comprobante.',
          true
        );
        return;
      }
    }
    // Evidence photo is mandatory for every delivery (repaired or returned).
    if (!evidenceFile) {
      notify('La foto de evidencia de la entrega es obligatoria.', true);
      return;
    }
    const formData = new FormData();
    formData.append('repairId', String(repairId));
    if (!isReturn) {
      const isCash = ['CASH', 'CASH_OFFICE'].includes(deliveryMethod);
      formData.append('method', deliveryMethod);
      if (!isCash) {
        formData.append('folio', deliveryFolio);
        formData.append('paymentAccountId', deliveryAccount);
        if (voucherFile) formData.append('voucher', voucherFile);
      }
    }
    if (evidenceFile) formData.append('evidence', evidenceFile);
    setIsWorking(true);
    const result = await completeExternalRepairDelivery(formData);
    setIsWorking(false);
    notify(result.msg, result.error);
    if (!result.error) {
      setEvidenceFile(null);
      setVoucherFile(null);
    }
  }

  const PICKUP_LABELS = ['Frente', 'Tablero', 'Serie', 'Debajo'];

  return (
    <>
      <Head>
        <title>Reparación Externa #{repair.totalNumber}</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={`Reparación Externa #${repair.totalNumber}`}
          sutitle={repair.customerName}
        />
        <NextBreadcrumbs
          paths={['Inicio', 'Reparaciones Externas', `#${repair.totalNumber}`]}
          lastLoaded={true}
        />
      </PageTitleWrapper>

      <Container maxWidth="md">
        <Grid container spacing={3}>
          {/* Detalle */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Detalle"
                action={
                  <Box mt={1} mr={1}>
                    <Chip label={status.label} color={status.color as any} />
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                {repair.status === 'ESPERANDO_AUTORIZACION' &&
                  role === 'TEC' && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Esperando autorización de presupuesto.
                    </Alert>
                  )}
                {repair.status === 'CANCELADA' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Recolección cancelada
                    {repair.cancellationReason
                      ? `: ${repair.cancellationReason}`
                      : ''}
                    .
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Cliente</Typography>
                    <Typography>{repair.customerName}</Typography>
                    <Typography color="text.secondary">
                      {repair.customerCell}
                    </Typography>
                    <Typography color="text.secondary">
                      {repair.customerAddress}
                    </Typography>
                    {repair.customerMaps && (
                      <Button
                        size="small"
                        href={repair.customerMaps}
                        target="_blank"
                      >
                        Ver ubicación
                      </Button>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Lavadora</Typography>
                    <Typography>
                      {repair.brand}
                      {repair.serialNumber ? ` · ${repair.serialNumber}` : ''}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Técnico
                    </Typography>
                    <Typography>{repair.takenBy?.name || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Falla</Typography>
                    <Typography>{repair.failureDescription}</Typography>
                  </Grid>
                  {repair.pickupConditionNote && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">
                        Estado al recolectar
                      </Typography>
                      <Typography>{repair.pickupConditionNote}</Typography>
                    </Grid>
                  )}
                  {(repair.entryPhotos || []).length > 0 && (
                    <Grid item xs={12}>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {repair.entryPhotos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={`foto-${i}`}
                              style={{
                                width: 110,
                                height: 110,
                                objectFit: 'cover',
                                borderRadius: 6
                              }}
                            />
                          </a>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recolección */}
          {repair.status === 'RECOLECCION_AGENDADA' && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Recolección" />
                <Divider />
                <CardContent>
                  <Typography sx={{ mb: 2 }}>
                    Chofer: <b>{repair.pickupAssignedTo?.name || '—'}</b> · Fecha:{' '}
                    <b>{fmt(repair.pickupScheduledDate)}</b>
                  </Typography>
                  {canCompletePickup ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Marca"
                          required
                          fullWidth
                          value={pickupBrand}
                          onChange={(e) => setPickupBrand(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Número de serie"
                          required
                          fullWidth
                          value={pickupSerial}
                          onChange={(e) => setPickupSerial(e.target.value)}
                        />
                      </Grid>
                      {PICKUP_LABELS.map((label, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            color={pickupPhotos[i] ? 'success' : 'primary'}
                          >
                            {pickupPhotos[i]
                              ? `${label}: ${pickupPhotos[i].name}`
                              : `Foto ${label} *`}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handlePickupPhoto(i, e)}
                            />
                          </Button>
                        </Grid>
                      ))}
                      <Grid item xs={12}>
                        <TextField
                          label="Nota de estado del equipo"
                          fullWidth
                          multiline
                          minRows={2}
                          value={conditionNote}
                          onChange={(e) => setConditionNote(e.target.value)}
                          helperText="Ej: piezas faltantes, golpes, etc."
                        />
                      </Grid>
                      <Grid item xs={12} textAlign="right">
                        <LoadingButton
                          variant="contained"
                          loading={isWorking}
                          onClick={handleCompletePickup}
                        >
                          Completar recolección
                        </LoadingButton>
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Pendiente de recolección por el chofer.
                    </Alert>
                  )}
                  {canCancel && (
                    <Box mt={2} textAlign="right">
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={() => setCancelOpen(true)}
                      >
                        Cancelar recolección
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Bajar en bodega */}
          {repair.status === 'RECOLECTADA' && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="En vehículo — bajar en bodega" />
                <Divider />
                <CardContent>
                  {canReceiveWarehouse ? (
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={7}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="wh-label">Bodega</InputLabel>
                          <Select
                            labelId="wh-label"
                            label="Bodega"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                          >
                            {(warehousesList || []).map((w) => (
                              <MenuItem key={w._id} value={w._id}>
                                {w.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <LoadingButton
                          variant="contained"
                          fullWidth
                          loading={isWorking}
                          disabled={!warehouseId}
                          onClick={handleReceiveWarehouse}
                        >
                          Bajar en bodega
                        </LoadingButton>
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Equipo en vehículo, pendiente de bajar en bodega.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Presupuesto */}
          {['POR_EVALUAR', 'ESPERANDO_AUTORIZACION'].includes(repair.status) && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Presupuesto — refacciones y mano de obra" />
                <Divider />
                <CardContent>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Refacción</TableCell>
                        <TableCell align="center">Cant.</TableCell>
                        <TableCell align="right">Precio</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        {canEdit && <TableCell />}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usedParts.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell>
                            {u.inventoryProduct?.name ||
                              u.inventoryProduct?.code ||
                              '—'}
                          </TableCell>
                          <TableCell align="center">{u.qty}</TableCell>
                          <TableCell align="right">${u.price}</TableCell>
                          <TableCell align="right">
                            ${(u.qty || 0) * (u.price || 0)}
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isWorking}
                                onClick={() => handleRemovePart(u._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {usedParts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 5 : 4}>
                            <Typography color="text.secondary">
                              Sin refacciones agregadas.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {canEdit && (
                    <Grid container spacing={2} alignItems="center" mt={1}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="prod-label">Refacción</InputLabel>
                          <Select
                            labelId="prod-label"
                            label="Refacción"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                          >
                            {(productsList || []).map((p) => (
                              <MenuItem key={p._id} value={p._id}>
                                {p.name || p.code} (stock: {p.stock})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          size="small"
                          type="number"
                          label="Cantidad"
                          fullWidth
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          inputProps={{ min: 1, step: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled={isWorking || !selectedProduct}
                          onClick={handleAddPart}
                        >
                          Agregar
                        </Button>
                      </Grid>
                    </Grid>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        size="small"
                        type="number"
                        label="Mano de obra ($)"
                        fullWidth
                        value={canEdit ? laborAmount : repair.laborAmount ?? 0}
                        onChange={(e) => setLaborAmount(e.target.value)}
                        disabled={!canEdit}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography>
                        Refacciones: <b>${partsTotal}</b>
                      </Typography>
                      <Typography>
                        Total presupuesto:{' '}
                        <b>
                          $
                          {canEdit
                            ? partsTotal + Number(laborAmount || 0)
                            : repair.budgetAmount ?? partsTotal}
                        </b>
                      </Typography>
                    </Grid>
                  </Grid>

                  {canEdit && (
                    <Box mt={2} textAlign="right">
                      <LoadingButton
                        variant="contained"
                        loading={isWorking}
                        onClick={handleSubmitBudget}
                      >
                        Enviar presupuesto a oficina
                      </LoadingButton>
                    </Box>
                  )}

                  {canDecide && (
                    <Box mt={2}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Envíe el presupuesto al cliente y registre su respuesta.
                      </Alert>
                      <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="flex-end"
                      >
                        <LoadingButton
                          color="error"
                          variant="outlined"
                          loading={isWorking}
                          onClick={handleReject}
                        >
                          No autorizado
                        </LoadingButton>
                        <LoadingButton
                          color="success"
                          variant="contained"
                          loading={isWorking}
                          onClick={handleAuthorize}
                        >
                          Autorizado
                        </LoadingButton>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Reparación y entrega/devolución */}
          {['AUTORIZADA', 'REPARADA', 'NO_AUTORIZADA', 'ENTREGADA', 'DEVUELTA'].includes(
            repair.status
          ) && (
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={isReturn ? 'Devolución' : 'Reparación y entrega'}
                />
                <Divider />
                <CardContent>
                  {repair.status === 'AUTORIZADA' && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Presupuesto autorizado.{' '}
                        {repair.repairDeadline &&
                          `Fecha límite de reparación: ${fmt(
                            repair.repairDeadline
                          )}.`}
                      </Alert>
                      {canRepair && (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="Descripción del trabajo realizado"
                              required
                              fullWidth
                              multiline
                              minRows={2}
                              value={repairDescription}
                              onChange={(e) =>
                                setRepairDescription(e.target.value)
                              }
                              helperText="Detalle las reparaciones y refacciones colocadas."
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Button
                              variant="outlined"
                              component="label"
                              fullWidth
                              color={
                                repairPhotos.length > 0 ? 'success' : 'primary'
                              }
                            >
                              {repairPhotos.length > 0
                                ? `${repairPhotos.length} foto(s) de evidencia`
                                : 'Fotos de evidencia *'}
                              <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleRepairPhotos}
                              />
                            </Button>
                          </Grid>
                          {repairPhotos.length > 0 && (
                            <Grid item xs={12} sm={6}>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => setRepairPhotos([])}
                              >
                                Quitar fotos
                              </Button>
                            </Grid>
                          )}
                          <Grid item xs={12} textAlign="right">
                            <LoadingButton
                              variant="contained"
                              loading={isWorking}
                              disabled={
                                !repairDescription.trim() ||
                                repairPhotos.length === 0
                              }
                              onClick={handleCompleteRepair}
                            >
                              Marcar como reparada
                            </LoadingButton>
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  )}

                  {(repair.repairDescription ||
                    (repair.repairEvidencePhotos || []).length > 0) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Trabajo realizado
                      </Typography>
                      {repair.repairDescription && (
                        <Typography sx={{ mb: 1 }}>
                          {repair.repairDescription}
                        </Typography>
                      )}
                      {(repair.repairEvidencePhotos || []).length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          {repair.repairEvidencePhotos.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={url}
                                alt={`evidencia-${i}`}
                                style={{
                                  width: 110,
                                  height: 110,
                                  objectFit: 'cover',
                                  borderRadius: 6
                                }}
                              />
                            </a>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}

                  {isDeliverable && (
                    <Box>
                      {isReturn ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Presupuesto no autorizado. Programe la devolución al
                          cliente
                          {repair.returnDeadline
                            ? ` antes del ${fmt(repair.returnDeadline)}`
                            : ''}
                          .
                        </Alert>
                      ) : (
                        <Typography sx={{ mb: 1 }}>
                          Reparada por{' '}
                          <b>{repair.repairedBy?.name || '—'}</b>
                          {repair.repairedAt && ` el ${fmt(repair.repairedAt)}`}.
                        </Typography>
                      )}

                      {canSchedule && (
                        <Grid container spacing={2} alignItems="center" mt={0.5}>
                          <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small">
                              <InputLabel id="op-label">Chofer</InputLabel>
                              <Select
                                labelId="op-label"
                                label="Chofer"
                                value={operatorId}
                                onChange={(e) => setOperatorId(e.target.value)}
                              >
                                {(operatorsList || []).map((op) => (
                                  <MenuItem key={op._id} value={op._id}>
                                    {op.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              size="small"
                              type="date"
                              label="Fecha"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <LoadingButton
                              variant="contained"
                              fullWidth
                              loading={isWorking}
                              disabled={!operatorId || !scheduledDate}
                              onClick={handleSchedule}
                            >
                              Programar
                            </LoadingButton>
                          </Grid>
                          {!isReturn && (
                            <Grid item xs={12}>
                              <Typography color="text.secondary">
                                Monto a cobrar en la entrega:{' '}
                                <b>${repair.budgetAmount ?? 0}</b>
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {isScheduled && (
                        <Box mt={1}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            {isReturn ? 'Devolución' : 'Entrega'} programada para
                            el {fmt(repair.deliveryScheduledDate)} con{' '}
                            {repair.deliveryAssignedTo?.name || 'el chofer'}.
                            {!isReturn && (
                              <>
                                {' '}
                                Monto a cobrar: <b>${repair.chargeAmount ?? 0}</b>.
                              </>
                            )}
                          </Alert>

                          {(repair.followUpNotes || []).length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2">
                                Notas de seguimiento
                              </Typography>
                              {repair.followUpNotes.map((n, i) => (
                                <Typography key={i} color="text.secondary">
                                  • {fmt(n.date)}: {n.note}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          {canPostpone && (
                            <Grid
                              container
                              spacing={2}
                              alignItems="center"
                              sx={{ mb: 2 }}
                            >
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  size="small"
                                  type="date"
                                  label="Nueva fecha"
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                  value={postponeDate}
                                  onChange={(e) =>
                                    setPostponeDate(e.target.value)
                                  }
                                />
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <TextField
                                  size="small"
                                  label="Nota de seguimiento"
                                  fullWidth
                                  value={postponeNote}
                                  onChange={(e) =>
                                    setPostponeNote(e.target.value)
                                  }
                                />
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <LoadingButton
                                  variant="outlined"
                                  fullWidth
                                  loading={isWorking}
                                  disabled={
                                    !postponeDate || !postponeNote.trim()
                                  }
                                  onClick={handlePostpone}
                                >
                                  Posponer
                                </LoadingButton>
                              </Grid>
                            </Grid>
                          )}

                          {canDeliver && (
                            <Box>
                              <Divider sx={{ my: 2 }} />
                              {isReturn ? (
                                <Typography sx={{ mb: 2 }}>
                                  Entregar el equipo al cliente (sin cobro) y
                                  cerrar la devolución.
                                </Typography>
                              ) : (
                                <Typography sx={{ mb: 2 }}>
                                  Cobrar <b>${repair.chargeAmount ?? 0}</b> y
                                  cerrar la entrega (garantía de 30 días).
                                </Typography>
                              )}
                              <Grid container spacing={2} alignItems="center">
                                {!isReturn && (
                                  <>
                                    <Grid item xs={12} sm={6}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel id="method-label">
                                          Método de pago
                                        </InputLabel>
                                        <Select
                                          labelId="method-label"
                                          label="Método de pago"
                                          value={deliveryMethod}
                                          onChange={(e) =>
                                            setDeliveryMethod(e.target.value)
                                          }
                                        >
                                          {Object.keys(PAYMENT_METHODS).map(
                                            (m) => (
                                              <MenuItem key={m} value={m}>
                                                {PAYMENT_METHODS[m]}
                                              </MenuItem>
                                            )
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    {deliveryMethod &&
                                      !['CASH', 'CASH_OFFICE'].includes(
                                        deliveryMethod
                                      ) && (
                                        <>
                                          <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth size="small">
                                              <InputLabel id="acc-label">
                                                Cuenta
                                              </InputLabel>
                                              <Select
                                                labelId="acc-label"
                                                label="Cuenta"
                                                value={deliveryAccount}
                                                onChange={(e) =>
                                                  setDeliveryAccount(
                                                    e.target.value
                                                  )
                                                }
                                              >
                                                {(paymentAccounts || []).map(
                                                  (acc) => (
                                                    <MenuItem
                                                      key={acc._id}
                                                      value={acc._id}
                                                    >
                                                      {`${acc.bank} ${acc.count} (${acc.number?.slice(
                                                        -4
                                                      )})`}
                                                    </MenuItem>
                                                  )
                                                )}
                                              </Select>
                                            </FormControl>
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <TextField
                                              size="small"
                                              fullWidth
                                              label="Folio comprobante"
                                              value={deliveryFolio}
                                              onChange={(e) =>
                                                setDeliveryFolio(e.target.value)
                                              }
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6}>
                                            <Button
                                              variant="outlined"
                                              component="label"
                                              fullWidth
                                              color={
                                                voucherFile
                                                  ? 'success'
                                                  : 'primary'
                                              }
                                            >
                                              {voucherFile
                                                ? `Comprobante: ${voucherFile.name}`
                                                : 'Foto de comprobante'}
                                              <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleVoucherChange}
                                              />
                                            </Button>
                                          </Grid>
                                        </>
                                      )}
                                  </>
                                )}
                                <Grid item xs={12} sm={6}>
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    color={evidenceFile ? 'success' : 'primary'}
                                  >
                                    {evidenceFile
                                      ? `Evidencia: ${evidenceFile.name}`
                                      : 'Foto de evidencia *'}
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*"
                                      onChange={handleEvidenceChange}
                                    />
                                  </Button>
                                </Grid>
                                <Grid item xs={12} textAlign="right">
                                  <LoadingButton
                                    variant="contained"
                                    loading={isWorking}
                                    disabled={
                                      !evidenceFile ||
                                      (!isReturn && !deliveryMethod)
                                    }
                                    onClick={handleCompleteDelivery}
                                  >
                                    {isReturn
                                      ? 'Completar devolución'
                                      : 'Completar entrega'}
                                  </LoadingButton>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  {repair.status === 'ENTREGADA' && (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Entregada el {fmt(repair.deliveredAt)}. Garantía hasta el{' '}
                        {fmt(repair.warrantyUntil)}.
                      </Alert>
                      <Typography>
                        Monto cobrado: <b>${repair.chargeAmount ?? 0}</b>
                      </Typography>
                      <Typography>
                        Técnico que reparó:{' '}
                        <b>{repair.repairedBy?.name || '—'}</b>
                      </Typography>
                      <Typography>
                        Entregó: {repair.deliveredBy?.name || '—'}
                      </Typography>
                      {repair.deliveryEvidenceUrl && (
                        <Button
                          size="small"
                          href={repair.deliveryEvidenceUrl}
                          target="_blank"
                          sx={{ mt: 1 }}
                        >
                          Ver evidencia
                        </Button>
                      )}
                    </Box>
                  )}

                  {repair.status === 'DEVUELTA' && (
                    <Alert severity="success">
                      Devuelta al cliente el {fmt(repair.returnedAt)}.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Cancelar recolección</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo de la cancelación"
            fullWidth
            required
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Cerrar</Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={isWorking}
            disabled={!cancelReason.trim()}
            onClick={handleCancel}
          >
            Confirmar cancelación
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  );
}

ExternalRepairDetail.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default ExternalRepairDetail;
