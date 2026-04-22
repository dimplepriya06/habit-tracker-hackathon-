import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { TrendingUp, Calendar, Target } from "lucide-react";
interface DailyData {
  date: string;
  completed: number;
}
const Statistics = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStatistics();
  }, []);
  const fetchStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Get last 30 days of data
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_progress")
        .select("completion_date, is_completed")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .gte("completion_date", thirtyDaysAgo)
        .order("completion_date", { ascending: true });
      if (error) throw error;
      // Count completions per day
      const countMap = new Map<string, number>();
      data?.forEach((d) => {
        const count = countMap.get(d.completion_date) || 0;
        countMap.set(d.completion_date, count + 1);
      });
      // Generate last 14 days for chart
      const chartData: DailyData[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        chartData.push({
          date: format(subDays(new Date(), i), "MMM d"),
          completed: countMap.get(date) || 0,
        });
      }
      setDailyData(chartData);
      setTotalCompleted(data?.length || 0);
      // Calculate streak (simplified)
      let streak = 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      
      if (countMap.has(today) || countMap.has(yesterday)) {
        streak = 1;
        for (let i = 1; i <= 30; i++) {
          const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
          if (countMap.has(checkDate)) {
            streak++;
          } else {
            break;
          }
        }
      }
      setCurrentStreak(streak);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };
  const averagePerDay = dailyData.length > 0
    ? (dailyData.reduce((sum, d) => sum + d.completed, 0) / dailyData.length).toFixed(1)
    : "0";
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Statistics</h1>
        <p className="text-muted-foreground mt-1">Track your consistency and growth 📊</p>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-lavender/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Completed</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-mint/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{averagePerDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-peach/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{currentStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Bar Chart - Daily Consistency */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Daily Consistency (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-soft)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(160, 40%, 75%)" 
                  radius={[8, 8, 0, 0]}
                  name="Challenges Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Trend Line Chart */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Progress Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(270, 50%, 75%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(270, 50%, 75%)", strokeWidth: 2, r: 5 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Statistics;