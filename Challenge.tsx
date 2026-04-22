import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Users, Target, MessageCircle, Check, Image } from "lucide-react";
import ChatRoom from "@/components/challenges/ChatRoom";
import PhotoUpload from "@/components/challenges/PhotoUpload";
interface Challenge {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  points_reward: number;
  member_count: number;
  creator_id: string;
  is_joined?: boolean;
  is_completed_today?: boolean;
}
const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    category: "general",
    difficulty: "easy",
  });
  const { toast } = useToast();
  useEffect(() => {
    fetchChallenges();
  }, []);
  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Check which challenges user has joined
      const { data: participations } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user.id);
      const joinedIds = new Set(participations?.map(p => p.challenge_id) || []);
      // Check today's progress
      const today = new Date().toISOString().split("T")[0];
      const { data: todayProgress } = await supabase
        .from("daily_progress")
        .select("challenge_id, is_completed")
        .eq("user_id", user.id)
        .eq("completion_date", today);
      const completedIds = new Set(
        todayProgress?.filter(p => p.is_completed).map(p => p.challenge_id) || []
      );
      const enrichedChallenges = challengesData?.map(c => ({
        ...c,
        is_joined: joinedIds.has(c.id),
        is_completed_today: completedIds.has(c.id),
      })) || [];
      setChallenges(enrichedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("challenges").insert({
        ...newChallenge,
        creator_id: user.id,
        is_public: true,
        points_reward: 10,
      });
      if (error) throw error;
      toast({
        title: "Challenge Created! 🎉",
        description: "Your challenge is now live for others to join.",
      });
      setCreateDialogOpen(false);
      setNewChallenge({ title: "", description: "", category: "general", difficulty: "easy" });
      fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("challenge_participants").insert({
        user_id: user.id,
        challenge_id: challengeId,
      });
      if (error) throw error;
      toast({
        title: "Joined! 🚀",
        description: "You've joined the challenge. Good luck!",
      });
      fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const openChat = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setChatDialogOpen(true);
  };
  const openPhotoUpload = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setPhotoDialogOpen(true);
  };
  const filteredChallenges = challenges.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Challenges</h1>
          <p className="text-muted-foreground mt-1">Discover and join challenges</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white rounded-xl shadow-soft hover:shadow-medium transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-0">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  placeholder="30 Days of Meditation"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  placeholder="Describe your challenge..."
                  className="mt-1 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={newChallenge.category}
                    onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
                  >
                    <option value="general">General</option>
                    <option value="fitness">Fitness</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="learning">Learning</option>
                    <option value="health">Health</option>
                  </select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select
                    value={newChallenge.difficulty}
                    onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl border border-input bg-background"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleCreateChallenge}
                className="w-full gradient-primary text-white rounded-xl"
                disabled={!newChallenge.title}
              >
                Create Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search challenges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-card"
        />
      </div>
      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge, index) => (
          <Card 
            key={challenge.id} 
            className="glass-card border-0 overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[challenge.difficulty] || difficultyColors.easy}`}>
                  {challenge.difficulty}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Users className="w-4 h-4" />
                  {challenge.member_count}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {challenge.description || "No description provided"}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Target className="w-4 h-4" />
                <span>{challenge.category}</span>
                <span className="mx-2">•</span>
                <span className="text-primary font-medium">+{challenge.points_reward} pts</span>
              </div>
              <div className="flex gap-2">
                {challenge.is_joined ? (
                  <>
                    {challenge.is_completed_today ? (
                      <Button className="flex-1 bg-mint/20 text-mint hover:bg-mint/30 rounded-xl" disabled>
                        <Check className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openPhotoUpload(challenge)}
                        className="flex-1 gradient-mint text-white rounded-xl"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openChat(challenge)}
                      className="rounded-xl"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="w-full gradient-primary text-white rounded-xl"
                  >
                    Join Challenge
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredChallenges.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No challenges found. Create one to get started!</p>
          </div>
        )}
      </div>
      {/* Chat Dialog */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="glass-card border-0 max-w-2xl h-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedChallenge?.title} - Chat Room</DialogTitle>
          </DialogHeader>
          {selectedChallenge && <ChatRoom challengeId={selectedChallenge.id} />}
        </DialogContent>
      </Dialog>
      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="glass-card border-0">
          <DialogHeader>
            <DialogTitle>Complete Challenge</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <PhotoUpload
              challengeId={selectedChallenge.id}
              onComplete={() => {
                setPhotoDialogOpen(false);
                fetchChallenges();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Challenges;