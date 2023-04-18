import { FC, ChangeEvent, useState } from "react";
import numeral from "numeral";
import * as str from "string";
import PropTypes from "prop-types";
import {
  Tooltip,
  Divider,
  Box,
  Card,
  Checkbox,
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
import { deleteMachines } from "../../lib/client/machinesFetch";
import { useSnackbar } from "notistack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import BulkTableActions from "../../src/components/BulkTableActions";
import SearchIcon from "@mui/icons-material/Search";
import NextLink from "next/link";
import GenericModal from "@/components/GenericModal";
import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
import { MACHINE_STATUS_LIST } from "../../lib/consts/OBJ_CONTS";
interface TablaEquiposProps {
  userRole: string;
  className?: string;
  machinesList: any[];
}
const getStatusDescription = (
  status: String,
  rent: any,
  vehicle: any,
  warehouse: any
) => {
  const notAvailable = "Información no disponible";
  switch (status) {
    case MACHINE_STATUS_LIST.RENTADO:
      return rent ? `Renta #${rent?.num}` : notAvailable;
    case MACHINE_STATUS_LIST.VEHI:
      return vehicle
        ? `${vehicle?.brand} ${vehicle?.model} ${vehicle?.color} ${vehicle?.year}`
        : notAvailable;
    default:
      return warehouse ? warehouse?.name : notAvailable;
  }
};

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (machinesList: any[], filter: string): any[] => {
  return machinesList.filter((machine) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(machine).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "status": {
            const matchDescription =
              value["description"] &&
              compareStringsForFilter(filter, value["description"]);
            return matchDescription;
          }
          case "currentWarehouse": {
            const matchWarehouse =
              value &&
              value["name"] &&
              compareStringsForFilter(filter, value["name"]);
            return matchWarehouse;
          }
          case "currentVehicle": {
            const vehicleDesc = value
              ? "".concat(
                  value["brand"] || "",
                  " ",
                  value["model"] || "",
                  " ",
                  value["color"] || "",
                  " ",
                  value["year"] || ""
                )
              : "";
            const matchVehicle =
              value && compareStringsForFilter(filter, vehicleDesc);
            return matchVehicle;
          }
          case "machineNum":
            {
              return compareStringsForFilter(filter, parseInt(value+"")<1000 ? ('00' + value+"").slice(-3): value+"");
            }
          case "brand":
          case "capacity":
          case "totalChanges": {
            return compareStringsForFilter(filter, value.toString());
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  machinesList: any[],
  page: number,
  limit: number
): any[] => {
  return machinesList.slice(page * limit, page * limit + limit);
};

const TablaEquipos: FC<TablaEquiposProps> = ({ userRole, machinesList }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [machinesToDelete, setMachinesToDelete] = useState<string[]>([]);
  const [selectedMachines, setselectedMachines] = useState<string[]>([]);
  const selectedBulkActions = selectedMachines.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const userCanDelete = ["ADMIN", "AUX"].includes(userRole);
  const machineCanBeDeleted = (machineIsActive, machineStatus) => {
    return (
      userCanDelete &&
      machineIsActive &&
      machineStatus !== MACHINE_STATUS_LIST.RENTADO &&
      machineStatus !== MACHINE_STATUS_LIST.MANTE &&
      machineStatus !== MACHINE_STATUS_LIST.VEHI
    );
  };
  const canSelectAll =
    machinesList.length > 0 &&
    machinesList.every((machine) =>
      machineCanBeDeleted(machine?.active, machine?.status?.id)
    );
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
  };

  const handleSelectAllMachines = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setselectedMachines(
      event.target.checked ? machinesList.map((machine) => machine?._id) : []
    );
  };

  const handleSelectOneMachine = (
    _event: ChangeEvent<HTMLInputElement>,
    machineId: string
  ): void => {
    if (!selectedMachines.includes(machineId)) {
      setselectedMachines((prevSelected) => [...prevSelected, machineId]);
    } else {
      setselectedMachines((prevSelected) =>
        prevSelected.filter((id) => id !== machineId)
      );
    }
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };
  const handleOnDeleteClick = (machines: string[]) => {
    setMachinesToDelete(machines);
    setDeleteModalIsOpen(true);
  };
  const handleOnConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteMachines(machinesToDelete);
    setDeleteModalIsOpen(false);
    setIsDeleting(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? "success" : "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      autoHideDuration: 2000,
    });

    if (!result.error) {
      const newSelected = selectedMachines.filter(
        (selected) => !machinesToDelete.includes(selected)
      );
      setselectedMachines(newSelected);
      setMachinesToDelete([]);
    }
  };

  const filteredMachines = applyFilters(machinesList, filter);
  const paginatedMachines = applyPagination(filteredMachines, page, limit);
  const selectedSomeMachines =
    selectedMachines.length > 0 &&
    selectedMachines.length < machinesList.length;
  const selectedAllMachines =
    selectedMachines.length === machinesList.length && machinesList.length > 0;
  const theme = useTheme();
  return (
    <>
      <Card>
        {selectedBulkActions && (
          <Box flex={1} p={2}>
            <BulkTableActions
              onClickButton={handleOnDeleteClick}
              selectedList={selectedMachines}
            />
          </Box>
        )}
        {!selectedBulkActions && (
          <CardHeader
            action={
              <Box width={200}>
                <TextField
                  size="small"
                  id="input-search-machine"
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
            title="Todos los Equipos"
          />
        )}
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  {canSelectAll && (
                    <Checkbox
                      color="primary"
                      checked={selectedAllMachines}
                      indeterminate={selectedSomeMachines}
                      onChange={handleSelectAllMachines}
                    />
                  )}
                </TableCell>
                <TableCell align="center"># Equipo</TableCell>
                <TableCell align="center">Marca</TableCell>
                <TableCell align="center">Capacidad</TableCell>
                <TableCell align="center">Costo</TableCell>
                <TableCell align="center">Gastos</TableCell>
                <TableCell align="center">Generado</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Última Renta</TableCell>
                <TableCell align="center">Cambios</TableCell>
                <TableCell align="center">Antiguedad</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.map((machine) => {
                const isMachineSelected = selectedMachines.includes(
                  machine?._id
                );
                return (
                  <TableRow
                    hover={machine?.active}
                    key={machine?._id}
                    selected={isMachineSelected}
                    sx={
                      !machine?.active
                        ? { backgroundColor: theme.palette.grey[400] }
                        : {}
                    }
                  >
                    <TableCell padding="checkbox">
                      {machineCanBeDeleted(
                        machine?.active,
                        machine?.status?.id
                      ) && (
                        <Checkbox
                          color="primary"
                          checked={isMachineSelected}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            handleSelectOneMachine(event, machine?._id)
                          }
                          value={isMachineSelected}
                        />
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
                        {machine?.machineNum}
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
                        {machine?.brand}
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
                        {machine?.capacity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {numeral(machine?.cost).format(`${machine.cost}0,0.00`)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="error" noWrap>
                        {numeral(machine?.expenses).format(
                          `${machine.expenses}0,0.00`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="green" noWrap>
                        {numeral(machine?.earnings).format(
                          `${machine.earnings}0,0.00`
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
                        {machine?.status?.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {getStatusDescription(
                          machine?.status?.id,
                          machine.lastRent,
                          machine.currentVehicle,
                          machine.currentWarehouse
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
                        {machine?.lastRent?.startDate
                          ? capitalizeFirstLetter(
                              formatTZDate(
                                new Date(machine?.lastRent?.startDate),
                                "MMM DD YYYY"
                              )
                            )
                          : ""}
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
                        {machine?.totalChanges}
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
                            new Date(machine?.createdAt),
                            "MMM DD YYYY"
                          )
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <NextLink href={`/equipos/${machine?._id}`}>
                        <Tooltip title="Detalle" arrow>
                          <IconButton
                            sx={{
                              "&:hover": {
                                background: theme.colors.primary.lighter,
                              },
                              color: theme.palette.primary.main,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </NextLink>
                      {machineCanBeDeleted(
                        machine?.active,
                        machine?.status?.id
                      ) && (
                        <Tooltip title="Eliminar Equipo" arrow>
                          <IconButton
                            onClick={() => handleOnDeleteClick([machine._id])}
                            sx={{
                              "&:hover": {
                                background: theme.colors.error.lighter,
                              },
                              color: theme.palette.error.main,
                            }}
                            color="inherit"
                            size="small"
                          >
                            <DeleteTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
            count={filteredMachines.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>

      <GenericModal
        open={deleteModalIsOpen}
        title="Atención"
        requiredReason={false}
        text={
          "¿Está seguro de eliminar a" +
          (machinesToDelete.length === 1
            ? "l equipo seleccionado"
            : " los equipos seleccionados") +
          "?"
        }
        isLoading={isDeleting}
        onAccept={handleOnConfirmDelete}
        onCancel={() => {
          setDeleteModalIsOpen(false);
          setIsDeleting(false);
        }}
      />
    </>
  );
};

TablaEquipos.propTypes = {
  userRole: PropTypes.string.isRequired,
  machinesList: PropTypes.array.isRequired,
};

TablaEquipos.defaultProps = {
  userRole: "",
  machinesList: [],
};

export default TablaEquipos;
