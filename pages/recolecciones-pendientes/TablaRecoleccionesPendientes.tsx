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
import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { cancelPickup, markWasSentPickup } from "../../lib/client/pickupsFetch";
import { useSnackbar } from "notistack";
import Label from "@/components/Label";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import GenericModal from "@/components/GenericModal";
import ModifyPickupModal from "../../src/components/ModifyPickupModal";
import OperatorModal from "@/components/OperatorModal";
import FormatModal from "@/components/FormatModal";
import { getFormatForPickup } from "../../lib/consts/OBJ_CONTS";
import { getFetcher, useGetPrices } from "pages/api/useRequest";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import ImagesModal from "@/components/ImagesModal";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

interface TablaRecoleccionesPendientesProps {
  userRole: string;
  className?: string;
  pickupList: any[];
}
const statusMap = {
  ESPERA: {
    text: "En espera",
    color: "warning",
  },
  EN_CAMINO: {
    text: "En espera",
    color: "warning",
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
const applyFilters = (pickupsList: any[], filter: string): any[] => {
  return pickupsList.filter((pickup) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(pickup).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "rent": {
            const matchCustomerName =
              value["customer"] &&
              value["customer"].name &&
              compareStringsForFilter(filter, value["customer"].name);
            const matchMachine =
              value["machine"] &&
              value["machine"].machineNum &&
              compareStringsForFilter(
                filter,
                parseInt(value["machine"].machineNum) < 1000
                  ? ("00" + value["machine"].machineNum).slice(-3)
                  : value["machine"].machineNum
              );
            const matchCityOrSector =
              value["customer"]?.currentResidence?.city?.name &&
              value["customer"]?.currentResidence?.sector?.name &&
              (compareStringsForFilter(
                filter,
                value["customer"].currentResidence.city.name
              ) ||
                compareStringsForFilter(
                  filter,
                  value["customer"].currentResidence.sector.name
                ) ||
                compareStringsForFilter(
                  filter,
                  value["customer"].currentResidence.suburb
                ));
            return matchMachine || matchCustomerName || matchCityOrSector;
          }
          case "status": {
            const matchText =
              statusMap["" + value] &&
              statusMap["" + value].text &&
              compareStringsForFilter(filter, statusMap["" + value].text);
            return matchText;
          }
          case "date": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(pickup?.date), "LLL dd yyyy", {
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
  pickupsList: any[],
  page: number,
  limit: number
): any[] => {
  return pickupsList.slice(page * limit, page * limit + limit);
};

const TablaRecoleccionesPendientes: FC<TablaRecoleccionesPendientesProps> = ({
  userRole,
  pickupList,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [modifyModalIsOpen, setModifyModalIsOpen] = useState(false);
  const [cancelModalIsOpen, setCancelModalIsOpen] = useState(false);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [operatorIsOpen, setOperatorIsOpen] = useState(false);
  const [formatText, setFormatText] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [pickupToEdit, setPickupToEdit] = useState<any>(null);
  const [idToCancel, setIdToCancel] = useState<string>(null);
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [filter, setFilter] = useState<string>("");
  const { prices } = useGetPrices(getFetcher);

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };
  const userCanDelete = ["ADMIN", "AUX", "OPE"].includes(userRole);
  const handleModifyClose = (modifiedPickup, successMessage = null) => {
    setModifyModalIsOpen(false);
    if (modifiedPickup && successMessage) {
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
  const handleOnModifyClick = (pickup: any) => {
    setPickupToEdit(pickup);
    setModifyModalIsOpen(true);
  };
  const handleOnOperatorClick = (change: any) => {
    setPickupToEdit(change);
    setOperatorIsOpen(true);
  };
  const handleOnDeleteClick = (pickupId: string) => {
    setIdToCancel(pickupId);
    setCancelModalIsOpen(true);
  };
  const handleOnConfirmDelete = async (reason) => {
    setIsDeleting(true);
    const result = await cancelPickup(idToCancel, reason);
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

  const filteredPickups = applyFilters(pickupList, filter);
  const paginatedPickups = applyPagination(filteredPickups, page, limit);
  const changeOperatorIcon = (pickup: any) => {
    if (!["ADMIN", "AUX"].includes(userRole)) return "";
    return (
      <Tooltip title="Asignar/Cambiar" arrow>
        <IconButton
          onClick={() => handleOnOperatorClick(pickup)}
          sx={{
            "&:hover": {
              background: theme.colors.primary.lighter,
            },
            color: theme.colors.alpha,
          }}
          color={pickup.operator ? "inherit" : "error"}
          size="small"
        >
          <PersonAddAlt1Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };
  const handleOnAsignedOperator = async () => {
    setOperatorIsOpen(false);
    enqueueSnackbar("Operador asignado con éxito!", {
      variant: "success",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      autoHideDuration: 2000,
    });
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
                <TableCell align="center"># Equipo</TableCell>
                <TableCell align="center">Fotos</TableCell>
                <TableCell align="center">Ubicación</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Colonia-Sector</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Fecha Programada</TableCell>
                <TableCell align="center">Horario Especial</TableCell>
                <TableCell align="center">¿Enviada?</TableCell>
                <TableCell align="center">Operador</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPickups.map((pickup) => {
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
                        {pickup?.rent?.machine?.machineNum}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {pickup?.rent?.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              setSelectedImages(pickup.rent.imagesUrl);
                              setOpenImages(true);
                            }}
                            sx={{
                              "&:hover": {
                                background: theme.colors.primary.lighter,
                              },
                              color: theme.palette.primary.main,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <ImageSearchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {pickup?.rent?.customer?.currentResidence?.maps ? (
                        <Tooltip title="Ver ubicación" arrow>
                          <IconButton
                            href={`${pickup?.rent?.customer?.currentResidence?.maps}`}
                            target="_blank"
                            sx={{
                              "&:hover": {
                                background: theme.colors.primary.lighter,
                              },
                              color: theme.palette.info.dark,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <LocationOnIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        "N/A"
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
                        {pickup?.rent?.customer?.currentResidence?.suburb}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {pickup?.rent?.customer?.currentResidence?.sector?.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        gutterBottom
                        noWrap
                      >
                        {pickup?.rent?.customer?.currentResidence?.city?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(pickup?.status)}
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
                          formatTZDate(new Date(pickup?.date), "MMM DD YYYY")
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
                        {pickup?.timeOption === "specific"
                          ? `${formatTZDate(
                              new Date(pickup?.fromTime),
                              "h:mm A"
                            )} - ${formatTZDate(
                              new Date(pickup?.endTime),
                              "h:mm A"
                            )}`
                          : "-"}
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
                        {pickup?.wasSent ? "Sí" : "-"}
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
                        {pickup?.operator ? pickup.operator.name : "N/A"}
                        {changeOperatorIcon(pickup)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <NextLink
                        href={`/recolecciones-pendientes/${pickup?._id}`}
                      >
                        <Tooltip title="Marcar recolectada" arrow>
                          <IconButton
                            sx={{
                              "&:hover": {
                                background: theme.colors.primary.lighter,
                              },
                              color: theme.colors.success.light,
                            }}
                            color="inherit"
                            size="small"
                            disabled={!pickup.operator}
                          >
                            <CheckIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      </NextLink>
                      <Tooltip title="Modificar" arrow>
                        <IconButton
                          onClick={() => handleOnModifyClick(pickup)}
                          sx={{
                            "&:hover": {
                              background: theme.colors.primary.lighter,
                            },
                            color: theme.palette.primary.main,
                          }}
                          color="inherit"
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {userCanDelete && (
                        <Tooltip title="Cancelar recolección" arrow>
                          <IconButton
                            onClick={() => handleOnDeleteClick(pickup._id)}
                            sx={{
                              "&:hover": {
                                background: theme.colors.error.lighter,
                              },
                              color: theme.palette.error.main,
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
                            setPickupToEdit(pickup);
                            setFormatText(
                              getFormatForPickup(
                                pickup.rent,
                                pickup,
                                pickup,
                                prices.dayPrice
                              )
                            );
                            setFormatIsOpen(true);
                          }}
                          sx={{
                            "&:hover": {
                              background: theme.colors.primary.lighter,
                            },
                            color: theme.colors.success.light,
                          }}
                          color="inherit"
                          size="small"
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
            count={filteredPickups.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={filteredPickups.length > 100 ? [30, 100, filteredPickups.length]:[30, 100]}
          />
        </Box>
      </Card>
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title={"Fotos de la renta"}
          text=""
          onClose={handleOnCloseImages}
        />
      )}
      {modifyModalIsOpen && (
        <ModifyPickupModal
          open={modifyModalIsOpen}
          handleOnClose={handleModifyClose}
          pickupToEdit={pickupToEdit}
        />
      )}
      {formatIsOpen && (
        <FormatModal
          open={formatIsOpen}
          selectedId={pickupToEdit?._id}
          title="Formato de recolección"
          text={pickupToEdit?.wasSent ? "ENVIADO" : null}
          textColor="green"
          formatText={formatText}
          onAccept={() => {
            setFormatIsOpen(false);
            setFormatText("");
          }}
          onSubmitAction={markWasSentPickup}
        />
      )}
      {cancelModalIsOpen && (
        <GenericModal
          open={cancelModalIsOpen}
          title="Atención"
          text={"¿Está seguro de cancelar la recolección seleccionada?"}
          requiredReason
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
          type="pickup"
          id={pickupToEdit?._id}
          currentOperator={pickupToEdit?.operator?._id}
          onAccept={handleOnAsignedOperator}
          onCancel={() => {
            setOperatorIsOpen(false);
          }}
        />
      )}
    </>
  );
};

TablaRecoleccionesPendientes.propTypes = {
  userRole: PropTypes.string.isRequired,
  pickupList: PropTypes.array.isRequired,
};

TablaRecoleccionesPendientes.defaultProps = {
  userRole: "",
  pickupList: [],
};

export default TablaRecoleccionesPendientes;
