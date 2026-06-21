import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * 外部串接 API 教學區塊組件
 */
const ApiCodeBlock = ({ currentSessionId, supabaseUrl, supabaseKey }) => {
  const [copied, setCopied] = useState(false);
  const [activeLang, setActiveLang] = useState('curl');
  
  const truncatedKey = supabaseKey ? `${supabaseKey.substring(0, 15)}...${supabaseKey.substring(supabaseKey.length - 10)}` : 'YOUR_SUPABASE_ANON_KEY';
  const displayKey = truncatedKey;
  const actualKey = supabaseKey || 'YOUR_SUPABASE_ANON_KEY';
  const url = supabaseUrl || 'https://your-project.supabase.co';

  // 用於顯示的 cURL (金鑰截短，避免撐爆介面)
  const curlCommandForDisplay = `curl -X POST "${url}/rest/v1/attendance_records" \\
  -H "apikey: ${displayKey}" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "${currentSessionId}",
    "student_id": "STUDENT_UUID",
    "status": "present",
    "confidence": 0.95
  }'`;

  // 用於複製的 cURL (含完整金鑰)
  const curlCommandForCopy = `curl -X POST "${url}/rest/v1/attendance_records" \\
  -H "apikey: ${actualKey}" \\
  -H "Authorization: Bearer ${actualKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "${currentSessionId}",
    "student_id": "STUDENT_UUID",
    "status": "present",
    "confidence": 0.95
  }'`;

  // 用於顯示的 Python (金鑰截短)
  const pythonSnippetForDisplay = `import requests

url = "${url}/rest/v1/attendance_records"
headers = {
    "apikey": "${displayKey}",
    "Authorization": "Bearer ${displayKey}",
    "Content-Type": "application/json"
}
payload = {
    "session_id": "${currentSessionId}",
    "student_id": "STUDENT_UUID", # 請填入學生的 UUID
    "status": "present",
    "confidence": 0.95 # 置信度 0.0 ~ 1.0
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.status_code, response.text)`;

  // 用於複製的 Python (含完整金鑰)
  const pythonSnippetForCopy = `import requests

url = "${url}/rest/v1/attendance_records"
headers = {
    "apikey": "${actualKey}",
    "Authorization": "Bearer ${actualKey}",
    "Content-Type": "application/json"
}
payload = {
    "session_id": "${currentSessionId}",
    "student_id": "STUDENT_UUID",
    "status": "present",
    "confidence": 0.95
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.status_code, response.text)`;

  const handleCopy = () => {
    const textToCopy = activeLang === 'curl' ? curlCommandForCopy : pythonSnippetForCopy;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#0e1017', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            onClick={() => setActiveLang('curl')} 
            style={{ 
              background: 'none', border: 'none', color: activeLang === 'curl' ? 'var(--accent-cyan)' : 'var(--text-secondary)', 
              fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderBottom: activeLang === 'curl' ? '2px solid var(--accent-cyan)' : 'none'
            }}
          >
            cURL (REST)
          </button>
          <button 
            type="button"
            onClick={() => setActiveLang('python')} 
            style={{ 
              background: 'none', border: 'none', color: activeLang === 'python' ? 'var(--accent-cyan)' : 'var(--text-secondary)', 
              fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderBottom: activeLang === 'python' ? '2px solid var(--accent-cyan)' : 'none'
            }}
          >
            Python YOLOv8
          </button>
        </div>
        <button 
          type="button"
          onClick={handleCopy} 
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', 
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px'
          }}
        >
          {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
          {copied ? '已複製！' : '複製'}
        </button>
      </div>
      <div style={{ padding: '12px', overflow: 'auto', maxHeight: '200px' }}>
        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          {activeLang === 'curl' ? curlCommandForDisplay : pythonSnippetForDisplay}
        </pre>
      </div>
    </div>
  );
};

export default ApiCodeBlock;
