import { FC, ChangeEvent, useState } from "react";
import * as str from "string";
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
  TextField,
  InputAdornment,
} from "@mui/material";
import Label from "@/components/Label";
import SearchIcon from "@mui/icons-material/Search";
import numeral from "numeral";
import { format } from "date-fns";
import es from "date-fns/locale/es";

interface TablaHistorialEquiposProps {
  className?: string;
  movements: any[];
}

const getAmount = (amount: Number): JSX.Element => {
  const color = amount >= 0.0 ? "success" : "error";
  const sign = amount >= 0.0 ? "+$" : "-$";
  amount = amount < 0.0 ? -amount : amount;
  return (
    <Label color={color}>
      {sign + numeral(amount).format(`${amount}0,0.00`)}
    </Label>
  );
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (movements: any[], filter: string): any[] => {
  return movements.filter((movement) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(movement).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "description":
          case "amount": {
            return compareStringsForFilter(filter, value.toString());
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  movements: any[],
  page: number,
  limit: number
): any[] => {
  return movements.slice(page * limit, page * limit + limit);
};

const TablaHistorialEquipos: FC<TablaHistorialEquiposProps> = ({
  movements,
}) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
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

  const filteredMovements = applyFilters(movements, filter);
  const paginatedMovements = applyPagination(filteredMovements, page, limit);

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
                <TableCell align="center">Movimiento</TableCell>
                <TableCell align="center">Importe</TableCell>
                <TableCell align="center">Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovements.map((movement) => {
                return (
                  <TableRow hover key={movement?._id}>
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
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {getAmount(movement?.amount)}
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
                        {format(new Date(movement?.date), "dd/LLLL/yyyy", {
                          locale: es,
                        })}
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
            count={filteredMovements.length}
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

TablaHistorialEquipos.propTypes = {
  movements: PropTypes.array.isRequired,
};

TablaHistorialEquipos.defaultProps = {
  movements: [],
};

export default TablaHistorialEquipos;
