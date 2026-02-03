import { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Chip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getFetcher,
  useGetPaymentsProgress
} from '../../../pages/api/useRequest';

interface UserProgress {
  _id: string;
  name: string;
  paymentsCount: number;
}

interface ProgressData {
  users: UserProgress[];
  totalActiveRents: number;
  totalPayments: number;
  collectivePercentage: number;
  collectiveBonus: number;
  collectiveBonusType: string | null;
  target80: number;
  target85: number;
  remainingFor80: number;
  remainingFor85: number;
  weekStart: string;
  weekEnd: string;
}

interface PaymentsProgressCardProps {
  weekStartStr: string;
  onBonusChange?: (bonus: number) => void;
}

export default function PaymentsProgressCard({ weekStartStr, onBonusChange }: PaymentsProgressCardProps) {
  const theme = useTheme();
  
  const { progressData, progressError, isLoadingProgress } = useGetPaymentsProgress(getFetcher, weekStartStr);

  const data = progressData as ProgressData;

  // Notify parent when bonus changes
  useEffect(() => {
    if (onBonusChange && data) {
      onBonusChange(data.collectiveBonus || 0);
    }
  }, [data?.collectiveBonus, onBonusChange]);

  if (isLoadingProgress) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  if (progressError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Error al cargar datos: {progressError?.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.users) {
    return null;
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 85) return theme.colors.success.main;
    if (percentage >= 80) return theme.colors.info.main;
    if (percentage >= 60) return theme.colors.warning.main;
    return theme.colors.error.main;
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.colors.warning.main, 0.05)} 0%, ${alpha(theme.colors.success.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.colors.warning.main, 0.2)}`
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={2}>
          <PaymentsIcon
            sx={{ fontSize: 40, color: theme.colors.warning.main, mr: 2 }}
          />
          <Typography variant="h4" fontWeight="bold">
            Progreso de Cobranza
          </Typography>
        </Box>

        {/* Collective Progress Section */}
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2, 
            backgroundColor: alpha(theme.colors.primary.main, 0.05),
            border: `1px solid ${alpha(theme.colors.primary.main, 0.1)}`
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h5" fontWeight="bold">
              Total de Pagos del Equipo
            </Typography>
            {data.collectiveBonus > 0 && (
              <Chip
                icon={<EmojiEventsIcon />}
                label={`¡Bono de $${data.collectiveBonus} alcanzado!`}
                sx={{
                  backgroundColor: data.collectiveBonus === 500 
                    ? alpha(theme.colors.success.main, 0.2) 
                    : alpha(theme.colors.info.main, 0.2),
                  color: data.collectiveBonus === 500 
                    ? theme.colors.success.dark 
                    : theme.colors.info.dark,
                  fontWeight: 'bold',
                  '& .MuiChip-icon': {
                    color: data.collectiveBonus === 500 
                      ? theme.colors.success.main 
                      : theme.colors.info.main
                  }
                }}
              />
            )}
          </Box>
          
          {/* Main Progress Display */}
          <Box display="flex" alignItems="baseline" gap={1} mb={1}>
            <Typography variant="h2" fontWeight="bold" color="primary">
              {data.totalPayments}
            </Typography>
            <Typography variant="h5" color="text.secondary">
              / {data.totalActiveRents} rentas activas
            </Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              sx={{ ml: 'auto', color: getProgressColor(data.collectivePercentage) }}
            >
              {data.collectivePercentage.toFixed(1)}%
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(data.collectivePercentage, 100)}
              sx={{
                height: 20,
                borderRadius: 10,
                backgroundColor: alpha(theme.palette.grey[400], 0.3),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 10,
                  backgroundColor: getProgressColor(data.collectivePercentage)
                }
              }}
            />
            {/* 80% marker */}
            <Box
              sx={{
                position: 'absolute',
                left: '80%',
                top: -5,
                bottom: -5,
                width: 2,
                backgroundColor: theme.colors.info.main
              }}
            />
            {/* 85% marker */}
            <Box
              sx={{
                position: 'absolute',
                left: '85%',
                top: -5,
                bottom: -5,
                width: 2,
                backgroundColor: theme.colors.success.main
              }}
            />
          </Box>

          {/* Targets */}
          <Box display="flex" gap={2}>
            <Box 
              sx={{ 
                flex: 1, 
                p: 1.5, 
                borderRadius: 1, 
                backgroundColor: data.remainingFor80 === 0 
                  ? alpha(theme.colors.info.main, 0.15)
                  : alpha(theme.palette.grey[500], 0.1),
                border: data.remainingFor80 === 0 
                  ? `2px solid ${theme.colors.info.main}`
                  : 'none'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                {data.remainingFor80 === 0 && (
                  <CheckCircleIcon sx={{ color: theme.colors.info.main, fontSize: 20 }} />
                )}
                <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                  Meta 80% = $300
                </Typography>
              </Box>
              <Typography variant="body2">
                {data.remainingFor80 === 0 
                  ? `✓ ${data.target80} pagos alcanzados`
                  : `Faltan ${data.remainingFor80} pagos (${data.target80} requeridos)`
                }
              </Typography>
            </Box>
            <Box 
              sx={{ 
                flex: 1, 
                p: 1.5, 
                borderRadius: 1, 
                backgroundColor: data.remainingFor85 === 0 
                  ? alpha(theme.colors.success.main, 0.15)
                  : alpha(theme.palette.grey[500], 0.1),
                border: data.remainingFor85 === 0 
                  ? `2px solid ${theme.colors.success.main}`
                  : 'none'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                {data.remainingFor85 === 0 && (
                  <CheckCircleIcon sx={{ color: theme.colors.success.main, fontSize: 20 }} />
                )}
                <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                  Meta 85% = $500
                </Typography>
              </Box>
              <Typography variant="body2">
                {data.remainingFor85 === 0 
                  ? `✓ ${data.target85} pagos alcanzados`
                  : `Faltan ${data.remainingFor85} pagos (${data.target85} requeridos)`
                }
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Individual Contributions Table */}
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Contribuciones Individuales
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: alpha(theme.colors.primary.main, 0.08),
                  '& th': {
                    fontWeight: 'bold',
                    color: theme.colors.primary.dark
                  }
                }}
              >
                <TableCell>Usuario</TableCell>
                <TableCell align="center">Pagos Registrados</TableCell>
                <TableCell align="center">Aportación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.users.map((user, index) => {
                const individualPercentage = data.totalActiveRents > 0 
                  ? (user.paymentsCount / data.totalActiveRents) * 100 
                  : 0;
                
                return (
                  <TableRow
                    key={user._id}
                    sx={{
                      backgroundColor: index % 2 === 0 
                        ? 'transparent' 
                        : alpha(theme.colors.primary.main, 0.02),
                      '&:hover': {
                        backgroundColor: alpha(theme.colors.primary.main, 0.05)
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {user.paymentsCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={individualPercentage > 0 ? 'primary' : 'text.secondary'}
                      >
                        {individualPercentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      No hay usuarios auxiliares registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
