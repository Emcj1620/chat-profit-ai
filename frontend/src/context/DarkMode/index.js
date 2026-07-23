import React, { createContext, useState, useContext, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { createMuiTheme, ThemeProvider as MUIThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import api from "../../services/api";
import { AuthContext } from "../Auth/AuthContext";
import { getBackendUrl } from "../../config";

const ThemeContext = createContext();

// Cores padrão originais do Whaticket
const DEFAULT_PRIMARY = "#7c4dff";
const DEFAULT_SECONDARY = "#ff4081";

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY);
  const [appName, setAppName] = useState("WhaTicket");
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appFavicon, setAppFavicon] = useState("");
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
        link.type = "image/png";
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      link.type = "image/png";
      document.head.appendChild(link);
    }
  };

  useEffect(() => {
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

        if (primary && primary.value) setPrimaryColor(primary.value);
        if (secondary && secondary.value) setSecondaryColor(secondary.value);
        if (name && name.value) {
          setAppName(name.value);
          document.title = name.value;
        }
        if (logoLight) setAppLogoLight(logoLight.value || "");
        if (logoDark) setAppLogoDark(logoDark.value || "");
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
        },
      }),
    [darkMode, primaryColor, secondaryColor]
  );

  const contextValue = useMemo(() => ({
    darkMode,
    toggleTheme,
    appName,
    appLogoLight,
    appLogoDark,
    appFavicon,
    settingsLoaded,
  }), [darkMode, appName, appLogoLight, appLogoDark, appFavicon, settingsLoaded]);

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

export const useThemeContext = () => useContext(ThemeContext);
