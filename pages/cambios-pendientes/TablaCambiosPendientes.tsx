import { FC, ChangeEvent, useState } from 'react';
import * as str from 'string';
import PropTypes from 'prop-types';
import {
  Tooltip,
  Divider,
  Box,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Typography,
  useTheme,
  CardHeader,
  TextField,
  InputAdornment
} from '@mui/material';
import NextLink from 'next/link';
import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { cancelChange, markWasSentChange } from '../../lib/client/changesFetch';
import { useSnackbar } from 'notistack';
import Label from '@/components/Label';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import GenericModal from '@/components/GenericModal';
import ModifyChangeModal from '../../src/components/ModifyChangeModal';
import OperatorModal from '@/components/OperatorModal';
import { getFormatForChange } from '../../lib/consts/OBJ_CONTS';
import FormatModal from '@/components/FormatModal';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ImagesModal from '@/components/ImagesModal';

interface TablaCambiosPendientesProps {
  userRole: string;
  className?: string;
  changesList: any[];
}
const statusMap = {
  ESPERA: {
    text: 'En espera',
    color: 'warning'
  },
  EN_CAMINO: {
    text: 'En espera',
    color: 'warning'
  },
  FINALIZADO: {
    text: 'Finalizado',
    color: 'success'
  }
};
const getStatusLabel = (changeStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[changeStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (changesList: any[], filter: string): any[] => {
  return changesList.filter((change) => {
    if (!filter || filter === '') {
      return true;
    }
    return (
      Object.entries(change).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case 'rent': {
            const matchCustomerName =
              value['customer'] &&
              value['customer'].name &&
              compareStringsForFilter(filter, value['customer'].name);
            const matchCityOrSector =
              value['customer']?.currentResidence?.city?.name &&
              value['customer']?.currentResidence?.sector?.name &&
              (compareStringsForFilter(
                filter,
                value['customer'].currentResidence.city.name
              ) ||
                compareStringsForFilter(
                  filter,
                  value['customer'].currentResidence.sector.name
                ) ||
                compareStringsForFilter(
                  filter,
                  value['customer'].currentResidence.suburb
                ));
            return matchCustomerName || matchCityOrSector;
          }
          case 'status': {
            const matchText =
              statusMap['' + value] &&
              statusMap['' + value].text &&
              compareStringsForFilter(filter, statusMap['' + value].text);
            return matchText;
          }
          case 'date': {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(change?.date), 'LLL dd yyyy', {
                  locale: es
                })
              );
            return matchFormatedDate;
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  changesList: any[],
  page: number,
  limit: number
): any[] => {
  return changesList.slice(page * limit, page * limit + limit);
};

const TablaCambiosPendientes: FC<TablaCambiosPendientesProps> = ({
  userRole,
  changesList
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [modifyModalIsOpen, setModifyModalIsOpen] = useState(false);
  const [cancelModalIsOpen, setCancelModalIsOpen] = useState(false);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [operatorIsOpen, setOperatorIsOpen] = useState(false);
  const [formatText, setFormatText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [changeToEdit, setChangeToEdit] = useState<any>(null);
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();
  const [idToCancel, setIdToCancel] = useState<string>(null);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [filter, setFilter] = useState<string>('');
  const userCanDelete = ['ADMIN', 'AUX', 'OPE'].includes(userRole);
  const userOnlyRead = userRole === 'SUB';
  const handleModifyClose = (modifiedDelivery, successMessage = null) => {
    setModifyModalIsOpen(false);
    if (modifiedDelivery && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 1500
      });
    }
  };
  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };
  const handleOnModifyClick = (change: any) => {
    setChangeToEdit(change);
    setModifyModalIsOpen(true);
  };
  const handleOnOperatorClick = (change: any) => {
    setChangeToEdit(change);
    setOperatorIsOpen(true);
  };
  const handleOnDeleteClick = (changeId: string) => {
    setIdToCancel(changeId);
    setCancelModalIsOpen(true);
  };
  const handleOnConfirmDelete = async (reason) => {
    setIsDeleting(true);
    const result = await cancelChange(idToCancel, reason);
    setCancelModalIsOpen(false);
    setIsDeleting(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });
  };
  const handleOnAsignedOperator = async () => {
    setOperatorIsOpen(false);
    enqueueSnackbar('Operador asignado con éxito!', {
      variant: 'success',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });
  };
  const filteredChanges = applyFilters(changesList, filter);
  const paginatedDeliveries = applyPagination(filteredChanges, page, limit);
  const changeOperatorIcon = (change: any) => {
    if (!['ADMIN', 'AUX'].includes(userRole)) return '';
    return (
      <Tooltip title="Asignar/Cambiar" arrow>
        <IconButton
          onClick={() => handleOnOperatorClick(change)}
          sx={{
            '&:hover': {
              background: theme.colors.primary.lighter
            },
            color: theme.colors.alpha
          }}
          color={change.operator ? 'inherit' : 'error'}
          size="small"
        >
          <PersonAddAlt1Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };
  const theme = useTheme();
  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                id="input-search-rent"
                label="Buscar"
                onChange={handleSearchChange}
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
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Fotos</TableCell>
                <TableCell align="center">Ubicación</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Colonia-Sector</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Fecha Programada</TableCell>
                <TableCell align="center">Horario Especial</TableCell>
                <TableCell align="center">¿Enviada?</TableCell>
                <TableCell align="center">Operador</TableCell>
                {!userOnlyRead && <TableCell align="center"></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeliveries.map((change) => {
                return (
                  <TableRow hover key={change?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {change?.rent?.machine?.machineNum}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {change?.rent?.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              setSelectedImages(change.rent.imagesUrl);
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
                    <TableCell align="center">
                      {change?.rent?.customer?.currentResidence?.maps ? (
                        <Tooltip title="Ver ubicación" arrow>
                          <IconButton
                            href={`${change?.rent?.customer?.currentResidence?.maps}`}
                            target="_blank"
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.info.dark
                            }}
                            color="inherit"
                            size="small"
                          >
                            <LocationOnIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        'N/A'
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
                        {change?.rent?.customer?.currentResidence?.suburb}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {change?.rent?.customer?.currentResidence?.sector?.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        gutterBottom
                        noWrap
                      >
                        {change?.rent?.customer?.currentResidence?.city?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(change?.status)}
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
                          formatTZDate(new Date(change?.date), 'MMM DD YYYY')
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
                        {change?.timeOption === 'specific'
                          ? `${formatTZDate(
                              new Date(change?.fromTime),
                              'h:mm A'
                            )} - ${formatTZDate(
                              new Date(change?.endTime),
                              'h:mm A'
                            )}`
                          : '-'}
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
                        {change?.wasSent ? 'Sí' : '-'}
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
                        {change?.operator ? change.operator.name : 'N/A'}
                        {changeOperatorIcon(change)}
                      </Typography>
                    </TableCell>
                    {!userOnlyRead && (
                      <TableCell align="center">
                        <NextLink href={`/cambios-pendientes/${change?._id}`}>
                          <Tooltip title="Marcar completado" arrow>
                            <IconButton
                              sx={{
                                '&:hover': {
                                  background: theme.colors.primary.lighter
                                },
                                color: theme.colors.success.light
                              }}
                              color="inherit"
                              size="small"
                              disabled={!change.operator}
                            >
                              <CheckIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                        </NextLink>
                        <Tooltip title="Modificar" arrow>
                          <IconButton
                            onClick={() => handleOnModifyClick(change)}
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.palette.primary.main
                            }}
                            color="inherit"
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {userCanDelete && (
                          <Tooltip title="Cancelar cambio" arrow>
                            <IconButton
                              onClick={() => handleOnDeleteClick(change._id)}
                              sx={{
                                '&:hover': {
                                  background: theme.colors.error.lighter
                                },
                                color: theme.palette.error.main
                              }}
                              color="inherit"
                              size="small"
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Ver formato" arrow>
                          <IconButton
                            onClick={() => {
                              setChangeToEdit(change);
                              setFormatText(
                                getFormatForChange(
                                  change.rent,
                                  change,
                                  change.reason,
                                  change
                                )
                              );
                              setFormatIsOpen(true);
                            }}
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.colors.success.light
                            }}
                            color="inherit"
                            size="small"
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box p={2}>
          <TablePagination
            component="div"
            count={filteredChanges.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={
              filteredChanges.length > 100
                ? [30, 100, filteredChanges.length]
                : [30, 100]
            }
          />
        </Box>
      </Card>
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title={'Fotos de la renta'}
          text=""
          onClose={handleOnCloseImages}
        />
      )}
      {modifyModalIsOpen && (
        <ModifyChangeModal
          open={modifyModalIsOpen}
          handleOnClose={handleModifyClose}
          changeToEdit={changeToEdit}
        />
      )}
      {formatIsOpen && (
        <FormatModal
          open={formatIsOpen}
          selectedId={changeToEdit?._id}
          title="Formato de Cambio"
          text={changeToEdit?.wasSent ? 'ENVIADO' : null}
          formatText={formatText}
          textColor={'green'}
          onAccept={() => {
            setFormatIsOpen(false);
            setFormatText('');
          }}
          onSubmitAction={markWasSentChange}
        />
      )}
      {cancelModalIsOpen && (
        <GenericModal
          open={cancelModalIsOpen}
          title="Atención"
          requiredReason
          text={'¿Está seguro de cancelar el cambio seleccionado?'}
          isLoading={isDeleting}
          onAccept={handleOnConfirmDelete}
          onCancel={() => {
            setCancelModalIsOpen(false);
            setIsDeleting(false);
          }}
        />
      )}
      {operatorIsOpen && (
        <OperatorModal
          open={operatorIsOpen}
          type="change"
          id={changeToEdit?._id}
          currentOperator={changeToEdit?.operator?._id}
          onAccept={handleOnAsignedOperator}
          onCancel={() => {
            setOperatorIsOpen(false);
          }}
        />
      )}
    </>
  );
};

TablaCambiosPendientes.propTypes = {
  userRole: PropTypes.string.isRequired,
  changesList: PropTypes.array.isRequired
};

TablaCambiosPendientes.defaultProps = {
  userRole: '',
  changesList: []
};

export default TablaCambiosPendientes;
