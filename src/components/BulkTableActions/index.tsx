
import {
  Box,
  Button,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';

const ButtonError = styled(Button)(
  ({ theme }) => `
     background: ${theme.colors.error.main};
     color: ${theme.palette.error.contrastText};

     &:hover {
        background: ${theme.colors.error.dark};
     }
    `
);

function BulkTableActions({onClickButton, selectedList}) {

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Typography variant="h5" color="text.secondary">
            Acciones:
          </Typography>
          <ButtonError
            sx={{ ml: 1 }}
            startIcon={<DeleteTwoToneIcon />}
            variant="contained"
            onClick={()=>onClickButton(selectedList)}
          >
            Eliminar Seleccionados
          </ButtonError>
        </Box>
      </Box>
    </>
  );
}

export default BulkTableActions;
