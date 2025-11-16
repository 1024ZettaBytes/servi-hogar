import {
  Grid,
  Typography,
  CardContent,
  Card,
  Box,
  Divider,
  Chip
} from '@mui/material';
import { Skeleton } from '@mui/material';
import Text from '@/components/Text';
import numeral from 'numeral';
import Image from 'next/image';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SellIcon from '@mui/icons-material/Sell';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'DISPONIBLE':
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'PENDIENTE':
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Pendiente"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'VENDIDO':
      return (
        <Chip
          icon={<SellIcon />}
          label="Vendido"
          color="error"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    default:
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
  }
};
const DetailRow = ({ label, value, isLoading, isChip = false }) => (
  <>
    <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
      <Box pr={2} pb={2}>
        {label}:
      </Box>
    </Grid>
    <Grid item xs={12} sm={8} md={9}>
      <Box sx={{ maxWidth: { xs: 'auto', sm: 400 } }}>
        {isLoading ? (
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px' }} />
        ) : (
          isChip ? value : <Text color="black">{value}</Text>
        )}
      </Box>
    </Grid>
  </>
);

function SalesMachineInfoTab({ salesMachine }) {
  const isLoading = !salesMachine;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Datos generales
              </Typography>
            </Box>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid
                container
                direction={'row'}
                alignItems="left"
                justifyItems="left"
              >

                <DetailRow
                  label="Número de Equipo"
                  isLoading={isLoading}
                  value={`#${salesMachine?.machineNum}`}
                />
                
                <DetailRow
                  label="Marca"
                  isLoading={isLoading}
                  value={salesMachine?.brand}
                />
                
                <DetailRow
                  label="Costo"
                  isLoading={isLoading}
                  value={numeral(salesMachine?.cost).format('$0,0.00')}
                />
                
                <DetailRow
                  label="Número de Serie"
                  isLoading={isLoading}
                  value={salesMachine?.serialNumber || 'N/A'}
                />

                <DetailRow
                  label="Origen"
                  isLoading={isLoading}
                  value={
                    salesMachine?.isFromRent ? (
                      <Chip label="Rentas" color="info" size="small" />
                    ) : (
                      <Chip label="Nuevo" color="default" size="small" variant="outlined" />
                    )
                  }
                />

                <DetailRow
                  label="Estado"
                  isLoading={isLoading}
                  isChip={true} 
                  value={getStatusChip(salesMachine?.status)}
                />
                
                <DetailRow
                  label="Garantía"
                  isLoading={isLoading}
                  value={salesMachine?.warranty 
                    ? capitalizeFirstLetter(
                        formatTZDate(new Date(salesMachine.warranty), 'DD MMMM YYYY')
                      )
                    : 'N/A'
                  }
                />
                
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: 'right' }}>
                  <Box pr={2} pb={2}>
                    Fotos:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  {isLoading ? (
                    <Skeleton variant="rectangular" width={210} height={118} />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {salesMachine?.photosUrls?.map((url, index) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={index}>
                          <Image
                            src={url}
                            alt={`Foto ${index + 1} del equipo`}
                            width={150}
                            height={200}
                            style={{ 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              cursor: 'pointer' 
                            }}
                          />
                        </a>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default SalesMachineInfoTab;