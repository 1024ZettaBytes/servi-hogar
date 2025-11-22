import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Skeleton,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import numeral from 'numeral';

interface DailyTotalCardProps {
  dailyTotal: {
    rentPayments: {
      count: number;
      total: number;
    };
    salePayments: {
      count: number;
      total: number;
    };
    total: number;
  };
  isLoading: boolean;
  error: any;
}

export default function DailyTotalCard({ dailyTotal, isLoading, error }: DailyTotalCardProps) {
  const theme = useTheme();

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Error al cargar el total diario: {error?.message || 'Error desconocido'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !dailyTotal) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={180} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.colors.primary.main, 0.1)} 0%, ${alpha(theme.colors.success.main, 0.1)} 100%)`,
        border: `2px solid ${alpha(theme.colors.success.main, 0.3)}`,
        boxShadow: theme.shadows[8]
      }}
    >
      <CardContent>
        <Box>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.colors.success.main} 0%, ${theme.colors.success.dark} 100%)`,
                borderRadius: '12px',
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: `0 4px 12px ${alpha(theme.colors.success.main, 0.4)}`
              }}
            >
              <AttachMoneyIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                Total Registrado Hoy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
          </Box>

          {/* Main Total */}
          <Box
            sx={{
              background: alpha(theme.colors.success.main, 0.15),
              borderRadius: 2,
              p: 3,
              mb: 2,
              textAlign: 'center',
              border: `1px solid ${alpha(theme.colors.success.main, 0.3)}`
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total General
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <TrendingUpIcon sx={{ fontSize: 40, color: theme.colors.success.main }} />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 'bold',
                  color: theme.colors.success.main,
                  textShadow: `0 2px 4px ${alpha(theme.colors.success.main, 0.3)}`
                }}
              >
                ${numeral(dailyTotal.total).format('0,0.00')}
              </Typography>
            </Box>
          </Box>

          {/* Breakdown */}
          <Grid container spacing={2}>
            {/* Rent Payments */}
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  background: alpha(theme.colors.info.main, 0.1),
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${alpha(theme.colors.info.main, 0.2)}`
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <ReceiptLongIcon 
                    sx={{ 
                      fontSize: 24, 
                      color: theme.colors.info.main, 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Pagos de Rentas
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color={theme.colors.info.main}>
                  ${numeral(dailyTotal.rentPayments.total).format('0,0.00')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dailyTotal.rentPayments.count} {dailyTotal.rentPayments.count === 1 ? 'pago' : 'pagos'}
                </Typography>
              </Box>
            </Grid>

            {/* Sale Payments */}
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  background: alpha(theme.colors.warning.main, 0.1),
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${alpha(theme.colors.warning.main, 0.2)}`
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <ShoppingCartIcon 
                    sx={{ 
                      fontSize: 24, 
                      color: theme.colors.warning.main, 
                      mr: 1 
                    }} 
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Pagos de Ventas
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color={theme.colors.warning.main}>
                  ${numeral(dailyTotal.salePayments.total).format('0,0.00')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dailyTotal.salePayments.count} {dailyTotal.salePayments.count === 1 ? 'pago' : 'pagos'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}
