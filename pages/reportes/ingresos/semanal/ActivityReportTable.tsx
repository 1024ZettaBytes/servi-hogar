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

import numeral from "numeral";

interface ActivityReportTableProps {
  colorStyle: object;
  list: any[];
  TOTAL: number;
}
const cellStyle = { border: "2px solid #374246" };
const ActivityReportTable: React.FC<ActivityReportTableProps> = ({
  colorStyle,
  list,
  TOTAL,
}) => {
  return (
    <div>
      <Divider />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                style={{ ...colorStyle, background: "#EE5656" }}
              >
                Fecha
              </TableCell>
              {list?.map((group) => (
                <TableCell
                  key={group.account}
                  align="center"
                  style={colorStyle}
                >
                  {group.account}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {list &&
              list[0] &&
              list[0].days.map((day, dIndex) => (
                <TableRow key={day.date}>
                  <TableCell align="center" style={cellStyle}>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {day?.date}
                    </Typography>
                  </TableCell>
                  {list.map((group, gIndex) => (
                    <TableCell
                      key={day.date + group.account}
                      align="center"
                      style={cellStyle}
                    >
                      <Typography
                        variant="body1"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {numeral(list[gIndex].days[dIndex].done).format(
                          `$${list[gIndex].days[dIndex].done}0,0.00`
                        )}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            <TableRow>
              <TableCell align="center" style={colorStyle}>
                <Typography variant="h5" gutterBottom noWrap>
                  TOTAL
                </Typography>
              </TableCell>
              {list?.map((group) => (
                <TableCell
                  key={group.account}
                  align="center"
                  style={{ ...colorStyle, background: "#DAF7A6" }}
                >
                  <Typography variant="h5" gutterBottom noWrap>
                    {numeral(group.total).format(`$${group.total}0,0.00`)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}></Box>
      <Typography
        width="100%"
        align="center"
        padding="20px"
        variant="h2"
        style={{ color: "black" }}
      >
        TOTAL: {numeral(TOTAL).format(`$${TOTAL}0,0.00`)}
      </Typography>
    </div>
  );
};
ActivityReportTable.propTypes = {
  colorStyle: PropTypes.object.isRequired,
  list: PropTypes.array.isRequired,
  TOTAL: PropTypes.number.isRequired,
};
export default ActivityReportTable;
