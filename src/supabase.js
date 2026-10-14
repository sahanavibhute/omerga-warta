import { createClient } from '@supabase/supabase-js';

// Supabase Cloud Configuration
// If environment variables are provided in Vercel, Supabase runs live.
// Otherwise, it falls back gracefully to local storage so the site never crashes.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Fetch latest news articles from Supabase with automatic pagination
 * Limits query to 30 posts to ensure ultra-fast load times even with 50,000+ posts in database.
 */
export async function fetchNewsFromSupabase(limitCount = 30) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.warn('Supabase fetch error, fallback to local storage:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Publish news story to Supabase
 */
export async function addNewsToSupabase(story) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('news_posts')
      .insert([{
        title_mr: story.title_mr,
        title_en: story.title_en || '',
        category_mr: story.category_mr,
        category_en: story.category_en || '',
        content_mr: story.content_mr,
        content_en: story.content_en || '',
        image: story.image || '',
        date: story.date || new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        author: story.author || 'महेश निंबरगे'
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return null;
    }
    return data && data[0];
  } catch (err) {
    console.error('Supabase insert exception:', err);
    return null;
  }
}

/**
 * Update an existing news story in Supabase
 */
export async function updateNewsInSupabase(id, updatedStory) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('news_posts')
      .update({
        title_mr: updatedStory.title_mr,
        title_en: updatedStory.title_en || '',
        category_mr: updatedStory.category_mr,
        category_en: updatedStory.category_en || '',
        content_mr: updatedStory.content_mr,
        content_en: updatedStory.content_en || '',
        image: updatedStory.image || ''
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase update exception:', err);
    return false;
  }
}

/**
 * Delete a news story in Supabase
 */
export async function deleteNewsFromSupabase(id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('news_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return false;
  }
}
