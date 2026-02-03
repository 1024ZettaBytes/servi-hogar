import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  Divider,
  Grid,
  TextField,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import DateFnsUtils from '@date-io/date-fns';
import locale from 'date-fns/locale/es';
import { savePayrollConfig } from '../../../lib/client/payrollFetch';

interface PayrollConfigModalProps {
  open: boolean;
  userId: string;
  userName: string;
  currentConfig: {
    baseSalary?: number;
    baseSalaryDescription?: string;
    punctualityBonusAmount?: number;
    restDayDeductionAmount?: number;
    hireDate?: Date;
    vacationDaysPerYear?: number;
    vacationDaysUsed?: number;
    collectionBonusEnabled?: boolean;
  } | null;
  swrKey: string;
  handleOnClose: (success?: boolean, message?: string) => void;
}

export default function PayrollConfigModal({
  open,
  userId,
  userName,
  currentConfig,
  swrKey,
  handleOnClose
}: PayrollConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const [baseSalary, setBaseSalary] = useState(currentConfig?.baseSalary || 0);
  const [baseSalaryDescription, setBaseSalaryDescription] = useState(
    currentConfig?.baseSalaryDescription || 'SUELDO BASE'
  );
  const [punctualityBonusAmount, setPunctualityBonusAmount] = useState(
    currentConfig?.punctualityBonusAmount || 0
  );
  const [restDayDeductionAmount, setRestDayDeductionAmount] = useState(
    currentConfig?.restDayDeductionAmount || 0
  );
  const [hireDate, setHireDate] = useState<Date | null>(
    currentConfig?.hireDate ? new Date(currentConfig.hireDate) : null
  );
  const [vacationDaysPerYear, setVacationDaysPerYear] = useState(
    currentConfig?.vacationDaysPerYear || 0
  );
  const [vacationDaysUsed, setVacationDaysUsed] = useState(
    currentConfig?.vacationDaysUsed || 0
  );
  const [collectionBonusEnabled, setCollectionBonusEnabled] = useState(
    currentConfig?.collectionBonusEnabled === true
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!hireDate) {
      setHasError({ error: true, msg: 'La fecha de ingreso es requerida' });
      setIsLoading(false);
      return;
    }

    const result = await savePayrollConfig(
      {
        userId,
        baseSalary,
        baseSalaryDescription,
        punctualityBonusAmount,
        restDayDeductionAmount,
        hireDate,
        vacationDaysPerYear,
        vacationDaysUsed,
        collectionBonusEnabled
      },
      swrKey
    );

    setIsLoading(false);

    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    handleOnClose(false);
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" scroll="body">
      <Card>
        <CardHeader title={`Configurar Nómina - ${userName}`} />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Descripción Sueldo Base"
                  fullWidth
                  value={baseSalaryDescription}
                  onChange={(e) => setBaseSalaryDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Sueldo Base"
                  type="number"
                  fullWidth
                  required
                  value={baseSalary}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBaseSalary(value);
                    setRestDayDeductionAmount(Math.floor(value / 6));
                  }}
                  InputProps={{
                    startAdornment: <span>$&nbsp;</span>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                disabled 
                  label="Descuento por Día de Descanso"
                  type="number"
                  fullWidth
                  value={restDayDeductionAmount}
                  InputProps={{
                    startAdornment: <span>$&nbsp;</span>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bono Puntualidad y Asistencia"
                  type="number"
                  fullWidth
                  value={punctualityBonusAmount}
                  onChange={(e) =>
                    setPunctualityBonusAmount(Number(e.target.value))
                  }
                  InputProps={{
                    startAdornment: <span>$&nbsp;</span>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider
                  dateAdapter={DateFnsUtils}
                  adapterLocale={locale}
                >
                  <DatePicker
                    label="Fecha de Ingreso"
                    value={hireDate}
                    onChange={(newValue) => setHireDate(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Días Vacaciones por Año"
                  type="number"
                  fullWidth
                  value={vacationDaysPerYear}
                  onChange={(e) =>
                    setVacationDaysPerYear(Number(e.target.value))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Días Vacaciones Usados"
                  type="number"
                  fullWidth
                  value={vacationDaysUsed}
                  onChange={(e) => setVacationDaysUsed(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={collectionBonusEnabled}
                      onChange={(e) => setCollectionBonusEnabled(e.target.checked)}
                    />
                  }
                  label="Aplica Bono de Cobranza"
                />
              </Grid>

              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Grid container justifyContent="flex-end" spacing={2}>
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      type="submit"
                      size="large"
                      variant="contained"
                      loading={isLoading}
                    >
                      Guardar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}
