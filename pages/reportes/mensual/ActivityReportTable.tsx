import * as React from "react";
import PropTypes from "prop-types";
import {
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
} from "@mui/material";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { capitalizeFirstLetter } from "lib/client/utils";

interface ActivityReportTableProps {
  colorStyle?: any;
  data: any;
}
const cellStyle = { border: "2px solid #374246", fontWeight: "bold" };
const ActivityReportTable: React.FC<ActivityReportTableProps> = ({
  colorStyle,
  data,
}) => {
  return (
    <div>
      <TableContainer>
        <Table size="small" style={{ tableLayout: "fixed" }}>
          <TableBody>
            <TableRow>
              <TableCell
                align="center"
                width={"11%"}
                style={{ border: "none" }}
              ></TableCell>
              <TableCell
                align="center"
                width={"9%"}
                style={{ border: "none" }}
              ></TableCell>
              <TableCell
                align="center"
                width={"16%"}
                style={colorStyle?.deliveryStyle}
                colSpan={2}
              >
                Entregas
              </TableCell>
              <TableCell
                align="center"
                width={"16%"}
                style={colorStyle?.changeStyle}
                colSpan={2}
              >
                Cambios
              </TableCell>
              <TableCell
                align="center"
                width={"16%"}
                style={colorStyle?.pickupStyle}
                colSpan={2}
              >
                Recolecciones
              </TableCell>
              <TableCell
                align="center"
                width={"16%"}
                style={colorStyle?.customerStyle.header}
                colSpan={3}
              >
                Clientes Nuevos
              </TableCell>
              <TableCell
                align="center"
                width={"10%"}
                style={colorStyle?.paymentStyle}
                colSpan={1}
              >
                Pagos
              </TableCell>
              <TableCell
                align="center"
                width={"8%"}
                style={colorStyle?.bonusStyle}
                colSpan={1}
              >
                Bon.
              </TableCell>
              <TableCell
                align="center"
                width={"8%"}
                style={colorStyle?.currentRentsStyle}
                colSpan={1}
              >
                COL.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" style={cellStyle}>
                Fecha
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Día
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Enviadas
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Realizadas
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Enviadas
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Realizadas
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Enviadas
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Realizadas
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.facebook}
              >
                F
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.ads}
              >
                P
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.referred}
              >
                R
              </TableCell>
              <TableCell align="center" style={cellStyle}>
                Realizados
              </TableCell>
              <TableCell align="center" style={cellStyle}/>
              <TableCell align="center" style={cellStyle}/>
            </TableRow>
            {data?.deliveries?.days?.map((day, i) => (
              <TableRow
                key={`activity-${format(new Date(day?.date), "dd/MM/yyyy", {
                  locale: es,
                })}`}
              >
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {format(new Date(day?.date), "dd/MM/yyyy", { locale: es })}
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
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.deliveries?.days[i].sent}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.deliveries?.days[i].done}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.changes.days[i].sent}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.changes.days[i].done}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.pickups.days[i].sent}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.pickups.days[i].done}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.customers.days[i].howFound.facebook}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.customers.days[i].howFound.ads}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.customers.days[i].howFound.referred}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.payments.days[i].done}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.payments.days[i].done}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {data?.currentRents.days[i].current || "N/A"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell align="center" style={{ border: "none" }}></TableCell>
              <TableCell align="center" style={cellStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  TOTAL
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.deliveryStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.deliveries?.totalData.sent}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.deliveryStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.deliveries?.totalData.done}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.changeStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.changes.totalData.sent}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.changeStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.changes.totalData.done}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.pickupStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.pickups.totalData.sent}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.pickupStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.pickups.totalData.done}
                </Typography>
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.facebook}
              >
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.customers.totalData.howFound.facebook}
                </Typography>
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.ads}
              >
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.customers.totalData.howFound.ads}
                </Typography>
              </TableCell>
              <TableCell
                align="center"
                style={colorStyle?.customerStyle.howFound.referred}
              >
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.customers.totalData.howFound.referred}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.paymentStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.payments.totalData.done}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.bonusStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.bonuses.totalData.done}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle?.currentRentsStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {data?.currentRents?.average ? parseInt(data?.currentRents?.average): "N/A"}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}></Box>
    </div>
  );
};
ActivityReportTable.propTypes = {
  colorStyle: PropTypes.object.isRequired,
  data: PropTypes.any.isRequired,
};
export default ActivityReportTable;
