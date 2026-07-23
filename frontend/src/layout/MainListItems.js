import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import QuestionAnswerOutlinedIcon from "@material-ui/icons/QuestionAnswerOutlined";
import PaymentIcon from "@material-ui/icons/Payment";
import ViewWeekIcon from "@material-ui/icons/ViewWeek";
import SendIcon from "@material-ui/icons/Send";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useThemeContext } from "../context/DarkMode";

function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const { sidebarTextColor } = useThemeContext();

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button component={renderLink} className={className}>
        {icon ? (
          <ListItemIcon style={{ color: sidebarTextColor || "inherit" }}>
            {icon}
          </ListItemIcon>
        ) : null}
        <ListItemText
          primary={primary}
          primaryTypographyProps={{ style: { color: sidebarTextColor || "inherit" } }}
        />
      </ListItem>
    </li>
  );
}

const MainListItems = (props) => {
  const { drawerClose } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);

  // Verifica se o usuário é admin — protege contra user não carregado ainda
  const isAdmin = user && user.profile && user.profile.toLowerCase() === "admin";

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  return (
    <div onClick={drawerClose}>
      <ListItemLink
        to="/"
        primary="Dashboard"
        icon={<DashboardOutlinedIcon />}
      />
      <ListItemLink
        to="/connections"
        primary={i18n.t("mainDrawer.listItems.connections")}
        icon={
          <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
            <SyncAltIcon />
          </Badge>
        }
      />
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
      />

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<ContactPhoneOutlinedIcon />}
      />
      <ListItemLink
        to="/campaigns"
        primary="Campanhas"
        icon={<SendIcon />}
      />
      <ListItemLink
        to="/kanban"
        primary="Kanban (CRM)"
        icon={<ViewWeekIcon />}
      />
      <ListItemLink
        to="/chatflows"
        primary="Fluxos de Conversa"
        icon={<AccountTreeOutlinedIcon />}
      />
      <ListItemLink
        to="/quickAnswers"
        primary={i18n.t("mainDrawer.listItems.quickAnswers")}
        icon={<QuestionAnswerOutlinedIcon />}
      />

      {isAdmin && (
        <>
          <Divider />
          <ListSubheader inset>
            {i18n.t("mainDrawer.listItems.administration")}
          </ListSubheader>
          <ListItemLink
            to="/users"
            primary={i18n.t("mainDrawer.listItems.users")}
            icon={<PeopleAltOutlinedIcon />}
          />
          <ListItemLink
            to="/queues"
            primary={i18n.t("mainDrawer.listItems.queues")}
            icon={<AccountTreeOutlinedIcon />}
          />
          <ListItemLink
            to="/settings"
            primary={i18n.t("mainDrawer.listItems.settings")}
            icon={<SettingsOutlinedIcon />}
          />
          <ListItemLink
            to="/subscription"
            primary="Assinatura"
            icon={<PaymentIcon />}
          />
        </>
      )}
    </div>
  );
};

export default MainListItems;
