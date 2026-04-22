import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, IndianRupee, Gift, Sparkles } from "lucide-react";
const Rewards = () => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    fetchPoints();
  }, []);
  const fetchPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points, redeemed_points")
        .eq("user_id", user.id)
        .maybeSingle();
      setTotalPoints(profile?.total_points || 0);
      setRedeemedPoints(profile?.redeemed_points || 0);
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setLoading(false);
    }
  };
  const availablePoints = totalPoints - redeemedPoints;
  const redeemableRupees = Math.floor(availablePoints / 100) * 10;
  const handleRedeem = async () => {
    if (availablePoints < 100) {
      toast({
        title: "Not enough points",
        description: "You need at least 100 points to redeem ₹10",
        variant: "destructive",
      });
      return;
    }
    setRedeeming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const pointsToRedeem = Math.floor(availablePoints / 100) * 100;
      const rupeesToEarn = (pointsToRedeem / 100) * 10;
      // Create redemption record
      const { error: rewardError } = await supabase.from("rewards").insert({
        user_id: user.id,
        points_redeemed: pointsToRedeem,
        rupees_amount: rupeesToEarn,
        status: "pending",
      });
      if (rewardError) throw rewardError;
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ redeemed_points: redeemedPoints + pointsToRedeem })
        .eq("user_id", user.id);
      if (profileError) throw profileError;
      setRedeemedPoints(redeemedPoints + pointsToRedeem);
      toast({
        title: "Redemption Successful! 🎉",
        description: `You've redeemed ₹${rupeesToEarn}! It will be processed soon.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
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
        <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
        <p className="text-muted-foreground mt-1">Convert your points to real money! 💰</p>
      </div>
      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0 bg-gradient-to-br from-lavender/20 to-sky/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points Earned</p>
                <p className="text-3xl font-bold mt-1">{totalPoints}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-lavender/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-foreground/70" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 bg-gradient-to-br from-mint/20 to-sky/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Points</p>
                <p className="text-3xl font-bold mt-1">{availablePoints}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-mint/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-foreground/70" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 bg-gradient-to-br from-peach/20 to-rose/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Redeemable Amount</p>
                <p className="text-3xl font-bold mt-1">₹{redeemableRupees}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-peach/30 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-foreground/70" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Redeem Section */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Redeem Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-xl bg-gradient-to-r from-honey/20 to-peach/20 border border-honey/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Cash Reward</h3>
                <p className="text-muted-foreground">100 points = ₹10</p>
              </div>
              <div className="text-3xl font-bold text-primary">₹{redeemableRupees}</div>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-honey to-peach transition-all"
                style={{ width: `${Math.min((availablePoints % 100), 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {availablePoints % 100}/100 points towards next ₹10
            </p>
            <Button
              onClick={handleRedeem}
              disabled={availablePoints < 100 || redeeming}
              className="w-full gradient-accent text-white rounded-xl h-12 font-semibold"
            >
              {redeeming ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <IndianRupee className="w-5 h-5 mr-2" />
                  Redeem ₹{redeemableRupees}
                </>
              )}
            </Button>
          </div>
          {/* How it works */}
          <div className="space-y-4">
            <h3 className="font-semibold">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold mb-3">
                  1
                </div>
                <h4 className="font-medium">Complete Challenges</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload photos to prove completion and earn 10 points each
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-full gradient-mint flex items-center justify-center text-white font-bold mb-3">
                  2
                </div>
                <h4 className="font-medium">Collect Points</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Accumulate 100 points to unlock ₹10 reward
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-bold mb-3">
                  3
                </div>
                <h4 className="font-medium">Redeem & Earn</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Convert your points to real money in rupees
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Rewards;