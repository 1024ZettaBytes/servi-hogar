import * as React from "react";
import PropTypes from "prop-types";
import {
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
} from "@mui/material";
import { format } from "date-fns";
import es from "date-fns/locale/es";

interface ActivityReportTableProps {
  header: string;
  colorStyle: object;
  list: any[];
  totalData: any;
}
const cellStyle = { border: "2px solid #374246" };
const ActivityReportTable: React.FC<ActivityReportTableProps> = ({
  header,
  colorStyle,
  list,
  totalData,
}) => {
  return (
    <div>
      <Divider />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" style={colorStyle} colSpan={4}>
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
              <TableCell align="center" style={colorStyle}>
                Enviadas
              </TableCell>
              <TableCell align="center" style={colorStyle}>
                Realizadas
              </TableCell>
            </TableRow>
            {list?.map((day) => (
              <TableRow key={`${header}-${day?.weekDay}`}>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {format(new Date(day?.date),"dd/MM/yyyy", { locale: es})}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {day?.weekDay}
                  </Typography>
                </TableCell>
                <TableCell align="center" style={cellStyle}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    gutterBottom
                    noWrap
                  >
                    {day?.sent}
                  </Typography>
                </TableCell>
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
              </TableRow>
            ))}

            <TableRow>
              <TableCell align="center" style={{ border: "none" }}></TableCell>
              <TableCell align="center" style={colorStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  TOTAL
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {totalData?.sent}
                </Typography>
              </TableCell>
              <TableCell align="center" style={colorStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  {totalData?.done}
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
  header: PropTypes.string.isRequired,
  colorStyle: PropTypes.object.isRequired,
  list: PropTypes.array.isRequired,
  totalData: PropTypes.any.isRequired,
};
export default ActivityReportTable;
