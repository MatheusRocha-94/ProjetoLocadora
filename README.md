# Dashboard de Frota

Dashboard em HTML/JavaScript com API PHP e banco MySQL/MariaDB. O estoque inicial foi preparado a partir de `Planilha Carros Cidades.xlsx`; as entradas e saídas posteriores ficam em uma tabela própria.

## Instalação no XAMPP

1. Inicie Apache e MySQL no painel do XAMPP.
2. No phpMyAdmin, importe `database/schema.sql` e depois `database/seed.sql`.
3. Se o MySQL não usa as credenciais padrão do XAMPP, configure as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` no ambiente do Apache.
4. Abra `http://localhost/Locadora/`.

## Organização

- `index.html`: marcação do dashboard.
- `assets/css/styles.css`: estilos adicionais.
- `assets/js/tailwind-config.js`: tema visual.
- `assets/js/app.js`: gráfico e integração com a API.
- `api/dashboard.php`: consolidação dos KPIs e do gráfico diário.
- `api/movimentacoes.php`: cadastro de entradas e saídas.
- `api/modelos.php`: modelos disponíveis para o cadastro.
- `config/database.php`: conexão PDO.
- `database/schema.sql`: estrutura do banco.
- `database/seed.sql`: estoque inicial extraído da planilha.

## Como registrar movimentações

Use o formulário no próprio dashboard. Também é possível inserir diretamente no banco:

```sql
INSERT INTO movimentacoes (cidade_id, modelo_id, tipo, quantidade, ocorrido_em)
SELECT c.id, m.id, 'retirada', 3, NOW()
FROM cidades c
JOIN modelos m ON m.nome = 'Polo'
WHERE c.slug = 'sao-paulo';
```

O gráfico exibe o volume de entradas (devoluções) e saídas (retiradas) dos últimos sete dias na região selecionada. Os KPIs acumulam todas as movimentações da região. O saldo atual é `estoque inicial + devoluções - retiradas`.
