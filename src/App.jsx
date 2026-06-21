import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from './supabaseClient';
import { Bell, AlertTriangle, Info } from 'lucide-react';

// 導入拆分後的元件
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import CameraTab from './components/CameraTab';
import StudentsTab from './components/StudentsTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';

// Web Audio API 簽到成功提示音
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
    console.log("音訊播放被瀏覽器封鎖或不受支援", e);
  }
};

const DEFAULT_STUDENTS = [
  { id: 'st-1', student_number: 'S11001', name: '陳威廷', avatar: '👨‍💻', face_features: [0.11, -0.22, 0.44] },
  { id: 'st-2', student_number: 'S11002', name: '張雅婷', avatar: '👩‍⚕️', face_features: [-0.05, 0.33, 0.12] },
  { id: 'st-3', student_number: 'S11003', name: '林志豪', avatar: '👨‍🎨', face_features: [0.99, -0.01, -0.45] },
  { id: 'st-4', student_number: 'S11004', name: '蔡依珊', avatar: '👩‍💼', face_features: [0.22, 0.11, 0.88] },
  { id: 'st-5', student_number: 'S11005', name: '王大同', avatar: '👨‍🚀', face_features: [-0.34, -0.12, 0.56] }
];

const DEFAULT_LOGS = [
  { id: 'log-1', student_name: '陳威廷', student_number: 'S11001', time: '18:02:15', status: 'present', confidence: 0.98, avatar: '👨‍💻' },
  { id: 'log-2', student_name: '張雅婷', student_number: 'S11002', time: '18:04:30', status: 'present', confidence: 0.94, avatar: '👩‍⚕️' }
];

// 診斷 Supabase 連線錯誤，並提供繁體中文故障排除建議
const diagnoseSupabaseError = (error) => {
  if (!error) return '未知錯誤。';
  
  const msg = error.message || '';
  const code = error.code || '';
  const status = error.status || '';

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('TypeError')) {
    return '【網路或網域錯誤】無法連線到指定的 Supabase 專案網址。請確認：\n1. Project URL 拼寫是否完全正確（例：https://xxxx.supabase.co）。\n2. 您的裝置是否已正常連接網際網路。';
  }

  if (code === 'PGRST301' || msg.includes('JWT') || msg.includes('Invalid API key') || msg.includes('apiKey') || status === 401 || status === 403) {
    return '【API 金鑰認證失敗】請確認：\n1. 設定頁面中的 Anon Key (API 公鑰) 填寫完整且正確。\n2. 請確認您使用的是 anon (public) 金鑰，而不是 service_role 金鑰。';
  }

  if (code === '42P01' || msg.includes('does not exist')) {
    return '【資料表不存在】資料庫連線成功，但找不到 `students` 表。請確認您已在 Supabase 專案中的 SQL Editor 內執行了 `schema.sql` 來建立資料表結構。';
  }

  if (code) {
    return `【資料庫錯誤 (${code})】${msg}。請檢查資料表權限或 Row-Level Security (RLS) 規則。`;
  }

  return `【其他錯誤】${msg}`;
};

