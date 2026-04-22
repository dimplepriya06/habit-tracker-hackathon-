import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Target, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Heart, 
  Settings,
  Sparkles,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
const menuItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Target, label: "Challenges", path: "/dashboard/challenges" },
  { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
  { icon: Trophy, label: "Rewards", path: "/dashboard/rewards" },
  { icon: BarChart3, label: "Statistics", path: "/dashboard/statistics" },
  { icon: Heart, label: "My Habits", path: "/dashboard/habits" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">
            HabitFlow
          </span>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive && "text-sidebar-primary"
              )} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>
      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;