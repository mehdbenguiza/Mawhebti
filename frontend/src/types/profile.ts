export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  skills?: string[];
}

export interface ProfileResponsePrivate {
  id: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  skills?: string[];
}
