CREATE TABLE IF NOT EXISTS user_attributes (
    id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    disabled BOOLEAN NOT NULL DEFAULT 0,
    last_logged_in TIMESTAMP DEFAULT NULL,
    password_change_required BOOLEAN NOT NULL DEFAULT 0,
    last_password_change TIMESTAMP DEFAULT NULL,
    logout_required BOOLEAN NOT NULL DEFAULT 0,
    user_created_at TIMESTAMP DEFAULT NULL,
    UNIQUE KEY (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

DELIMITER //

-- TRIGGER on INSERT : If a user is deleted, they should also be disabled
CREATE TRIGGER before_user_attributes_insert
BEFORE INSERT ON user_attributes
FOR EACH ROW
BEGIN
    IF NEW.deleted = 1 THEN
        SET NEW.disabled = 1;
    END IF;
END;//

-- TRIGGER on UPDATE : If a user is deleted, they should also be disabled
CREATE TRIGGER before_user_attributes_update
BEFORE UPDATE ON user_attributes
FOR EACH ROW
BEGIN
    IF NEW.deleted = 1 THEN
        SET NEW.disabled = 1;
    END IF;
END;//

DELIMITER ;