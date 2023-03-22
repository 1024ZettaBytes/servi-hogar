import { FC, ChangeEvent, useState } from "react";
import PropTypes from "prop-types";
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
} from "@mui/material";

import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
interface HistoryTabProps {
  className?: string;
  movementsList: any[];
}


const applyPagination = (
  mList: any[],
  page: number,
  limit: number
): any[] => {
  return mList.slice(page * limit, page * limit + limit);
};

const HistoryTab: FC<HistoryTabProps> = ({ movementsList }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);


  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedMovements = applyPagination(movementsList.reverse(), page, limit);
  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          title="Movimientos del cliente"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Fecha</TableCell>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovements.map((movement) => {
                return (
                  <TableRow key={movement?._id}>
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
                            new Date(movement?.date),
                            "MMM DD YYYY HH:mm:mm"
                          )
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
                        {movement?.machine?.machineNum}
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
                        {movement?.description}
                      </Typography>
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
            count={movementsList.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
    </>
  );
};

HistoryTab.propTypes = {
  movementsList: PropTypes.array.isRequired,
};

HistoryTab.defaultProps = {
  movementsList: [],
};

export default HistoryTab;
