import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Target, Users, Calendar, Trash2 } from "lucide-react";
interface MyChallenge {
  id: string;
  challenge: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    difficulty: string;
    member_count: number;
    points_reward: number;
  };
  joined_at: string;
}
const Habits = () => {
  const [myChallenges, setMyChallenges] = useState<MyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    fetchMyChallenges();
  }, []);
  const fetchMyChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("challenge_participants")
        .select(`
          id,
          joined_at,
          challenge:challenges (
            id,
            title,
            description,
            category,
            difficulty,
            member_count,
            points_reward
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      // Filter out any entries where challenge is null (deleted challenges)
      const validChallenges = (data || []).filter(d => d.challenge !== null) as MyChallenge[];
      setMyChallenges(validChallenges);
    } catch (error) {
      console.error("Error fetching my challenges:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleLeaveChallenge = async (participationId: string, challengeTitle: string) => {
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .delete()
        .eq("id", participationId);
      if (error) throw error;
      toast({
        title: "Left Challenge",
        description: `You've left "${challengeTitle}"`,
      });
      fetchMyChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const difficultyColors: Record<string, string> = {
    easy: "bg-mint/20 text-mint",
    medium: "bg-honey/20 text-honey",
    hard: "bg-rose/20 text-rose",
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
        <h1 className="text-3xl font-bold text-foreground">My Habits</h1>
        <p className="text-muted-foreground mt-1">Challenges you're actively working on 💪</p>
      </div>
      {myChallenges.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Habits Yet</h3>
            <p className="text-muted-foreground mb-4">
              Join some challenges to start building healthy habits!
            </p>
            <Button
              onClick={() => window.location.href = "/dashboard/challenges"}
              className="gradient-primary text-white rounded-xl"
            >
              <Target className="w-4 h-4 mr-2" />
              Explore Challenges
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myChallenges.map((item, index) => (
            <Card 
              key={item.id} 
              className="glass-card border-0 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[item.challenge.difficulty] || difficultyColors.easy}`}>
                    {item.challenge.difficulty}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLeaveChallenge(item.id, item.challenge.title)}
                    className="text-muted-foreground hover:text-destructive rounded-xl h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.challenge.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.challenge.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{item.challenge.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{item.challenge.member_count} members</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </span>
                  <span className="ml-auto text-sm font-medium text-primary">
                    +{item.challenge.points_reward} pts/day
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default Habits;