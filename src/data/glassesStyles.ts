import type { Tables } from "@/integrations/supabase/types";

export interface GlassesStyle {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  category: string;
}

// Demo glasses for the catalog demo page
export const glassesStyles: GlassesStyle[] = [
  {
    id: "aviator-gold",
    name: "Classic Aviator",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=200&fit=crop",
    color: "Gold",
    category: "Aviator",
  },
  {
    id: "wayfarer-black",
    name: "Wayfarer Classic",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=200&fit=crop",
    color: "Black",
    category: "Wayfarer",
  },
  {
    id: "round-tortoise",
    name: "Round Vintage",
    imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=200&fit=crop",
    color: "Tortoise",
    category: "Round",
  },
  {
    id: "cat-eye-pink",
    name: "Cat Eye Chic",
    imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=200&fit=crop",
    color: "Pink",
    category: "Cat Eye",
  },
  {
    id: "rectangular-silver",
    name: "Modern Rectangle",
    imageUrl: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=200&fit=crop",
    color: "Silver",
    category: "Rectangular",
  },
  {
    id: "oversized-brown",
    name: "Oversized Glam",
    imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=200&fit=crop",
    color: "Brown",
    category: "Oversized",
  },
  {
    id: "geometric-blue",
    name: "Geometric Edge",
    imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=200&fit=crop",
    color: "Blue",
    category: "Geometric",
  },
  {
    id: "clubmaster-black",
    name: "Clubmaster Style",
    imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=200&fit=crop",
    color: "Black/Gold",
    category: "Clubmaster",
  },
];

// Color mapping for frame colors to actual hex values
const colorMap: Record<string, string> = {
  gold: "#D4AF37",
  black: "#1a1a1a",
  tortoise: "#8B4513",
  brown: "#8B4513",
  pink: "#FF69B4",
  silver: "#C0C0C0",
  blue: "#4169E1",
  red: "#DC143C",
  white: "#F5F5F5",
  gray: "#808080",
  grey: "#808080",
  green: "#228B22",
  purple: "#800080",
};

// Get frame color from product
export const getFrameColorHex = (color: string): string => {
  const normalizedColor = color.toLowerCase();
  return colorMap[normalizedColor] || "#1a1a1a";
};

// Get lens color with transparency based on frame color
export const getLensColor = (color: string): string => {
  const normalizedColor = color.toLowerCase();
  switch (normalizedColor) {
    case "gold": return "rgba(139, 90, 43, 0.3)";
    case "black": return "rgba(30, 30, 30, 0.4)";
    case "tortoise": 
    case "brown": return "rgba(139, 69, 19, 0.3)";
    case "pink": return "rgba(255, 182, 193, 0.3)";
    case "silver": 
    case "gray":
    case "grey": return "rgba(128, 128, 128, 0.3)";
    case "blue": return "rgba(65, 105, 225, 0.3)";
    case "red": return "rgba(220, 20, 60, 0.3)";
    case "white": return "rgba(245, 245, 245, 0.2)";
    case "green": return "rgba(34, 139, 34, 0.3)";
    case "purple": return "rgba(128, 0, 128, 0.3)";
    default: return "rgba(30, 30, 30, 0.35)";
  }
};

// Convert database product to glasses template format
export const productToGlassesTemplate = (product: Tables<"glasses_products">) => {
  return {
    frameColor: getFrameColorHex(product.frame_color),
    lensColor: getLensColor(product.frame_color),
  };
};

// SVG glasses templates for overlay (for demo catalog)
export const glassesTemplates: Record<string, { frameColor: string; lensColor: string }> = {
  "aviator-gold": { frameColor: "#D4AF37", lensColor: "rgba(139, 90, 43, 0.3)" },
  "wayfarer-black": { frameColor: "#1a1a1a", lensColor: "rgba(30, 30, 30, 0.4)" },
  "round-tortoise": { frameColor: "#8B4513", lensColor: "rgba(139, 69, 19, 0.3)" },
  "cat-eye-pink": { frameColor: "#FF69B4", lensColor: "rgba(255, 182, 193, 0.3)" },
  "rectangular-silver": { frameColor: "#C0C0C0", lensColor: "rgba(128, 128, 128, 0.3)" },
  "oversized-brown": { frameColor: "#8B4513", lensColor: "rgba(139, 69, 19, 0.4)" },
  "geometric-blue": { frameColor: "#4169E1", lensColor: "rgba(65, 105, 225, 0.3)" },
  "clubmaster-black": { frameColor: "#1a1a1a", lensColor: "rgba(30, 30, 30, 0.35)" },
};
