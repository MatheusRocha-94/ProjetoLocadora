<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$pdo = conexaoBanco();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $slug = trim((string) ($_GET['cidade'] ?? ''));
    if ($slug === '' || !preg_match('/^[a-z0-9-]{2,60}$/', $slug)) {
        responderJson(['erro' => 'Informe uma região válida.'], 422);
    }

    $consulta = $pdo->prepare(
        "SELECT ca.id, mo.nome AS modelo, ca.condicao, ca.faixa_km, ca.categoria,
            ca.quantidade_inicial
            + COALESCE(SUM(CASE WHEN mv.tipo = 'devolucao' THEN mv.quantidade ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN mv.tipo = 'retirada' THEN mv.quantidade ELSE 0 END), 0) AS saldo
         FROM carros ca
         JOIN cidades ci ON ci.id = ca.cidade_id
         JOIN modelos mo ON mo.id = ca.modelo_id
         LEFT JOIN movimentacoes mv ON mv.carro_id = ca.id
         WHERE ci.slug = :slug
         GROUP BY ca.id, mo.nome, ca.condicao, ca.faixa_km, ca.categoria, ca.quantidade_inicial
         ORDER BY mo.nome, ca.condicao, ca.faixa_km"
    );
    $consulta->execute(['slug' => $slug]);

    responderJson(['carros' => array_map(static function (array $carro): array {
        return [
            'id' => (int) $carro['id'],
            'modelo' => $carro['modelo'],
            'condicao' => $carro['condicao'],
            'faixaKm' => $carro['faixa_km'],
            'categoria' => $carro['categoria'],
            'saldo' => (int) $carro['saldo'],
        ];
    }, $consulta->fetchAll())]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$dados = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($dados)) {
    responderJson(['erro' => 'Envie os dados em JSON válido.'], 400);
}

$cidade = trim((string) ($dados['cidade'] ?? ''));
$modeloId = filter_var($dados['modeloId'] ?? null, FILTER_VALIDATE_INT);
$quantidade = filter_var($dados['quantidade'] ?? null, FILTER_VALIDATE_INT);
$condicao = (string) ($dados['condicao'] ?? '');
$faixaKm = (string) ($dados['faixaKm'] ?? '');
$categoria = (string) ($dados['categoria'] ?? '');

if (!preg_match('/^[a-z0-9-]{2,60}$/', $cidade)
    || $modeloId === false || $modeloId < 1
    || $quantidade === false || $quantidade < 1
    || !in_array($condicao, ['zero_km', 'seminovo'], true)
    || !in_array($faixaKm, ['ate_30', 'ate_50000', 'acima_100000'], true)
    || !in_array($categoria, ['hatch', 'sedan', 'suv'], true)) {
    responderJson(['erro' => 'Preencha todos os campos com valores válidos.'], 422);
}

$pdo->beginTransaction();
try {
    $consulta = $pdo->prepare(
        'INSERT INTO carros (cidade_id, modelo_id, condicao, faixa_km, categoria, quantidade_inicial)
         SELECT ci.id, mo.id, :condicao, :faixa_km, :categoria, :quantidade
         FROM cidades ci JOIN modelos mo ON mo.id = :modelo_id
         WHERE ci.slug = :cidade
         ON DUPLICATE KEY UPDATE quantidade_inicial = carros.quantidade_inicial + VALUES(quantidade_inicial),
           id = LAST_INSERT_ID(carros.id)'
    );
    $consulta->execute([
        'condicao' => $condicao, 'faixa_km' => $faixaKm, 'categoria' => $categoria,
        'quantidade' => $quantidade, 'modelo_id' => $modeloId, 'cidade' => $cidade,
    ]);
    if ($consulta->rowCount() === 0) {
        $pdo->rollBack();
        responderJson(['erro' => 'Região ou modelo não encontrado.'], 404);
    }

    $carroId = (int) $pdo->lastInsertId();
    $registro = $pdo->prepare('INSERT INTO cadastros_carros (carro_id, quantidade) VALUES (:carro_id, :quantidade)');
    $registro->execute(['carro_id' => $carroId, 'quantidade' => $quantidade]);
    $pdo->commit();
    responderJson(['mensagem' => 'Carros cadastrados com sucesso.'], 201);
} catch (Throwable $erro) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $erro;
}
