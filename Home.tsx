import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Flame, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
interface Stats {
  totalChallenges: number;
  completedToday: number;
  totalPoints: number;
  streak: number;
}
const Home = () => {
  const [stats, setStats] = useState<Stats>({
    totalChallenges: 0,
    completedToday: 0,
    totalPoints: 0,
    streak: 0,
  });
  const [dailyProgress, setDailyProgress] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch profile for points
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("user_id", user.id)
        .maybeSingle();
      // Fetch challenges user is participating in
      const { data: participations } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user.id);
      // Fetch today's progress
      const today = new Date().toISOString().split("T")[0];
      const { data: todayProgress } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("completion_date", today);
      const completed = todayProgress?.filter(p => p.is_completed).length || 0;
      const total = participations?.length || 0;
      setStats({
        totalChallenges: total,
        completedToday: completed,
        totalPoints: profile?.total_points || 0,
        streak: 7, // TODO: Calculate actual streak
      });
      // Prepare pie chart data
      setDailyProgress([
        { name: "Completed", value: completed, color: "hsl(160, 40%, 75%)" },
        { name: "Remaining", value: Math.max(0, total - completed), color: "hsl(270, 20%, 90%)" },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const statCards = [
    { 
      label: "Active Challenges", 
      value: stats.totalChallenges, 
      icon: Target, 
      color: "from-lavender to-sky",
      iconBg: "bg-lavender/20"
    },
    { 
      label: "Completed Today", 
      value: stats.completedToday, 
      icon: Star, 
      color: "from-mint to-sky",
      iconBg: "bg-mint/20"
    },
    { 
      label: "Total Points", 
      value: stats.totalPoints, 
      icon: Trophy, 
      color: "from-peach to-rose",
      iconBg: "bg-peach/20"
    },
    { 
      label: "Day Streak", 
      value: stats.streak, 
      icon: Flame, 
      color: "from-rose to-peach",
      iconBg: "bg-rose/20"
    },
  ];
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your progress and stay motivated ✨</p>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={stat.label} className="glass-card border-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-foreground/70" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress Pie Chart */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.totalChallenges > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dailyProgress}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dailyProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Target className="w-12 h-12 mb-4 opacity-50" />
                  <p>Join challenges to see your progress!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Quick Actions */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-lavender/20 to-sky/20 border border-lavender/30">
              <h3 className="font-semibold text-foreground">🎯 Create a Challenge</h3>
              <p className="text-sm text-muted-foreground mt-1">Start a new habit journey and invite others!</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-mint/20 to-sky/20 border border-mint/30">
              <h3 className="font-semibold text-foreground">🔍 Explore Challenges</h3>
              <p className="text-sm text-muted-foreground mt-1">Find popular challenges to join</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-peach/20 to-rose/20 border border-peach/30">
              <h3 className="font-semibold text-foreground">🏆 Redeem Points</h3>
              <p className="text-sm text-muted-foreground mt-1">Convert 100 points to ₹10</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;