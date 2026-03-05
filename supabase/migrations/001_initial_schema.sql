-- stories table
CREATE TABLE stories (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- scores table
CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id text NOT NULL REFERENCES stories(id),
  player_name text NOT NULL,
  score integer NOT NULL,
  is_game_over boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for leaderboard queries
CREATE INDEX idx_scores_story_score ON scores(story_id, score DESC);
