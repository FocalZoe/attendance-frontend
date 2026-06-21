import React from 'react';
import { Eraser } from 'lucide-react';

/**
 * 歷史出勤紀錄分頁組件
 */
const HistoryTab = ({ attendanceLogs, handleClearLogs }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', textAlign: 'left' }}>
        <div>
          <h2 style={{ margin: 0 }}>歷史點名紀錄</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            此列表展示所有簽到成功之學生的時間紀錄與置信度。
          </p>
        </div>
        <button 
          type="button"
          className="btn btn-danger" 
          onClick={handleClearLogs} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Eraser size={16} />
          清除今日紀錄
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>頭像</th>
              <th>學號</th>
              <th>姓名</th>
              <th>簽到時間</th>
              <th>點名狀態</th>
              <th>AI 識別率</th>
            </tr>
          </thead>
          <tbody>
            {attendanceLogs.length > 0 ? (
              attendanceLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="student-avatar" style={{ overflow: 'hidden' }}>
                      {log.avatar && log.avatar.startsWith('data:') ? (
                        <img src={log.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        log.avatar || '🎓'
                      )}
                    </div>
                  </td>
                  <td>{log.student_number}</td>
                  <td style={{ fontWeight: 'bold' }}>{log.student_name}</td>
                  <td>{log.time}</td>
                  <td><span className="badge badge-present">已簽到</span></td>
                  <td>{(log.confidence * 100).toFixed(1)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                  今日尚無出勤紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTab;
