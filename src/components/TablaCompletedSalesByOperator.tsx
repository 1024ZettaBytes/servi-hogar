import { FC, ChangeEvent, useState, useEffect } from 'react';
import {
  Divider,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Typography,
  CardHeader,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ImagesModal from '@/components/ImagesModal';

interface TablaCompletedSalesByOperatorProps {
  salesList: any[];
}

const TablaCompletedSalesByOperator: FC<TablaCompletedSalesByOperatorProps> = ({
  salesList
}) => {
  const theme = useTheme();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filters, setFilters] = useState<any>({
    folio: ''
  });
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<any>(null);

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };

  useEffect(() => {
    if (!salesList) return;
    
    let filtered = [...salesList];

    if (filters.folio) {
      filtered = filtered.filter((sale) =>
        sale.saleNum?.toString().includes(filters.folio)
      );
    }

    setFilteredSales(filtered);
    setPage(0);
  }, [salesList, filters]);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedSales = filteredSales.slice(
    page * limit,
    page * limit + limit
  );

  return (
    <>
    <Card>
      <CardHeader
        title="Entregas Completadas"
        titleTypographyProps={{ variant: 'h4' }}
      />
      <Divider />
      <Box p={2}>
        <TextField
          fullWidth
          placeholder="Buscar por folio..."
          value={filters.folio}
          onChange={(e) => setFilters({ ...filters, folio: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Equipo/Serie</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Pago Inicial</TableCell>
              <TableCell align="center">Semanas</TableCell>
              <TableCell>Fecha Entrega</TableCell>
              <TableCell align="center">Fotos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay entregas completadas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((sale) => {
                return (
                  <TableRow hover key={sale._id}>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sale.saleNum}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sale.machine?.machineNum || sale.serialNumber || 'N/A'}
                      </Typography>
                      {sale.machine && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {sale.machine.brand} - {sale.machine.capacity}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sale.customer?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        ${sale.totalAmount?.toLocaleString('es-MX')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        ${sale.initialPayment?.toLocaleString('es-MX')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sale.totalWeeks}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {sale.delivery
                          ? format(new Date(sale.delivery.deliveryDate), 'dd/MM/yyyy', { locale: es })
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {sale.delivery?.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              // Filter out the _id field from imagesUrl
                              const { _id, ...images } = sale.delivery.imagesUrl;
                              setSelectedImages(images);
                              setOpenImages(true);
                            }}
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                            color="inherit"
                            size="small"
                          >
                            <ImageSearchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={filteredSales.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
          labelRowsPerPage="Filas por página:"
        />
      </Box>
    </Card>
    {openImages && selectedImages && (
      <ImagesModal
        open={openImages}
        imagesObj={selectedImages}
        title="Fotos de la entrega"
        text=""
        onClose={handleOnCloseImages}
      />
    )}
    </>
  );
};

export default TablaCompletedSalesByOperator;
