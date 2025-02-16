CREATE TABLE IF NOT EXISTS public.categories (
  id serial primary key,
  name varchar(64) not null unique,
  created timestamp with time zone not null default current_timestamp
);

CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answers JSONB NOT NULL
);
