CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100)
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  isbn VARCHAR(20),  -- ISBN as a string, adjust length as needed
  rating INT CHECK (rating >= 0 AND rating <= 10),  -- Rating between 0 and 10
  notes TEXT,  -- Notes can be a larger text field
  date_read DATE,  -- Date when the book was read
  user_id INT REFERENCES users(id)  -- Foreign key linking to the users table
);

