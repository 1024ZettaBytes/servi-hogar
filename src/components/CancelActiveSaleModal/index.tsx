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
  TextField
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { cancelActiveSale } from '../../../lib/client/salesFetch';
import {
  convertDateToTZ,
  setDateToMid,
  convertDateToLocal
} from 'lib/client/utils';
import OperationTime from 'pages/renta-rapida/OperationTime';

const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(22, 0, 0);
  return today;
};

function CancelActiveSaleModal(props) {
  const { handleOnClose, open, sale } = props;

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

  const submitButtonEnabled =
    reason.trim().length > 0 &&
    pickupTime.date &&
    (pickupTime.timeOption === 'any' ||
      (pickupTime.fromTime &&
        pickupTime.endTime &&
        pickupTime.fromTime.getTime() <= pickupTime.endTime.getTime()));

  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);

    const result = await cancelActiveSale(sale._id, reason, {
      ...pickupTime,
      date: convertDateToTZ(setDateToMid(pickupTime.date)),
      fromTime: convertDateToTZ(pickupTime.fromTime),
      endTime: convertDateToTZ(pickupTime.endTime)
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

  const onChangePickupTime = (id, value) => {
    if (
      (id === 'fromTime' || id === 'endTime') &&
      value.toString() === 'Invalid Date'
    ) {
      value = null;
    }
    setPickupTime({ ...pickupTime, [id]: value });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth={'md'} scroll={'body'}>
      <Card>
        <CardHeader title="Cancelar Venta Activa" />
        <Divider />
        <CardContent>
          <Box>
            <Container maxWidth="lg">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="h6" gutterBottom>
                      Venta #{sale.saleNum}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cliente:</strong> {sale.customer?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Teléfono:</strong>{' '}
                      {sale.customer?.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Máquina:</strong> #{sale.machine?.machineNum} -{' '}
                      {sale.machine?.brand}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Se agendará una recolección para recuperar el equipo del
                      cliente. La venta pasará a estado <strong>En Cancelación</strong> hasta
                      que se complete la recolección.
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Razón de la cancelación"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    required
                    placeholder="Ej: Cliente no puede seguir pagando, acuerdo mutuo, etc."
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
                  Cerrar
                </Button>
                <LoadingButton
                  variant="contained"
                  color="error"
                  onClick={handleOnSubmit}
                  disabled={!submitButtonEnabled}
                  loading={isSubmitting}
                >
                  Cancelar Venta y Agendar Recolección
                </LoadingButton>
              </Box>
            </Container>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default CancelActiveSaleModal;
