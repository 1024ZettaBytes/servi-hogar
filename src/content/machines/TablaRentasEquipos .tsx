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

import { formatTZDate } from "lib/client/utils";

interface TablaRentasEquipoProps {
  className?: string;
  rents: any[];
}

const applyPagination = (
  movements: any[],
  page: number,
  limit: number
): any[] => {
  return movements.slice(page * limit, page * limit + limit);
};

const TablaRentasEquipo: FC<TablaRentasEquipoProps> = ({
  rents,
}) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedRents = applyPagination([...rents].reverse(), page, limit);

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
          title=""
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Inicio</TableCell>
                <TableCell align="center">Fin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRents.map((rent) => {
                return (
                  <TableRow hover key={rent?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {rent?.customer?.name || "N/A"}
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
                        {formatTZDate(new Date(rent?.startDate), "DD/MMMM/YYYY")}
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
                        {formatTZDate(new Date(rent?.endDate), "DD/MMMM/YYYY")}
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
            count={paginatedRents.length}
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

TablaRentasEquipo.propTypes = {
  rents: PropTypes.array.isRequired,
};

TablaRentasEquipo.defaultProps = {
  rents: [],
};

export default TablaRentasEquipo;
