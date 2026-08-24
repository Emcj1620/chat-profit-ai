import React, { createContext, useState, useContext, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { createMuiTheme, ThemeProvider as MUIThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import api from "../../services/api";
import { AuthContext } from "../Auth/AuthContext";
import { getBackendUrl } from "../../config";

const ThemeContext = createContext();

// Cores padrão oficiais da paleta Chat Profit AI
const DEFAULT_PRIMARY = "#28C76F";
const DEFAULT_SECONDARY = "#0084FF";

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [appName, setAppName] = useState("Chat Profit AI");
  const [appLogoLight, setAppLogoLight] = useState("chat_profit_logo.png");
  const [appLogoDark, setAppLogoDark] = useState("chat_profit_logo.png");
  const [appFavicon, setAppFavicon] = useState("chat_profit_favicon.png");
  const [appBackground, setAppBackground] = useState("chat_profit_bg.png");
  const [darkModeBgColor, setDarkModeBgColor] = useState("#0B0F14");
  const [headerBgColor, setHeaderBgColor] = useState("");
  const [sidebarTextColor, setSidebarTextColor] = useState("");
  const [sidebarBgColor, setSidebarBgColor] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { isAuth, user } = useContext(AuthContext);

  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const updateFavicon = (fileName) => {
    if (!fileName) return;
    const backendUrl = getBackendUrl();
    const faviconUrl = `${backendUrl}public/${fileName}`;
    const links = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    if (links.length > 0) {
      links.forEach(link => {
        link.href = faviconUrl;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  };

  const fetchThemeSettings = async () => {
    try {
      const tenantId = isAuth && user?.tenantId ? user.tenantId : 1;
      const { data } = await api.get(`/settings/public?tenantId=${tenantId}`);

      const primary = data.find(s => s.key === "primaryColor");
      const secondary = data.find(s => s.key === "secondaryColor");
      const name = data.find(s => s.key === "appName");
      const logoLight = data.find(s => s.key === "appLogoLight");
      const logoDark = data.find(s => s.key === "appLogoDark");
      const favicon = data.find(s => s.key === "appFavicon");
      const bg = data.find(s => s.key === "appBackground");
      const darkBg = data.find(s => s.key === "darkModeBgColor");
      const headerBg = data.find(s => s.key === "headerBgColor");
      const sbText = data.find(s => s.key === "sidebarTextColor");
      const sbBg = data.find(s => s.key === "sidebarBgColor");

      if (primary && primary.value) setPrimaryColor(primary.value);
      if (secondary && secondary.value) setSecondaryColor(secondary.value);
      if (name && name.value) {
        setAppName(name.value);
        document.title = name.value;
      }
      if (logoLight) setAppLogoLight(logoLight.value || "");
      if (logoDark) setAppLogoDark(logoDark.value || "");
      if (bg) setAppBackground(bg.value || "");
      if (darkBg && darkBg.value) setDarkModeBgColor(darkBg.value);
      if (headerBg) setHeaderBgColor(headerBg.value || "");
      if (sbText) setSidebarTextColor(sbText.value || "");
      if (sbBg) setSidebarBgColor(sbBg.value || "");
      if (favicon && favicon.value) {
        setAppFavicon(favicon.value);
        updateFavicon(favicon.value);
      }
      setSettingsLoaded(true);
    } catch (err) {
      console.error("Error loading theme settings:", err);
      setSettingsLoaded(true);
    }
  };

  useEffect(() => {
    fetchThemeSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user?.tenantId]);

  const theme = useMemo(
    () =>
      createMuiTheme({
        scrollbarStyles: {
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
            backgroundColor: "#e8e8e8",
          },
        },
        palette: {
          type: darkMode ? "dark" : "light",
          primary: { main: primaryColor },
          secondary: { main: secondaryColor },
          background: {
            default: darkMode ? (darkModeBgColor || "#0A0D10") : "#f5f5f5",
            paper: darkMode ? (darkModeBgColor ? `${darkModeBgColor}` : "#12161B") : "#ffffff",
          },
          text: {
            primary: darkMode ? "#F3F4F6" : "#333333",
            secondary: darkMode ? "#9CA3AF" : "#666666",
          }
        },
        shape: {
          borderRadius: 4
        },
        overrides: {
          MuiCssBaseline: {
            "@global": {
              body: {
                backgroundColor: darkMode ? (darkModeBgColor || "#0A0D10") : "#f5f5f5",
              },
            },
          },
          MuiPaper: {
            outlined: {
              borderColor: darkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
            },
          },
          MuiButton: {
            root: {
              textTransform: "none",
              fontWeight: 500,
            },
          },
        },
      }),
    [darkMode, primaryColor, secondaryColor, darkModeBgColor]
  );

  const contextValue = useMemo(() => ({
    darkMode,
    toggleTheme,
    appName,
    appLogoLight,
    appLogoDark,
    appFavicon,
    appBackground,
    darkModeBgColor,
    headerBgColor,
    sidebarTextColor,
    sidebarBgColor,
    settingsLoaded,
    fetchThemeSettings,
  }), [darkMode, appName, appLogoLight, appLogoDark, appFavicon, appBackground, darkModeBgColor, headerBgColor, sidebarTextColor, sidebarBgColor, settingsLoaded]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      darkMode: false,
      toggleTheme: () => {},
      appName: "Chat Profit AI",
      appLogoLight: "",
      appLogoDark: "",
      appFavicon: "",
      appBackground: "",
      darkModeBgColor: "#121212",
      headerBgColor: "",
      sidebarTextColor: "",
      sidebarBgColor: "",
      settingsLoaded: true,
      fetchThemeSettings: () => {}
    };
  }
  return context;
};
