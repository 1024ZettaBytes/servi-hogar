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
  InputAdornment,
  Chip
} from '@mui/material';

import { updateUser, unlockUser } from '../../lib/client/usersFetch';
import { useSnackbar } from 'notistack';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SearchIcon from '@mui/icons-material/Search';
import GenericModal from '@/components/GenericModal';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import AssignMachineModal from '@/components/AssignMachineModal';

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
    if (!filter || filter === '') {
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
          case 'role': {
            const matchRole =
              value['name'] && compareStringsForFilter(filter, value['name']);
            return matchRole;
          }
          case 'name':
          case 'id': {
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
  const [unlockModalIsOpen, setUnlockModalIsOpen] = useState(false);
  const [assignModalIsOpen, setAssignModalIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<any>(null);
  const [userToUnlock, setUserToUnlock] = useState<any>(null);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [filter, setFilter] = useState<string>('');
  const tecUsers = userList.filter(
    (user) => user.role?.id === 'TEC' && user.isActive
  );
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
  
  const handleOnUnlock = (): void => {
    setUnlockModalIsOpen(true);
  };
  
  const handleOnConfirmUpdate = async () => {
    setIsUpdating(true);
    const result = await updateUser(userToUpdate);
    setUpdateModalIsOpen(false);
    setIsUpdating(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });

    if (!result.error) {
      setUserToUpdate(null);
    }
  };
  
  const handleOnConfirmUnlock = async (reason: string) => {
    setIsUnlocking(true);
    const result = await unlockUser(userToUnlock._id, reason);
    setUnlockModalIsOpen(false);
    setIsUnlocking(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });

    if (!result.error) {
      setUserToUnlock(null);
    }
  };
  
  const handleCloseAssign = (success, message) => {
    setAssignModalIsOpen(false);
    if (!success) {
      return;
    }

    enqueueSnackbar(message, {
      variant: 'success',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });
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
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
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
                      {!user?.isActive ? (
                        <Chip
                          label="INACTIVO"
                          color="default"
                          size="small"
                          sx={{ fontWeight: 'bold', backgroundColor: '#bdbdbd' }}
                        />
                      ) : user?.isBlocked ? (
                        <Chip
                          label="BLOQUEADO"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ) : (
                        <Chip
                          label="ACTIVO"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {user.role?.id === 'TEC' && (
                        <Tooltip title={'Asignar Equipos'} arrow>
                          <IconButton
                            onClick={() => {
                              setUserToUpdate(user);
                              setAssignModalIsOpen(true);
                            }}
                            color="info"
                            size="small"
                          >
                            <LocalLaundryServiceIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user?.isBlocked && user?.isActive && (
                        <Tooltip title="Desbloquear Usuario" arrow>
                          <IconButton
                            onClick={() => {
                              setUserToUnlock(user);
                              handleOnUnlock();
                            }}
                            sx={{
                              '&:hover': {
                                background: theme.colors.success.lighter
                              },
                              color: theme.palette.success.main
                            }}
                            color="inherit"
                            size="small"
                          >
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip
                        title={
                          user?.isActive
                            ? 'Desactivar Usuario'
                            : 'Activar usuario'
                        }
                        arrow
                      >
                        <IconButton
                          onClick={() => {
                            setUserToUpdate({
                              _id: user?._id,
                              isActive: !user?.isActive,
                              operation: 'STATUS'
                            });
                            handleOnChangeStatus();
                          }}
                          sx={{
                            '&:hover': {
                              background: theme.colors.error.lighter
                            },
                            color: user?.isActive
                              ? theme.palette.error.main
                              : theme.colors.alpha.black
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
      {unlockModalIsOpen && (
      <GenericModal
        open={unlockModalIsOpen}
        title="Desbloquear Usuario"
        requiredReason={true}
        text={`¿Está seguro que desea desbloquear al usuario ${userToUnlock?.name}? El usuario podrá volver a completar vueltas. Por favor indique la razón del desbloqueo.`}
        isLoading={isUnlocking}
        onAccept={handleOnConfirmUnlock}
        onCancel={() => {
          setUnlockModalIsOpen(false);
          setIsUnlocking(false);
          setUserToUnlock(null);
        }}
      />
      )}
      {assignModalIsOpen && (
        <AssignMachineModal
          open={assignModalIsOpen}
          tecList={tecUsers}
          selectedTec={userToUpdate}
          handleOnClose={handleCloseAssign}
        />
      )}
    </>
  );
};

TablaUsuarios.propTypes = {
  userList: PropTypes.array.isRequired
};

TablaUsuarios.defaultProps = {
  userList: []
};

export default TablaUsuarios;
