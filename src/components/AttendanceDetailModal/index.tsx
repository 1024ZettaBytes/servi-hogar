import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useGetAttendanceRecords, getFetcher } from '../../../pages/api/useRequest';
import { format } from 'date-fns';
import { addDaysToDate } from 'lib/client/utils';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import DateFnsUtils from '@date-io/date-fns';
import locale from 'date-fns/locale/es';
function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return format(d, 'HH:mm:ss');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return format(d, 'dd/MM/yyyy');
}

export default function AttendanceDetailModal({ open, onClose, user }) {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    addDaysToDate(new Date(), -3)
  );
  const [endDate, setEndDate] = useState(addDaysToDate(new Date(), 3));

  const { attendanceList, attendanceError } = useGetAttendanceRecords(
    getFetcher,
    user?._id,
    startDate,
    endDate
  );

  const isLoading = !attendanceList && !attendanceError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Asistencia de {user?.name} ({user?.id})
      </DialogTitle>
      <DialogContent>
        <Box display="flex" gap={2} mb={2} mt={1}>
          <Grid item xs={12}>
                          <LocalizationProvider
                            dateAdapter={DateFnsUtils}
                            adapterLocale={locale}
                          >
                            <DatePicker
                              label="DESDE"
                              value={startDate}
                              onChange={(newValue) => setStartDate(newValue)}
                              renderInput={(params) => (
                                <TextField {...params} fullWidth required />
                              )}
                            />
                          </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                          <LocalizationProvider
                            dateAdapter={DateFnsUtils}
                            adapterLocale={locale}
                          >
                            <DatePicker
                              label="HASTA"
                              value={endDate}
                              onChange={(newValue) => setEndDate(newValue)}
                              renderInput={(params) => (
                                <TextField {...params} fullWidth required />
                              )}
                            />
                          </LocalizationProvider>
                        </Grid>
        </Box>

        {attendanceError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cargar la asistencia.
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : attendanceList?.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No se encontraron registros de asistencia en este rango de fechas.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Fecha</TableCell>
                  <TableCell align="center">Entrada</TableCell>
                  <TableCell align="center">Ubicación Entrada</TableCell>
                  <TableCell align="center">Salida</TableCell>
                  <TableCell align="center">Ubicación Salida</TableCell>
                  <TableCell align="center">Oficina</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceList?.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell align="center">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell align="center">
                      {formatTime(record.firstLogin)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={record.isLoginLocationValid ? 'Válida' : 'Inválida'}
                        color={record.isLoginLocationValid ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {formatTime(record.lastLogout)}
                    </TableCell>
                    <TableCell align="center">
                      {record.lastLogout ? (
                        <Chip
                          label={record.isLogoutLocationValid ? 'Válida' : 'Inválida'}
                          color={record.isLogoutLocationValid ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {record.warehouse?.name || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
