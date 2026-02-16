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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HomeIcon from '@mui/icons-material/Home';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ListIcon from '@mui/icons-material/List';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import HailIcon from '@mui/icons-material/Hail';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import PaidIcon from '@mui/icons-material/Paid';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BuildIcon from '@mui/icons-material/Build';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NoCrashIcon from '@mui/icons-material/NoCrash';

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

function SidebarMenu({ userRole }) {
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
              {userRole === 'PARTNER' && (
                <ListItem component="div">
                  <NextLink href="/espacio-socios" passHref>
                    <Button
                      className={
                        currentRoute === '/espacio-socios' ? 'active' : ''
                      }
                      disableRipple
                      component="a"
                      onClick={closeSidebar}
                      startIcon={<HandshakeIcon />}
                    >
                      Socios
                    </Button>
                  </NextLink>
                </ListItem>
              )}
            </List>
          </SubMenuWrapper>
        </List>
                {['AUX', "ADMIN"].includes(userRole) && (
          <List
            component="div"
            subheader={
              <ListSubheader component="div" disableSticky>
                GESTIÓN
              </ListSubheader>
            }
          >
            <SubMenuWrapper>
              <List component="div">
                <ListItem component="div">
                  <NextLink href="/pendientes" passHref>
                    <Button
                      className={
                        currentRoute === '/pendientes' ? 'active' : ''
                      }
                      disableRipple
                      component="a"
                      onClick={closeSidebar}
                      startIcon={<PendingActionsIcon />}
                    >
                      Pendientes
                    </Button>
                  </NextLink>
                </ListItem>
              </List>
            </SubMenuWrapper>
          </List>
        )}
        {['ADMIN', 'AUX'].includes(userRole) && (
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
                  <NextLink href="/renta-rapida" passHref>
                    <Button
                      className={
                        currentRoute === '/renta-rapida' ? 'active' : ''
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
                  <NextLink href="/rentas" passHref>
                    <Button
                      className={
                        !currentRoute.includes('/rentas-') &&
                        currentRoute.includes('/rentas')
                          ? 'active'
                          : ''
                      }
                      disableRipple
                      component="a"
                      onClick={closeSidebar}
                      startIcon={<ListIcon />}
                    >
                      Colocadas
                    </Button>
                  </NextLink>
                </ListItem>
              </List>
            </SubMenuWrapper>
          </List>
        )}

        {['ADMIN', 'AUX', 'OPE'].includes(userRole) && (
          <>
            <List
              component="div"
              subheader={
                <ListSubheader component="div" disableSticky>
                  VENTAS
                </ListSubheader>
              }
            >
              <SubMenuWrapper>
                <List component="div">
                  <ListItem component="div">
                    <NextLink href="/ventas" passHref>
                      <Button
                        className={
                          currentRoute === '/ventas' ? 'active' : ''
                        }
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<AttachMoneyIcon />}
                      >
                        Lista de Ventas
                      </Button>
                    </NextLink>
                  </ListItem>
                  {['ADMIN', 'AUX'].includes(userRole) && (
                    <ListItem component="div">
                      <NextLink href="/equipos-venta" passHref>
                        <Button
                          className={
                            currentRoute.includes('/equipos-venta')
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<ShoppingBagIcon />}
                        >
                          Equipos de Venta
                        </Button>
                      </NextLink>
                    </ListItem>
                  )}
                </List>
              </SubMenuWrapper>
            </List>
          </>
        )}

        {['OPE', 'ADMIN', 'AUX'].includes(userRole) && (
          <>
            <List
              component="div"
              subheader={
                <ListSubheader component="div" disableSticky>
                  OPERADOR
                </ListSubheader>
              }
            >
              <SubMenuWrapper>
                <List component="div">
                  <ListItem component="div">
                    <NextLink href="/vueltas-operador" passHref>
                      <Button
                        className={
                          currentRoute.includes('/vueltas-operador')
                            ? 'active'
                            : ''
                        }
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<AssignmentIcon />}
                      >
                        Vueltas del Operador
                      </Button>
                    </NextLink>
                  </ListItem>
                </List>
              </SubMenuWrapper>
            </List>
          </>
        )}
        {['ADMIN', 'AUX', 'SUB'].includes(userRole) && (
          <>
            <List
              component="div"
              subheader={
                <ListSubheader component="div" disableSticky>
                  ENTREGAS (RENTAS)
                </ListSubheader>
              }
            >
              <SubMenuWrapper>
                <List component="div">
                  <ListItem component="div">
                    <NextLink href="/entregas-pendientes" passHref>
                      <Button
                        className={
                          currentRoute.includes('/entregas-pendientes')
                            ? 'active'
                            : ''
                        }
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<PendingActionsIcon />}
                      >
                        Entregas pendientes
                      </Button>
                    </NextLink>
                  </ListItem>
                  {['ADMIN', 'AUX'].includes(userRole) && (
                    <ListItem component="div">
                      <NextLink href="/entregas" passHref>
                        <Button
                          className={
                            currentRoute === '/entregas' ? 'active' : ''
                          }
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<LocalShippingIcon />}
                        >
                          Lista de entregas
                        </Button>
                      </NextLink>
                    </ListItem>
                  )}
                </List>
              </SubMenuWrapper>
            </List>
            {['ADMIN', 'AUX', 'SUB'].includes(userRole) && (
              <List
                component="div"
                subheader={
                  <ListSubheader component="div" disableSticky>
                    CAMBIOS
                  </ListSubheader>
                }
              >
                <SubMenuWrapper>
                  <List component="div">
                    <ListItem component="div">
                      <NextLink href="/cambios-pendientes" passHref>
                        <Button
                          className={
                            currentRoute.includes('/cambios-pendientes')
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<PendingActionsIcon />}
                        >
                          Cambios pendientes
                        </Button>
                      </NextLink>
                    </ListItem>
                    <ListItem component="div">
                      <NextLink href="/cambios" passHref>
                        <Button
                          className={currentRoute === '/cambios' ? 'active' : ''}
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<ChangeCircleIcon />}
                        >
                          Lista de cambios
                        </Button>
                      </NextLink>
                    </ListItem>
                  </List>
                </SubMenuWrapper>
              </List>
            )}
            {['ADMIN', 'AUX'].includes(userRole) && (
              <List
                component="div"
                subheader={
                  <ListSubheader component="div" disableSticky>
                    RECOLECCIONES
                  </ListSubheader>
                }
              >
                <SubMenuWrapper>
                  <List component="div">
                    <ListItem component="div">
                      <NextLink href="/recolecciones-pendientes" passHref>
                        <Button
                          className={
                            currentRoute.includes('/recolecciones-pendientes')
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<PendingActionsIcon />}
                        >
                          Recolecciones pendientes
                        </Button>
                      </NextLink>
                    </ListItem>
                    <ListItem component="div">
                      <NextLink href="/recolecciones" passHref>
                        <Button
                          className={
                            currentRoute === '/recolecciones' ? 'active' : ''
                          }
                          disableRipple
                          component="a"
                          onClick={closeSidebar}
                          startIcon={<HailIcon />}
                        >
                          Lista de recolecciones
                        </Button>
                      </NextLink>
                    </ListItem>
                  </List>
                </SubMenuWrapper>
              </List>
            )}
          </>
        )}
                {
          ["ADMIN", "TEC"].includes(userRole) && 
          <List
          component="div"
          subheader={
            <ListSubheader component="div" disableSticky>
              BODEGA
            </ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List component="div">
              <ListItem component="div">
                <NextLink href="/recolectadas" passHref>
                  <Button
                    className={
                      currentRoute.includes("/recolectadas")
                        ? "active"
                        : ""
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<NoCrashIcon />}
                  >
                    Recolectados
                  </Button>
                </NextLink>
              </ListItem>
              <ListItem component="div">
                <NextLink href="/mantenimientos" passHref>
                  <Button
                    className={
                      currentRoute.includes("/mantenimientos")
                        ? "active"
                        : ""
                    }
                    disableRipple
                    component="a"
                    onClick={closeSidebar}
                    startIcon={<BuildIcon />}
                  >
                    Mantenimientos
                  </Button>
                </NextLink>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
        }
        {/*<List
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
                  </List>*/}
        {['ADMIN', 'AUX', 'SUB', "TEC"].includes(userRole) ? (
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
            {['ADMIN', 'AUX'].includes(userRole) && <>
                <ListItem component="div">
                  <NextLink href="/pagos" passHref>
                    <Button
                      className={currentRoute === '/pagos' ? 'active' : ''}
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
                        currentRoute.includes('/equipos') &&
                        !currentRoute.includes('/equipos-venta') &&
                        !currentRoute.includes('/reportes')
                          ? 'active'
                          : ''
                      }
                      disableRipple
                      component="a"
                      onClick={closeSidebar}
                      startIcon={<LocalLaundryServiceIcon />}
                    >
                      Equipos (Rentas)
                    </Button>
                  </NextLink>
                </ListItem>
              </>}
              {['ADMIN', 'AUX'].includes(userRole) && (
                <ListItem component="div">
                  <NextLink href="/clientes" passHref>
                    <Button
                      className={
                        currentRoute.includes('/clientes') ? 'active' : ''
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
                
                )}
                {userRole === 'ADMIN' && (
                  <ListItem component="div">
                    <NextLink href="/socios" passHref>
                      <Button
                        className={currentRoute === '/socios' ? 'active' : ''}
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<HandshakeIcon />}
                      >
                        Socios
                      </Button>
                    </NextLink>
                  </ListItem>
                )}
                {['ADMIN', 'AUX'].includes(userRole) && (<>
                  <ListItem component="div">
                    <NextLink href="/inventario" passHref>
                      <Button
                        className={
                          currentRoute === '/inventario' ? 'active' : ''
                        }
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<InventoryIcon />}
                      >
                        Inventario
                      </Button>
                    </NextLink>
                  </ListItem>
                
                <ListItem component="div">
                  <NextLink href={userRole === "SUB" ? "/reportes/semanal" :"/reportes"} passHref>
                    <Button
                      className={
                        currentRoute.includes('/reportes') ? 'active' : ''
                      }
                      disableRipple
                      component="a"
                      onClick={closeSidebar}
                      startIcon={<AssessmentIcon />}
                    >
                      Reportes
                    </Button>
                  </NextLink>
                </ListItem></>
              )}
              {
                userRole === 'TEC' && (
                  <ListItem component="div">
                  <NextLink href={"/reportes/tecnicos"} passHref>
                    <Button
                      className={
                        currentRoute.includes('/reportes') ? 'active' : ''
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
                )
              }
                {userRole === 'ADMIN' && (
                  <ListItem component="div">
                    <NextLink href="/usuarios" passHref>
                      <Button
                        className={currentRoute === '/usuarios' ? 'active' : ''}
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<GroupIcon />}
                      >
                        Usuarios
                      </Button>
                    </NextLink>
                  </ListItem>
                )}
              { ['ADMIN', 'AUX'].includes(userRole) && (
                  <ListItem component="div">
                    <NextLink href="/nomina" passHref>
                      <Button
                        className={currentRoute === '/nomina' ? 'active' : ''}
                        disableRipple
                        component="a"
                        onClick={closeSidebar}
                        startIcon={<ReceiptLongIcon />}
                      >
                        Nómina
                      </Button>
                    </NextLink>
                  </ListItem>
                )}
              </List>
            </SubMenuWrapper>
          </List>
        ) : null}
      </MenuWrapper>
    </>
  );
}

export default SidebarMenu;
