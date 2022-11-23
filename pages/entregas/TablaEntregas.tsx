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
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { capitalizeFirstLetter } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import Label from "@/components/Label";
import SearchIcon from "@mui/icons-material/Search";

interface TablaEntregasProps {
  userRole: string;
  className?: string;
  deliveriesList: any[];
}
const statusMap = {
  CANCELADA: {
    text: "Cancelada",
    color: "error",
  },
  ENTREGADA: {
    text: "Entregada",
    color: "success",
  },
};
const getStatusLabel = (deliverStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[deliverStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (deliveriesList: any[], filter: string): any[] => {
  return deliveriesList.filter((delivery) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(delivery).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "rent": {
            const matchCustomerName =
              value["customer"] &&
              value["customer"].name &&
              compareStringsForFilter(filter, value["customer"].name);
            const matchNumber =
              value["num"] && compareStringsForFilter(filter, value["num"]);
            return matchNumber || matchCustomerName;
          }
          case "status": {
            const matchText =
              statusMap["" + value] &&
              statusMap["" + value].text &&
              compareStringsForFilter(filter, statusMap["" + value].text);
            return matchText;
          }
          case "createdAt": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(delivery?.createdAt), "LLL dd yyyy", {
                  locale: es,
                })
              );
            return matchFormatedDate;
          }

          case "finishedAt": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(delivery?.finishedAt), "LLL dd yyyy", {
                  locale: es,
                })
              );
            return matchFormatedDate;
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  deliveriesList: any[],
  page: number,
  limit: number
): any[] => {
  return deliveriesList.slice(page * limit, page * limit + limit);
};

const TablaEntregas: FC<TablaEntregasProps> = ({ deliveriesList }) => {
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

  const filteredDeliveries = applyFilters(deliveriesList, filter);
  const paginatedDeliveries = applyPagination(filteredDeliveries, page, limit);

  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <TextField
                size="small"
                id="input-search-rent"
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
                <TableCell align="center">#</TableCell>
                <TableCell align="center"># del día</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Solicitada</TableCell>
                <TableCell align="center">Entregada</TableCell>
                <TableCell align="center">Resultado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDeliveries.map((delivery) => {
                return (
                  <TableRow hover key={delivery?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {delivery?.totalNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        gutterBottom
                        noWrap
                      >
                        {delivery?.dayNumber}
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
                        {delivery?.rent?.customer?.name}
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
                          format(new Date(delivery?.createdAt), "LLL dd yyyy", {
                            locale: es,
                          })
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
                        {delivery?.finishedAt
                          ? capitalizeFirstLetter(
                              format(
                                new Date(delivery?.finishedAt),
                                "LLL dd yyyy",
                                {
                                  locale: es,
                                }
                              )
                            )
                          : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getStatusLabel(delivery?.status)}
                      {delivery?.status === "CANCELADA" && (
                        <Tooltip
                          title={delivery?.cancellationReason || "SIN RAZÓN"}
                          arrow
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </Tooltip>
                      )}
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
            count={filteredDeliveries.length}
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

TablaEntregas.propTypes = {
  userRole: PropTypes.string.isRequired,
  deliveriesList: PropTypes.array.isRequired,
};

TablaEntregas.defaultProps = {
  userRole: "",
  deliveriesList: [],
};

export default TablaEntregas;
