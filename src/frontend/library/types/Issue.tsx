export type Issue = {
  id?: number;
  title: string;
  description: string | null;
  location: string | null;
  status?: string;
  created_at?: string;
  votes?: number;
  user_email?: string | null;
  user_id?: number | null;
  has_voted?: number | boolean;
  is_author_followed?: number | boolean;
  kategorie?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  statusComment?: string;
  commentCount?: number;
  is_private?: number | boolean;
  reactions?: { emoji: string; count: number }[];
  user_reaction?: string | null;
  user_username?: string | null;
  user_profile_pic_url?: string | null;
}

