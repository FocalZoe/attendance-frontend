import React, { useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Camera, 
  VideoOff, 
  Video, 
  FlaskConical, 
  Terminal, 
  ClipboardX,
  Lightbulb
} from 'lucide-react';
import ApiCodeBlock from './ApiCodeBlock';

/**
 * 控制中心 (Dashboard) 分頁組件
 */
const DashboardTab = ({
  totalStudents,
  presentCount,
  absentCount,
  attendanceRate,
  isMockMode,
  cameraActive,
  setCameraActive,
  detectedFaces,
  handleTriggerMockDetection,
  currentSession,
  supabaseUrl,
  supabaseKey,
  attendanceLogs,
  triggerToast,
  setActiveTab
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  // 控制相機串流與畫布渲染的生命週期
  useEffect(() => {
    if (isMockMode && cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => {
          console.warn("無法存取實體相機，切換為模擬串流環境", err);
          triggerToast("找不到實體視訊鏡頭，已自動啟用智慧模擬串流。", "info");
        });
      
      renderOverlay();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [cameraActive, isMockMode, detectedFaces]);

  const cleanupCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  const renderOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製偵測到的人臉標記框
    detectedFaces.forEach(face => {
      const { x, y, width, height, label, conf, matchStatus } = face;
      
      let color = '#ec4899'; // 預設粉色
      if (matchStatus === 'present') color = '#10b981'; // 簽到成功綠色
      if (matchStatus === 'unknown') color = '#ef4444'; // 未知紅色
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = color;
      const len = 15;
      const t = 4;
      // 左上角角標
      ctx.fillRect(x - t/2, y - t/2, len, t);
      ctx.fillRect(x - t/2, y - t/2, t, len);
      // 右上角角標
      ctx.fillRect(x + width - len + t/2, y - t/2, len, t);
      ctx.fillRect(x + width - t/2, y - t/2, t, len);
      // 左下角角標
      ctx.fillRect(x - t/2, y + height - t/2, len, t);
      ctx.fillRect(x - t/2, y + height - len + t/2, t, len);
      // 右下角角標
      ctx.fillRect(x + width - len + t/2, y + height - t/2, len, t);
      ctx.fillRect(x + width - t/2, y + height - len + t/2, t, len);

      // 標籤背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y - 25, width, 25);
      
      // 標籤文字
      ctx.fillStyle = '#fff';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${label} (${Math.round(conf * 100)}%)`, x + 8, y - 8);
    });

    animationFrameId.current = requestAnimationFrame(renderOverlay);
  };

  return (
    <div>
      {/* 數據看板列 */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">註冊學生總數</span>
            <span className="stat-value">{totalStudents} 人</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">今日出席人數</span>
            <span className="stat-value">{presentCount} 人</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">缺席人數</span>
            <span className="stat-value">{absentCount} 人</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">出席率</span>
            <span className="stat-value">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      <div className="panel-grid">
        {/* 左側主面板：影像預覽或硬體串接儀表板 */}
        <div className="card">
          {isMockMode ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>教室 AI 點名即時串流 (YOLOv8)</h3>
              </div>
              
              <div className="camera-wrapper" style={{ maxHeight: '380px' }}>
                <div className="camera-status-tag">
                  <span className="status-indicator" style={{ backgroundColor: cameraActive ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                  {cameraActive ? 'LIVE' : 'STANDBY'}
                </div>
                {cameraActive && <div className="scan-line" />}
                
                {cameraActive ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <video 
                      ref={videoRef} 
                      className="camera-feed"
                      playsInline 
                      muted 
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                    />
                    <canvas 
                      ref={canvasRef} 
                      width="640" 
                      height="360" 
                      className="camera-overlay-canvas"
                      style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      background: '#151726',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      gap: '12px',
                      zIndex: 0
                    }}>
                      <Camera size={44} color="var(--text-muted)" />
                      <span>正在載入模擬監控影像畫面...</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'radial-gradient(circle, #1a1c29 0%, #0d0f18 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    gap: '16px'
                  }}>
                    <VideoOff size={48} color="var(--text-muted)" />
                    <p style={{ margin: '0 0 10px 0' }}>相機未啟動。請點擊上方按鈕開啟即時 AI 點名串流。</p>
                    <button 
                      type="button"
                      className="btn btn-primary" 
                      onClick={() => {
                        setActiveTab('camera');
                        setCameraActive(true);
                      }} 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Camera size={16} />
                      開啟點名相機
                    </button>
                  </div>
                )}
              </div>

              {cameraActive && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={handleTriggerMockDetection} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FlaskConical size={16} />
                    模擬人臉辨識簽到
                  </button>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Lightbulb size={14} style={{ color: 'var(--accent-orange)' }} />
                    提示：點擊按鈕可隨機模擬「偵測學生」或「警報未登錄人臉」效果。
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="cloud-dashboard-panel" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Terminal size={20} color="var(--accent-cyan)" />
                  雲端監控與硬體串接儀表板
                </h3>
                <span className="badge badge-connected animate-pulse-fast" style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className="status-indicator pulsing" style={{ backgroundColor: 'var(--accent-green)', width: '6px', height: '6px' }} />
                  即時監聽中
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 雲端連線狀態卡 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>活動課程名稱</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSession.class_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>課程 Batch ID (UUID)</div>
                      <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentSession.id}</div>
                    </div>
                  </div>
                </div>

                {/* 串接說明文字 */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    本系統已開啟<strong>雲端實戰監控</strong>。請設定外部 YOLOv8 影像辨識主機或 Ameba 鏡頭端點，將點名資料透過 HTTP POST 寫入 Supabase 資料表 <code style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>attendance_records</code>：
                  </p>
                </div>

                {/* API 串接程式碼區塊 */}
                <ApiCodeBlock currentSessionId={currentSession.id} supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />
              </div>
            </div>
          )}
        </div>

        {/* 右側面板：最新簽到列表 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>最新簽到動態</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>即時更新</span>
          </div>
          
          <div className="recent-list">
            {attendanceLogs.length > 0 ? (
              attendanceLogs.map((log) => (
                <div key={log.id} className={`attendance-card ${log.isNew ? 'new-arrival' : ''}`}>
                  <div className="student-avatar detected" style={{ overflow: 'hidden' }}>
                    {log.avatar && log.avatar.startsWith('data:') ? (
                      <img src={log.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      log.avatar || '🎓'
                    )}
                  </div>
                  <div className="attendance-info">
                    <div className="student-name">{log.student_name}</div>
                    <div className="student-meta">{log.student_number} | AI 置信度 {Math.round(log.confidence * 100)}%</div>
                  </div>
                  <div className="attendance-time-status">
                    <span className="badge badge-present">已簽到</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <ClipboardX size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <p>今日尚無任何點名資料。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
