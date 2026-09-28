export interface AppUser {
  id: string; // Supabase auth.users.id (uuid)
  email: string;
  createdAt: string;
}

export interface FavoriteRecord {
  id: string; // uuid, primary key
  userId: string; // FK -> auth.users.id
  jewelleryItemId: number; // FK into the static dataset by `id` (no DB FK — see Migration Document §3.2)
  createdAt: string;
}
