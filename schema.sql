CREATE DATABASE research_portal;
USE research_portal;

CREATE TABLE opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  research_area VARCHAR(100) NOT NULL,
  faculty_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  required_skills TEXT NOT NULL,
  positions INT NOT NULL,
  deadline DATE NOT NULL,
  status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open'
);
