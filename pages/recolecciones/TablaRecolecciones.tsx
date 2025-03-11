import { FC, useState } from 'react';
import PropTypes from 'prop-types';
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
  Tooltip,
  IconButton,
  useTheme,
  Skeleton,
  Grid,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import Label from '@/components/Label';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import SearchIcon from '@mui/icons-material/Search';
import ImagesModal from '@/components/ImagesModal';
import { getFetcher, useGetPickups } from 'pages/api/useRequest';

interface TablaRecoleccionesProps {
  userRole: string;
  className?: string;
}
const statusMap = {
  CANCELADA: {
    text: 'Cancelada',
    color: 'error'
  },
  RECOLECTADA: {
    text: 'Recolectada',
    color: 'success'
  }
};
const getStatusLabel = (pickupStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[pickupStatus];

  return <Label color={color}>{text}</Label>;
};

const TablaRecolecciones: FC<TablaRecoleccionesProps> = ({userRole}) => {
  const showUser = userRole === 'ADMIN';
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [searchTerm, setSearchTerm] = useState(null);
  const [searchText, setSearchText] = useState(null);

  const { pickups, pickupsError } = useGetPickups(
    getFetcher,
    limit,
    page + 1,
    searchTerm
  );

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };
  const theme = useTheme();

  return (
    <Grid item xs={12}>
      {pickupsError ? (
        <Alert severity="error">{pickupsError?.message}</Alert>
      ) : !pickups ? (
        <Skeleton
          variant="rectangular"
          width={'100%'}
          height={500}
          animation="wave"
        />
      ) : (
        <Card>
          <CardHeader
            action={
              <Box width={200}>
                <TextField
                  size="small"
                  helperText="Escriba y presione ENTER"
                  id="input-search-payment"
                  label="Buscar"
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      setSearchTerm(searchText);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  sx={{ marginTop: '20px' }}
                />
              </Box>
            }
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
            title=""
          />

          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Renta</TableCell>
                  <TableCell align="center">Cliente</TableCell>
                  <TableCell align="center">Solicitada</TableCell>
                  <TableCell align="center">Recolectada</TableCell>
                  <TableCell align="center">Resultado</TableCell>
                  <TableCell align="center"># Equipo</TableCell>
                  <TableCell align="center">Fotos</TableCell>
                  {showUser && <TableCell align="center">Usuario</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {pickups?.list?.map((pickup) => {
                  return (
                    <TableRow hover key={pickup?._id}>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {pickup?.rent?.num}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {pickup?.rent?.customer?.name}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {capitalizeFirstLetter(
                            formatTZDate(new Date(pickup?.date), 'MMM DD YYYY')
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {(pickup?.finishedAt
                            ? capitalizeFirstLetter(
                                formatTZDate(
                                  new Date(pickup?.finishedAt),
                                  'MMM DD YYYY'
                                )
                              )
                            : 'N/A')
                            +" "+ (pickup?.finishedAt
                            ? capitalizeFirstLetter(
                                formatTZDate(
                                  new Date(pickup?.rent?.updatedAt),
                                  'hh:mm a'
                                )
                              )
                            : '')}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getStatusLabel(pickup?.status)}
                        {pickup?.status === 'CANCELADA' && (
                          <Tooltip
                            title={pickup?.cancellationReason || 'SIN RAZÓN'}
                            arrow
                          >
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {pickup?.rent?.machine?.machineNum}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {pickup.imagesUrl ? (
                          <Tooltip title="Ver fotos" arrow>
                            <IconButton
                              onClick={() => {
                                setSelectedImages(pickup.imagesUrl);
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
                          'N/A'
                        )}
                      </TableCell>
                      {showUser && <TableCell align="center">
                        {pickup?.lastUpdatedBy?.name || 'N/A'}
                      </TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box p={2}>
            <TablePagination
              component="div"
              count={pickups.total}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleLimitChange}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[5, 10, 25, 30]}
            />
          </Box>
        </Card>
      )}
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title={'Fotos de la recolección'}
          text=""
          onClose={handleOnCloseImages}
        />
      )}
    </Grid>
  );
};

TablaRecolecciones.propTypes = {
  userRole: PropTypes.string.isRequired
};

TablaRecolecciones.defaultProps = {
  userRole: ''
};

export default TablaRecolecciones;
