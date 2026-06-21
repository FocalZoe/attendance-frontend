import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Trash2, 
  UserPlus, 
  FlaskConical, 
  CheckCircle2, 
  ClipboardX,
  Search,
  Dna,
  Zap,
  AlertTriangle,
  AlertCircle,
  Video
} from 'lucide-react';
import { getSupabaseClient } from '../supabaseClient';

// Web Audio API 輔助函式 (點名或註冊提示音)
const playBeep = (type = 'success') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime); // E6
      }, 80);
      
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      oscillator.stop(audioCtx.currentTime + 0.25);
    } else {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      oscillator.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    console.log("音訊播放在此瀏覽器不受支援或被封鎖", e);
  }
};

/**
 * 學生管理與註冊名冊分頁組件
 */
const StudentsTab = ({
  isMockMode,
  students,
  onStudentAdded,
  onStudentDeleted,
  triggerToast
}) => {
  // 本地狀態
  const [studentSearch, setStudentSearch] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentAvatar, setNewStudentAvatar] = useState('🎓');
  
  // 錄入相機與特徵狀態
  const [enrollMode, setEnrollMode] = useState(isMockMode ? 'simulate' : 'camera');
  const [enrollCameraActive, setEnrollCameraActive] = useState(false);
  const [enrollFeatureReady, setEnrollFeatureReady] = useState(false);
  const [enrollVector, setEnrollVector] = useState(null);
  const [enrollPhoto, setEnrollPhoto] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrollVideoRef = useRef(null);
  const enrollCanvasRef = useRef(null);

  // 當運作模式改變時，連線模式下強制啟用鏡頭模式並清空暫存
  useEffect(() => {
    if (!isMockMode) {
      setEnrollMode('camera');
      setEnrollCameraActive(false);
      setEnrollFeatureReady(false);
      setEnrollVector(null);
      setEnrollPhoto(null);
    } else {
      setEnrollMode('simulate');
    }
  }, [isMockMode]);

  // 控制錄入相機串流
  useEffect(() => {
    let stream = null;
    if (enrollMode === 'camera' && enrollCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then(s => {
          stream = s;
          if (enrollVideoRef.current) {
            enrollVideoRef.current.srcObject = s;
            enrollVideoRef.current.play();
          }
        })
        .catch(err => {
          console.warn("無法開啟錄入相機:", err);
          triggerToast("無法開啟錄入相機，已切換回模擬生成模式。", "error");
          setEnrollMode('simulate');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enrollMode, enrollCameraActive]);

  // 搜尋過濾
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.student_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // 拍照擷取人臉影像
  const handleCaptureEnrollFace = () => {
    const video = enrollVideoRef.current;
    const canvas = enrollCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 240;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    setEnrollPhoto(photoDataUrl);
    setIsEnrolling(true);
    playBeep('success');

    // 關閉相機
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    setEnrollCameraActive(false);

    // 模擬 1.5 秒的神經網路特徵計算
    setTimeout(() => {
      const vector = Array.from({ length: 128 }, () => Number((Math.random() * 2 - 1).toFixed(3)));
      setEnrollVector(vector);
      setEnrollFeatureReady(true);
      setIsEnrolling(false);
      triggerToast("人臉特徵提取成功 (128維特徵已就緒)！", "success");
    }, 1500);
  };

  // 模擬提取特徵
  const handleSimulateEnrollFeatures = () => {
    setIsEnrolling(true);
    setEnrollPhoto(null);
    setEnrollFeatureReady(false);
    
    setTimeout(() => {
      const vector = Array.from({ length: 128 }, () => Number((Math.random() * 2 - 1).toFixed(3)));
      setEnrollVector(vector);
      setEnrollFeatureReady(true);
      setIsEnrolling(false);
      triggerToast("AI 特徵模擬生成完成！", "success");
    }, 1200);
  };

  // 新增學生
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentName || !newStudentNumber) {
      triggerToast("請填寫姓名與學號！", "error");
      return;
    }

    if (!enrollFeatureReady || !enrollVector) {
      triggerToast("請先錄入或提取人臉特徵資料！", "error");
      return;
    }

    const studentAvatar = enrollPhoto ? enrollPhoto : newStudentAvatar;

    if (isMockMode) {
      const exists = students.some(s => s.student_number === newStudentNumber);
      if (exists) {
        triggerToast("學號重複，請檢查！", "error");
        return;
      }

      const newStudent = {
        id: `st-${Date.now()}`,
        student_number: newStudentNumber,
        name: newStudentName,
        avatar: studentAvatar,
        face_features: enrollVector
      };

      onStudentAdded(newStudent);
      resetForm();
      triggerToast(`成功註冊學生: ${newStudentName}`, "success");
    } else {
      const client = getSupabaseClient();
      if (!client) return;

      // 檢查是否學號重複
      const { data: existing } = await client
        .from('students')
        .select('id')
        .eq('student_number', newStudentNumber);

      if (existing && existing.length > 0) {
        triggerToast("學號重複，請檢查！", "error");
        return;
      }

      const { data: newStudent, error: insertError } = await client
        .from('students')
        .insert({
          student_number: newStudentNumber,
          name: newStudentName,
          avatar_url: studentAvatar,
          face_features: enrollVector
        })
        .select()
        .single();

      if (insertError) {
        triggerToast(`註冊失敗: ${insertError.message}`, "error");
      } else if (newStudent) {
        const mapped = {
          id: newStudent.id,
          student_number: newStudent.student_number,
          name: newStudent.name,
          avatar: newStudent.avatar_url,
          face_features: newStudent.face_features
        };
        onStudentAdded(mapped);
        resetForm();
        triggerToast(`成功註冊學生: ${newStudent.name}`, "success");
      }
    }
  };

  // 刪除學生
  const handleDeleteStudentClick = async (id, name) => {
    if (window.confirm(`確定要刪除學生 ${name} 嗎？`)) {
      if (isMockMode) {
        onStudentDeleted(id);
        triggerToast(`已刪除學生 ${name}`, "info");
      } else {
        const client = getSupabaseClient();
        if (!client) return;

        const { error } = await client
          .from('students')
          .delete()
          .eq('id', id);

        if (error) {
          triggerToast(`刪除失敗: ${error.message}`, "error");
        } else {
          onStudentDeleted(id);
          triggerToast(`已刪除學生 ${name}`, "info");
        }
      }
    }
  };

  const resetForm = () => {
    setNewStudentName('');
    setNewStudentNumber('');
    setNewStudentAvatar('🎓');
    setEnrollFeatureReady(false);
    setEnrollVector(null);
    setEnrollPhoto(null);
  };

  return (
    <div className="panel-grid">
      {/* 左側：名冊展示 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, textAlign: 'left' }}>學生註冊名冊 ({filteredStudents.length})</h3>
          <div style={{ position: 'relative', maxWidth: '240px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
              placeholder="搜尋學號或姓名..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>照片</th>
                <th>學號</th>
                <th>姓名</th>
                <th>特徵資料狀態</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-avatar" style={{ fontSize: '1.2rem', overflow: 'hidden' }}>
                        {student.avatar && student.avatar.startsWith('data:') ? (
                          <img src={student.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          student.avatar || '🎓'
                        )}
                      </div>
                    </td>
                    <td>{student.student_number}</td>
                    <td style={{ fontWeight: 'bold' }}>{student.name}</td>
                    <td>
                      <span style={{ 
                        color: student.face_features ? 'var(--accent-green)' : 'var(--accent-orange)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {student.face_features ? (
                          <>
                            <CheckCircle2 size={14} />
                            128維人臉特徵已錄入
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} />
                            未登錄人臉
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDeleteStudentClick(student.id, student.name)}
                      >
                        <Trash2 size={12} />
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                    找不到符合條件的學生
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 右側：註冊新學生表單 */}
      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ marginBottom: '20px' }}>註冊新學生 (AI 特徵錄入)</h3>
        
        <form onSubmit={handleAddStudentSubmit}>
          <div className="form-group">
            <label className="form-label">學生學號</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="例如 S11006" 
              value={newStudentNumber} 
              onChange={e => setNewStudentNumber(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">學生姓名</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="例如 林大明" 
              value={newStudentName} 
              onChange={e => setNewStudentName(e.target.value)}
            />
          </div>
          
          {/* 臉部特徵錄入區塊 */}
          <div style={{ 
            background: 'rgba(0,0,0,0.15)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: 'var(--border-radius-sm)', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
              <Camera size={16} color="var(--accent-purple)" />
              人臉特徵錄入方式
            </label>
            
            {/* 切換錄入模式 */}
            {isMockMode && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className={`btn ${enrollMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    setEnrollMode('camera');
                    setEnrollFeatureReady(false);
                    setEnrollVector(null);
                    setEnrollPhoto(null);
                  }}
                >
                  <Camera size={14} />
                  鏡頭即時擷取
                </button>
                <button
                  type="button"
                  className={`btn ${enrollMode === 'simulate' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => {
                    setEnrollMode('simulate');
                    setEnrollFeatureReady(false);
                    setEnrollVector(null);
                    setEnrollPhoto(null);
                  }}
                >
                  <Dna size={14} />
                  AI 模擬生成
                </button>
              </div>
            )}

            {/* 模式 A: 鏡頭即時擷取 */}
            {enrollMode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                {enrollCameraActive ? (
                  <div style={{ position: 'relative', width: '200px', height: '150px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--accent-cyan)' }}>
                    <video 
                      ref={enrollVideoRef} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      playsInline 
                      muted 
                    />
                    <canvas ref={enrollCanvasRef} style={{ display: 'none' }} />
                    <div className="scan-line" style={{ height: '2px', boxShadow: '0 0 8px var(--accent-cyan)' }} />
                  </div>
                ) : enrollPhoto ? (
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-green)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                    <img src={enrollPhoto} alt="Snapshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '150px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', gap: '8px', border: '1px dashed var(--glass-border)' }}>
                    <Camera size={24} />
                    <span>相機尚未啟動</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  {enrollCameraActive ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={handleCaptureEnrollFace}
                    >
                      <Camera size={14} />
                      拍攝並分析人臉
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => {
                        setEnrollCameraActive(true);
                        setEnrollFeatureReady(false);
                        setEnrollVector(null);
                        setEnrollPhoto(null);
                      }}
                    >
                      <Video size={14} />
                      啟動錄製鏡頭
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 模式 B: AI 模擬生成 */}
            {enrollMode === 'simulate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>個人預設頭像</label>
                  <select 
                    className="form-control" 
                    value={newStudentAvatar} 
                    onChange={e => setNewStudentAvatar(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="🎓">🎓 學士帽</option>
                    <option value="👨‍💻">👨‍💻 男生工程師</option>
                    <option value="👩‍💻">👩‍💻 女生工程師</option>
                    <option value="🧑">🧑 一般人臉</option>
                    <option value="👩">👩 女生人臉</option>
                    <option value="👨">👨 男生人臉</option>
                  </select>
                </div>
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  onClick={handleSimulateEnrollFeatures}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? <Dna size={16} /> : <Zap size={16} />}
                  {isEnrolling ? '正在進行 YOLOv8 特徵模擬提取...' : '一鍵模擬生成特徵資料'}
                </button>
              </div>
            )}

            {/* 特徵提取進度動畫 */}
            {isEnrolling && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', gap: '6px' }}>
                <div className="status-indicator pulsing" style={{ backgroundColor: 'var(--accent-cyan)', width: '10px', height: '10px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>神經網路計算中 (ResNet-128)...</span>
              </div>
            )}

            {enrollFeatureReady && enrollVector && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '6px', 
                fontSize: '0.8rem' 
              }}>
                <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <CheckCircle2 size={14} />
                  人臉特徵擷取完成 (128維特徵已就緒)
                </div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.7rem', 
                  wordBreak: 'break-all',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '4px',
                  borderRadius: '4px',
                  maxHeight: '45px',
                  overflowY: 'auto'
                }}>
                  [{enrollVector.slice(0, 5).join(', ')}, ..., {enrollVector.slice(-5).join(', ')}]
                </div>
              </div>
            )}
          </div>

          {!isMockMode && !enrollFeatureReady && (
            <div style={{ 
              margin: '0 0 16px 0', 
              padding: '10px 14px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '6px', 
              fontSize: '0.8rem', 
              color: 'var(--accent-red)',
              textAlign: 'left',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>實戰連線模式：必須啟動視訊鏡頭拍攝真實人臉照片，方可錄入 128 維特徵資料並註冊。</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            disabled={!isMockMode && !enrollFeatureReady}
          >
            <UserPlus size={16} />
            完成註冊與錄入特徵
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentsTab;
