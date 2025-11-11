import { FC, ChangeEvent, useState } from 'react';
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
  Chip
} from '@mui/material';
import { formatTZDate } from 'lib/client/utils';

interface TablaDesbloqueos {
  className?: string;
  unlocksList: any[];
}

const applyPagination = (
  unlocksList: any[],
  page: number,
  limit: number
): any[] => {
  return unlocksList.slice(page * limit, page * limit + limit);
};

const TablaDesbloqueos: FC<TablaDesbloqueos> = ({ unlocksList }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedUnlocks = applyPagination(unlocksList, page, limit);

  return (
    <Card>
      <CardHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
        title="Historial de Desbloqueos"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario Desbloqueado</TableCell>
              <TableCell>ID Usuario</TableCell>
              <TableCell>Desbloqueado Por</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell align="center">Fecha y Hora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUnlocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay registros de desbloqueos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUnlocks.map((unlock) => {
                return (
                  <TableRow hover key={unlock._id}>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {unlock?.user?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unlock?.user?.id || 'N/A'}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {unlock?.unlockedBy?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 300 }}
                      >
                        {unlock?.reason}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {unlock?.unlockedAt
                          ? formatTZDate(
                              new Date(unlock.unlockedAt),
                              'DD/MM/YYYY HH:mm'
                            )
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={unlocksList.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
    </Card>
  );
};

TablaDesbloqueos.propTypes = {
  unlocksList: PropTypes.array.isRequired
};

TablaDesbloqueos.defaultProps = {
  unlocksList: []
};

export default TablaDesbloqueos;
