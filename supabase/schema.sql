-- AI 影像識別自動點名系統 - Supabase 資料庫結構 (Database Schema)

-- 1. 學生資料表 (Students)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    face_features JSONB, -- 儲存人臉特徵向量 (e.g., [0.123, -0.456, ...])
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 點名批次/課程課堂表 (Attendance Sessions)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(150) NOT NULL,
    session_date DATE DEFAULT CURRENT_DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active' (進行中), 'completed' (已結束)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 點名紀錄表 (Attendance Records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status VARCHAR(20) DEFAULT 'present' NOT NULL, -- 'present' (已到), 'late' (遲到), 'absent' (缺席)
    confidence DOUBLE PRECISION DEFAULT 1.0, -- AI 辨識置信度 (0.0 ~ 1.0)
    photo_url TEXT, -- 簽到當下的人臉快照連結
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (session_id, student_id) -- 確保單一課堂中學生不會重複簽到
);

-- 4. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_students_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- 確保 RLS 開啟
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 1. 配置 學生資料表 (students) 存取權限
CREATE POLICY "允許所有人讀取學生" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "允許所有人註冊學生" ON students FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允許所有人刪除學生" ON students FOR DELETE TO anon USING (true);

-- 2. 配置 課堂批次表 (attendance_sessions) 存取權限
CREATE POLICY "允許所有人讀取課堂" ON attendance_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "允許所有人建立課堂" ON attendance_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允許所有人修改課堂" ON attendance_sessions FOR UPDATE TO anon USING (true);

-- 3. 配置 點名紀錄表 (attendance_records) 存取權限
CREATE POLICY "允許所有人讀取點名紀錄" ON attendance_records FOR SELECT TO anon USING (true);
CREATE POLICY "允許所有人寫入點名紀錄" ON attendance_records FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允許所有人清除點名紀錄" ON attendance_records FOR DELETE TO anon USING (true);