CREATE TABLE IF NOT EXISTS material_status (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),
    teacher_comment TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, student_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_status_material ON material_status(material_id);
CREATE INDEX idx_material_status_student ON material_status(student_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);

COMMENT ON TABLE material_status IS 'Статус изучения материалов студентами';
COMMENT ON TABLE chat_messages IS 'Сообщения чата между студентами и преподавателями';
COMMENT ON COLUMN material_status.status IS 'not_started, in_progress, completed, needs_review';
COMMENT ON COLUMN material_status.teacher_comment IS 'Комментарий преподавателя при проверке';
