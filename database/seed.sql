USE locadora;

INSERT INTO cidades (nome, uf, slug) VALUES
  ('São Paulo', 'SP', 'sao-paulo'),
  ('Curitiba', 'PR', 'curitiba'),
  ('Santos', 'SP', 'santos'),
  ('Porto Alegre', 'RS', 'porto-alegre'),
  ('Recife', 'PE', 'recife'),
  ('Belo Horizonte', 'MG', 'belo-horizonte')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), uf = VALUES(uf);

INSERT INTO modelos (nome) VALUES
  ('Polo'), ('Argo'), ('HB20'), ('Onix'), ('Tera')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO estoque_inicial (cidade_id, modelo_id, quantidade)
SELECT c.id, m.id, dados.quantidade
FROM (
  SELECT 'sao-paulo' cidade, 'Polo' modelo, 30 quantidade UNION ALL
  SELECT 'sao-paulo', 'Argo', 135 UNION ALL
  SELECT 'sao-paulo', 'HB20', 90 UNION ALL
  SELECT 'sao-paulo', 'Onix', 0 UNION ALL
  SELECT 'sao-paulo', 'Tera', 100 UNION ALL
  SELECT 'curitiba', 'Polo', 10 UNION ALL
  SELECT 'curitiba', 'Argo', 0 UNION ALL
  SELECT 'curitiba', 'HB20', 40 UNION ALL
  SELECT 'curitiba', 'Onix', 50 UNION ALL
  SELECT 'curitiba', 'Tera', 0 UNION ALL
  SELECT 'santos', 'Polo', 5 UNION ALL
  SELECT 'santos', 'Argo', 10 UNION ALL
  SELECT 'santos', 'HB20', 50 UNION ALL
  SELECT 'santos', 'Onix', 25 UNION ALL
  SELECT 'santos', 'Tera', 0 UNION ALL
  SELECT 'porto-alegre', 'Polo', 45 UNION ALL
  SELECT 'porto-alegre', 'Argo', 15 UNION ALL
  SELECT 'porto-alegre', 'HB20', 0 UNION ALL
  SELECT 'porto-alegre', 'Onix', 84 UNION ALL
  SELECT 'porto-alegre', 'Tera', 0 UNION ALL
  SELECT 'recife', 'Polo', 10 UNION ALL
  SELECT 'recife', 'Argo', 5 UNION ALL
  SELECT 'recife', 'HB20', 20 UNION ALL
  SELECT 'recife', 'Onix', 10 UNION ALL
  SELECT 'recife', 'Tera', 0 UNION ALL
  SELECT 'belo-horizonte', 'Polo', 20 UNION ALL
  SELECT 'belo-horizonte', 'Argo', 0 UNION ALL
  SELECT 'belo-horizonte', 'HB20', 41 UNION ALL
  SELECT 'belo-horizonte', 'Onix', 5 UNION ALL
  SELECT 'belo-horizonte', 'Tera', 0
) AS dados
JOIN cidades c ON c.slug = dados.cidade
JOIN modelos m ON m.nome = dados.modelo
ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade);

INSERT INTO carros (cidade_id, modelo_id, condicao, faixa_km, categoria, quantidade_inicial)
SELECT cidade_id, modelo_id, 'seminovo', 'ate_50000', 'hatch', quantidade
FROM estoque_inicial
ON DUPLICATE KEY UPDATE quantidade_inicial = VALUES(quantidade_inicial);

INSERT INTO cadastros_carros (carro_id, quantidade, cadastrado_em)
SELECT ca.id, ca.quantidade_inicial, ca.criado_em
FROM carros ca
WHERE ca.quantidade_inicial > 0
  AND NOT EXISTS (SELECT 1 FROM cadastros_carros cc WHERE cc.carro_id = ca.id);
