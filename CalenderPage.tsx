import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface CompletedDay {
  date: Date;
  count: number;
}
const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedDays, setCompletedDays] = useState<CompletedDay[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCompletedDays();
  }, [currentDate]);
  const fetchCompletedDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const { data, error } = await supabase
        .from("daily_progress")
        .select("completion_date")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .gte("completion_date", format(start, "yyyy-MM-dd"))
        .lte("completion_date", format(end, "yyyy-MM-dd"));
      if (error) throw error;
      // Count completions per day
      const countMap = new Map<string, number>();
      data?.forEach((d) => {
        const count = countMap.get(d.completion_date) || 0;
        countMap.set(d.completion_date, count + 1);
      });
      const completed = Array.from(countMap.entries()).map(([date, count]) => ({
        date: new Date(date),
        count,
      }));
      setCompletedDays(completed);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const getCompletionForDay = (date: Date) => {
    return completedDays.find((d) => isSameDay(d.date, date));
  };
  const startDayOfWeek = startOfMonth(currentDate).getDay();
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
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
        <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-1">Track your daily completions 📅</p>
      </div>
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-xl">
              {format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before start of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days of the month */}
            {days.map((day) => {
              const completion = getCompletionForDay(day);
              const hasCompletion = !!completion;
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all",
                    today && "ring-2 ring-primary",
                    hasCompletion
                      ? "bg-gradient-to-br from-mint/30 to-sky/30"
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      today ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {hasCompletion && (
                    <div className="absolute -top-1 -right-1">
                      <Medal className="w-5 h-5 text-honey drop-shadow-sm" />
                    </div>
                  )}
                  {hasCompletion && completion.count > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ×{completion.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-mint/30 to-sky/30" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-honey" />
              <span className="text-sm text-muted-foreground">Medal earned</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default CalendarPage;