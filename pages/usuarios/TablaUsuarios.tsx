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

import { updateUser } from "../../lib/client/usersFetch";
import { useSnackbar } from "notistack";
import BlockIcon from "@mui/icons-material/Block";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import GenericModal from "@/components/GenericModal";

interface TablaUsuariosProps {
  className?: string;
  userList: any[];
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (customerList: any[], filter: string): any[] => {
  return customerList.filter((customer) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(customer).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "role": {
            const matchRole =
              value["name"] && compareStringsForFilter(filter, value["name"]);
            return matchRole;
          }
          case "name":
          case "id": {
            return compareStringsForFilter(filter, value.toString());
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  customerList: any[],
  page: number,
  limit: number
): any[] => {
  return customerList.slice(page * limit, page * limit + limit);
};

const TablaUsuarios: FC<TablaUsuariosProps> = ({ userList }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [updateModalIsOpen, setUpdateModalIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<any>(null);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [filter, setFilter] = useState<string>("");
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
  const handleOnChangeStatus = (): void => {
    setUpdateModalIsOpen(true);
  };
  const handleOnConfirmUpdate = async () => {
    setIsUpdating(true);
    const result = await updateUser(userToUpdate);
    setUpdateModalIsOpen(false);
    setIsUpdating(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? "success" : "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      autoHideDuration: 2000,
    });

    if (!result.error) {
      setUserToUpdate(null);
    }
  };

  const filteredUsers = applyFilters(userList, filter);
  const paginatedUsers = applyPagination(filteredUsers, page, limit);
  const theme = useTheme();
  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                id="input-search-customer"
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
          title="Todos los Usuarios"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Usuario</TableCell>
                <TableCell align="center">Rol</TableCell>
                <TableCell align="center">ID</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => {
                return (
                  <TableRow
                    hover={!user?.isActive}
                    key={user?._id}
                    sx={
                      !user?.isActive
                        ? { backgroundColor: theme.palette.error.light }
                        : {}
                    }
                  >
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {user?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{user?.role?.name}</TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {user?.id}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip
                        title={
                          user?.isActive
                            ? "Desactivar Usuario"
                            : "Activar usuario"
                        }
                        arrow
                      >
                        <IconButton
                          onClick={() => {
                            setUserToUpdate({
                              _id: user?._id,
                              isActive: !user?.isActive,
                              operation: "STATUS",
                            });
                            handleOnChangeStatus();
                          }}
                          sx={{
                            "&:hover": {
                              background: theme.colors.error.lighter,
                            },
                            color: user?.isActive
                              ? theme.palette.error.main
                              : theme.colors.alpha.black,
                          }}
                          color="inherit"
                          size="small"
                        >
                          {user?.isActive ? (
                            <BlockIcon fontSize="small" />
                          ) : (
                            <CheckIcon fontSize="small" />
                          )}
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
            count={filteredUsers.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
      <GenericModal
        open={updateModalIsOpen}
        title="Atención"
        requiredReason={false}
        text="Se cambiará el estado del usuario"
        isLoading={isUpdating}
        onAccept={handleOnConfirmUpdate}
        onCancel={() => {
          setUpdateModalIsOpen(false);
          setIsUpdating(false);
        }}
      />
    </>
  );
};

TablaUsuarios.propTypes = {
  userList: PropTypes.array.isRequired,
};

TablaUsuarios.defaultProps = {
  userList: [],
};

export default TablaUsuarios;
