import { LoadingButton } from "@mui/lab";
import { Typography, Avatar, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
function PageHeader(props) {
  const user = {
    avatar: "/static/images/avatars/1.png",
  };
  const { showAvatar, button } = props;
  let { title, subtitle } = props;
  const theme = useTheme();

  return (
    <Grid container justifyContent="space-between" alignItems="center">
      {showAvatar ? (
        <Grid item>
          <Avatar
            sx={{
              mr: 2,
              width: theme.spacing(8),
              height: theme.spacing(8),
            }}
            variant="rounded"
            src={user.avatar}
          />
        </Grid>
      ) : null}
      <Grid item>
        <Typography variant="h3" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="subtitle2">{subtitle}</Typography>
      </Grid>
      <Grid item>
        {button ? (
          <LoadingButton
            sx={{ mt: { xs: 2, md: 0 } }}
            variant={button.variant}
            startIcon={button.startIcon}
            color={button.color || "primary"}
            onClick={() => button.onClick()}
            disabled={button.disabled}
            loading={button.isLoading}
          >
            {button.text}
          </LoadingButton>
        ) : null}
      </Grid>
    </Grid>
  );
}

export default PageHeader;
