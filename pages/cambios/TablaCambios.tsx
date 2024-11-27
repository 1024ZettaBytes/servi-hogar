import { FC, useState } from 'react';
import PropTypes from 'prop-types';
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
  Skeleton,
  Alert,
  Grid
} from '@mui/material';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';

import { capitalizeFirstLetter, formatTZDate } from 'lib/client/utils';
import Label from '@/components/Label';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ImagesModal from '@/components/ImagesModal';
import { getFetcher, useGetChanges } from 'pages/api/useRequest';
interface TablaCambiosProps {
  userRole: string;
  className?: string;
}
const statusMap = {
  CANCELADO: {
    text: 'Cancelado',
    color: 'error'
  },
  FINALIZADO: {
    text: 'Realizado',
    color: 'success'
  }
};
const getStatusLabel = (
  changeStatus: string,
  wasFixed = false
): JSX.Element => {
  const { text, color }: any = statusMap[changeStatus];

  return <Label color={color}>{wasFixed ? 'Solucionado' : text}</Label>;
};


const TablaCambios: FC<TablaCambiosProps> = () => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);

  const { changes, changesError } = useGetChanges(
    getFetcher,
    limit,
    page +  1
  );

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value));
  };
  const [openImages, setOpenImages] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<null>();

  const handleOnCloseImages = () => {
    setOpenImages(false);
    setSelectedImages(null);
  };

  const theme = useTheme();

  return (
    <Grid item xs={12}>
      {changesError ? (
        <Alert severity="error">{changesError?.message}</Alert>
      ) : !changes ? (
        <Skeleton
          variant="rectangular"
          width={'100%'}
          height={500}
          animation="wave"
        />
      ) : (
        <Card>
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}
              title=""
            />

            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Renta</TableCell>
                    <TableCell align="center">Razón</TableCell>
                    <TableCell align="center">Cliente</TableCell>
                    <TableCell align="center">Solicitado</TableCell>
                    <TableCell align="center">Realizado</TableCell>
                    <TableCell align="center">Equipo cliente</TableCell>
                    <TableCell align="center">Equipo dejado</TableCell>
                    <TableCell align="center">Fotos</TableCell>
                    <TableCell align="center">Resultado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes?.list?.map((change) => {
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
                          <Tooltip title={change?.reason || 'SIN RAZÓN'} arrow>
                            <ReportProblemIcon fontSize="small" />
                          </Tooltip>
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
                              formatTZDate(
                                new Date(change?.date),
                                'MMM DD YYYY'
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
                            {change?.finishedAt
                              ? capitalizeFirstLetter(
                                  formatTZDate(
                                    new Date(change?.finishedAt),
                                    'MMM DD YYYY'
                                  )
                                )
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {change.pickedMachine
                            ? change.pickedMachine.machineNum
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {change?.wasFixed
                            ? 'Solucionado'
                            : change.leftMachine
                            ? change.leftMachine.machineNum
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {change.imagesUrl ? (
                            <Tooltip title="Ver fotos" arrow>
                              <IconButton
                                onClick={() => {
                                  setSelectedImages(change.imagesUrl);
                                  setOpenImages(true);
                                }}
                                sx={{
                                  '&:hover': {
                                    background: theme.colors.primary.lighter
                                  },
                                  color: theme.palette.primary.main
                                }}
                                color="inherit"
                                size="small"
                              >
                                <ImageSearchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getStatusLabel(change?.status, change?.wasFixed)}
                          {change?.status === 'CANCELADO' && (
                            <Tooltip
                              title={change?.cancellationReason || 'SIN RAZÓN'}
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
                count={changes.total}
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
              title={'Fotos del cambio'}
              text=""
              onClose={handleOnCloseImages}
            />
          )}
        </Card>
      )}
      ;
    </Grid>
  );
};

TablaCambios.propTypes = {
  userRole: PropTypes.string.isRequired
};

TablaCambios.defaultProps = {
  userRole: ''
};

export default TablaCambios;
