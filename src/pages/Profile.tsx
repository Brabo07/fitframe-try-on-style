import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const faceShapes = ["oval", "round", "square", "heart", "diamond", "oblong"];
const frameStyles = ["aviator", "wayfarer", "cat_eye", "round", "rectangular", "oversized", "geometric"];
const frameColors = ["Black", "Tortoise", "Gold", "Silver", "Blue", "Brown", "Clear", "Pink"];

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [faceShape, setFaceShape] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setFullName(data.full_name || "");
        setGender(data.gender || "");
        setFaceShape(data.face_shape || "");
        setSelectedStyles(data.preferred_styles || []);
        setSelectedColors(data.preferred_colors || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          gender: gender as any,
          face_shape: faceShape as any,
          preferred_styles: selectedStyles as any,
          preferred_colors: selectedColors,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Profile</h1>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unisex">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Face Shape</Label>
              <Select value={faceShape} onValueChange={setFaceShape}>
                <SelectTrigger>
                  <SelectValue placeholder="Select face shape" />
                </SelectTrigger>
                <SelectContent>
                  {faceShapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape.charAt(0).toUpperCase() + shape.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Preferred Frame Styles</Label>
              <div className="flex flex-wrap gap-2">
                {frameStyles.map((style) => (
                  <Badge
                    key={style}
                    variant={selectedStyles.includes(style) ? "default" : "outline"}
                    className="cursor-pointer text-sm px-4 py-2"
                    onClick={() => toggleStyle(style)}
                  >
                    {style.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred Frame Colors</Label>
              <div className="flex flex-wrap gap-2">
                {frameColors.map((color) => (
                  <Badge
                    key={color}
                    variant={selectedColors.includes(color) ? "default" : "outline"}
                    className="cursor-pointer text-sm px-4 py-2"
                    onClick={() => toggleColor(color)}
                  >
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
