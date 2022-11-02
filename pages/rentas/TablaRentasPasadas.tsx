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
import { capitalizeFirstLetter } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import SearchIcon from "@mui/icons-material/Search";
import Label from "@/components/Label";



interface TablaRentasPasadasProps {
  className?: string;
  rentList: any[];
}



const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};

const applyFilters = (rentList: any[], filter: string): any[] => {
  return rentList.filter((rent) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(rent).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "num": {
            const matchNumber =
              compareStringsForFilter(filter, value + "");
            return matchNumber;
          }
          case "status":{
            const matchText =
              value["id"] && compareStringsForFilter(filter, statusMap[value["id"]].text);
            return matchText;
          }
          case "customer": {
            const matchText =
              value["name"] && compareStringsForFilter(filter, value["name"]);
            return matchText;
          }
          case "machine": {
            const matchText =
              value["machineNum"] && compareStringsForFilter(filter, value["machineNum"]);
            return matchText;
          }
          case "startDate": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(rent?.startDate), "LLL dd yyyy", {
                  locale: es,
                })
              );
            return matchFormatedDate;
          }
          case "endDate": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(rent?.endDate), "LLL dd yyyy", {
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
  rentList: any[],
  page: number,
  limit: number
): any[] => {
  return rentList.slice(page * limit, page * limit + limit);
};
const statusMap = {
  PENDIENTE: {
    text: "Pendiente de entrega",
    color: "warning",
  },
  ENTREGA: {
    text: "En proceso de entrega",
    color: "warning",
  },
  RENTADO: {
    text: "Rentado",
    color: "success",
  },
  EN_CAMBIO: {
    text: "Cambio solicitado",
    color: "warning",
  },
  EN_RECOLECCION: {
    text: "En proceso de recolección",
    color: "error",
  },
  FINALIZADA: {
    text: "Renta finalizada",
    color: "success",
  },
  CANCELADA: {
    text: "Cancelada (no entregada)",
    color: "error",
  },
};
const getStatusLabel = (deliverStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[deliverStatus];

  return <Label color={color}>{text}</Label>;
};
const TablaRentasPasadas: FC<TablaRentasPasadasProps> = ({
  rentList,
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



  const filteredRents = applyFilters(rentList, filter);
  const paginatedRents = applyPagination(filteredRents, page, limit);

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
          title="Rentas pasadas"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"># de renta</TableCell>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Inicio</TableCell>
                <TableCell align="center">Vencimiento</TableCell>
                <TableCell align="center">Semanas</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center"></TableCell>
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
                        {rent?.num}
                      </Typography>
                    </TableCell>
                    {/*<TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {delivery?.takenBy?.name}
                    </Typography>
              </TableCell>*/}
                    <TableCell align="center">
                      {rent?.machine?.machineNum}
                    </TableCell>
                    <TableCell align="center">
                      {rent?.customer?.name}
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
                          format(new Date(rent?.startDate), "LLL dd yyyy", {
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
                        {capitalizeFirstLetter(
                          format(new Date(rent?.endDate), "LLL dd yyyy", {
                            locale: es,
                          })
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                      {rent?.totalWeeks}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(rent?.status.id)}
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
            count={filteredRents.length}
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

TablaRentasPasadas.propTypes = {
  rentList: PropTypes.array.isRequired,
};

TablaRentasPasadas.defaultProps = {
  rentList: [],
};

export default TablaRentasPasadas;
