import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  Monitor, 
  Users, 
  History, 
  Settings as SettingsIcon, 
  Bot 
} from 'lucide-react';

/**
 * 側邊欄導航組件
 */
const Sidebar = ({ activeTab, setActiveTab, isMockMode, supabaseStatus }) => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">
          <Bot size={22} color="#fff" />
        </div>
        <span className="logo-text">AI Attendance</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ul className="nav-links">
          <li>
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard />
              控制中心
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'camera' ? 'active' : ''}`} 
              onClick={() => setActiveTab('camera')}
            >
              {isMockMode ? <Camera /> : <Monitor />}
              {isMockMode ? '即時 AI 點名' : '即時投影看板'}
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} 
              onClick={() => setActiveTab('students')}
            >
              <Users />
              學生註冊名冊
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
              onClick={() => setActiveTab('history')}
            >
              <History />
              歷史出勤紀錄
            </div>
          </li>
          <li>
            <div 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon />
              系統設定
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className={`status-badge ${
            isMockMode ? 'mock' : 
            supabaseStatus === 'connected' ? 'connected' : 
            supabaseStatus === 'connecting' ? 'connecting' : 'error'
          }`}>
            <span className="status-indicator pulsing" />
            {isMockMode ? '展示模擬模式' : 
             supabaseStatus === 'connected' ? 'Supabase 已連線' : 
             supabaseStatus === 'connecting' ? '資料庫連線中...' : '資料庫連線失敗'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ameba 端點: 已就緒
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