function App() {
  // 導航分頁
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 連線配置設定
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_key') || '');
  const [isMockMode, setIsMockMode] = useState(localStorage.getItem('is_mock_mode') === 'false' ? false : true);
  
  // 系統連線狀態 ('connected' | 'connecting' | 'disconnected' | 'error')
  const [supabaseStatus, setSupabaseStatus] = useState('disconnected');
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState('');
  
  // 編輯中的課堂名稱
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState('');
  
  // 學生註冊名單
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('students_list');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });
  
  // 點名出勤紀錄
  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    const saved = localStorage.getItem('attendance_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });
  
  // 當前課堂批次細節
  const [currentSession, setCurrentSession] = useState({
    id: 'session-today',
    class_name: 'AI 影像識別點名課堂',
    date: new Date().toLocaleDateString('zh-TW'),
    status: 'active'
  });

  // 相機與辨識模擬狀態
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // 僅在展示模擬模式下，同步資料回本記 LocalStorage 快照
  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('students_list', JSON.stringify(students));
    }
  }, [students, isMockMode]);

  useEffect(() => {
    if (isMockMode) {
      localStorage.setItem('attendance_logs', JSON.stringify(attendanceLogs));
    }
  }, [attendanceLogs, isMockMode]);

  // 同步連線設定
  useEffect(() => {
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
    localStorage.setItem('is_mock_mode', String(isMockMode));
  }, [supabaseUrl, supabaseKey, isMockMode]);

  // 載入 Supabase 資料庫或 LocalStorage 資料，並監聽即時點名事件
  useEffect(() => {
    let activeChannel = null;

    const initDatabaseAndSync = async () => {
      // 模擬模式：回歸本地緩存
      if (isMockMode) {
        setSupabaseStatus('disconnected');
        setSupabaseErrorMsg('');
        const savedStudents = localStorage.getItem('students_list');
        const savedLogs = localStorage.getItem('attendance_logs');
        setStudents(savedStudents ? JSON.parse(savedStudents) : DEFAULT_STUDENTS);
        setAttendanceLogs(savedLogs ? JSON.parse(savedLogs) : DEFAULT_LOGS);
        setCurrentSession({
          id: 'session-today',
          class_name: 'AI 影像識別點名課堂',
          date: new Date().toLocaleDateString('zh-TW'),
          status: 'active'
        });
        return;
      }

      // Supabase 連線模式
      const client = getSupabaseClient();
      if (!client) {
        setSupabaseStatus('error');
        setSupabaseErrorMsg('請先在設定中輸入正確的 Supabase Project URL 與 API Anon Key。');
        triggerToast('請先配置 Supabase 連線資訊！', 'error');
        return;
      }

      // 檢查 URL 格式是否合法
      try {
        new URL(supabaseUrl);
      } catch (_) {
        setSupabaseStatus('error');
        setSupabaseErrorMsg('【Project URL 格式錯誤】網址必須以 http:// 或 https:// 開頭，並且是合法的網域格式。');
        triggerToast('Project URL 格式錯誤！', 'error');
        setStudents([]);
        setAttendanceLogs([]);
        return;
      }

      setSupabaseStatus('connecting');
      setSupabaseErrorMsg('');

      try {
        // 1. 執行簡易請求以驗證 API 憑證是否有效
        const { error: testError } = await client.from('students').select('id').limit(1);
        if (testError) throw testError;

        setSupabaseStatus('connected');
        triggerToast('Supabase 連線成功！正在載入雲端資料...', 'success');

        // 2. 獲取或建立今日的點名批次 (Session)
        const todayDateStr = new Date().toISOString().split('T')[0];
        let { data: sessions, error: sessionError } = await client
          .from('attendance_sessions')
          .select('*')
          .eq('session_date', todayDateStr)
          .eq('status', 'active')
          .limit(1);

        if (sessionError) throw sessionError;

        let session = sessions?.[0];
        if (!session) {
          // 資料庫尚無今日課堂，自動建立一筆
          const { data: newSession, error: createError } = await client
            .from('attendance_sessions')
            .insert({
              class_name: 'AI 影像識別點名課堂',
              session_date: todayDateStr,
              status: 'active'
            })
            .select()
            .single();

          if (createError) throw createError;
          session = newSession;
        }

        setCurrentSession({
          id: session.id,
          class_name: session.class_name,
          date: new Date(session.session_date).toLocaleDateString('zh-TW'),
          status: session.status
        });

        // 3. 獲取所有學生註冊名冊
        const { data: dbStudents, error: studentsError } = await client
          .from('students')
          .select('*')
          .order('created_at', { ascending: true });

        if (studentsError) throw studentsError;

        const mappedStudents = dbStudents.map(s => ({
          id: s.id,
          student_number: s.student_number,
          name: s.name,
          avatar: s.avatar_url,
          face_features: s.face_features
        }));
        setStudents(mappedStudents);

        // 4. 獲取當前課堂的歷史點名紀錄 (關聯學生基本資料)
        const { data: records, error: recordsError } = await client
          .from('attendance_records')
          .select(`
            id,
            check_in_time,
            confidence,
            photo_url,
            status,
            students (
              id,
              student_number,
              name,
              avatar_url
            )
          `)
          .eq('session_id', session.id)
          .order('check_in_time', { ascending: false });

        if (recordsError) throw recordsError;

        const mappedLogs = records.map(r => ({
          id: r.id,
          student_name: r.students?.name || '未知學生',
          student_number: r.students?.student_number || '未知',
          time: new Date(r.check_in_time).toLocaleTimeString('zh-TW', { hour12: false }),
          status: r.status,
          confidence: r.confidence,
          avatar: r.students?.avatar_url || '🎓'
        }));
        setAttendanceLogs(mappedLogs);

        // 5. 註冊 Supabase Realtime 即時點名訂閱頻道
        activeChannel = client
          .channel(`realtime-attendance-${session.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'attendance_records',
              filter: `session_id=eq.${session.id}`
            },
            async (payload) => {
              const { data: st } = await client
                .from('students')
                .select('name, student_number, avatar_url')
                .eq('id', payload.new.student_id)
                .single();

              if (st) {
                playBeep('success');
                const checkInTime = new Date(payload.new.check_in_time).toLocaleTimeString('zh-TW', { hour12: false });
                
                const newLog = {
                  id: payload.new.id,
                  student_name: st.name,
                  student_number: st.student_number,
                  time: checkInTime,
                  status: payload.new.status,
                  confidence: payload.new.confidence,
                  avatar: st.avatar_url || '🎓',
                  isNew: true
                };

                setAttendanceLogs(prev => {
                  if (prev.some(log => log.student_number === st.student_number)) return prev;
                  return [newLog, ...prev];
                });
                
                triggerToast(`${st.name} 簽到成功 (置信度 ${Math.round(payload.new.confidence * 100)}%)！`, 'success');
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Supabase 初始化失敗:', err);
        setSupabaseStatus('error');
        setSupabaseErrorMsg(diagnoseSupabaseError(err));
        setStudents([]);
        setAttendanceLogs([]);
        triggerToast('資料庫連線失敗，請檢查設定資訊！', 'error');
      }
    };

    initDatabaseAndSync();

    return () => {
      if (activeChannel) {
        const client = getSupabaseClient();
        if (client) client.removeChannel(activeChannel);
      }
    };
  }, [isMockMode, supabaseUrl, supabaseKey]);

  // 全域通知
  const triggerToast = (message, status) => {
    setToastMessage({ message, status });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 儲存修改後的課程名稱
  const handleSaveSessionName = async () => {
    if (!editingSessionName.trim()) {
      triggerToast('課程名稱不能為空！', 'error');
      return;
    }

    if (isMockMode) {
      setCurrentSession(prev => ({ ...prev, class_name: editingSessionName }));
      setIsEditingSession(false);
      triggerToast('課堂名稱已修改 (僅暫存)', 'success');
    } else {
      const client = getSupabaseClient();
      if (!client || !currentSession?.id) return;

      const { error } = await client
        .from('attendance_sessions')
        .update({ class_name: editingSessionName })
        .eq('id', currentSession.id);

      if (error) {
        triggerToast(`修改失敗: ${error.message}`, 'error');
      } else {
        setCurrentSession(prev => ({ ...prev, class_name: editingSessionName }));
        setIsEditingSession(false);
        triggerToast('課堂名稱修改成功！', 'success');
      }
    }
  };

  // 模擬人臉識別簽到事件 (僅在模擬模式下被按鈕調用)
  const handleTriggerMockDetection = async () => {
    if (!cameraActive) {
      triggerToast("請先啟動點名相機！", "error");
      return;
    }

    const roll = Math.random();
    
    if (roll < 0.6 && students.length > 0) {
      const randomIndex = Math.floor(Math.random() * students.length);
      const student = students[randomIndex];
      
      const newFace = {
        x: 150 + Math.random() * 100,
        y: 100 + Math.random() * 50,
        width: 160,
        height: 160,
        label: student.name,
        conf: 0.88 + Math.random() * 0.1,
        matchStatus: 'present'
      };

      setDetectedFaces([newFace]);
      
      const exists = attendanceLogs.some(log => log.student_number === student.student_number);
      if (!exists) {
        if (isMockMode) {
          playBeep('success');
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0];
          
          const newLog = {
            id: `log-${Date.now()}`,
            student_name: student.name,
            student_number: student.student_number,
            time: timeStr,
            status: 'present',
            confidence: newFace.conf,
            avatar: student.avatar
          };
          
          setAttendanceLogs(prev => [newLog, ...prev]);
          triggerToast(`${student.name} 簽到成功！`, "success");
        } else {
          // 直接寫入 Supabase (若是開發測試需求)
          const client = getSupabaseClient();
          if (!client || !currentSession?.id) return;

          const { error: insertError } = await client
            .from('attendance_records')
            .insert({
              session_id: currentSession.id,
              student_id: student.id,
              confidence: newFace.conf,
              status: 'present'
            });

          if (insertError) {
            if (insertError.code === '23505') {
              triggerToast(`${student.name} 重複偵測 (已簽到)`, "info");
            } else {
              triggerToast(`簽到失敗: ${insertError.message}`, "error");
            }
          }
        }
      } else {
        triggerToast(`${student.name} 重複偵測 (已簽到)`, "info");
      }
    } else if (roll < 0.9) {
      playBeep('error');
      const newFace = {
        x: 200,
        y: 120,
        width: 150,
        height: 150,
        label: "未登錄人員",
        conf: 0.72,
        matchStatus: 'unknown'
      };
      setDetectedFaces([newFace]);
      triggerToast("警報：偵測到未登錄人臉！", "error");
    } else {
      setDetectedFaces([]);
    }
  };

  // 清除點名紀錄
  const handleClearLogs = async () => {
    if (window.confirm("確定要清除今日所有點名紀錄嗎？")) {
      if (isMockMode) {
        setAttendanceLogs([]);
        setDetectedFaces([]);
        triggerToast("已清除所有點名紀錄", "info");
      } else {
        const client = getSupabaseClient();
        if (!client || !currentSession?.id) return;

        const { error } = await client
          .from('attendance_records')
          .delete()
          .eq('session_id', currentSession.id);

        if (error) {
          triggerToast(`清除紀錄失敗: ${error.message}`, "error");
        } else {
          setAttendanceLogs([]);
          setDetectedFaces([]);
          triggerToast("已清除所有點名紀錄", "info");
        }
      }
    }
  };

  // 重設為預設展示資料
  const handleResetDefaults = async () => {
    if (window.confirm("是否重設為預設展示資料？這會覆蓋目前的學生名單與所有雲端點名。")) {
      if (isMockMode) {
        setStudents(DEFAULT_STUDENTS);
        setAttendanceLogs(DEFAULT_LOGS);
        triggerToast("已重設為預設範例資料", "success");
      } else {
        const client = getSupabaseClient();
        if (!client) return;

        const { error: deleteError } = await client
          .from('students')
          .delete()
          .neq('student_number', 'RESET_TEMP');

        if (deleteError) {
          triggerToast(`重設失敗: ${deleteError.message}`, "error");
          return;
        }

        const studentsToInsert = DEFAULT_STUDENTS.map(s => ({
          student_number: s.student_number,
          name: s.name,
          avatar_url: s.avatar,
          face_features: s.face_features
        }));

        const { data: newStudents, error: insertError } = await client
          .from('students')
          .insert(studentsToInsert)
          .select();

        if (insertError) {
          triggerToast(`寫入範例學生失敗: ${insertError.message}`, "error");
        } else if (newStudents) {
          setStudents(newStudents.map(s => ({
            id: s.id,
            student_number: s.student_number,
            name: s.name,
            avatar: s.avatar_url,
            face_features: s.face_features
          })));
          setAttendanceLogs([]);
          triggerToast("已重設雲端資料庫為範例學生名單", "success");
        }
      }
    }
  };

  // 統計資訊計算
  const totalStudents = students.length;
  const presentCount = new Set(attendanceLogs.map(log => log.student_number)).size;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // 學生註冊 Callback (提供子組件更新 App 狀態)
  const handleStudentAdded = (newStudent) => {
    setStudents(prev => [...prev, newStudent]);
  };

  const handleStudentDeleted = (studentId) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  return (
    <div className="app-container">
      {/* 全域浮動 Toast */}
      {toastMessage && (
        <div className="notification-center">
          <div className="toast" style={{ 
            borderLeftColor: toastMessage.status === 'success' ? '#10b981' : 
                             toastMessage.status === 'error' ? '#ef4444' : '#f59e0b' 
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '2px' }}>
                {toastMessage.status === 'success' ? <Bell size={18} color="#10b981" /> : 
                 toastMessage.status === 'error' ? <AlertTriangle size={18} color="#ef4444" /> : 
                 <Info size={18} color="#f59e0b" />}
              </div>
              <div>
                <strong style={{ display: 'block', color: '#fff', textAlign: 'left' }}>
                  {toastMessage.status === 'success' ? '點名系統' : 
                   toastMessage.status === 'error' ? '警報提示' : '系統資訊'}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{toastMessage.message}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. 側邊欄 */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMockMode={isMockMode} 
        supabaseStatus={supabaseStatus} 
      />

      {/* 2. 主內容區域 */}
      <main className="main-content">
        <Header 
          currentSession={currentSession}
          isEditingSession={isEditingSession}
          setIsEditingSession={setIsEditingSession}
          editingSessionName={editingSessionName}
          setEditingSessionName={setEditingSessionName}
          handleSaveSessionName={handleSaveSessionName}
          isMockMode={isMockMode}
          handleResetDefaults={handleResetDefaults}
          cameraActive={cameraActive}
          setCameraActive={setCameraActive}
          setActiveTab={setActiveTab}
        />

        {/* 分頁組件條件渲染 */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            totalStudents={totalStudents}
            presentCount={presentCount}
            absentCount={absentCount}
            attendanceRate={attendanceRate}
            isMockMode={isMockMode}
            cameraActive={cameraActive}
            setCameraActive={setCameraActive}
            detectedFaces={detectedFaces}
            handleTriggerMockDetection={handleTriggerMockDetection}
            currentSession={currentSession}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
            attendanceLogs={attendanceLogs}
            triggerToast={triggerToast}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'camera' && (
          <CameraTab
            isMockMode={isMockMode}
            cameraActive={cameraActive}
            setCameraActive={setCameraActive}
            detectedFaces={detectedFaces}
            handleTriggerMockDetection={handleTriggerMockDetection}
            currentSession={currentSession}
            presentCount={presentCount}
            absentCount={absentCount}
            attendanceRate={attendanceRate}
            attendanceLogs={attendanceLogs}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab
            isMockMode={isMockMode}
            students={students}
            onStudentAdded={handleStudentAdded}
            onStudentDeleted={handleStudentDeleted}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            attendanceLogs={attendanceLogs}
            handleClearLogs={handleClearLogs}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            isMockMode={isMockMode}
            setIsMockMode={setIsMockMode}
            supabaseStatus={supabaseStatus}
            supabaseErrorMsg={supabaseErrorMsg}
            supabaseUrl={supabaseUrl}
            setSupabaseUrl={setSupabaseUrl}
            supabaseKey={supabaseKey}
            setSupabaseKey={setSupabaseKey}
            triggerToast={triggerToast}
          />
        )}
      </main>
    </div>
  );
}

export default App;
