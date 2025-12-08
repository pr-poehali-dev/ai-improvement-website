CREATE TABLE IF NOT EXISTS learning_materials (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_teacher ON learning_materials(teacher_id);
CREATE INDEX idx_materials_category ON learning_materials(category);

COMMENT ON TABLE learning_materials IS 'Учебные материалы от преподавателей';
COMMENT ON COLUMN learning_materials.teacher_id IS 'ID преподавателя';
COMMENT ON COLUMN learning_materials.title IS 'Название материала';
COMMENT ON COLUMN learning_materials.description IS 'Описание материала';
COMMENT ON COLUMN learning_materials.file_url IS 'URL файла в S3';
COMMENT ON COLUMN learning_materials.file_type IS 'Тип файла (pdf, doc, video и т.д.)';
COMMENT ON COLUMN learning_materials.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN learning_materials.category IS 'Категория материала';