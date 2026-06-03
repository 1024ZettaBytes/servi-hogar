import {
  Grid,
  Skeleton,
  Alert,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip
} from '@mui/material';
import { getFetcher, useGetOperatorsPayroll } from 'pages/api/useRequest';
import numeral from 'numeral';

interface OperatorPayrollTabProps {
  weekStartStr: string;
  userRole: string;
}

function OperatorPayrollTab({ weekStartStr, userRole }: OperatorPayrollTabProps) {
  const { operatorsPayrollData, operatorsPayrollError, isLoadingOperatorsPayroll } =
    useGetOperatorsPayroll(getFetcher, weekStartStr);

  if (operatorsPayrollError) {
    return <Alert severity="error">{operatorsPayrollError?.message || 'Error al cargar datos'}</Alert>;
  }

  if (isLoadingOperatorsPayroll || !operatorsPayrollData) {
    return (
      <Skeleton
        variant="rectangular"
        width={'100%'}
        height={400}
        animation="wave"
      />
    );
  }

  const { operators } = operatorsPayrollData;

  if (!operators || operators.length === 0) {
    return (
      <Alert severity="info">
        No se encontraron datos de operadores para la semana seleccionada.
      </Alert>
    );
  }

  const totalAllEarnings = operators.reduce((sum, op) => sum + op.totalEarnings, 0);
  const totalAllTasks = operators.reduce((sum, op) => sum + op.totalTasks, 0);

  return (
    <>
      {/* Summary cards - only for ADMIN */}
      {userRole === 'ADMIN' && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#e3f2fd', p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Operadores
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {operators.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#fff3e0', p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Vueltas
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalAllTasks}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#f3e5f5', p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total a Pagar
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {numeral(totalAllEarnings).format('$0,0.00')}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Per-operator cards */}
      {operators.map((op) => (
        <Card key={op.operator._id} sx={{ mb: 2, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h6" fontWeight="bold">
              {op.operator.name}
            </Typography>
            <Chip
              label={`Total: ${numeral(op.totalEarnings).format('$0,0.00')}`}
              color="secondary"
              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Concepto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tarifa</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: 'Entregas', count: op.deliveries },
                  { label: 'Recolecciones', count: op.pickups },
                  { label: 'Cambios', count: op.changes },
                  { label: 'Recolecciones Venta', count: op.salePickups },
                  { label: 'Entregas Venta', count: op.saleDeliveries },
                  { label: 'Cambios Venta', count: op.saleChanges },
                  { label: 'Vueltas Extra', count: op.extraTrips },
                ].filter(r => r.count > 0).map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell align="center">{row.count}</TableCell>
                    <TableCell align="right">{numeral(op.earningsPerTask).format('$0,0.00')}</TableCell>
                    <TableCell align="right">{numeral(row.count * op.earningsPerTask).format('$0,0.00')}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{op.totalTasks}</TableCell>
                  <TableCell />
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {numeral(op.totalEarnings).format('$0,0.00')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ))}
    </>
  );
}

export default OperatorPayrollTab;
