import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { capitalizeFirstLetter } from 'lib/client/utils';

interface RegistersReportTableProps {
  header: string;
  colorStyle: object;
  list: any[];
  days?: { payments?: any[]; externalPayments?: any[]; salesPayments?: any[] };
  totalData: any;
  type?: string;
}
const cellStyle = { border: '2px solid #374246' };
const RegistersReportTable: React.FC<RegistersReportTableProps> = ({
  header,
  days,
  colorStyle,
  list,
  totalData,
  type
}) => {
  const isBonus = type === 'BONUS';
  const isPayment = type === 'PAYMENT';
  return (
    <div>
      <Divider />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                style={colorStyle}
                colSpan={isPayment ? 5: (isBonus ? 6 : 3)}
              >
                {header}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center" style={colorStyle}>
                Fecha
              </TableCell>
              <TableCell align="center" style={colorStyle}>
                Día
              </TableCell>
              {isPayment ? (
                <>
                  <TableCell align="center" style={colorStyle}>
                    Rentas
                  </TableCell>
                  <TableCell align="center" style={colorStyle}>
                    Rep. Externas
                  </TableCell>
                  <TableCell align="center" style={colorStyle}>
                    Ventas
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell align="center" style={colorStyle}>
                    Registro
                  </TableCell>
                  {isBonus && (
                    <>
                      <TableCell align="center" style={colorStyle}>
                        Cliente
                      </TableCell>
                      <TableCell align="center" style={colorStyle}>
                        Descripción
                      </TableCell>
                      <TableCell align="center" style={colorStyle}>
                        Usuario
                      </TableCell>
                    </>
                  )}
                </>
              )}
            </TableRow>
            {list?.map((day, index) => (
              <TableRow key={`${header}-${day?.weekDay}`}>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {format(new Date(day?.date), 'dd/MM/yyyy', { locale: es })}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {capitalizeFirstLetter(day?.weekDay)}
                  </Typography>
                </TableCell>
                {isPayment ? (
                  <>
                    <TableCell align="center" style={cellStyle}>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {days.payments[index].done}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" style={cellStyle}>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {days.externalPayments[index].done}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" style={cellStyle}>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {days.salesPayments[index].done}
                      </Typography>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell align="center" style={cellStyle}>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {day?.done}
                      </Typography>
                    </TableCell>
                    {isBonus && (
                      <>
                        <TableCell align="center" style={cellStyle}>
                          {day?.list?.map((reg, index) => (
                            <TableRow key={`${header}-customer-${index}`}>
                              <TableCell align="center" style={cellStyle}>
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                  noWrap
                                >
                                  {reg?.customer?.name}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableCell>
                        <TableCell align="center" style={cellStyle}>
                          {day?.list?.map((reg, index) => (
                            <TableRow key={`${header}-desc-${index}`}>
                              <TableCell align="center" style={cellStyle}>
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                  noWrap
                                >
                                  {reg?.description}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableCell>
                        <TableCell align="center" style={cellStyle}>
                          {day?.list?.map((reg, index) => (
                            <TableRow key={`${header}-user-${index}`}>
                              <TableCell align="center" style={cellStyle}>
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                  noWrap
                                >
                                  {reg?.createdBy?.name}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableCell>
                      </>
                    )}
                  </>
                )}
              </TableRow>
            ))}

            <TableRow>
              <TableCell align="center" style={{ border: 'none' }}></TableCell>
              <TableCell align="center" style={colorStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  TOTAL
                </Typography>
              </TableCell>
              {isPayment ? (
                <>
                  <TableCell align="center" style={colorStyle}>
                    <Typography variant="h5" gutterBottom noWrap>
                      {totalData?.payments.done}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" style={colorStyle}>
                    <Typography variant="h5" gutterBottom noWrap>
                      {totalData?.externalPayments.done}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" style={colorStyle}>
                    <Typography variant="h5" gutterBottom noWrap>
                      {totalData?.salesPayments.done}
                    </Typography>
                  </TableCell>
                </>
              ) : (
                <TableCell align="center" style={colorStyle}>
                  <Typography variant="h5" gutterBottom noWrap>
                    {totalData?.done}
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}></Box>
    </div>
  );
};
RegistersReportTable.propTypes = {
  header: PropTypes.string.isRequired,
  colorStyle: PropTypes.object.isRequired,
  list: PropTypes.array.isRequired,
  totalData: PropTypes.any.isRequired
};
export default RegistersReportTable;
