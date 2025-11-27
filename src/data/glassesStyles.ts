export interface GlassesStyle {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  category: string;
}

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

// SVG glasses templates for overlay
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
