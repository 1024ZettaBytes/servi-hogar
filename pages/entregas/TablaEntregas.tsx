import { FC, ChangeEvent, useState } from "react";
import * as str from "string";
import PropTypes from "prop-types";
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
} from "@mui/material";
import NextLink from "next/link";
import { capitalizeFirstLetter } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { cancelDelivery } from "../../lib/client/deliveriesFetch";
import { useSnackbar } from "notistack";
import Label from "@/components/Label";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SearchIcon from "@mui/icons-material/Search";
import GenericModal from "@/components/GenericModal";
import ModifyDeliveryModal from "../../src/components/ModifyDeliveryModal";
import FormatModal from "@/components/FormatModal";
import { getFormatForDelivery } from "../../lib/consts/OBJ_CONTS"

interface TablaEntregasProps {
  userRole: string;
  className?: string;
  deliveriesList: any[];
}
const statusMap = {
  CANCELADA: {
    text: "Cancelada",
    color: "error",
  },
  ENTREGADA: {
    text: "Entregada",
    color: "success",
  },
};
const getStatusLabel = (deliverStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[deliverStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (deliveriesList: any[], filter: string): any[] => {
  return deliveriesList.filter((delivery) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(delivery).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "rent": {
            const matchCustomerName = value["customer"] && value["customer"].name && compareStringsForFilter(filter, value["customer"].name);
            const matchNumber =
              value["num"] && compareStringsForFilter(filter, value["num"]);
            return matchNumber || matchCustomerName;
          }
          case "status": {
            const matchText =
              statusMap["" + value] &&
              statusMap["" + value].text &&
              compareStringsForFilter(filter, statusMap["" + value].text);
            return matchText;
          }
          case "createdAt": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(delivery?.createdAt), "LLL dd yyyy", {
                  locale: es,
                })
              );
            return matchFormatedDate;
          }

          case "finishedAt": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(delivery?.finishedAt), "LLL dd yyyy", {
                  locale: es,
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
  deliveriesList: any[],
  page: number,
  limit: number
): any[] => {
  return deliveriesList.slice(page * limit, page * limit + limit);
};

const TablaEntregas: FC<TablaEntregasProps> = ({
  userRole,
  deliveriesList,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [modifyModalIsOpen, setModifyModalIsOpen] = useState(false);
  const [cancelModalIsOpen, setCancelModalIsOpen] = useState(false);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [formatText, setFormatText] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveryToEdit, setDeliveryToEdit] = useState<any>(null);
  const [idToCancel, setIdToCancel] = useState<string>(null);
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
  };
  const handleOnDeleteClick = (deliveryId: string) => {
    setIdToCancel(deliveryId);
    setCancelModalIsOpen(true);
  };
  const handleOnConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await cancelDelivery(idToCancel);
    setCancelModalIsOpen(false);
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
  const paginatedDeliveries = applyPagination(filteredDeliveries, page, limit);

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
                  ),
                }}
                sx={{ marginTop: "20px" }}
              />
            </Box>
          }
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          title=""
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"># de renta</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Solicitada</TableCell>
                <TableCell align="center">Entregada</TableCell>
                <TableCell align="center">Resultado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeliveries.map((delivery) => {
                return (
                  <TableRow hover key={delivery?._id}>
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
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {delivery?.rent?.customer?.name}
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
                          format(new Date(delivery?.createdAt), "LLL dd yyyy", {
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
                        {delivery?.finishedAt ? capitalizeFirstLetter(
                          format(new Date(delivery?.finishedAt), "LLL dd yyyy", {
                            locale: es,
                          })
                        ) : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(delivery?.status)}
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
      {modifyModalIsOpen && (
        <ModifyDeliveryModal
          open={modifyModalIsOpen}
          handleOnClose={handleModifyClose}
          deliveryToEdit={deliveryToEdit}
        />
      )}
      {formatIsOpen && (
        <FormatModal
          open={formatIsOpen}
          title="Formato de entrega"
          text=""
          formatText={formatText}
          onAccept={() => {
            setFormatIsOpen(false);
            setFormatText("");
          }}
        />
      )}
      <GenericModal
        open={cancelModalIsOpen}
        title="Atención"
        text={"¿Está seguro de cancelar la entrega seleccionada?"}
        isLoading={isDeleting}
        onAccept={handleOnConfirmDelete}
        onCancel={() => {
          setCancelModalIsOpen(false);
          setIsDeleting(false);
        }}
      />
    </>
  );
};

TablaEntregas.propTypes = {
  userRole: PropTypes.string.isRequired,
  deliveriesList: PropTypes.array.isRequired,
};

TablaEntregas.defaultProps = {
  userRole: "",
  deliveriesList: [],
};

export default TablaEntregas;
