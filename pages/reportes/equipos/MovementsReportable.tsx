import * as React from "react";
import PropTypes from "prop-types";
import {
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from "@mui/material";

const cellsPerRow = 20;
interface MovementsReportTableProps {
  colorStyle?: any;
  data: any;
}
const MovementsReportTable: React.FC<MovementsReportTableProps> = ({
  colorStyle,
  data,
}) => {
  let rowsNumber = 0;
  let machinesList = [];
  if (data) {
    rowsNumber = parseInt(data.length / cellsPerRow + "");
    for (let i = 0; i <= rowsNumber; i++) {
      let row = [];
      for (
        let j = 0 + i * cellsPerRow;
        j < data.length && j < (i + 1) * cellsPerRow;
        j++
      ) {
        row.push(data[j]);
      }
      machinesList.push(row);
    }
  }
  return (
    <div>
      <TableContainer>
        <Table size="small" style={{ tableLayout: "fixed" }}>
          <TableBody>
            {machinesList.map((row, i) => {
              return (
                <TableRow key={i}>
                  {row.map((machine) => (
                    <TableCell
                      key={"machine-" + machine.machineNum}
                      align="center"
                      style={
                        colorStyle?.machineStyle[
                          machine.exists
                            ? machine.hasMovements
                              ? "hasMovements"
                              : "noMovements"
                            : "doesNotExists"
                        ]
                      }
                    >
                      {machine.machineNum}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}></Box>
    </div>
  );
};
MovementsReportTable.propTypes = {
  colorStyle: PropTypes.object.isRequired,
  data: PropTypes.any.isRequired,
};
export default MovementsReportTable;
