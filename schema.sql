CREATE TABLE IF NOT EXISTS tokens (
  email VARCHAR(120) NOT NULL,
  access_token VARCHAR(120) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(120) NOT NULL,
  password VARCHAR(120) NOT NULL,
  firstname VARCHAR(120) NOT NULL,
  familyname VARCHAR(120) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  city VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_email VARCHAR(120) NOT NULL,
  receiver_email VARCHAR(120) NOT NULL,
  message TEXT NOT NULL
);