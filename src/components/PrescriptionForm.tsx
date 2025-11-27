import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, Upload, Save, FileText } from "lucide-react";

interface PrescriptionFormProps {
  onSave?: () => void;
  initialData?: {
    sphLeft?: number | null;
    sphRight?: number | null;
    cylLeft?: number | null;
    cylRight?: number | null;
    axisLeft?: number | null;
    axisRight?: number | null;
    add?: number | null;
    pd?: number | null;
    imageUrl?: string | null;
  };
}

const PrescriptionForm = ({ onSave, initialData }: PrescriptionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    sphLeft: initialData?.sphLeft?.toString() || "",
    sphRight: initialData?.sphRight?.toString() || "",
    cylLeft: initialData?.cylLeft?.toString() || "",
    cylRight: initialData?.cylRight?.toString() || "",
    axisLeft: initialData?.axisLeft?.toString() || "",
    axisRight: initialData?.axisRight?.toString() || "",
    add: initialData?.add?.toString() || "",
    pd: initialData?.pd?.toString() || "",
    imageUrl: initialData?.imageUrl || ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to upload prescriptions");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-prescription-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) {
        // Create bucket if it doesn't exist (handled by toast)
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload Notice",
          description: "Prescription saved locally. Image upload requires storage setup.",
          variant: "default"
        });
        return;
      }

      const { data } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, imageUrl: data.publicUrl }));
      toast({ title: "Prescription image uploaded successfully" });
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to save prescription");

      const { error } = await supabase
        .from('profiles')
        .update({
          prescription_sph_left: formData.sphLeft ? parseFloat(formData.sphLeft) : null,
          prescription_sph_right: formData.sphRight ? parseFloat(formData.sphRight) : null,
          prescription_cyl_left: formData.cylLeft ? parseFloat(formData.cylLeft) : null,
          prescription_cyl_right: formData.cylRight ? parseFloat(formData.cylRight) : null,
          prescription_axis_left: formData.axisLeft ? parseInt(formData.axisLeft) : null,
          prescription_axis_right: formData.axisRight ? parseInt(formData.axisRight) : null,
          prescription_add: formData.add ? parseFloat(formData.add) : null,
          prescription_pd: formData.pd ? parseFloat(formData.pd) : null,
          prescription_image_url: formData.imageUrl || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "Prescription saved successfully" });
      onSave?.();
    } catch (error: any) {
      toast({
        title: "Error saving prescription",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-premium animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Prescription Details
        </CardTitle>
        <CardDescription>
          Enter your prescription details for customized lenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SPH (Sphere) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">SPH (Sphere)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Left Eye (OS)</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="-2.00"
                value={formData.sphLeft}
                onChange={(e) => handleChange('sphLeft', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Right Eye (OD)</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="-1.75"
                value={formData.sphRight}
                onChange={(e) => handleChange('sphRight', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* CYL (Cylinder) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">CYL (Cylinder)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Left Eye (OS)</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="-0.50"
                value={formData.cylLeft}
                onChange={(e) => handleChange('cylLeft', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Right Eye (OD)</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="-0.75"
                value={formData.cylRight}
                onChange={(e) => handleChange('cylRight', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* AXIS */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">AXIS</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Left Eye (OS)</Label>
              <Input
                type="number"
                min="1"
                max="180"
                placeholder="90"
                value={formData.axisLeft}
                onChange={(e) => handleChange('axisLeft', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Right Eye (OD)</Label>
              <Input
                type="number"
                min="1"
                max="180"
                placeholder="85"
                value={formData.axisRight}
                onChange={(e) => handleChange('axisRight', e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* ADD and PD */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">ADD (Optional)</Label>
            <Input
              type="number"
              step="0.25"
              placeholder="+1.50"
              value={formData.add}
              onChange={(e) => handleChange('add', e.target.value)}
              className="transition-all focus:scale-[1.02]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Pupillary Distance (PD)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="62"
              value={formData.pd}
              onChange={(e) => handleChange('pd', e.target.value)}
              className="transition-all focus:scale-[1.02]"
            />
          </div>
        </div>

        {/* Upload prescription image */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Upload Doctor's Prescription</Label>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-all">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload image"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {formData.imageUrl && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <FileText className="h-4 w-4" />
                <span>Uploaded</span>
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full hover-lift"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Prescription"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PrescriptionForm;
