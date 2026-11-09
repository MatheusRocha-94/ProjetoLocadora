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
- `api/status-veiculos.php`: cadastro de entradas e liberações de veículos indisponíveis.
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

## Histórico de entregas

Esta seção documenta a evolução do projeto a partir do histórico de commits do repositório e da implementação mais recente.

### Entrega 1 — Protótipo inicial do dashboard

Implementações:

- criação da primeira versão do `index.html`;
- dashboard responsivo com Tailwind CSS;
- indicadores de retiradas, devoluções e saldo no pátio;
- gráfico de barras com Chart.js;
- estrutura inicial de integração com uma API de dashboard;
- botão para atualização manual dos dados.

### Entrega 2 — Identidade visual e filtro por cidade


Implementações:

- aplicação da identidade visual inspirada na Kovi;
- criação do tema escuro e da paleta personalizada;
- novo cabeçalho com logotipo, ícones e seletor de cidade;
- reformulação visual dos cards de indicadores;
- melhoria da responsividade para celular e desktop;
- personalização do gráfico com cores e silhuetas de veículos;
- envio da cidade selecionada como filtro para o backend.

### Entrega 3 — Backend PHP e persistência MySQL


Implementações:

- criação da API em PHP com respostas no formato JSON;
- conexão com MySQL/MariaDB utilizando PDO;
- criação das tabelas de cidades, modelos, estoque inicial e movimentações;
- carga inicial da frota por cidade e modelo;
- endpoint de consulta dos modelos disponíveis;
- endpoint para cadastro de retiradas e devoluções;
- validação de cidade, modelo, tipo de movimento e quantidade;
- bloqueio de retiradas maiores que o saldo existente;
- uso de transações no cadastro das movimentações;
- cálculo dos KPIs e do saldo atual por cidade;
- consolidação do gráfico diário dos últimos sete dias;
- integração completa do frontend com a API PHP;
- separação dos arquivos de estilos, tema e JavaScript;
- documentação de instalação e configuração no XAMPP.

### Entrega 4 — Situação operacional dos veículos


Implementações:

- criação da tabela `movimentacoes_status` para manter o histórico operacional;
- inclusão das situações `manutenção`, `retido` e `sinistro`;
- registro de entrada e liberação de veículos em cada situação;
- campo opcional de observação para explicar a ocorrência;
- novo endpoint `api/status-veiculos.php`;
- validação para impedir que mais veículos sejam indisponibilizados do que o saldo disponível;
- validação para impedir a liberação de uma quantidade maior que o saldo da situação;
- cálculo separado entre total físico no pátio e veículos disponíveis;
- bloqueio de retiradas que ultrapassem a disponibilidade operacional;
- novos indicadores de disponíveis, em manutenção, retidos e sinistro;
- novo formulário para alterar a situação da frota;
- atualização automática do dashboard depois de cada operação.

O cálculo utilizado nesta entrega é:

```text
disponíveis = saldo no pátio - manutenção - retidos - sinistro
```

## Atualização de uma instalação existente

Para utilizar a Entrega 4 em um banco que já foi criado anteriormente, execute novamente o arquivo `database/schema.sql` no phpMyAdmin. As tabelas usam `CREATE TABLE IF NOT EXISTS`, portanto os dados existentes são preservados.
