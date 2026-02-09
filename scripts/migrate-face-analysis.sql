-- FaceAnalysis 테이블 생성
CREATE TABLE IF NOT EXISTS face_analyses (
  id VARCHAR(36) PRIMARY KEY,
  share_code VARCHAR(255) UNIQUE NOT NULL,
  score INT NOT NULL,
  gender VARCHAR(50) NOT NULL,
  categories JSON NOT NULL,
  analysis JSON NOT NULL,
  landmarks MEDIUMTEXT,
  image_width INT,
  image_height INT,
  image_data MEDIUMTEXT,
  pan_angle FLOAT,
  tilt_angle FLOAT,
  roll_angle FLOAT,
  expires_at DATETIME NOT NULL,
  view_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_share_code (share_code),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FaceCompatibility 테이블 생성
CREATE TABLE IF NOT EXISTS face_compatibilities (
  id VARCHAR(36) PRIMARY KEY,
  share_code VARCHAR(255) UNIQUE NOT NULL,
  male_analysis_id VARCHAR(36) NOT NULL,
  female_analysis_id VARCHAR(36) NOT NULL,
  compatibility_score INT NOT NULL,
  category_scores JSON NOT NULL,
  analysis JSON NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_id VARCHAR(255),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_share_code (share_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
