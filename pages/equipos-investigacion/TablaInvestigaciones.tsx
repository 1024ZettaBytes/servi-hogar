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
  Skeleton,
  Grid,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import SearchIcon from '@mui/icons-material/Search';
import { getFetcher, useGetInvestigations } from 'pages/api/useRequest';
import ResolveInvestigationModal from '../../src/components/ResolveInvestigationModal';
import { ROUTES } from 'lib/consts/API_URL_CONST';
import { mutate } from 'swr';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useSnackbar } from 'notistack';
import { markMachineLostReq } from 'lib/client/pickupsFetch';

interface TablaInvestigacionesProps {
  userRole: string;
  isSuperUser?: boolean;
  className?: string;
}

const getInvestigationTime = (date: string | Date) => {
  if (!date) return 'N/A';
  const diffInMs = new Date().getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(diffInHours / 24);
  const hours = diffInHours % 24;

  if (days > 0) {
    return `${days} d ${hours > 0 ? `${hours} h` : ''}`;
  }
  return `${hours} h`;
};

const getInvestigationTimeColor = (date: string | Date) => {
  if (!date) return 'text.primary';
  const diffInMs = new Date().getTime() - new Date(date).getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  return diffInHours >= 24 ? 'error.main' : 'warning.main';
};

const TablaInvestigaciones: FC<TablaInvestigacionesProps> = ({ userRole, isSuperUser }) => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [searchTerm, setSearchTerm] = useState(null);
  const [searchText, setSearchText] = useState(null);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);
  const [lostPickup, setLostPickup] = useState(null);
  const [isLostLoading, setIsLostLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleResolveConfirm = () => {
    mutate(
      (key) => typeof key === 'string' && key.startsWith(ROUTES.ALL_INVESTIGATIONS_API),
      undefined,
      { revalidate: true }
    );
  };

  const handleMarkLost = async () => {
    if (!lostPickup) return;
    setIsLostLoading(true);
    try {
      const result = await markMachineLostReq(lostPickup._id);
      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
        handleResolveConfirm();
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    } catch (e: any) {
      enqueueSnackbar(e.message || 'Error inesperado', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    } finally {
      setIsLostLoading(false);
      setIsLostDialogOpen(false);
      setLostPickup(null);
    }
  };

  const { investigations, investigationsError } = useGetInvestigations(
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

  return (
    <Grid item xs={12}>
      {investigationsError ? (
        <Alert severity="error">{investigationsError?.message}</Alert>
      ) : !investigations ? (
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
                  id="input-search-investigation"
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
                  <TableCell align="center"># Equipo</TableCell>
                  <TableCell align="center">Cliente</TableCell>
                  <TableCell align="center">Recolectada</TableCell>
                  <TableCell align="center">Tiempo en Inv.</TableCell>
                  <TableCell align="center">Operador (Recolector)</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investigations?.list?.map((pickup) => {
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
                          {pickup?.machine?.machineNum || 'N/A'}
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
                          {pickup?.rent?.customer?.name || 'N/A'}
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
                          {pickup?.finishedAt ? capitalizeFirstLetter(
                            formatTZDate(new Date(pickup?.finishedAt), 'MMM DD YYYY')
                          ) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color={getInvestigationTimeColor(pickup?.updatedAt)}
                          gutterBottom
                          noWrap
                        >
                          {getInvestigationTime(pickup?.updatedAt)}
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
                          {pickup?.operator?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedPickup(pickup);
                              setIsResolveModalOpen(true);
                            }}
                          >
                            Resolver
                          </Button>
                          {isSuperUser && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => {
                                setLostPickup(pickup);
                                setIsLostDialogOpen(true);
                              }}
                            >
                              No encontrado
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box p={2}>
            <TablePagination
              component="div"
              count={investigations.total}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleLimitChange}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[5, 10, 25, 30]}
            />
          </Box>
          {selectedPickup && (
            <ResolveInvestigationModal
              open={isResolveModalOpen}
              pickup={selectedPickup}
              onClose={() => {
                setIsResolveModalOpen(false);
                setSelectedPickup(null);
              }}
              onConfirm={handleResolveConfirm}
              userRole={userRole}
            />
          )}
          <Dialog
            open={isLostDialogOpen}
            onClose={() => {
              if (!isLostLoading) {
                setIsLostDialogOpen(false);
                setLostPickup(null);
              }
            }}
          >
            <DialogTitle>Marcar equipo como perdido</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas marcar el equipo{' '}
                <b>#{lostPickup?.machine?.machineNum || 'N/A'}</b> como{' '}
                <b>perdido</b>? Esta acción cambiará su estado a PERDIDA.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setIsLostDialogOpen(false);
                  setLostPickup(null);
                }}
                disabled={isLostLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleMarkLost}
                disabled={isLostLoading}
              >
                {isLostLoading ? 'Procesando...' : 'Confirmar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Card>
      )}
    </Grid>
  );
};

TablaInvestigaciones.propTypes = {
  userRole: PropTypes.string.isRequired
};

TablaInvestigaciones.defaultProps = {
  userRole: ''
};

export default TablaInvestigaciones;
