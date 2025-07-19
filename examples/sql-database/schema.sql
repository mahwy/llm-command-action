-- Blog database schema
-- Note: This schema has some issues for testing purposes

CREATE TABLE user (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE post (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Missing indexes for common queries
CREATE INDEX idx_posts_user_id ON post(user_id);

-- Additional tables without proper naming conventions
CREATE TABLE UserPreferences (
  id INT PRIMARY KEY,
  userId INT,
  theme VARCHAR(50),
  notifications BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE TABLE post_tags (
  post_id INT,
  tag_name VARCHAR(100),
  PRIMARY KEY (post_id, tag_name),
  FOREIGN KEY (post_id) REFERENCES post(id)
);