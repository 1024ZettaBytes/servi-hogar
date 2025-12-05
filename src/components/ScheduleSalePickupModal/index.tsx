import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Alert,
  Container,
  Typography,
  TextField,
  Autocomplete,
  Skeleton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { saveSalePickup } from '../../../lib/client/salePickupsFetch';
import {
  convertDateToTZ,
  setDateToMid,
  convertDateToLocal
} from 'lib/client/utils';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import OperationTime from 'pages/renta-rapida/OperationTime';
import useSWR from 'swr';
import { ROUTES } from '../../../lib/consts/API_URL_CONST';

const fetcher = (url) => fetch(url).then((res) => res.json());

const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(22, 0, 0);
  return today;
};

function ScheduleSalePickupModal(props) {
  const { handleOnClose, open, preSelectedSale } = props;
  
  // Fetch completed sales with warranty
  const { data: salesData, error: salesError } = useSWR(
    ROUTES.ALL_SALES_API,
    fetcher
  );

  const [selectedSale, setSelectedSale] = useState<any>(preSelectedSale || null);
  const [selectedMachine, setSelectedMachine] = useState<any>(preSelectedSale?.machine || null);
  const [reason, setReason] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<any>({
    date: setDateToMid(new Date()),
    timeOption: 'any',
    fromTime: defaultInitialDate(convertDateToLocal(new Date())),
    endTime: defaultEndDate(convertDateToLocal(new Date()))
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });

  // Filter sales with valid warranty
  const salesWithWarranty = salesData?.data?.filter((sale: any) => {
    return sale.status === 'ACTIVA' || sale.status === 'PAGADA';
  }) || [];

  const submitButtonEnabled =
    selectedSale &&
    selectedMachine &&
    reason.trim().length > 0 &&
    pickupTime.date &&
    (pickupTime.timeOption === 'any' ||
      (pickupTime.fromTime &&
        pickupTime.endTime &&
        pickupTime.fromTime.getTime() <= pickupTime.endTime.getTime()));

  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);
    
    const result = await saveSalePickup({
      saleId: selectedSale._id,
      machineId: selectedMachine._id,
      pickupTime: {
        ...pickupTime,
        date: convertDateToTZ(setDateToMid(pickupTime.date)),
        fromTime: convertDateToTZ(pickupTime.fromTime),
        endTime: convertDateToTZ(pickupTime.endTime)
      },
      reason
    });
    
    setIsSubmitting(false);
    if (!result.error) {
      handleSavedPickup(result.msg);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(false);
    handleOnClose(false);
  };

  const handleSavedPickup = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const onChangePickupTime = (id, value) => {
    if (
      (id === 'fromTime' || id === 'endTime') &&
      value.toString() === 'Invalid Date'
    ) {
      value = null;
    }
    setPickupTime({ ...pickupTime, [id]: value });
  };

  if (salesError) {
    return (
      <Dialog open={open} fullWidth={true} maxWidth={'md'}>
        <Card>
          <CardHeader title="Agendar Recolección de Garantía" />
          <Divider />
          <CardContent>
            <Alert severity="error">
              Error al cargar las ventas. Por favor intente de nuevo.
            </Alert>
            <Box mt={2}>
              <Button variant="outlined" onClick={handleClose}>
                Cerrar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} fullWidth={true} maxWidth={'md'} scroll={'body'}>
      <Card>
        <CardHeader title="Agendar Recolección de Garantía" />
        <Divider />
        <CardContent>
          <Box>
            <Container maxWidth="lg">
              <Grid container spacing={3}>
                {!salesData ? (
                  <Grid item xs={12}>
                    <Skeleton variant="rectangular" height={200} />
                  </Grid>
                ) : (
                  <>
                    {preSelectedSale ? (
                      <>
                        <Grid item xs={12}>
                          <Alert severity="info">
                            <Typography variant="h6" gutterBottom>
                              Venta #{preSelectedSale.saleNum}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Cliente:</strong> {preSelectedSale.customer?.name}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Teléfono:</strong> {preSelectedSale.customer?.phone || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Máquina:</strong> #{preSelectedSale.machine?.machineNum} - {preSelectedSale.machine?.brand}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Garantía hasta:</strong>{' '}
                              {preSelectedSale.machine?.warranty
                                ? format(new Date(preSelectedSale.machine.warranty), 'dd/MM/yyyy', { locale: es })
                                : 'Sin garantía'}
                            </Typography>
                          </Alert>
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom>
                            Información de la Venta
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            options={salesWithWarranty}
                            getOptionLabel={(option) => 
                              `${option.customer?.name} - Venta #${option._id?.slice(-6)}`
                            }
                            value={selectedSale}
                            onChange={(_, newValue) => {
                              setSelectedSale(newValue);
                              setSelectedMachine(null);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Seleccionar Venta"
                                required
                              />
                            )}
                          />
                        </Grid>

                        {selectedSale && (
                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={[selectedSale.machine]}
                              getOptionLabel={(option) => 
                                `Máquina #${option.machineNum} - ${option.brand}`
                              }
                              value={selectedMachine}
                              onChange={(_, newValue) => setSelectedMachine(newValue)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Máquina"
                                  required
                                />
                              )}
                            />
                          </Grid>
                        )}
                      </>
                    )}

                    {selectedMachine && (
                      <>
                        {!preSelectedSale && (
                          <Grid item xs={12}>
                            <Alert severity="info">
                              <Typography variant="body2">
                                <strong>Cliente:</strong> {selectedSale.customer?.name}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Teléfono:</strong> {selectedSale.customer?.phone || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Garantía hasta:</strong>{' '}
                                {selectedMachine.warranty
                                  ? format(new Date(selectedMachine.warranty), 'dd/MM/yyyy', { locale: es })
                                  : 'Sin garantía'}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}

                        <Grid item xs={12}>
                          <TextField
                            label="Razón de la recolección (descripción del problema)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            required
                            placeholder="Ej: Máquina no enciende, hace ruido extraño, etc."
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom>
                            Fecha y Hora de Recolección
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <OperationTime
                            date={pickupTime.date}
                            timeOption={pickupTime.timeOption}
                            fromTime={pickupTime.fromTime}
                            endTime={pickupTime.endTime}
                            onChangeTime={onChangePickupTime}
                            minDate={new Date()}
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </Grid>

              {hasErrorSubmitting.error && (
                <Box mt={2}>
                  <Alert severity="error">{hasErrorSubmitting.msg}</Alert>
                </Box>
              )}

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleOnSubmit}
                  disabled={!submitButtonEnabled}
                  loading={isSubmitting}
                >
                  Agendar Recolección
                </LoadingButton>
              </Box>
            </Container>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default ScheduleSalePickupModal;
