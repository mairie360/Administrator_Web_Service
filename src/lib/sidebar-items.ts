import {
  Briefcase,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
} from "lucide-react";

export const sidebarItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "projects", label: "Projets", icon: Briefcase },
  { id: "messages", label: "Messagerie", icon: MessageSquare },
  { id: "training", label: "Formation", icon: GraduationCap },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "admin", label: "Administration", icon: Shield, adminOnly: true, badge: "Admin" },
  { id: "settings", label: "Paramètres", icon: Settings },
];
