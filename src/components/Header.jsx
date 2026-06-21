import React from 'react';
import { Pencil, DatabaseBackup, VideoOff, Video } from 'lucide-react';

/**
 * 頁首標題與操作區組件
 */
const Header = ({
  currentSession,
  isEditingSession,
  setIsEditingSession,
  editingSessionName,
  setEditingSessionName,
  handleSaveSessionName,
  isMockMode,
  handleResetDefaults,
  cameraActive,
  setCameraActive,
  setActiveTab
}) => {
  return (
    <header className="main-header">
      <div className="header-title" style={{ textAlign: 'left' }}>
        <h1>自動化點名控制台</h1>
        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 0 0 0' }}>
          課程批次：
          {isEditingSession ? (
            <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ padding: '4px 8px', fontSize: '0.85rem', width: '200px', display: 'inline-block', height: '30px' }}
                value={editingSessionName}
                onChange={e => setEditingSessionName(e.target.value)}
                autoFocus
              />
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                onClick={handleSaveSessionName}
              >
                儲存
              </button>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                onClick={() => setIsEditingSession(false)}
              >
                取消
              </button>
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{currentSession.class_name}</span>
              <span style={{ color: 'var(--text-secondary)' }}>({currentSession.date})</span>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '2px 6px',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => {
                  setEditingSessionName(currentSession.class_name);
                  setIsEditingSession(true);
                }}
              >
                <Pencil size={12} />
                修改名稱
              </button>
            </>
          )}
        </p>
      </div>
      <div className="header-actions">
        {isMockMode ? (
          <>
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={handleResetDefaults} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <DatabaseBackup size={16} />
              載入範例資料
            </button>
            <button 
              type="button"
              className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'}`} 
              onClick={() => {
                setActiveTab('camera');
                setCameraActive(p => !p);
              }} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {cameraActive ? <VideoOff size={16} /> : <Video size={16} />}
              {cameraActive ? '關閉點名相機' : '啟動自動點名'}
            </button>
          </>
        ) : (
          <span className="badge badge-connected" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.85rem' }}>
            <span className="status-indicator pulsing" style={{ backgroundColor: 'var(--accent-green)' }} />
            已連接至雲端資料庫
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
