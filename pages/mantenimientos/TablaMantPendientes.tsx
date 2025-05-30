import { FC, ChangeEvent, useState } from 'react';
import PropTypes from 'prop-types';
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
  useTheme,
  CardHeader,
  Chip,
  Typography
} from '@mui/material';
import { completeMantainance } from '../../lib/client/mantainanacesFetch';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import { useSnackbar } from 'notistack';
import CheckIcon from '@mui/icons-material/Check';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import GenericModal from '../../src/components/GenericModal';


export const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDIENTE':
      return (
        <Chip
          icon={<PendingActionsIcon fontSize="small" />}
          label="Pendiente"
          color="warning"
          size="small"
        ></Chip>
      );
    case 'CANCELADO':
      return (
        <Chip
          icon={<DoNotDisturbOnOutlinedIcon fontSize="small" />}
          label="Cancelado"
          color="error"
          size="small"
        ></Chip>
      );
    case 'ALERTA':
      return (
        <Chip
          icon={<NotificationImportantIcon fontSize="small" />}
          label="LLAMAR A ADMINISTRADOR"
          color="error"
          size="small"
        ></Chip>
      );
  }
};

interface TablaMantPendientesProps {
  className?: string;
  listData: any[];
}

const applyPagination = (
  rentList: any[],
  page: number,
  limit: number
): any[] => {
  return rentList.slice(page * limit, page * limit + limit);
};

const TablaMantPendientes: FC<TablaMantPendientesProps> = ({ listData }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [completeModalIsOpen, setCompleteModalIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const handleCloseModal = (wasSuccess, message = null) => {
    setCompleteModalIsOpen(!wasSuccess);

    if (message) {
      enqueueSnackbar(message, {
        variant: wasSuccess ? 'success' : 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 1500
      });
    }
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleCompleteClick = (mantId: string, machineNum: string) => {
    setSelectedId(mantId);
    setSelectedMachine(machineNum);
    setCompleteModalIsOpen(true);
  };

  const submitMarkComplete = async (selectedId: any) => {
    setIsCompleting(true);
    const result = await completeMantainance(selectedId);
    setIsCompleting(false);
    handleCloseModal(!result.error, result.msg);
  };

  const paginatedMants = applyPagination(listData, page, limit);

  const theme = useTheme();
  const canComplete = !(listData.some((m) => m.daysSinceCreate >= 3));
  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
          title="Pendientes"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Días Transcurridos</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMants.map((mant) => {
                return (
                  <TableRow
                    key={mant?._id}
                    sx={
                      !canComplete
                        ? { backgroundColor: theme.colors.error.lighter }
                        : {}
                    }
                  >
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {mant?.machine?.machineNum}
                      </Typography>{' '}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(canComplete ? mant?.status : 'ALERTA')}
                    </TableCell>
                    <TableCell align="center">
                      {mant?.daysSinceCreate}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Marcar Finalizado" arrow>
                        <IconButton
                          disabled={!canComplete}
                          onClick={() =>
                            handleCompleteClick(
                              mant?._id,
                              mant?.machine?.machineNum
                            )
                          }
                          sx={{
                            '&:hover': {
                              background: theme.colors.primary.lighter
                            },
                            color: theme.colors.success.light
                          }}
                          color="inherit"
                          size="small"
                        >
                          <CheckIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>
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
            count={listData.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={
              listData.length > 100 ? [30, 100, listData.length] : [30, 100]
            }
          />
        </Box>
      </Card>
      {completeModalIsOpen && (
        <GenericModal
          open={completeModalIsOpen}
          title="Finalizar Mantenimiento"
          text={`Se marcará el mantenimiento del equipo ${selectedMachine} como finalizado.`}
          isLoading={isCompleting}
          isWarning={false}
          requiredReason={false}
          onAccept={() => {
            submitMarkComplete(selectedId);
          }}
          onCancel={() => setCompleteModalIsOpen(false)}
        />
      )}
    </>
  );
};

TablaMantPendientes.propTypes = {
  listData: PropTypes.array.isRequired
};

TablaMantPendientes.defaultProps = {
  listData: []
};

export default TablaMantPendientes;
