import { FC, ChangeEvent, useState } from "react";
import numeral from "numeral";
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
  useTheme,
  CardHeader,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import SearchIcon from "@mui/icons-material/Search";
import { formatTZDate } from "lib/client/utils";
import { PAYOUT_KEYS } from "../../lib/consts/OBJ_CONTS";

import Label from "@/components/Label";
interface TablaMisPagosProps {
  className?: string;
  payoutsList: any[];
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (payoutsList: any[], filter: string): any[] => {
  return payoutsList.filter((payout) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(payout).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "createdAt":
          case "completedAt": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                formatTZDate(payout[key], "MMMM DD YYYY")
              );
            return matchFormatedDate;
          }
          case "partner": {
            const matchCustomerName =
              payout.partner &&
              compareStringsForFilter(filter, payout?.partner?.user?.name);
            return matchCustomerName;
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  payoutsList: any[],
  page: number,
  limit: number
): any[] => {
  return payoutsList.slice(page * limit, page * limit + limit);
};

const TablaMisPagos: FC<TablaMisPagosProps> = ({ payoutsList }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(100);
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
  const getDescription = (type: string) => {
    const map = {
      NEW: (
        <Label color="secondary">
          <HomeIcon fontSize="small" />
          <b>Inicio de renta (colocación)</b>
        </Label>
      ),
      EXTENDED: (
        <Label color="success">
          <PublishedWithChangesIcon fontSize="small" />
          <b>Extensión de renta</b>
        </Label>
      ),
    };
    return map[type];
  };
  const getStatus = (status: string) => {
    switch (status) {
      case PAYOUT_KEYS.PENDING:
        return (
          <b
            style={{
              color: theme.colors.error.light,
            }}
          >
            PENDIENTE
          </b>
        );
      case PAYOUT_KEYS.COMPLETED:
        return (
          <Label color="success">
            <b>PAGADO</b>
          </Label>
        );
      case PAYOUT_KEYS.NA:
        return (
          <Label color="secondary">
            <b>N/A</b>
          </Label>
        );
    }
  };
  const filteredMachines = applyFilters(payoutsList, filter);
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
                id="input-search-payout"
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
          title="Pagos generados"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Generado</TableCell>
                <TableCell align="center">Socio</TableCell>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Concepto</TableCell>
                <TableCell align="center">Cobrado</TableCell>
                <TableCell align="center">Mantenimiento</TableCell>
                <TableCell align="center">Comisión</TableCell>
                <TableCell align="center">Por pagar</TableCell>
                <TableCell align="center">Pagado</TableCell>
                <TableCell align="center">Comprobante</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.map((payout) => {
                return (
                  <TableRow key={payout?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {formatTZDate(payout?.createdAt, "DD/MMMM/YYYY")}
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
                        {payout?.partner?.user?.name}
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
                        {payout?.machine?.machineNum}
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
                        {getDescription(payout?.type)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="gray" noWrap>
                        {numeral(payout?.incomeAmount).format(
                          `$${payout?.incomeAmount}0,0.00`
                        )}
                      </Typography>
                      {payout?.placement > 0 && (
                        <Typography variant="body2" color="red" noWrap>
                          {` - ${numeral(payout?.placement).format(
                            `$${payout?.placement}0,0.00`
                          )}`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="red" noWrap>
                        {"-" +
                          ` ${payout?.mantainancePercentage}% (${numeral(
                            payout?.mantainance
                          ).format("$0.00")})`}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="red" noWrap>
                        {"-" +
                          ` ${payout?.comisionPercentage}% (${numeral(
                            payout?.comision
                          ).format(`$0.00`)})`}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={payout?.toPay > 0 ? "green" : "gray"}
                        noWrap
                      >
                        {numeral(payout?.toPay).format("$0.00")}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {payout?.completedAt
                          ? formatTZDate(payout?.completedAt, "DD/MMMM/YYYY")
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {payout?.voucherUrl ? (
                        <a
                          href={payout.voucherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {getStatus(payout?.status)}
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
            rowsPerPageOptions={[10, 50, 100]}
          />
        </Box>
      </Card>
    </>
  );
};

TablaMisPagos.propTypes = {
  payoutsList: PropTypes.array.isRequired,
};

TablaMisPagos.defaultProps = {
  payoutsList: [],
};

export default TablaMisPagos;
