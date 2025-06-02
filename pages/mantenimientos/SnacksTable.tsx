import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {
  Box,
  CardHeader,
  InputAdornment,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import numeral from 'numeral';

export default function SnacksTable({ showSearch, rows }) {
  const theme = useTheme();

  const total =
    rows && rows.length > 0
      ? rows.reduce((acc, row) => acc + row.price * row.qty, 0)
      : 0;

  return (
    <>
      <CardHeader
        action={
          showSearch ? (
            <Box width={200}>
              <>
                <TextField
                  size="small"
                  id="input-search-customer"
                  label="Buscar"
                  onChange={() => {}}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  sx={{ marginTop: '20px' }}
                />
              </>
            </Box>
          ) : null
        }
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
        title=""
      />
      <TableContainer
        component={Paper}
        sx={{
          marginBottom: '10px',
          width: '100%',
          overflowX: 'auto', // Enable horizontal scrolling
          '@media (max-width: 550px)': {
            // Mobile breakpoint
            maxWidth: '100vw'
          }
        }}
      >
        <Table
          sx={{
            // Adjust minimum width for different screen sizes
            minWidth: {
              xs: 300, // Mobile
              sm: 450, // Tablet
              md: 650 // Desktop (original size)
            }
          }}
          aria-label="simple table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell align="center">Nombre</TableCell>
              <TableCell align="center">Unidades</TableCell>
              <TableCell align="center">Precio Unit.</TableCell>
              <TableCell align="center">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows &&
              rows.map((row) => (
                <TableRow
                  key={`${row._id}`}
                  sx={{
                    '&.MuiTableRow-root:hover': {
                      backgroundColor: theme.palette.primary.light
                    },
                    '&.MuiTableRow-root.Mui-selected': {
                      backgroundColor: theme.palette.secondary.main
                    },

                    cursor: 'pointer'
                  }}
                >
                  <TableCell component="th" scope="row">
                    {row.inventoryProduct?.code}
                  </TableCell>
                  <TableCell align="center">
                    {row.inventoryProduct?.name}
                  </TableCell>
                  <TableCell align="center">{row.qty}</TableCell>
                  <TableCell align="center">
                    {numeral(row.price).format('$0,0.00')}
                  </TableCell>
                  <TableCell align="center">
                    {numeral(row.price * row.qty).format('$0,0.00')}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ alignItems: 'right', textAlign: 'right' }}>
        <Typography fontWeight="bold" display="inline">
          {'TOTAL:'}
        </Typography>
        <Typography
          display="inline"
          marginLeft={4}
          marginRight={4}
          fontWeight="bold"
        >
          {numeral(total).format('$0,0.00')}
        </Typography>
      </Box>
    </>
  );
}
