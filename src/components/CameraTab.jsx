import React, { useEffect, useRef } from 'react';
import { VideoOff, Video, FlaskConical, Bot, Monitor, Lightbulb } from 'lucide-react';

/**
 * 即時 AI 點名 / 即時投影看板分頁組件
 */
const CameraTab = ({
  isMockMode,
  cameraActive,
  setCameraActive,
  detectedFaces,
  handleTriggerMockDetection,
  currentSession,
  presentCount,
  absentCount,
  attendanceRate,
  attendanceLogs,
  triggerToast
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  // 控制模擬點名相機的生命週期
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
          console.warn("無法開啟模擬點名攝影機:", err);
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
    
    detectedFaces.forEach(face => {
      const { x, y, width, height, label, conf, matchStatus } = face;
      
      let color = '#ec4899';
      if (matchStatus === 'present') color = '#10b981';
      if (matchStatus === 'unknown') color = '#ef4444';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = color;
      const len = 15;
      const t = 4;
      ctx.fillRect(x - t/2, y - t/2, len, t);
      ctx.fillRect(x - t/2, y - t/2, t, len);
      ctx.fillRect(x + width - len + t/2, y - t/2, len, t);
      ctx.fillRect(x + width - t/2, y - t/2, t, len);
      ctx.fillRect(x - t/2, y + height - t/2, len, t);
      ctx.fillRect(x - t/2, y + height - len + t/2, t, len);
      ctx.fillRect(x + width - len + t/2, y + height - t/2, len, t);
      ctx.fillRect(x + width - t/2, y + height - len + t/2, t, len);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y - 25, width, 25);
      
      ctx.fillStyle = '#fff';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${label} (${Math.round(conf * 100)}%)`, x + 8, y - 8);
    });

    animationFrameId.current = requestAnimationFrame(renderOverlay);
  };

  return (
    isMockMode ? (
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', textAlign: 'left' }}>
        <h2>AI 影像辨識即時點名 (模擬)</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>系統會透過鏡頭影像擷取學生人臉特徵，並與本機資料庫特徵比對進行簽到。</p>
        
        <div className="camera-wrapper" style={{ width: '100%', marginBottom: '20px' }}>
          <div className="camera-status-tag">
            <span className="status-indicator" style={{ backgroundColor: cameraActive ? 'var(--accent-green)' : 'var(--text-muted)' }} />
            {cameraActive ? 'LIVE VIDEO STREAMING' : 'CAMERA OFF'}
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
                zIndex: 0
              }}>
                <span>正在擷取攝影機畫面...</span>
              </div>
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: '#0e1017', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '15px'
            }}>
              <VideoOff size={48} color="var(--text-secondary)" />
              <p style={{ color: 'var(--text-secondary)' }}>相機尚未啟動，請點擊下方按鈕開啟</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'}`} 
            onClick={() => setCameraActive(prev => !prev)} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {cameraActive ? <VideoOff size={16} /> : <Video size={16} />}
            {cameraActive ? '關閉相機' : '開啟相機'}
          </button>
          {cameraActive && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleTriggerMockDetection} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FlaskConical size={16} />
              模擬 AI 偵測點名
            </button>
          )}
        </div>
        
        {cameraActive && (
          <div className="card" style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <Bot size={18} color="var(--accent-purple)" />
              影像辨識邏輯說明
            </h4>
            <ol style={{ textAlign: 'left', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>人臉偵測 (YOLOv8)</strong>：即時尋找畫面中出現的人臉位置並劃記紅色/粉色外框。</li>
              <li><strong>特徵比對 (Face Recognition)</strong>：從裁切後的人臉圖像提取 128 維特徵，與資料庫進行比對。</li>
              <li><strong>雲端同步 (Supabase)</strong>：當特徵距離小於 0.6，判定簽到成功，點名綠框亮起，發送 JSON 至資料庫並播放提示音。</li>
            </ol>
          </div>
        )}
      </div>
    ) : (
      /* Supabase 連線模式：即時簽到大投影看板 */
      <div className="projection-board-container" style={{ textAlign: 'left' }}>
        <div className="projection-header">
          <div>
            <h2 className="projection-title" style={{ margin: 0, color: '#fff', fontSize: '1.8rem', fontWeight: 700 }}>{currentSession.class_name}</h2>
            <p className="projection-subtitle" style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              授課日期：{currentSession.date} | 雲端資料庫已同步
            </p>
          </div>
          <div className="projection-status-badge">
            <span className="status-indicator pulsing-green" style={{ backgroundColor: 'var(--accent-green)' }} />
            雲端即時連線監聽中
          </div>
        </div>

        <div className="projection-stats-row">
          <div className="proj-stat-card">
            <span className="proj-stat-label">已出席人數</span>
            <span className="proj-stat-value text-green">{presentCount} <span className="proj-stat-unit">人</span></span>
          </div>
          <div className="proj-stat-card">
            <span className="proj-stat-label">缺席人數</span>
            <span className="proj-stat-value text-red">{absentCount} <span className="proj-stat-unit">人</span></span>
          </div>
          <div className="proj-stat-card">
            <span className="proj-stat-label">今日出席率</span>
            <span className="proj-stat-value text-cyan">{attendanceRate}%</span>
          </div>
        </div>

        <div className="projection-grid">
          {/* 左側：最新簽到學生超大特寫 */}
          <div className="proj-latest-container">
            <div className="proj-panel-header">最新簽到學生特寫</div>
            {attendanceLogs.length > 0 ? (
              (() => {
                const latestLog = attendanceLogs[0];
                return (
                  <div key={latestLog.id} className="proj-latest-card animate-zoom-in">
                    <div className="proj-latest-avatar-wrapper">
                      <div className="proj-latest-avatar">
                        {latestLog.avatar && latestLog.avatar.startsWith('data:') ? (
                          <img src={latestLog.avatar} alt="avatar" />
                        ) : (
                          <span className="avatar-emoji">{latestLog.avatar || '🎓'}</span>
                        )}
                      </div>
                      <div className="proj-latest-badge">NEW</div>
                    </div>
                    <div className="proj-latest-info">
                      <div className="proj-latest-name">{latestLog.student_name}</div>
                      <div className="proj-latest-number">學號：{latestLog.student_number}</div>
                      <div className="proj-latest-meta-grid">
                        <div>
                          <span className="proj-meta-label">簽到時間</span>
                          <span className="proj-meta-val">{latestLog.time}</span>
                        </div>
                        <div>
                          <span className="proj-meta-label">辨識置信度</span>
                          <span className="proj-meta-val text-green">{Math.round(latestLog.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="proj-empty-waiting">
                <div className="radar-animation">
                  <div className="radar-circle-1" />
                  <div className="radar-circle-2" />
                  <div className="radar-circle-3" />
                  <Monitor size={48} className="radar-icon" />
                </div>
                <p className="radar-text">等待首位簽到學生...</p>
              </div>
            )}
          </div>

          {/* 右側：最近簽到列表 */}
          <div className="proj-recent-container">
            <div className="proj-panel-header">最近簽到動態 (最新 5 筆)</div>
            <div className="proj-recent-list">
              {attendanceLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="proj-recent-card animate-slide-in">
                  <div className="proj-recent-avatar">
                    {log.avatar && log.avatar.startsWith('data:') ? (
                      <img src={log.avatar} alt="avatar" />
                    ) : (
                      log.avatar || '🎓'
                    )}
                  </div>
                  <div className="proj-recent-info">
                    <div className="proj-recent-name">{log.student_name}</div>
                    <div className="proj-recent-meta">{log.student_number} | 置信度 {Math.round(log.confidence * 100)}%</div>
                  </div>
                  <div className="proj-recent-time">
                    {log.time}
                  </div>
                </div>
              ))}
              {attendanceLogs.length === 0 && (
                <div className="proj-recent-empty">
                  尚未有任何簽到資料
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="projection-footer-note" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lightbulb size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>投影模式說明：此看板專供教室大螢幕投影。當外部 AI 點名設備（Ameba 或 YOLOv8 腳本）將資料寫入 Supabase 時，本畫面將 0 延遲同步刷新統計並響起提示音。</span>
        </div>
      </div>
    )
  );
};

export default CameraTab;
