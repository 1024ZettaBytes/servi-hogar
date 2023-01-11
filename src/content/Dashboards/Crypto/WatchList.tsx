import { Box, Typography } from "@mui/material";

import WatchListColumn from "./WatchListColumn";

function WatchList() {
  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pb: 3,
        }}
      >
        <Typography variant="h3">Equipos más solicitados</Typography>
      </Box>
      <WatchListColumn />
    </>
  );
}

export default WatchList;
