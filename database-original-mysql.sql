CREATE DATABASE IF NOT EXISTS school_event_db;
USE school_event_db;

DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_registration (user_id, event_id),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

INSERT INTO users (full_name, email, password, role) VALUES
('System Administrator', 'admin@school.local', '$2y$12$6A8UCV2d4TQTC8neqTivM.x.n7onVBgfia3NI4hbP4RjZDJH5eK2.', 'admin');
-- Admin password: admin123

INSERT INTO events (title, description, event_date, event_time, location, capacity) VALUES
('School Foundation Day', 'A celebration featuring student performances, games, and school activities.', '2026-10-20', '09:00:00', 'School Gymnasium', 200),
('Intramurals 2026', 'Inter-class sports competition for students.', '2026-10-25', '08:00:00', 'Main Sports Field', 300),
('Science and Technology Fair', 'Student projects, exhibits, and technology demonstrations.', '2026-11-05', '10:00:00', 'Science Building', 150);
