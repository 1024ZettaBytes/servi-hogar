import React, { FC, useState } from 'react';
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
  Alert,
  Grid,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Slide
} from '@mui/material';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import SearchIcon from '@mui/icons-material/Search';

import useDeviceType, {
  capitalizeFirstLetter,
  formatTZDate
} from 'lib/client/utils';
import Label from '@/components/Label';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImagesModal from '@/components/ImagesModal';
import { getFetcher, useGetChanges } from 'pages/api/useRequest';
import Button from '@mui/material/Button';
import { TransitionProps } from '@mui/material/transitions';
interface TablaCambiosProps {
  userRole: string;
  className?: string;
}
const statusMap = {
  CANCELADO: {
    text: 'Cancelado',
    color: 'error'
  },
  FINALIZADO: {
    text: 'Realizado',
    color: 'success'
  }
};
const getStatusLabel = (
  changeStatus: string,
  wasFixed = false
): JSX.Element => {
  const { text, color }: any = statusMap[changeStatus];

  return <Label color={color}>{wasFixed ? 'Solucionado' : text}</Label>;
};
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TablaCambios: FC<TablaCambiosProps> = ({userRole}) => {
  const showUser = userRole === 'ADMIN';
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [searchTerm, setSearchTerm] = useState(null);
  const [searchText, setSearchText] = useState(null);
  const { changes, changesError } = useGetChanges(
    getFetcher,
    limit,
    page + 1,
    searchTerm
  );
  const { isMobile } = useDeviceType();
  const [reasonModalIsOpen, setReasonModalIsOpen] = useState(false);
  const [reason, setReason] = useState(null);

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };

  const theme = useTheme();

  return (
    <Grid item xs={12}>
      {changesError ? (
        <Alert severity="error">{changesError?.message}</Alert>
      ) : !changes ? (
        <Skeleton
          variant="rectangular"
          width={'100%'}
          height={500}
          animation="wave"
        />
      ) : (
        <Card>
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
                    {
                      //<TableCell align="center">Renta</TableCell>
                    }
                    <TableCell align="center">Razón</TableCell>
                    <TableCell align="center">Cliente</TableCell>
                    <TableCell align="center">Solicitado</TableCell>
                    <TableCell align="center">Realizado</TableCell>
                    <TableCell align="center">Equipo cliente</TableCell>
                    <TableCell align="center">Equipo dejado</TableCell>
                    <TableCell align="center">Fotos</TableCell>
                    <TableCell align="center">Resultado</TableCell>
                    {showUser && <TableCell align="center">Usuario</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes?.list?.map((change) => {
                    return (
                      <TableRow hover key={change?._id}>
                        {/*<TableCell align="center">
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                            {change?.rent?.num}
                          </Typography>
                        </TableCell>*/}
                        <TableCell align="center">
                          {isMobile ? (
                            <IconButton
                              onClick={() => {
                                setReason(change?.reason || 'SIN RAZÓN')
                                setReasonModalIsOpen(true);
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
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Tooltip
                              title={change?.reason || 'SIN RAZÓN'}
                              arrow
                            >
                              <ReportProblemIcon fontSize="small" />
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
                            {change?.rent?.customer?.name}
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
                              formatTZDate(
                                new Date(change?.date),
                                'MMM DD YYYY'
                              )
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
                            {change?.finishedAt
                              ? capitalizeFirstLetter(
                                  formatTZDate(
                                    new Date(change?.finishedAt),
                                    'MMM DD YYYY'
                                  )
                                )
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {change.pickedMachine
                            ? change.pickedMachine.machineNum
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {change?.wasFixed
                            ? 'Solucionado'
                            : change.leftMachine
                            ? change.leftMachine.machineNum
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {change.imagesUrl ? (
                            <Tooltip title="Ver fotos" arrow>
                              <IconButton
                                onClick={() => {
                                  setSelectedImages(change.imagesUrl);
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
                        <TableCell
                          align="center"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getStatusLabel(change?.status, change?.wasFixed)}
                          {change?.status === 'CANCELADO' && (
                            <Tooltip
                              title={change?.cancellationReason || 'SIN RAZÓN'}
                              arrow
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </Tooltip>
                          )}
                          
                        </TableCell>
                        {showUser && <TableCell align="center">
                        <Typography
                            variant="body1"
                            color="text.primary"
                            gutterBottom
                            noWrap
                          >
                          {change?.lastUpdatedBy?.name || 'N/A'}
                          </Typography>
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
                count={changes.total}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                page={page}
                rowsPerPage={limit}
                rowsPerPageOptions={[5, 10, 25, 30]}
              />
            </Box>
          </Card>

          {openImages && selectedImages && (
            <ImagesModal
              open={openImages}
              imagesObj={selectedImages}
              title={'Fotos del cambio'}
              text=""
              onClose={handleOnCloseImages}
            />
          )}
          <Dialog
            open={reasonModalIsOpen}
            TransitionComponent={Transition}
            keepMounted
            onClose={() => {
              setReasonModalIsOpen(false);
            }}
            aria-describedby="alert-dialog-slide-description"
          >
            <DialogTitle>{"Razón del cambio"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-slide-description" color={'error'}>
                {reason}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setReasonModalIsOpen(false);
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </Card>
      )}
      ;
    </Grid>
  );
};

TablaCambios.propTypes = {
  userRole: PropTypes.string.isRequired
};

TablaCambios.defaultProps = {
  userRole: ''
};

export default TablaCambios;
