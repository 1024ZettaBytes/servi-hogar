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
  CardHeader,
  Typography
} from '@mui/material';
import { formatTZDate } from 'lib/client/utils';
import { getStatusLabel } from './TablaMantPendientes';

interface TablaMantProps {
  className?: string;
  listData: any[];
}

const applyPagination = (
  listData: any[],
  page: number,
  limit: number
): any[] => {
  return listData.slice(page * limit, page * limit + limit);
};

const TablaMant: FC<TablaMantProps> = ({ listData }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedMant = applyPagination(listData, page, limit);

  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
          title="Pasados"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Fecha Inicio</TableCell>
                <TableCell align="center">Fecha Fin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMant.map((mant) => {
                return (
                  <TableRow
                    key={mant?._id}
                  >
                    <TableCell align="center">
                      <Typography fontWeight="bold">{mant?.machine?.machineNum}</Typography>
                    </TableCell>
                    <TableCell align="center">{getStatusLabel(mant?.status)}</TableCell>
                    <TableCell align="center">
                      {formatTZDate(mant?.createdAt, 'DD MMM YYYY')}
                    </TableCell>
                    <TableCell align="center">
                      {formatTZDate(mant?.finishedAt, 'DD MMM  YYYY')}
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
            count={listData.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={
              listData.length > 100 ? [30, 100, listData.length] : [30, 100]
            }
          />
        </Box>
      </Card>
    </>
  );
};

TablaMant.propTypes = {
  listData: PropTypes.array.isRequired
};

TablaMant.defaultProps = {
  listData: []
};

export default TablaMant;
