-- Create teacher_messages table for communication
CREATE TABLE IF NOT EXISTS teacher_messages (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create teacher_students table for teacher-student relationships
CREATE TABLE IF NOT EXISTS teacher_students (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_messages_student ON teacher_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_teacher ON teacher_messages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);