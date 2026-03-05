-- Seed Dub Camp story
-- Run after applying migrations
-- The JSON data should be copied from public/stories/dub-camp.json

INSERT INTO stories (id, title, description, data)
VALUES (
  'dub-camp',
  'Dub Crampe',
  'Le Dub Camp. Pas besoin d''en dire plus...',
  '{}'::jsonb  -- Replace with full JSON from public/stories/dub-camp.json
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  data = EXCLUDED.data,
  updated_at = now();
