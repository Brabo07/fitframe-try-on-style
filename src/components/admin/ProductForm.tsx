import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

// Use exact enum values from database
const frameStyleOptions = ["aviator", "wayfarer", "cat_eye", "round", "rectangular", "oversized", "geometric"] as const;
const frameMaterialOptions = ["metal", "plastic", "acetate", "titanium", "wood", "mixed"] as const;
const genderOptions = ["male", "female", "unisex"] as const;

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  brand: z.string().min(1, "Brand is required").max(50),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  frame_color: z.string().min(1, "Frame color is required"),
  frame_style: z.enum(frameStyleOptions),
  frame_material: z.enum(frameMaterialOptions),
  gender: z.enum(genderOptions),
  lens_width: z.coerce.number().min(0).optional().nullable(),
  bridge_width: z.coerce.number().min(0).optional().nullable(),
  temple_length: z.coerce.number().min(0).optional().nullable(),
  in_stock: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Tables<"glasses_products"> | null;
  onSuccess: () => void;
}

const ProductForm = ({ open, onOpenChange, product, onSuccess }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEditing = !!product;

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "FitFrame",
      description: "",
      price: 0,
      frame_color: "",
      frame_style: "rectangular",
      frame_material: "acetate",
      gender: "unisex",
      in_stock: true,
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        brand: product.brand,
        description: product.description || "",
        price: Number(product.price),
        frame_color: product.frame_color,
        frame_style: product.frame_style,
        frame_material: product.frame_material,
        gender: product.gender,
        lens_width: product.lens_width,
        bridge_width: product.bridge_width,
        temple_length: product.temple_length,
        in_stock: product.in_stock ?? true,
      });
      setImagePreview(product.image_url);
    } else {
      reset({
        name: "",
        brand: "FitFrame",
        description: "",
        price: 0,
        frame_color: "",
        frame_style: "rectangular",
        frame_material: "acetate",
        gender: "unisex",
        in_stock: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return product?.image_url || null;

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `glasses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const imageUrl = await uploadImage();

      const productData = {
        name: data.name,
        brand: data.brand,
        description: data.description || null,
        price: data.price,
        frame_color: data.frame_color,
        frame_style: data.frame_style,
        frame_material: data.frame_material,
        gender: data.gender,
        lens_width: data.lens_width || null,
        bridge_width: data.bridge_width || null,
        temple_length: data.temple_length || null,
        in_stock: data.in_stock,
        image_url: imageUrl,
      };

      if (isEditing && product) {
        const { error } = await supabase
          .from("glasses_products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("glasses_products")
          .insert(productData);

        if (error) throw error;
        toast.success("Product created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="Classic Aviator" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input id="brand" {...register("brand")} placeholder="FitFrame" />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦) *</Label>
              <Input id="price" type="number" {...register("price")} placeholder="18500" />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            {/* Frame Color */}
            <div className="space-y-2">
              <Label htmlFor="frame_color">Frame Color *</Label>
              <Input id="frame_color" {...register("frame_color")} placeholder="Gold" />
              {errors.frame_color && <p className="text-sm text-destructive">{errors.frame_color.message}</p>}
            </div>

            {/* Frame Style */}
            <div className="space-y-2">
              <Label>Frame Style *</Label>
              <Select onValueChange={(val) => setValue("frame_style", val as typeof frameStyleOptions[number])} value={watch("frame_style")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {frameStyleOptions.map((style) => (
                    <SelectItem key={style} value={style} className="capitalize">
                      {style.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frame Material */}
            <div className="space-y-2">
              <Label>Frame Material *</Label>
              <Select onValueChange={(val) => setValue("frame_material", val as typeof frameMaterialOptions[number])} value={watch("frame_material")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {frameMaterialOptions.map((material) => (
                    <SelectItem key={material} value={material} className="capitalize">
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select onValueChange={(val) => setValue("gender", val as typeof genderOptions[number])} value={watch("gender")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lens Width */}
            <div className="space-y-2">
              <Label htmlFor="lens_width">Lens Width (mm)</Label>
              <Input id="lens_width" type="number" {...register("lens_width")} placeholder="52" />
            </div>

            {/* Bridge Width */}
            <div className="space-y-2">
              <Label htmlFor="bridge_width">Bridge Width (mm)</Label>
              <Input id="bridge_width" type="number" {...register("bridge_width")} placeholder="18" />
            </div>

            {/* Temple Length */}
            <div className="space-y-2">
              <Label htmlFor="temple_length">Temple Length (mm)</Label>
              <Input id="temple_length" type="number" {...register("temple_length")} placeholder="140" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Elegant glasses with a modern design..." rows={3} />
          </div>

          {/* In Stock */}
          <div className="flex items-center gap-2">
            <Switch
              id="in_stock"
              checked={watch("in_stock")}
              onCheckedChange={(checked) => setValue("in_stock", checked)}
            />
            <Label htmlFor="in_stock">In Stock</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage}>
              {(isSubmitting || uploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
