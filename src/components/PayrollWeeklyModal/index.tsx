import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import DateFnsUtils from '@date-io/date-fns';
import locale from 'date-fns/locale/es';
import { format, parseISO } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { saveWeeklyPayroll } from '../../../lib/client/payrollFetch';
import { dateFromString } from 'lib/client/utils';

interface RestDay {
  date: Date | string | null;
  description: string;
  type: 'DESCANSO' | 'VACACIONES';
}

interface ExtraItem {
  concept: string;
  amount: number;
}

interface PayrollWeeklyModalProps {
  open: boolean;
  userId: string;
  userName: string;
  weekStart: string; // Format: YYYY-MM-DD
  weekEnd: string; // Format: YYYY-MM-DD
  currentWeeklyData: {
    punctualityBonusApplied?: boolean;
    restDays?: RestDay[];
    extraDeductions?: ExtraItem[];
    extraPerceptions?: ExtraItem[];
    notes?: string;
  } | null;
  vacationDaysRemaining?: number;
  swrKey: string;
  handleOnClose: (success?: boolean, message?: string) => void;
}

export default function PayrollWeeklyModal({
  open,
  userId,
  userName,
  weekStart,
  weekEnd,
  currentWeeklyData,
  vacationDaysRemaining = 0,
  swrKey,
  handleOnClose
}: PayrollWeeklyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const [punctualityBonusApplied, setPunctualityBonusApplied] = useState(
    currentWeeklyData?.punctualityBonusApplied || false
  );
  const [restDays, setRestDays] = useState<RestDay[]>(
    currentWeeklyData?.restDays || []
  );
  const [extraDeductions, setExtraDeductions] = useState<ExtraItem[]>(
    currentWeeklyData?.extraDeductions || []
  );
  const [extraPerceptions, setExtraPerceptions] = useState<ExtraItem[]>(
    currentWeeklyData?.extraPerceptions || []
  );
  const [notes, setNotes] = useState(currentWeeklyData?.notes || '');

  useEffect(() => {
    if (open && currentWeeklyData) {
      setPunctualityBonusApplied(currentWeeklyData.punctualityBonusApplied || false);
      setRestDays(currentWeeklyData.restDays || []);
      setExtraDeductions(currentWeeklyData.extraDeductions || []);
      setExtraPerceptions(currentWeeklyData.extraPerceptions || []);
      setNotes(currentWeeklyData.notes || '');
    }
  }, [open, currentWeeklyData]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    const result = await saveWeeklyPayroll({
      userId,
      weekStart,
      weekEnd,
      punctualityBonusApplied,
      restDays: restDays.filter(rd => rd.date !== null),
      extraDeductions: extraDeductions.filter(ed => ed.concept.trim() !== ''),
      extraPerceptions: extraPerceptions.filter(ep => ep.concept.trim() !== ''),
      notes
    }, swrKey);

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

  // Rest Days handlers
  const addRestDay = () => {
    setRestDays([...restDays, { date: null, description: '', type: 'DESCANSO' }]);
  };

  const removeRestDay = (index: number) => {
    setRestDays(restDays.filter((_, i) => i !== index));
  };

  const updateRestDay = (index: number, field: 'date' | 'description' | 'type', value: any) => {
    const updated = [...restDays];
    updated[index] = { ...updated[index], [field]: value };
    setRestDays(updated);
  };

  // Count vacation days being added
  const newVacationDaysCount = restDays.filter(rd => rd.type === 'VACACIONES' && rd.date).length;
  const existingVacationDaysCount = (currentWeeklyData?.restDays || []).filter(rd => rd.type === 'VACACIONES').length;
  const vacationDaysDiff = newVacationDaysCount - existingVacationDaysCount;

  // Extra Deductions handlers
  const addExtraDeduction = () => {
    setExtraDeductions([...extraDeductions, { concept: '', amount: 0 }]);
  };

  const removeExtraDeduction = (index: number) => {
    setExtraDeductions(extraDeductions.filter((_, i) => i !== index));
  };

  const updateExtraDeduction = (index: number, field: 'concept' | 'amount', value: any) => {
    const updated = [...extraDeductions];
    updated[index] = { ...updated[index], [field]: value };
    setExtraDeductions(updated);
  };

  // Extra Perceptions handlers
  const addExtraPerception = () => {
    setExtraPerceptions([...extraPerceptions, { concept: '', amount: 0 }]);
  };

  const removeExtraPerception = (index: number) => {
    setExtraPerceptions(extraPerceptions.filter((_, i) => i !== index));
  };

  const updateExtraPerception = (index: number, field: 'concept' | 'amount', value: any) => {
    const updated = [...extraPerceptions];
    updated[index] = { ...updated[index], [field]: value };
    setExtraPerceptions(updated);
  };

  // Parse date strings for display
  const weekStartDate = parseISO(weekStart);
  const weekEndDate = parseISO(weekEnd);
  const weekLabel = `${format(weekStartDate, 'dd MMM', { locale })} - ${format(weekEndDate, 'dd MMM yyyy', { locale })}`;

  return (
    <Dialog open={open} fullWidth maxWidth="md" scroll="body">
      <Card>
        <CardHeader 
          title={`Editar Nómina Semanal - ${userName}`}
          subheader={`Semana: ${weekLabel}`}
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Punctuality Bonus */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={punctualityBonusApplied}
                      onChange={(e) => setPunctualityBonusApplied(e.target.checked)}
                    />
                  }
                  label="Aplicar Bono de Puntualidad y Asistencia"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Rest Days */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="h6">Días de Descanso / Vacaciones</Typography>
                    {vacationDaysRemaining > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Días de vacaciones disponibles: {vacationDaysRemaining - vacationDaysDiff}
                        {vacationDaysDiff > 0 && (
                          <Typography component="span" color="warning.main">
                            {' '}(-{vacationDaysDiff} esta semana)
                          </Typography>
                        )}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addRestDay}
                    size="small"
                  >
                    Agregar
                  </Button>
                </Box>
                {restDays.map((restDay, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={restDay.type || 'DESCANSO'}
                          label="Tipo"
                          onChange={(e) => updateRestDay(index, 'type', e.target.value)}
                        >
                          <MenuItem value="DESCANSO">Descanso</MenuItem>
                          <MenuItem value="VACACIONES">Vacaciones</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <LocalizationProvider dateAdapter={DateFnsUtils} adapterLocale={locale}>
                        <DatePicker
                          label="Fecha"
                          value={restDay.date ? new Date(restDay.date) : null}
                          onChange={(newValue) => updateRestDay(index, 'date', newValue)}
                          minDate={dateFromString(weekStart)}
                          maxDate={dateFromString(weekEnd)}
                          renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Descripción (opcional)"
                        size="small"
                        fullWidth
                        value={restDay.description}
                        onChange={(e) => updateRestDay(index, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton color="error" onClick={() => removeRestDay(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Extra Deductions */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Descuentos Adicionales</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addExtraDeduction}
                    size="small"
                  >
                    Agregar
                  </Button>
                </Box>
                {extraDeductions.map((deduction, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Concepto"
                        size="small"
                        fullWidth
                        value={deduction.concept}
                        onChange={(e) => updateExtraDeduction(index, 'concept', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Monto"
                        type="number"
                        size="small"
                        fullWidth
                        value={deduction.amount}
                        onChange={(e) => updateExtraDeduction(index, 'amount', Number(e.target.value))}
                        InputProps={{
                          startAdornment: <span>$&nbsp;</span>
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton color="error" onClick={() => removeExtraDeduction(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Extra Perceptions */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Percepciones Adicionales</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addExtraPerception}
                    size="small"
                  >
                    Agregar
                  </Button>
                </Box>
                {extraPerceptions.map((perception, index) => (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Concepto"
                        size="small"
                        fullWidth
                        value={perception.concept}
                        onChange={(e) => updateExtraPerception(index, 'concept', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Monto"
                        type="number"
                        size="small"
                        fullWidth
                        value={perception.amount}
                        onChange={(e) => updateExtraPerception(index, 'amount', Number(e.target.value))}
                        InputProps={{
                          startAdornment: <span>$&nbsp;</span>
                        }}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton color="error" onClick={() => removeExtraPerception(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notas"
                  multiline
                  rows={2}
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
