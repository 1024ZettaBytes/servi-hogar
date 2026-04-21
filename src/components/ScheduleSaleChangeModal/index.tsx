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
import { saveSaleChange } from '../../../lib/client/saleChangesFetch';
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

function ScheduleSaleChangeModal(props) {
  const { handleOnClose, open, preSelectedSale } = props;

  // Fetch available sales machines (DISPONIBLE)
  const { data: machinesData, error: machinesError } = useSWR(
    open ? ROUTES.ALL_SALES_MACHINES_API : null,
    fetcher
  );

  // Fetch operators
  const { data: operatorsData, error: operatorsError } = useSWR(
    open ? '/api/operators' : null,
    fetcher
  );

  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [reason, setReason] = useState<string>('');
  const [changeTime, setChangeTime] = useState<any>({
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

  const availableMachines = machinesData?.salesMachinesList || [];
  const operatorsList = operatorsData?.data || [];

  const submitButtonEnabled =
    preSelectedSale &&
    selectedMachine &&
    selectedOperator &&
    reason.trim().length > 0 &&
    changeTime.date &&
    (changeTime.timeOption === 'any' ||
      (changeTime.fromTime &&
        changeTime.endTime &&
        changeTime.fromTime.getTime() <= changeTime.endTime.getTime()));

  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);

    const result = await saveSaleChange({
      saleId: preSelectedSale._id,
      leftMachineId: selectedMachine._id,
      operatorId: selectedOperator.id,
      changeTime: {
        ...changeTime,
        date: convertDateToTZ(setDateToMid(changeTime.date)),
        fromTime: convertDateToTZ(changeTime.fromTime),
        endTime: convertDateToTZ(changeTime.endTime)
      },
      reason
    });

    setIsSubmitting(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(false);
    handleOnClose(false);
  };

  const onChangeTime = (id, value) => {
    if (
      (id === 'fromTime' || id === 'endTime') &&
      value.toString() === 'Invalid Date'
    ) {
      value = null;
    }
    setChangeTime({ ...changeTime, [id]: value });
  };

  if (machinesError || operatorsError) {
    return (
      <Dialog open={open} fullWidth={true} maxWidth={'md'}>
        <Card>
          <CardHeader title="Agendar Cambio por Garantía" />
          <Divider />
          <CardContent>
            <Alert severity="error">
              Error al cargar los datos. Por favor intente de nuevo.
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
        <CardHeader title="Agendar Cambio por Garantía" />
        <Divider />
        <CardContent>
          <Box>
            <Container maxWidth="lg">
              <Grid container spacing={3}>
                {!machinesData || !operatorsData ? (
                  <Grid item xs={12}>
                    <Skeleton variant="rectangular" height={200} />
                  </Grid>
                ) : (
                  <>
                    {/* Sale info */}
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="h6" gutterBottom>
                          Venta #{preSelectedSale.saleNum}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cliente:</strong>{' '}
                          {preSelectedSale.customer?.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Máquina actual:</strong> #
                          {preSelectedSale.machine?.machineNum} -{' '}
                          {preSelectedSale.machine?.brand}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Garantía hasta:</strong>{' '}
                          {preSelectedSale.machine?.warranty
                            ? format(
                                new Date(preSelectedSale.machine.warranty),
                                'dd/MM/yyyy',
                                { locale: es }
                              )
                            : 'Sin garantía'}
                        </Typography>
                      </Alert>
                    </Grid>

                    {/* Replacement machine (leftMachine) selection */}
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={availableMachines}
                        getOptionLabel={(option: any) =>
                          `#${option.machineNum} - ${option.brand} ${
                            option.serialNumber || ''
                          }`
                        }
                        value={selectedMachine}
                        onChange={(_, newValue) => setSelectedMachine(newValue)}
                        isOptionEqualToValue={(option: any, value: any) =>
                          option._id === value._id
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Equipo de reemplazo"
                            required
                          />
                        )}
                      />
                    </Grid>

                    {/* Operator selection */}
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={operatorsList.map((op: any) => ({
                          label: op.name,
                          id: op._id
                        }))}
                        value={selectedOperator}
                        onChange={(_, newValue) =>
                          setSelectedOperator(newValue)
                        }
                        isOptionEqualToValue={(option: any, value: any) =>
                          option.id === value.id
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Operador" required />
                        )}
                      />
                    </Grid>

                    {/* Reason */}
                    <Grid item xs={12}>
                      <TextField
                        label="Razón del cambio (descripción del problema)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        required
                        placeholder="Ej: Máquina no enciende, hace ruido extraño, etc."
                      />
                    </Grid>

                    {/* Date/Time */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Fecha y Hora del Cambio
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <OperationTime
                        date={changeTime.date}
                        timeOption={changeTime.timeOption}
                        fromTime={changeTime.fromTime}
                        endTime={changeTime.endTime}
                        onChangeTime={onChangeTime}
                        minDate={new Date()}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="warning" title="ATENCIÓN">
                        {
                          'El sistema marcará el equipo de reemplazo como "En Vehiculo" del operador seleccionado. Asegurese de subirlo fisicamente al vehículo para que el cambio se realice correctamente.'
                        }
                      </Alert>
                    </Grid>
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
                  Agendar Cambio
                </LoadingButton>
              </Box>
            </Container>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default ScheduleSaleChangeModal;
