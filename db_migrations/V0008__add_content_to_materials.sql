ALTER TABLE learning_materials 
ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN learning_materials.content IS 'Текстовое содержимое материала';