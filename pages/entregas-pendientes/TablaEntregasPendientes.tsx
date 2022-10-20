import { FC, ChangeEvent, useState } from 'react';
import * as str from "string";
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
  InputAdornment,
} from '@mui/material';
import { capitalizeFirstLetter } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
//simport { deleteRents } from "../../lib/client/rentsFetch";
import { useSnackbar } from "notistack";
import Label from '@/components/Label';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import NextLink from "next/link";
import GenericModal from '@/components/GenericModal';
import ModifyDeliveryModal from '../../src/components/ModifyDeliveryModal';

interface TablaEntregasPendientesProps {
  userRole: string;
  className?: string;
  deliveriesList: any[];
}
const statusMap = {
  ESPERA: {
    text: "En espera",
    color: 'warning'
  },
  EN_CAMINO: {
    text: "En espera",
    color: 'warning'
  },
  ENTREGADA: {
    text: "Entregada",
    color: 'success'
  }
};
const getStatusLabel = (deliverStatus: string): JSX.Element => {
  
  const { text, color }: any = statusMap[deliverStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field).latinise().toLowerCase().includes(str(keyWord).latinise().toLowerCase());
}
const applyFilters = (
  deliveriesList: any[],
  filter: string
): any[] => {
  return deliveriesList.filter((delivery) => {
    if (!filter || filter === '') {
      return true;
    }
    return Object.entries(delivery).filter(keyValue => {
      const key = keyValue[0];
      const value = keyValue[1];
      if (!value) {
        return false;
      }
      switch (key) {
        case 'rent': {
          const matchNumber = value['num'] && compareStringsForFilter(filter, value['num']);
          return matchNumber;
        }
        case 'status': {
          const matchText = statusMap[''+value] && statusMap[''+value].text && compareStringsForFilter(filter, statusMap[''+value].text);
          return matchText;
        }
        case 'date':{
          const matchFormatedDate = value && compareStringsForFilter(filter, format(new Date(delivery?.fromTime), "LLL dd yyyy", {
            locale: es,
          }));
          return matchFormatedDate;
        }
      }
    }).length > 0;
  });
};

const applyPagination = (
  deliveriesList: any[],
  page: number,
  limit: number
): any[] => {
  return deliveriesList.slice(page * limit, page * limit + limit);
};

const TablaEntregasPendientes: FC<TablaEntregasPendientesProps> = ({ userRole, deliveriesList }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [modifyModalIsOpen, setModifyModalIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveryToEdit, setDeliveryToEdit] = useState<any>(null);
  const [rentsToDelete, setRentsToDelete] = useState<string[]>(
    []
  );
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const userCanDelete = userRole === "ADMIN";
  const handleModifyClose = (modifiedDelivery, successMessage = null) => {
    setModifyModalIsOpen(false);
    if (modifiedDelivery && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    }
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
  const handleOnModifyClick = (delivery: any) => {
    setDeliveryToEdit(delivery);
    setModifyModalIsOpen(true);
  }
  const handleOnDeleteClick= (rents: string[])=>{
    setRentsToDelete(rents);
    //setDeleteModalIsOpen(true);

  }
  const handleOnConfirmDelete = async () => {
    setIsDeleting(true);
    const result = null//await deleteRents(rentsToDelete);
    //setDeleteModalIsOpen(false);
    setIsDeleting(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? "success" : "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      autoHideDuration: 2000,
    });

  };

  const filteredDeliveries = applyFilters(deliveriesList, filter);
  const paginatedDeliveries = applyPagination(
    filteredDeliveries,
    page,
    limit
  );

  const theme = useTheme();
  return (
    <>
    <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size='small'
                id="input-search-rent"
                label="Buscar"
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{marginTop:"20px"}}
              />
            </Box>
          }
          sx={{display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap"}}
          title=""
        />
      
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center"># de renta</TableCell>
              {//<TableCell align="center">Operador</TableCell>
              }   
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Fecha solicitada</TableCell>
              <TableCell align="center">Horario Especial</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDeliveries.map((delivery) => {
              return (
                <TableRow
                  hover
                  key={delivery?._id}
                >
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {delivery?.rent?.num}
                    </Typography>
                  </TableCell>
                  {/*<TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {delivery?.takenBy?.name}
                    </Typography>
              </TableCell>*/}
                  <TableCell align="center">
                    {getStatusLabel(delivery?.status)}
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {
                      capitalizeFirstLetter(
                        format(new Date(delivery?.fromTime), "LLL dd yyyy", {
                          locale: es,
                        })
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
                      {
                        delivery?.timeOption === "specific" ?
                      
                        
                      `${format(new Date(delivery?.fromTime), "h:mm a", {
                          locale: es,
                        })} - ${format(new Date(delivery?.endTime), "h:mm a", {
                          locale: es,
                        })}`
                      : "-"}
                      

                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                  
                    <Tooltip title="Modificar" arrow>
                      <IconButton
                      onClick={() =>handleOnModifyClick(delivery)}
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
                    
                    {userCanDelete &&<Tooltip title="Cancelar entrega" arrow>
                      <IconButton
                      onClick={() =>handleOnDeleteClick([delivery._id])}
                        sx={{
                          '&:hover': { background: theme.colors.error.lighter },
                          color: theme.palette.error.main
                        }}
                        color="inherit"
                        size="small"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>}
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
          count={filteredDeliveries.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
    </Card>
    {modifyModalIsOpen  && 
        <ModifyDeliveryModal
          open={modifyModalIsOpen}
          handleOnClose={handleModifyClose}
          deliveryToEdit={deliveryToEdit}
        />
      }
    
    {/*<GenericModal
    open={deleteModalIsOpen}
    title="Atención"
    text={
      "¿Esta seguro de eliminar a" +
      (rentsToDelete.length === 1
        ? "l cliente seleccionado"
        : " los clientes seleccionados") +
      "?"
    }
    isLoading={isDeleting}
    onAccept={handleOnConfirmDelete}
    onCancel={() => {
      setDeleteModalIsOpen(false);
      setIsDeleting(false);
    }}
  />*/}</>
  );
};

TablaEntregasPendientes.propTypes = {
  userRole: PropTypes.string.isRequired,
  deliveriesList: PropTypes.array.isRequired,
};

TablaEntregasPendientes.defaultProps = {
  userRole: "",
  deliveriesList: [],
};

export default TablaEntregasPendientes;
