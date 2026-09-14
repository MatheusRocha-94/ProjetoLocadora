CREATE DATABASE IF NOT EXISTS locadora
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE locadora;

CREATE TABLE IF NOT EXISTS cidades (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  uf CHAR(2) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modelos (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estoque_inicial (
  cidade_id SMALLINT UNSIGNED NOT NULL,
  modelo_id SMALLINT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (cidade_id, modelo_id),
  CONSTRAINT fk_estoque_cidade FOREIGN KEY (cidade_id) REFERENCES cidades (id),
  CONSTRAINT fk_estoque_modelo FOREIGN KEY (modelo_id) REFERENCES modelos (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movimentacoes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cidade_id SMALLINT UNSIGNED NOT NULL,
  modelo_id SMALLINT UNSIGNED NULL,
  tipo ENUM('retirada', 'devolucao') NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  ocorrido_em DATETIME NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimentacao_cidade FOREIGN KEY (cidade_id) REFERENCES cidades (id),
  CONSTRAINT fk_movimentacao_modelo FOREIGN KEY (modelo_id) REFERENCES modelos (id),
  INDEX idx_movimentacao_cidade_data (cidade_id, ocorrido_em),
  INDEX idx_movimentacao_tipo (tipo)
) ENGINE=InnoDB;
