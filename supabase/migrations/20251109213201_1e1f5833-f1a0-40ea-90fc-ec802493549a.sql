-- Create enum types for better data validation
CREATE TYPE face_shape AS ENUM ('oval', 'round', 'square', 'heart', 'diamond', 'oblong');
CREATE TYPE frame_style AS ENUM ('aviator', 'wayfarer', 'cat_eye', 'round', 'rectangular', 'oversized', 'geometric');
CREATE TYPE frame_material AS ENUM ('metal', 'plastic', 'acetate', 'titanium', 'wood', 'mixed');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'unisex');

-- Create profiles table for extended user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  gender gender_type,
  face_shape face_shape,
  vision_prescription TEXT,
  preferred_styles frame_style[],
  preferred_colors TEXT[],
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create glasses_products table
CREATE TABLE public.glasses_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  frame_style frame_style NOT NULL,
  frame_material frame_material NOT NULL,
  frame_color TEXT NOT NULL,
  lens_width INTEGER,
  bridge_width INTEGER,
  temple_length INTEGER,
  gender gender_type NOT NULL,
  suitable_face_shapes face_shape[],
  image_url TEXT,
  additional_images TEXT[],
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.glasses_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Glasses products policies (public read, admin write)
CREATE POLICY "Anyone can view glasses products"
  ON public.glasses_products FOR SELECT
  TO authenticated
  USING (true);

-- User favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample glasses products
INSERT INTO public.glasses_products (name, brand, description, price, frame_style, frame_material, frame_color, lens_width, bridge_width, temple_length, gender, suitable_face_shapes, image_url, in_stock) VALUES
('Classic Aviator', 'FitFrame', 'Timeless aviator style with premium metal frame', 149.99, 'aviator', 'metal', 'Gold', 58, 14, 140, 'unisex', ARRAY['oval'::face_shape, 'square'::face_shape, 'heart'::face_shape], 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop', true),
('Modern Wayfarer', 'FitFrame', 'Contemporary take on the classic wayfarer design', 129.99, 'wayfarer', 'acetate', 'Black', 52, 20, 145, 'unisex', ARRAY['round'::face_shape, 'oval'::face_shape, 'diamond'::face_shape], 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=600&fit=crop', true),
('Elegant Cat Eye', 'FitFrame', 'Sophisticated cat eye frames for a bold statement', 139.99, 'cat_eye', 'acetate', 'Tortoise', 54, 16, 140, 'female', ARRAY['heart'::face_shape, 'square'::face_shape, 'round'::face_shape], 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&h=600&fit=crop', true),
('Minimalist Round', 'FitFrame', 'Sleek round frames with titanium construction', 159.99, 'round', 'titanium', 'Silver', 48, 20, 145, 'unisex', ARRAY['square'::face_shape, 'oblong'::face_shape, 'diamond'::face_shape], 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop', true),
('Bold Rectangular', 'FitFrame', 'Strong rectangular frames for a professional look', 119.99, 'rectangular', 'plastic', 'Blue', 56, 18, 140, 'male', ARRAY['round'::face_shape, 'oval'::face_shape, 'heart'::face_shape], 'https://images.unsplash.com/photo-1586465251291-c77d83611a96?w=800&h=600&fit=crop', true),
('Oversized Chic', 'FitFrame', 'Fashion-forward oversized frames', 169.99, 'oversized', 'acetate', 'Brown', 60, 16, 145, 'female', ARRAY['oval'::face_shape, 'diamond'::face_shape, 'oblong'::face_shape], 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=800&h=600&fit=crop', true);