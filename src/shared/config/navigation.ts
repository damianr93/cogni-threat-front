import type { SvgIconComponent } from "@mui/icons-material";
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  FactCheck as FactCheckIcon,
  GppBad as GppBadIcon,
  Groups as GroupsIcon,
  Inventory as InventoryIcon,
  NotificationsActive as NotificationsActiveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  SmartToy as SmartToyIcon,
  Telegram as TelegramIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import type { User } from "../types";

export type NavItem = {
  path: string;
  label: string;
  icon: SvgIconComponent;
  roles?: User["role"][];
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "general",
    title: "General",
    items: [
      { path: "/", label: "Inicio", icon: DashboardIcon },
      { path: "/dashboard", label: "Dashboard", icon: AssessmentIcon },
      { path: "/chat-ai", label: "Chat IA", icon: SmartToyIcon },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoreo",
    items: [
      { path: "/ransomware", label: "Ransomware", icon: SecurityIcon },
      { path: "/ransomware-groups", label: "Grupos de ransomware", icon: GroupsIcon },
      { path: "/actors", label: "Actores", icon: PersonIcon },
      { path: "/vuln-monitor", label: "Vulnerabilidades", icon: GppBadIcon },
      { path: "/telegram-alerts", label: "Canales de Telegram", icon: TelegramIcon },
    ],
  },
  {
    id: "risk-management",
    title: "Gestión de riesgos",
    items: [
      { path: "/assets", label: "Activos", icon: InventoryIcon },
      { path: "/risks", label: "Riesgos", icon: ShieldIcon },
      { path: "/risk-treatment", label: "Tratamiento de riesgos", icon: FactCheckIcon },
    ],
  },
  {
    id: "measurement-control",
    title: "Medición y control",
    items: [
      { path: "/kpis", label: "KPIs", icon: AssessmentIcon },
      { path: "/operational-controls", label: "Control operacional", icon: SettingsIcon },
    ],
  },
  {
    id: "configuration",
    title: "Configuración",
    items: [
      { path: "/alerts-config", label: "Alertas", icon: NotificationsActiveIcon },
    ],
  },
  {
    id: "administration",
    title: "Administración",
    items: [
      { path: "/admin", label: "Administración", icon: AdminPanelSettingsIcon, roles: ["ADMIN"] },
      { path: "/admin/risk-settings", label: "Criterios de riesgo", icon: ShieldIcon, roles: ["ADMIN"] },
      { path: "/admin/secrets", label: "Fuentes y credenciales", icon: VpnKeyIcon, roles: ["ADMIN"] },
    ],
  },
];
