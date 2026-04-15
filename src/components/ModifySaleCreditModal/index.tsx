import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Alert,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { updateSaleCredit } from '../../../lib/client/salesFetch';

function ModifySaleCreditModal({ open, sale, handleOnClose }) {
  const [totalAmount, setTotalAmount] = useState(sale.totalAmount?.toString() || '');
  const [initialPayment, setInitialPayment] = useState(sale.initialPayment?.toString() || '');
  const [totalWeeks, setTotalWeeks] = useState(sale.totalWeeks?.toString() || '');

  const [weeklyPayment, setWeeklyPayment] = useState('0.00');
  const [remainingAmount, setRemainingAmount] = useState('0.00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState({ error: false, msg: '' });

  useEffect(() => {
    const total = parseFloat(totalAmount);
    const initial = parseFloat(initialPayment);
    const weeks = parseInt(totalWeeks);

    if (!isNaN(total) && !isNaN(initial) && !isNaN(weeks) && weeks > 0) {
      const remaining = total - initial;
      const weekly = remaining / weeks;

      setRemainingAmount(remaining.toFixed(2));
      setWeeklyPayment(weekly.toFixed(2));
    } else {
      setRemainingAmount('0.00');
      setWeeklyPayment('0.00');
    }
  }, [totalAmount, initialPayment, totalWeeks]);

  const isValid =
    totalAmount &&
    initialPayment &&
    totalWeeks &&
    parseFloat(totalAmount) > 0 &&
    parseFloat(initialPayment) >= 0 &&
    parseFloat(initialPayment) <= parseFloat(totalAmount) &&
    parseInt(totalWeeks) > 0;

  const handleSubmit = async () => {
    setError({ error: false, msg: '' });
    setIsSubmitting(true);

    const result = await updateSaleCredit({
      saleId: sale._id,
      totalAmount: parseFloat(totalAmount),
      initialPayment: parseFloat(initialPayment),
      totalWeeks: parseInt(totalWeeks)
    });

    setIsSubmitting(false);

    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setError({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setError({ error: false, msg: '' });
    setIsSubmitting(false);
    handleOnClose(false);
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <Card>
        <CardHeader title="Modificar Crédito de Venta" />
        <Divider />
        <CardContent>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography fontWeight="bold">
                    Venta #{sale?.saleNum}
                  </Typography>
                  <Typography>
                    Cliente: {sale?.customer?.name || 'N/A'}
                  </Typography>
                  <Typography>
                    Equipo: #{sale?.machine?.machineNum} -{' '}
                    {sale?.machine?.brand}
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Total ($)"
                  type="number"
                  fullWidth
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Pago Inicial ($)"
                  type="number"
                  fullWidth
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Semanas"
                  type="number"
                  fullWidth
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="success">
                  <Typography>
                    Pago semanal:{' '}
                    <strong>${weeklyPayment}</strong>
                  </Typography>
                  <Typography>
                    Restante:{' '}
                    <strong>${remainingAmount}</strong>
                  </Typography>
                </Alert>
              </Grid>

              {error.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error.msg}</Alert>
                </Grid>
              )}
            </Grid>

            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>

              <LoadingButton
                variant="contained"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!isValid}
              >
                Guardar Cambios
              </LoadingButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default ModifySaleCreditModal;