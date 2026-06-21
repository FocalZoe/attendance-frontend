import React from 'react';
import { Save, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

/**
 * 系統設定分頁組件
 */
const SettingsTab = ({
  isMockMode,
  setIsMockMode,
  supabaseStatus,
  supabaseErrorMsg,
  supabaseUrl,
  setSupabaseUrl,
  supabaseKey,
  setSupabaseKey,
  triggerToast
}) => {
  return (
    <div className="card" style={{ maxWidth: '650px', margin: '0 auto', width: '100%', textAlign: 'left' }}>
      <h2>系統設定 (Configuration)</h2>
      <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>調整 AI 自動點名系統的連線資訊與功能運作模式。</p>
      
      {/* 運作模式切換 */}
      <div className="form-group">
        <label className="form-label">運作模式</label>
        <div 
          className={`toggle-container ${!isMockMode ? 'active' : ''}`}
          onClick={() => setIsMockMode(prev => !prev)}
        >
          <div className="toggle-switch" />
          <span style={{ fontWeight: 'bold' }}>
            {isMockMode ? '展示模擬模式 (不串接 Supabase)' : 'Supabase 連線模式'}
          </span>
        </div>
        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          * 「展示模擬模式」適合無資料庫或本機展示時使用，所有操作只會儲存在瀏覽器記憶體中。
        </span>
      </div>

      {!isMockMode && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          borderRadius: 'var(--border-radius-sm)', 
          background: supabaseStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 
                      supabaseStatus === 'connecting' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${
            supabaseStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 
            supabaseStatus === 'connecting' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }`,
          fontSize: '0.85rem'
        }}>
          <strong style={{ 
            color: supabaseStatus === 'connected' ? 'var(--accent-green)' : 
                   supabaseStatus === 'connecting' ? 'var(--accent-cyan)' : 'var(--accent-red)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            連線狀態：
            {supabaseStatus === 'connected' && (
              <>
                <CheckCircle2 size={16} />
                已成功連接雲端資料庫
              </>
            )}
            {supabaseStatus === 'connecting' && (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} />
                正在進行握手驗證中...
              </>
            )}
            {supabaseStatus === 'error' && (
              <>
                <XCircle size={16} />
                連線失敗
              </>
            )}
          </strong>
          {supabaseErrorMsg && (
            <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
              失敗原因: {supabaseErrorMsg}
            </p>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '24px 0' }} />

      {/* Supabase 連線欄位 */}
      <div style={{ opacity: isMockMode ? 0.5 : 1, transition: 'var(--transition-smooth)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Supabase 資料庫連線配置</h3>
        
        <div className="form-group">
          <label className="form-label">Supabase Project URL</label>
          <input 
            type="text" 
            className="form-control" 
            disabled={isMockMode}
            placeholder="https://your-project.supabase.co" 
            value={supabaseUrl}
            onChange={e => setSupabaseUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Supabase Anon Key (API 公鑰)</label>
          <input 
            type="password" 
            className="form-control" 
            disabled={isMockMode}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
            value={supabaseKey}
            onChange={e => setSupabaseKey(e.target.value)}
          />
        </div>
      </div>

      <button 
        type="button"
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        onClick={() => {
          triggerToast("系統連線設定已儲存！", "success");
        }}
      >
        <Save size={16} />
        儲存設定
      </button>
    </div>
  );
};

export default SettingsTab;
