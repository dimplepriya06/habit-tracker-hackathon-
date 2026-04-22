import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Palette, Save } from "lucide-react";
interface Profile {
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string;
  background: string;
}
const themes = [
  { id: "pastel", name: "Pastel Dream", colors: ["#c4b5fd", "#a5f3fc", "#fcd5ce"] },
  { id: "ocean", name: "Ocean Breeze", colors: ["#0ea5e9", "#22d3ee", "#a5f3fc"] },
  { id: "forest", name: "Forest Calm", colors: ["#22c55e", "#86efac", "#dcfce7"] },
  { id: "sunset", name: "Sunset Glow", colors: ["#fb923c", "#fbbf24", "#fef08a"] },
  { id: "berry", name: "Berry Mix", colors: ["#ec4899", "#f472b6", "#fbcfe8"] },
];
const backgrounds = [
  { id: "default", name: "Default" },
  { id: "gradient", name: "Gradient" },
  { id: "minimal", name: "Minimal" },
  { id: "dots", name: "Dots Pattern" },
];
const Settings = () => {
  const [profile, setProfile] = useState<Profile>({
    username: "",
    bio: "",
    avatar_url: "",
    theme: "pastel",
    background: "default",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url, theme, background")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile({
          username: data.username || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          theme: data.theme || "pastel",
          background: data.background || "default",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          theme: profile.theme,
          background: profile.background,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({
        title: "Settings Saved! ✨",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your profile and app appearance ⚙️</p>
      </div>
      {/* Profile Section */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              value={profile.username || ""}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="Your display name"
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="mt-1 rounded-xl"
              rows={3}
            />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input
              value={profile.avatar_url || ""}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>
      {/* Theme Section */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Color Theme</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setProfile({ ...profile, theme: theme.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    profile.theme === theme.id
                      ? "border-primary shadow-soft"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {theme.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-3 block">Background Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setProfile({ ...profile, background: bg.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    profile.background === bg.id
                      ? "border-primary shadow-soft"
                      : "border-transparent hover:border-border"
                  } bg-muted/30`}
                >
                  <span className="text-sm font-medium">{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full md:w-auto gradient-primary text-white rounded-xl h-12 px-8"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
};
export default Settings;