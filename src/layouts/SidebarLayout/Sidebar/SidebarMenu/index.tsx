import { useContext } from 'react';
import { useRouter } from 'next/router';

import {
  ListSubheader,
  alpha,
  Box,
  List,
  styled,
  Button,
  ListItem
} from '@mui/material';
import NextLink from 'next/link';
import { SidebarContext } from 'src/contexts/SidebarContext';

import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import HomeIcon from '@mui/icons-material/Home';
import ListIcon from '@mui/icons-material/List';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import HailIcon from '@mui/icons-material/Hail';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import PaidIcon from '@mui/icons-material/Paid';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
const MenuWrapper = styled(Box)(
  ({ theme }) => `
  .MuiList-root {
    padding: ${theme.spacing(1)};

    & > .MuiList-root {
      padding: 0 ${theme.spacing(0)} ${theme.spacing(1)};
    }
  }

    .MuiListSubheader-root {
      text-transform: uppercase;
      font-weight: bold;
      font-size: ${theme.typography.pxToRem(12)};
      color: ${theme.colors.alpha.trueWhite[50]};
      padding: ${theme.spacing(0, 2.5)};
      line-height: 1.4;
    }
`
);

const SubMenuWrapper = styled(Box)(
  ({ theme }) => `
    .MuiList-root {

      .MuiListItem-root {
        padding: 1px 0;

        .MuiBadge-root {
          position: absolute;
          right: ${theme.spacing(3.2)};

          .MuiBadge-standard {
            background: ${theme.colors.primary.main};
            font-size: ${theme.typography.pxToRem(10)};
            font-weight: bold;
            text-transform: uppercase;
            color: ${theme.palette.primary.contrastText};
          }
        }
    
        .MuiButton-root {
          display: flex;
          color: ${theme.colors.alpha.trueWhite[70]};
          background-color: transparent;
          width: 100%;
          justify-content: flex-start;
          padding: ${theme.spacing(1.2, 3)};

          .MuiButton-startIcon,
          .MuiButton-endIcon {
            transition: ${theme.transitions.create(['color'])};

            .MuiSvgIcon-root {
              font-size: inherit;
              transition: none;
            }
          }

          .MuiButton-startIcon {
            color: ${theme.colors.alpha.trueWhite[30]};
            font-size: ${theme.typography.pxToRem(20)};
            margin-right: ${theme.spacing(1)};
          }
          
          .MuiButton-endIcon {
            color: ${theme.colors.alpha.trueWhite[50]};
            margin-left: auto;
            opacity: .8;
            font-size: ${theme.typography.pxToRem(20)};
          }

          &.active,
          &:hover {
            background-color: ${alpha(theme.colors.alpha.trueWhite[100], 0.06)};
            color: ${theme.colors.alpha.trueWhite[100]};

            .MuiButton-startIcon,
            .MuiButton-endIcon {
              color: ${theme.colors.alpha.trueWhite[100]};
            }
          }
        }

        &.Mui-children {
          flex-direction: column;

          .MuiBadge-root {
            position: absolute;
            right: ${theme.spacing(7)};
          }
        }

        .MuiCollapse-root {
          width: 100%;

          .MuiList-root {
            padding: ${theme.spacing(1, 0)};
          }

          .MuiListItem-root {
            padding: 1px 0;

            .MuiButton-root {
              padding: ${theme.spacing(0.8, 3)};

              .MuiBadge-root {
                right: ${theme.spacing(3.2)};
              }

              &:before {
                content: ' ';
                background: ${theme.colors.alpha.trueWhite[100]};
                opacity: 0;
                transition: ${theme.transitions.create([
                  'transform',
                  'opacity'
                ])};
                width: 6px;
                height: 6px;
                transform: scale(0);
                transform-origin: center;
                border-radius: 20px;
                margin-right: ${theme.spacing(1.8)};
              }

              &.active,
              &:hover {

                &:before {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            }
          }
        }
      }
    }
`
);

function SidebarMenu({userRole}) {
  const { closeSidebar } = useContext(SidebarContext);
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <>
      <MenuWrapper>
        <List component="div">
          <SubMenuWrapper>
            <List component="div">
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={currentRoute === '/' ? 'active' : ''}
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<HomeIcon />}
                  >
                    Inicio
                  </Button>
                </NextLink>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
        <List
          component="div"
          subheader={
            <ListSubheader component="div" disableSticky>
              RENTAS
            </ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List component="div">
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/dashboards/crypto' ? 'active' : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<AddBusinessIcon />}
                  >
                    Renta Rápida
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/applications/messenger' ? 'active' : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<ListIcon />}
                  >
                    Lista de rentas
                  </Button>
                </NextLink>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
        <List
          component="div"
          subheader={
            <ListSubheader component="div" disableSticky>
              OPRERATIVO
            </ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List component="div">
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/transactions'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<LocalShippingIcon />}
                  >
                    Entregas
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/transactions'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<ArrowCircleUpIcon />}
                  >
                    Cargas
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/transactions'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<HailIcon />}
                  >
                    Recolecciones
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/transactions'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<ChangeCircleIcon />}
                  >
                    Cambios
                  </Button>
                </NextLink>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
        {["ADMIN", "AUX"].includes(userRole) ?
        <List
          component="div"
          subheader={
            <ListSubheader component="div" disableSticky>
              ADMINISTRACIÓN
            </ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List component="div">
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/profile' ? 'active' : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<PaidIcon />}
                  >
                    Pagos
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/equipos" passHref>
                  <Button
                    className={
                      currentRoute.includes("/equipos")
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<LocalLaundryServiceIcon />}
                  >
                    Equipos
                  </Button>
                </NextLink>
              </ListItem>
              
              <ListItem component="div">
                <NextLink href="/clientes" passHref>
                  <Button
                    className={
                      currentRoute.includes("/clientes")
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<ShoppingBagIcon />}
                  >
                    Clientes
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/profile/settings'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<GroupIcon />}
                  >
                    Usuarios
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/" passHref>
                  <Button
                    className={
                      currentRoute === '/management/profile/settings'
                        ? 'active'
                        : ''
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<AssessmentIcon />}
                  >
                    Reportes
                  </Button>
                </NextLink>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>:null}
      </MenuWrapper>
    </>
  );
}

export default SidebarMenu;
