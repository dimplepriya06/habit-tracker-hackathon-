import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Check, X } from "lucide-react";

interface PhotoUploadProps {
  challengeId: string;
  onComplete: () => void;
}

const PhotoUpload = ({ challengeId, onComplete }: PhotoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async () => {
    if (!selectedFile) {
      toast({
        title: "Photo Required",
        description: "Please upload a photo to complete the challenge",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];

      // For now, we'll store the photo as a base64 string (in production, use Supabase Storage)
      // Convert file to base64 for demo purposes
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const photoUrl = reader.result as string;

        // Update or insert daily progress
        const { error: progressError } = await supabase
          .from("daily_progress")
          .upsert({
            user_id: user.id,
            challenge_id: challengeId,
            completion_date: today,
            is_completed: true,
            photo_url: photoUrl,
            points_earned: 10,
          }, {
            onConflict: 'user_id,challenge_id,completion_date'
          });

        if (progressError) throw progressError;

        // Update user's total points
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("user_id", user.id)
          .maybeSingle();

        const newPoints = (profile?.total_points || 0) + 10;

        await supabase
          .from("profiles")
          .update({ total_points: newPoints })
          .eq("user_id", user.id);

        toast({
          title: "Challenge Completed! 🎉",
          description: "You earned 10 points!",
        });

        onComplete();
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-6 py-4">
      <p className="text-muted-foreground text-center">
        Upload a photo to prove you completed today's challenge and earn 10 points!
      </p>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-xl"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={clearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
          <Image className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">Click to upload photo</p>
          <p className="text-sm text-muted-foreground/70 mt-1">JPG, PNG or GIF</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}

      <Button
        onClick={handleComplete}
        disabled={!selectedFile || uploading}
        className="w-full gradient-primary text-white rounded-xl h-12"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Complete Challenge (+10 pts)
          </>
        )}
      </Button>
    </div>
  );
};

export default PhotoUpload;
