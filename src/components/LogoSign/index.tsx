import {
  Box,
  Badge,
  styled,
  useTheme
} from '@mui/material';
import Link from 'src/components/Link';
import classes from "./logoSign.module.css"

const LogoWrapper = styled(Link)(
  ({ theme }) => `
        color: ${theme.palette.text.primary};
        display: flex;
        text-decoration: none;
        width: 100%;
        margin: 0 auto;
        margin-left: 30%;
        font-weight: ${theme.typography.fontWeightBold};
`
);

const LogoSignWrapper = styled(Box)(
  () => `
        width: 52px;
        height: 38px;
`
);







function Logo() {
  const theme = useTheme();

  return (
  
      <LogoWrapper href="/">
        <Badge
          sx={{
            '.MuiBadge-badge': {
              fontSize: theme.typography.pxToRem(11),
              right: -2,
              top: 8
            }
          }}
          overlap="circular"
          color="success"
          badgeContent="1.0"
        >
          <LogoSignWrapper>
          <img
          className={classes.logoimg}
              src="/static/images/servi_hogar.png"
            />
          </LogoSignWrapper>
        </Badge>
      </LogoWrapper>
  );
}

export default Logo;
