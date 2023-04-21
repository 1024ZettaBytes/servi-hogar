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
import { useSnackbar } from "notistack";
import PlusOneIcon from "@mui/icons-material/PlusOne";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import RedeemIcon from "@mui/icons-material/Redeem";
import ExtendRentModal from "../../src/components/ExtendRentModal";
import ChangePayDayModal from "@/components/ChangePayDayModal";
import SchedulePickupModal from "@/components/SchedulePickupModal";
import FormatModal from "@/components/FormatModal";
import { getFormatForPickup, getFormatForChange } from "lib/consts/OBJ_CONTS";
import ScheduleChangeModal from "@/components/ScheduleChangeModal";
import Label from "@/components/Label";
import styles from "../tables.module.css";
import BonusModal from "@/components/BonusModal";
import { markWasSentPickup } from "lib/client/pickupsFetch";
import { markWasSentChange } from "lib/client/changesFetch";
import { getFetcher, useGetPrices } from "pages/api/useRequest";

interface TablaRentasActualesProps {
  className?: string;
  rentList: any[];
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};

const applyFilters = (rentList: any[], filter: string): any[] => {
  return rentList.filter((rent) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(rent).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "status": {
            const matchText =
              value["id"] &&
              compareStringsForFilter(filter, statusMap[value["id"]].text);
            return matchText;
          }
          case "customer": {
            const matchText =
              value["name"] && compareStringsForFilter(filter, value["name"]);
            const matchCityOrSector =
              value["currentResidence"]?.city?.name &&
              value["currentResidence"]?.sector?.name &&
              (compareStringsForFilter(
                filter,
                value["currentResidence"].city.name
              ) ||
                compareStringsForFilter(
                  filter,
                  value["currentResidence"].sector.name
                ) ||
                compareStringsForFilter(
                  filter,
                  value["currentResidence"].suburb
                ));
            return matchText || matchCityOrSector;
          }
          case "machine": {
            const matchText =
              value["machineNum"] &&
              compareStringsForFilter(
                filter,
                parseInt(value["machineNum"]) < 1000
                  ? ("00" + value["machineNum"]).slice(-3)
                  : value["machineNum"]
              );
            return matchText;
          }
          case "endDate": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(rent?.endDate), "LLL dd yyyy", {
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
  rentList: any[],
  page: number,
  limit: number
): any[] => {
  return rentList.slice(page * limit, page * limit + limit);
};
const statusMap = {
  PENDIENTE: {
    text: "Pendiente de entrega",
    color: "warning",
  },
  ENTREGA: {
    text: "En proceso de entrega",
    color: "warning",
  },
  RENTADO: {
    text: "Rentado",
    color: "success",
  },
  EN_CAMBIO: {
    text: "Cambio solicitado",
    color: "warning",
  },
  EN_RECOLECCION: {
    text: "En proceso de recolección",
    color: "error",
  },
  FINALIZADA: {
    text: "Renta finalizada",
    color: "primary",
  },
  CANCELADA: {
    text: "Cancelada (no entregada)",
    color: "secondary",
  },
};
const getStatusLabel = (deliverStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[deliverStatus];

  return <Label color={color}>{text}</Label>;
};
const TablaRentasActuales: FC<TablaRentasActualesProps> = ({ rentList }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { prices } = useGetPrices(getFetcher);
  const [extendModalIsOpen, setExtendModalIsOpen] = useState(false);
  const [payDayModalIsOpen, setPayDayModalIsOpen] = useState(false);
  const [pickupModalIsOpen, setPickupModalIsOpen] = useState(false);
  const [changeModalIsOpen, setChangeModalIsOpen] = useState(false);
  const [bonusModalIsOpen, setBonusModalIsOpen] = useState(false);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [createdPickup, setCreatedPickup] = useState<any>(null);
  const [createdChange, setCreatedChange] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [selectedRent, setSelectedRent] = useState<any>(null);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const handleCloseModal = (wasSuccess, successMessage = null) => {
    setExtendModalIsOpen(false);
    setPayDayModalIsOpen(false);
    setPickupModalIsOpen(false);
    setChangeModalIsOpen(false);
    setBonusModalIsOpen(false);
    if (wasSuccess && successMessage) {
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
  const handleClosePickupModal = (
    wasSuccess,
    pickUpCompleteData,
    successMessage = null
  ) => {
    handleCloseModal(wasSuccess, successMessage);
    if (wasSuccess) {
      setCreatedPickup(pickUpCompleteData);
      setFormatIsOpen(true);
    }
  };

  const handleCloseChangeModal = (
    wasSuccess,
    changeCompleteData,
    successMessage = null
  ) => {
    handleCloseModal(wasSuccess, successMessage);
    if (wasSuccess) {
      setCreatedChange(changeCompleteData);
      setFormatIsOpen(true);
    }
  };

  const handleCloseBonusModal = (wasSuccess, successMessage = null) => {
    handleCloseModal(wasSuccess, successMessage);
    if (wasSuccess) {
      // Show success message
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

  const handleOnExtendClick = (rentId: string) => {
    setSelectedId(rentId);
    setExtendModalIsOpen(true);
  };

  const handleOnDayChangeClick = (rentId: string) => {
    setSelectedId(rentId);
    setPayDayModalIsOpen(true);
  };

  const handleOnPickupClick = (rentId: string) => {
    setSelectedId(rentId);
    setPickupModalIsOpen(true);
  };
  const handleOnChangeClick = (rentId: string) => {
    setSelectedId(rentId);
    setChangeModalIsOpen(true);
  };
  const handleOnBonusClick = (rent: any) => {
    setSelectedId(rent?._id);
    setSelectedRent(rent);
    setBonusModalIsOpen(true);
  };

  const filteredRents = applyFilters(rentList, filter);
  const paginatedRents = applyPagination(filteredRents, page, limit);

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
          title="Rentas actuales"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Colonia-Sector</TableCell>
                <TableCell align="center">Pago</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Días Restantes</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRents.map((rent) => {
                return (
                  <TableRow hover key={rent?._id}>
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
                      {rent?.machine?.machineNum}
                    </TableCell>
                    <TableCell align="center">
                      <NextLink href={`/clientes/${rent?.customer?._id}`}>
                        <a className={styles.title_text}>
                          {rent?.customer?.name}
                        </a>
                      </NextLink>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {rent?.customer?.currentResidence?.suburb}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {rent?.customer?.currentResidence?.sector?.name}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        gutterBottom
                        noWrap
                      >
                        {rent?.customer?.currentResidence?.city?.name}
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
                          formatTZDate(new Date(rent?.endDate), "MMM DD YYYY")
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(rent?.status.id)}
                    </TableCell>
                    <TableCell align="center">
                      {rent?.remaining >= 0 ? (
                        rent.remaining
                      ) : (
                        <Typography color="error">
                          VENCIDA (Hace {Math.abs(rent.remaining)} día(s))
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Extender Renta" arrow>
                        <IconButton
                          onClick={() => handleOnExtendClick(rent?._id)}
                          sx={{
                            "&:hover": {
                              background: theme.colors.primary.lighter,
                            },
                            color: theme.colors.success.light,
                          }}
                          color="inherit"
                          size="small"
                        >
                          <PlusOneIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cambio de equipo" arrow>
                        <span>
                          <IconButton
                            onClick={() => {
                              handleOnChangeClick(rent?._id);
                            }}
                            sx={{
                              "&:hover": {
                                background: theme.colors.error.lighter,
                              },
                              color: theme.palette.warning.light,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <ChangeCircleIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cambiar día de pago" arrow>
                        <IconButton
                          disabled={["EN_CAMBIO", "EN_RECOLECCION"].includes(
                            rent?.status?.id
                          )}
                          onClick={() => {
                            handleOnDayChangeClick(rent?._id);
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
                          <CurrencyExchangeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Retirar" arrow>
                        <span>
                          <IconButton
                            disabled={rent.status.id !== "RENTADO"}
                            onClick={() => {
                              handleOnPickupClick(rent?._id);
                            }}
                            sx={{
                              "&:hover": {
                                background: theme.colors.error.lighter,
                              },
                              color: theme.palette.error.main,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <LocalShippingIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Bonificar" arrow>
                        <span>
                          <IconButton
                            disabled={["EN_CAMBIO", "EN_RECOLECCION"].includes(
                              rent.status.id
                            )}
                            onClick={() => {
                              handleOnBonusClick(rent);
                            }}
                            sx={{
                              "&:hover": {
                                background: theme.colors.gradients.blue4,
                              },
                              color: theme.colors.gradients.blue1,
                            }}
                            color="info"
                            size="small"
                          >
                            <RedeemIcon fontSize="small" />
                          </IconButton>
                        </span>
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
            count={filteredRents.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
      {extendModalIsOpen && (
        <ExtendRentModal
          open={extendModalIsOpen}
          handleOnClose={handleCloseModal}
          rentId={selectedId}
        />
      )}
      {changeModalIsOpen && (
        <ScheduleChangeModal
          open={changeModalIsOpen}
          handleOnClose={handleCloseChangeModal}
          rentId={selectedId}
        />
      )}
      {payDayModalIsOpen && (
        <ChangePayDayModal
          open={payDayModalIsOpen}
          handleOnClose={handleCloseModal}
          rentId={selectedId}
        />
      )}
      {pickupModalIsOpen && (
        <SchedulePickupModal
          open={pickupModalIsOpen}
          handleOnClose={handleClosePickupModal}
          rentId={selectedId}
        />
      )}
      {bonusModalIsOpen && (
        <BonusModal
          open={bonusModalIsOpen}
          handleOnClose={handleCloseBonusModal}
          rent={selectedRent}
        />
      )}
      {formatIsOpen && createdPickup && (
        <FormatModal
          open={formatIsOpen}
          selectedId={createdPickup.pickup._id}
          title="Formato de Recolección"
          text={createdPickup?.wasSent ? "ENVIADO" : null}
          textColor="green"
          formatText={getFormatForPickup(
            createdPickup.rent,
            createdPickup.pickup,
            createdPickup.pickupTime,
            prices.dayPrice
          )}
          onAccept={() => {
            setFormatIsOpen(false);
            setCreatedPickup(null);
          }}
          onSubmitAction={markWasSentPickup}
        />
      )}
      {formatIsOpen && createdChange && (
        <FormatModal
          open={formatIsOpen}
          selectedId={createdChange.change._id}
          title="Formato de Cambio"
          text={createdChange?.change.wasSent ? "ENVIADO" : null}
          textColor="green"
          formatText={getFormatForChange(
            createdChange.rent,
            createdChange.change,
            createdChange.reason,
            createdChange.changeTime
          )}
          onAccept={() => {
            setFormatIsOpen(false);
            setCreatedChange(null);
          }}
          onSubmitAction={markWasSentChange}
        />
      )}
    </>
  );
};

TablaRentasActuales.propTypes = {
  rentList: PropTypes.array.isRequired,
};

TablaRentasActuales.defaultProps = {
  rentList: [],
};

export default TablaRentasActuales;
