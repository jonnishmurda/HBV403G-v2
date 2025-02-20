DELETE FROM questions;
DELETE FROM categories;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE questions_id_seq RESTART WITH 1;
