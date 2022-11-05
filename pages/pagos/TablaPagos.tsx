import { FC, ChangeEvent, useState } from "react";
import numeral from "numeral";
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

import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import SearchIcon from "@mui/icons-material/Search";
import { capitalizeFirstLetter } from "lib/client/utils";
import {PAYMENT_METHODS} from "../../lib/consts/OBJ_CONTS"
import { format } from "date-fns";
import es from "date-fns/locale/es";
interface TablaPagosProps {
  className?: string;
  paymentsList: any[];
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (paymentsList: any[], filter: string): any[] => {
  return paymentsList.filter((payment) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(payment).filter((keyValue) => {
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
          case "paymentNum":
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
  paymentsList: any[],
  page: number,
  limit: number
): any[] => {
  return paymentsList.slice(page * limit, page * limit + limit);
};

const TablaPagos: FC<TablaPagosProps> = ({ paymentsList }) => {
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

  const filteredMachines = applyFilters(paymentsList, filter);
  const paginatedMachines = applyPagination(filteredMachines, page, limit);
  const theme = useTheme();
  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                id="input-search-payment"
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
          title=""
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"># pago</TableCell>
                <TableCell align="center">Fecha</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Concepto</TableCell>
                <TableCell align="center">Método</TableCell>
                <TableCell align="center">Folio</TableCell>
                <TableCell align="center">Comprobante</TableCell>
                <TableCell align="center">Importe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.map((payment) => {
                return (
                  <TableRow key={payment?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payment.number}
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
                          format(
                            new Date(payment?.date),
                            "MMM dd yyyy HH:mm:mm",
                            { locale: es }
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
                        {payment?.customer?.name}
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
                        {payment?.description}
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
                        {PAYMENT_METHODS[payment?.method]}
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
                        {payment?.folio}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                    {payment.voucherUrl ? <a href={payment.voucherUrl} target="_blank" rel="noopener noreferrer">
                        <Tooltip title="Ver comprobante" arrow>
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
                            <ImageSearchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </a>: null}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="green" noWrap>
                        {numeral(payment?.amount).format(
                          `$${payment.amount}0,0.00`
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
            count={filteredMachines.length}
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

TablaPagos.propTypes = {
  paymentsList: PropTypes.array.isRequired,
};

TablaPagos.defaultProps = {
  paymentsList: [],
};

export default TablaPagos;
