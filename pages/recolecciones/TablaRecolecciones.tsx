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
  IconButton,
  useTheme,
} from "@mui/material";
import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import Label from "@/components/Label";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import ImagesModal from "@/components/ImagesModal";

interface TablaRecoleccionesProps {
  userRole: string;
  className?: string;
  pickupsList: any[];
}
const statusMap = {
  CANCELADA: {
    text: "Cancelada",
    color: "error",
  },
  RECOLECTADA: {
    text: "Recolectada",
    color: "success",
  },
};
const getStatusLabel = (pickupStatus: string): JSX.Element => {
  const { text, color }: any = statusMap[pickupStatus];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (pickupsList: any[], filter: string): any[] => {
  return pickupsList.filter((pickup) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(pickup).filter((keyValue) => {
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
              const matchMachineNum =
              value["machine"].machineNum &&
              compareStringsForFilter(
                filter,
                parseInt(value["machine"].machineNum) < 1000
                  ? ("00" + value["machine"].machineNum).slice(-3)
                  : value["machine"].machineNum
              );
            return matchNumber || matchCustomerName || matchMachineNum;
          }
          case "status": {
            const matchText =
              statusMap["" + value] &&
              statusMap["" + value].text &&
              compareStringsForFilter(filter, statusMap["" + value].text);
            return matchText;
          }
          case "date": {
            const matchFormatedDate =
              value &&
              compareStringsForFilter(
                filter,
                format(new Date(pickup?.date), "LLL dd yyyy", {
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
                format(new Date(pickup?.finishedAt), "LLL dd yyyy", {
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
  pickupsList: any[],
  page: number,
  limit: number
): any[] => {
  return pickupsList.slice(page * limit, page * limit + limit);
};

const TablaRecolecciones: FC<TablaRecoleccionesProps> = ({ pickupsList }) => {
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };

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

  const filteredPickups = applyFilters(pickupsList, filter);
  const paginatedPickups = applyPagination(filteredPickups, page, limit);
  const theme = useTheme();

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
                <TableCell align="center">Solicitada</TableCell>
                <TableCell align="center">Recolectada</TableCell>
                <TableCell align="center">Resultado</TableCell>
                <TableCell align="center"># Equipo</TableCell>
                <TableCell align="center">Fotos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPickups.map((pickup) => {
                return (
                  <TableRow hover key={pickup?._id}>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {pickup?.rent?.num}
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
                        {pickup?.totalNumber}
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
                        {pickup?.dayNumber}
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
                        {pickup?.rent?.customer?.name}
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
                          formatTZDate(new Date(pickup?.date), "MMM DD YYYY")
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
                        {pickup?.finishedAt
                          ? capitalizeFirstLetter(
                            formatTZDate(new Date(pickup?.finishedAt), "MMM DD YYYY")
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
                      {getStatusLabel(pickup?.status)}
                      {pickup?.status === "CANCELADA" && (
                        <Tooltip
                          title={pickup?.cancellationReason || "SIN RAZÓN"}
                          arrow
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {pickup?.rent?.machine?.machineNum}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {pickup.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              setSelectedImages(pickup.imagesUrl);
                              setOpenImages(true);
                            }}
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
                      ) : (
                        "N/A"
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
            count={filteredPickups.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25, 30]}
          />
        </Box>
      </Card>
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title={"Fotos de la recolección"}
          text=""
          onClose={handleOnCloseImages}
        />
      )}
    </>
  );
};

TablaRecolecciones.propTypes = {
  userRole: PropTypes.string.isRequired,
  pickupsList: PropTypes.array.isRequired,
};

TablaRecolecciones.defaultProps = {
  userRole: "",
  pickupsList: [],
};

export default TablaRecolecciones;
