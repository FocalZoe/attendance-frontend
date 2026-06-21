import { createClient } from '@supabase/supabase-js';

/**
 * 獲取 Supabase 連線用戶端。
 * 會優先讀取本地儲存 (由系統設定頁面設定的 URL 與 Key)，
 * 其次讀取 Vite 的環境變數設定。
 */
export const getSupabaseClient = () => {
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!url || !key) {
    return null;
  }
  
  try {
    return createClient(url, key);
  } catch (error) {
    console.error('初始化 Supabase 用戶端時出錯:', error);
    return null;
  }
};
