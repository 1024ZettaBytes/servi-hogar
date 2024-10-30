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
  Tooltip,
  IconButton,
  useTheme,
  Alert,
  Skeleton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { capitalizeFirstLetter, formatTZDate } from "lib/client/utils";
import Label from "@/components/Label";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import ImagesModal from "@/components/ImagesModal";
import { getFetcher, useGetDeliveries } from "pages/api/useRequest";

interface TablaEntregasProps {
  userRole: string;
  className?: string;
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


const TablaEntregas: FC<TablaEntregasProps> = ({ }) => {
  
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const { deliveriesList: data, deliveriesError } = useGetDeliveries(getFetcher, limit, page+1);
  const generalError = deliveriesError;
  const completeData = data?.list;
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();
  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };


  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const theme = useTheme();

  return (
    generalError ? (
      <Alert severity="error">
        {deliveriesError?.message}
      </Alert>
    ) : 
    <>
      <Card>
        <CardHeader
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          title="Entregas pasadas"
        />

        <Divider />
        {!completeData ? (
      <Skeleton
        variant="rectangular"
        width={"100%"}
        height={500}
        animation="wave"
      />
    ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">#</TableCell>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Fecha Programada</TableCell>
                <TableCell align="center">Entregada</TableCell>
                <TableCell align="center">Fotos</TableCell>
                <TableCell align="center">Resultado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.list?.map((delivery) => {
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
                          formatTZDate(new Date(delivery?.date), "MMM DD YYYY")
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
                            formatTZDate(new Date(delivery?.finishedAt), "MMM DD YYYY")
                            )
                          : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {delivery?.rent?.imagesUrl ? (
                        <Tooltip title="Ver fotos" arrow>
                          <IconButton
                            onClick={() => {
                              setSelectedImages(delivery?.rent?.imagesUrl);
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
        </TableContainer>)}
        <Box p={2}>
          <TablePagination
            disabled={!completeData}
            component="div"
            count={data?.total || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[10, 50, 100]}
          />
        </Box>
      </Card>
      {openImages && selectedImages && (
        <ImagesModal
          open={openImages}
          imagesObj={selectedImages}
          title={"Fotos de la entrega"}
          text=""
          onClose={handleOnCloseImages}
        />
      )}
    </>
  );
};

TablaEntregas.propTypes = {
  userRole: PropTypes.string.isRequired,
};

TablaEntregas.defaultProps = {
  userRole: "",
};

export default TablaEntregas;
