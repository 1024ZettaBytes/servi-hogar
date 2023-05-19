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
import MovementsSummary from "./MovementsSummary";

const cellsPerRow = 20;
interface MovementsReportTableProps {
  colorStyle?: any;
  data: any;
}
const MovementsReportTable: React.FC<MovementsReportTableProps> = ({
  colorStyle,
  data,
}) => {
  const getBackColor = (machine): string => {
    if (!machine.exists) return "doesNotExists";
    if (machine.onLittleWarehouse) return "onLittleWarehouse";
    if (machine.isLost) return "isLost";
    if (machine.hasMovements) return "hasMovements";
    return "noMovements";
    

  };
  let rowsNumber = 0;
  let machinesList = [];
  if (data?.list) {
    rowsNumber = parseInt(data.list.length / cellsPerRow + "");
    for (let i = 0; i <= rowsNumber; i++) {
      let row = [];
      for (
        let j = 0 + i * cellsPerRow;
        j < data.list.length && j < (i + 1) * cellsPerRow;
        j++
      ) {
        row.push(data.list[j]);
      }
      machinesList.push(row);
    }
  }
  return (
    <div>
      <MovementsSummary 
        withMovements={data.summary.withMovements}
        noMovements={data.summary.noMovements}
        lost={data.summary.lost}
        onLittleWarehouse={data.summary.onLittleWarehouse}
        total={data.summary.total}
        colorStyle={colorStyle}
      />
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
                      style={colorStyle?.machineStyle[getBackColor(machine)]}
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
