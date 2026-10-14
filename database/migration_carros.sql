USE locadora;

CREATE TABLE IF NOT EXISTS carros (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cidade_id SMALLINT UNSIGNED NOT NULL,
  modelo_id SMALLINT UNSIGNED NOT NULL,
  condicao ENUM('zero_km', 'seminovo') NOT NULL,
  faixa_km ENUM('ate_30', 'ate_50000', 'acima_100000') NOT NULL,
  categoria ENUM('hatch', 'sedan', 'suv') NOT NULL,
  quantidade_inicial INT UNSIGNED NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carro_cidade FOREIGN KEY (cidade_id) REFERENCES cidades (id),
  CONSTRAINT fk_carro_modelo FOREIGN KEY (modelo_id) REFERENCES modelos (id),
  UNIQUE KEY uk_carro_configuracao (cidade_id, modelo_id, condicao, faixa_km, categoria)
) ENGINE=InnoDB;

ALTER TABLE movimentacoes
  ADD COLUMN IF NOT EXISTS carro_id BIGINT UNSIGNED NULL AFTER modelo_id;

SET @fk_existe = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimentacoes'
    AND CONSTRAINT_NAME = 'fk_movimentacao_carro'
);
SET @sql_fk = IF(@fk_existe = 0,
  'ALTER TABLE movimentacoes ADD CONSTRAINT fk_movimentacao_carro FOREIGN KEY (carro_id) REFERENCES carros (id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO carros (cidade_id, modelo_id, condicao, faixa_km, categoria, quantidade_inicial)
SELECT cidade_id, modelo_id, 'seminovo', 'ate_50000', 'hatch', quantidade
FROM estoque_inicial
ON DUPLICATE KEY UPDATE quantidade_inicial = VALUES(quantidade_inicial);

UPDATE movimentacoes mv
JOIN carros ca
  ON ca.cidade_id = mv.cidade_id
 AND ca.modelo_id = mv.modelo_id
 AND ca.condicao = 'seminovo'
 AND ca.faixa_km = 'ate_50000'
 AND ca.categoria = 'hatch'
SET mv.carro_id = ca.id
WHERE mv.carro_id IS NULL;

CREATE TABLE IF NOT EXISTS cadastros_carros (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carro_id BIGINT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  cadastrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cadastro_carro FOREIGN KEY (carro_id) REFERENCES carros (id),
  INDEX idx_cadastro_carro_data (carro_id, cadastrado_em)
) ENGINE=InnoDB;

INSERT INTO cadastros_carros (carro_id, quantidade, cadastrado_em)
SELECT ca.id, ca.quantidade_inicial, ca.criado_em
FROM carros ca
WHERE ca.quantidade_inicial > 0
  AND NOT EXISTS (SELECT 1 FROM cadastros_carros cc WHERE cc.carro_id = ca.id);
