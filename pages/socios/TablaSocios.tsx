import { FC, ChangeEvent, useState } from "react";
import * as str from "string";
import PropTypes from "prop-types";
import {
  Tooltip,
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
  IconButton,
  useTheme,
} from "@mui/material";
import NextLink from "next/link";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SearchIcon from "@mui/icons-material/Search";
import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
interface TablaSociosProps {
  className?: string;
  partnersList: any[];
}

const getMachinesList = (machineArray: any) => {
  let lst = "";
  machineArray?.forEach((machine) => {
    lst += machine.machineNum + ", ";
  });
  return lst.substring(0, lst.length - 2);
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (partnersList: any[], filter: string): any[] => {
  return partnersList.filter((payment) => {
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
          case "user": {
            return (
              payment.user && compareStringsForFilter(filter, payment.user.name)
            );
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  partnersList: any[],
  page: number,
  limit: number
): any[] => {
  return partnersList.slice(page * limit, page * limit + limit);
};

const TablaSocios: FC<TablaSociosProps> = ({ partnersList }) => {
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

  const filteredMachines = applyFilters(partnersList, filter);
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
          title="Todos los socios"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Nombre</TableCell>
                <TableCell align="center">Cant. Equipos</TableCell>
                <TableCell align="center">Antiguedad</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.map((partner) => {
                return (
                  <TableRow key={partner?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {partner?.user?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={getMachinesList(partner?.machines)} arrow>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {partner?.machines?.length}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {capitalizeFirstLetter(
                          formatTZDate(partner?.createdAt, "MMMM DD YYYY")
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <NextLink href={`/socios/${partner?.user?._id}`}>
                        <Tooltip title="Detalle" arrow>
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
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </NextLink>
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

TablaSocios.propTypes = {
  partnersList: PropTypes.array.isRequired,
};

TablaSocios.defaultProps = {
  partnersList: [],
};

export default TablaSocios;
