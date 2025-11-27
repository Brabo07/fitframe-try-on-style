-- Add prescription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS prescription_sph_left DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS prescription_sph_right DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS prescription_cyl_left DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS prescription_cyl_right DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS prescription_axis_left INTEGER,
ADD COLUMN IF NOT EXISTS prescription_axis_right INTEGER,
ADD COLUMN IF NOT EXISTS prescription_add DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS prescription_pd DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS prescription_image_url TEXT,
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;