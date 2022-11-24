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
  Tooltip
} from "@mui/material";

import { capitalizeFirstLetter } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import Label from "@/components/Label";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
interface TablaCambiosProps {
  userRole: string;
  className?: string;
  changesList: any[];
}
const statusMap = {
  CANCELADO: {
    text: "Cancelado",
    color: "error",
  },
  FINALIZADO: {
    text: "Realizado",
    color: "success",
  },
};
const getStatusLabel = (changeStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[changeStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (changesList: any[], filter: string): any[] => {
  return changesList.filter((change) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(change).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "rent": {
            const matchCustomerName = value["customer"] && value["customer"].name && compareStringsForFilter(filter, value["customer"].name);
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
                format(new Date(change?.createdAt), "LLL dd yyyy", {
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
                format(new Date(change?.finishedAt), "LLL dd yyyy", {
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
  changesList: any[],
  page: number,
  limit: number
): any[] => {
  return changesList.slice(page * limit, page * limit + limit);
};

const TablaCambios: FC<TablaCambiosProps> = ({
  changesList,
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
  

  const filteredChanges = applyFilters(changesList, filter);
  const paginatedChanges = applyPagination(filteredChanges, page, limit);

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
                <TableCell align="center">Renta</TableCell>
                <TableCell align="center">#</TableCell>
                <TableCell align="center"># del día</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Solicitado</TableCell>
                <TableCell align="center">Realizado</TableCell>
                <TableCell align="center">Equipo recogido</TableCell>
                <TableCell align="center">Equipo dejado</TableCell>
                <TableCell align="center">Resultado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChanges.map((change) => {
                return (
                  <TableRow hover key={change?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {change?.rent?.num}
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
                        {change?.totalNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        gutterBottom
                        noWrap
                      >
                        {change?.dayNumber}
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
                        {change?.rent?.customer?.name}
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
                          format(new Date(change?.createdAt), "LLL dd yyyy", {
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
                        {change?.finishedAt ? capitalizeFirstLetter(
                          format(new Date(change?.finishedAt), "LLL dd yyyy", {
                            locale: es,
                          })
                        ) : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {change.pickedMachine ? change.pickedMachine.machineNum : "N/A"}
                    </TableCell>
                    <TableCell align="center">
                      {change.leftMachine ? change.leftMachine.machineNum : "N/A"}
                    </TableCell>
                    <TableCell align="center" sx={{display:"flex", alignItems: "center", justifyContent: "center"}}>
                    {getStatusLabel(change?.status)}
                      {change?.status === "CANCELADO" && 
                        <Tooltip title={change?.cancellationReason || "SIN RAZÓN"} arrow>
                          <InfoOutlinedIcon fontSize="small" />
                        </Tooltip>
                      }
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
            count={filteredChanges.length}
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

TablaCambios.propTypes = {
  userRole: PropTypes.string.isRequired,
  changesList: PropTypes.array.isRequired,
};

TablaCambios.defaultProps = {
  userRole: "",
  changesList: [],
};

export default TablaCambios;
