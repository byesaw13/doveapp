import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  must_change_password?: boolean;
  password_changed_at?: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  avatar_url?: string;
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update current user's profile
 */
export async function updateCurrentUserProfile(
  updates: UserProfileUpdate
): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }

  return data;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw new Error('Failed to upload avatar');
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

  return data.publicUrl;
}
