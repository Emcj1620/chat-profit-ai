import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  Switch,
  Paper,
  Button,
  Container,
} from "@material-ui/core";
import { useLocation, useHistory } from "react-router-dom";
import api from "../services/api";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Brightness4Icon from "@material-ui/icons/Brightness4";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { getBackendUrl } from "../config";
import { i18n } from "../translate/i18n";
import { useThemeContext } from "../context/DarkMode";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 8px",
    minHeight: "48px",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: theme.palette.background.default,
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
    color: theme.palette.text.primary,
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    color: theme.palette.text.primary,
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    backgroundColor: theme.palette.background.paper,
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  switch: {
    transform: "scale(0.8)",
  },
  iconButton: {
    color: theme.palette.text.primary,
  },
  themeSwitchContainer: {
    display: "flex",
    alignItems: "center",
  },
  themeIcon: {
    color: theme.palette.text.primary,
  },
}));

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const location = useLocation();
  const history = useHistory();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user } = useContext(AuthContext);
  const { darkMode, toggleTheme, appName, appLogoLight, appLogoDark, headerBgColor, sidebarBgColor, sidebarTextColor } = useThemeContext();
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const { data } = await api.get("/subscription");
        const isExpired = data.dueDate && new Date(data.dueDate) < new Date();
        const isSuspended = data.subscriptionStatus === "suspended";
        // Bloqueia se a assinatura estiver suspensa ou vencida/expirada
        if (isSuspended || isExpired) {
          setSubscriptionBlocked(true);
        } else {
          setSubscriptionBlocked(false);
        }
      } catch (err) {
        console.error("Error checking subscription in layout:", err);
        setSubscriptionBlocked(false);
      }
    };

    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (document.body.offsetWidth > 600) {
      setDrawerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          ),
        }}
        PaperProps={{
          style: {
            backgroundColor: sidebarBgColor || undefined,
            color: sidebarTextColor || undefined
          }
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} style={{ color: sidebarTextColor || "inherit" }}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          <MainListItems drawerClose={drawerClose} />
        </List>
        <Divider />
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        style={{ backgroundColor: headerBgColor || undefined }}
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              classes.menuButton,
              drawerOpen && classes.menuButtonHidden
            )}
          >
            <MenuIcon />
          </IconButton>
          <div className={classes.title}>
            {((darkMode && appLogoDark) || appLogoLight) ? (
              <img
                src={`${getBackendUrl()}public/${(darkMode && appLogoDark) ? appLogoDark : appLogoLight}`}
                alt={appName}
                style={{ height: "36px", width: "auto", display: "block" }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Typography
                component="h1"
                variant="h6"
                noWrap
              >
                {appName}
              </Typography>
            )}
          </div>

          <div className={classes.themeSwitchContainer}>
            <Brightness4Icon className={classes.themeIcon} />
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              color="default"
              className={classes.switch}
            />
          </div>

          {user.id && (
            <NotificationsPopOver className={classes.iconButton} />
          )}

          <div>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              className={classes.iconButton}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {subscriptionBlocked && location.pathname !== "/subscription" ? (
          <Container style={{ marginTop: 40, textAlign: "center" }}>
            <Paper style={{ padding: 40 }} elevation={3}>
              <Typography variant="h5" color="secondary" gutterBottom style={{ fontWeight: "bold" }}>
                Acesso Bloqueado / Assinatura Expirada
              </Typography>
              <Typography variant="body1" paragraph>
                O prazo de pagamento da sua assinatura venceu. Para continuar utilizando todos os recursos do sistema, por favor efetue o pagamento.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => history.push("/subscription")}
              >
                Ir para Tela de Assinatura
              </Button>
            </Paper>
          </Container>
        ) : (
          children ? children : null
        )}
      </main>
    </div>
  );
};

export default LoggedInLayout;
