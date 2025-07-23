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
  Grid,
} from "@mui/material";

import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
interface HistoryTabProps {
  className?: string;
  movementsList: any[];
  rentsList: any[];
}


const applyPagination = (
  mList: any[],
  page: number,
  limit: number
): any[] => {
  return mList.slice(page * limit, page * limit + limit);
};

const HistoryTab: FC<HistoryTabProps> = ({ movementsList, rentsList }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const [pageRent, setPageRent] = useState<number>(0);
  const [limitRent, setLimitRent] = useState<number>(10);


  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };
  const handlePageChangeRent = (_event: any, newPage: number): void => {
    setPageRent(newPage);
  };
  const handleLimitChangeRent = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimitRent(parseInt(event.target.value));
  };

  const paginatedMovements = applyPagination([...movementsList].reverse(), page, limit);
  const paginatedRents = applyPagination([...rentsList].reverse(), pageRent, limitRent);
  return (
    <Grid container spacing={3}>
      <Grid item lg={12} md={12} xs={12}>
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
    </Grid>
    <Grid item xs={12} md={6}>
      <Card>
        <CardHeader
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          title="Rentas del cliente"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Inicio</TableCell>
                <TableCell align="center">Fin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRents.map((rent) => {
                return (
                  <TableRow key={rent?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {rent?.machine?.machineNum}
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
                            new Date(rent?.startDate),
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
                        {capitalizeFirstLetter(
                          formatTZDate(
                            new Date(rent?.endDate),
                            "MMM DD YYYY HH:mm:mm"
                          )
                        )}
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
            count={rentsList.length}
            onPageChange={handlePageChangeRent}
            onRowsPerPageChange={handleLimitChangeRent}
            page={pageRent}
            rowsPerPage={limitRent}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
    </Grid>
    </Grid>
  );
};

HistoryTab.propTypes = {
  movementsList: PropTypes.array.isRequired,
  rentsList: PropTypes.array.isRequired,
};

HistoryTab.defaultProps = {
  movementsList: [],
  rentsList: [],
};

export default HistoryTab;
