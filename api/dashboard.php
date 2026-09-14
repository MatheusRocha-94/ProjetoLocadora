<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$slug = trim((string) ($_GET['cidade'] ?? ''));

if ($slug === '' || !preg_match('/^[a-z0-9-]{2,60}$/', $slug)) {
    responderJson(['erro' => 'Informe uma cidade válida.'], 422);
}

$pdo = conexaoBanco();
$consultaCidade = $pdo->prepare('SELECT id, nome, uf, slug FROM cidades WHERE slug = :slug');
$consultaCidade->execute(['slug' => $slug]);
$cidade = $consultaCidade->fetch();

if (!$cidade) {
    responderJson(['erro' => 'Cidade não encontrada.'], 404);
}

$fim = new DateTimeImmutable('today');
$inicio = $fim->modify('-6 days');

$consultaResumo = $pdo->prepare(
    "SELECT
        COALESCE(SUM(CASE WHEN tipo = 'retirada' THEN quantidade ELSE 0 END), 0) AS saidas,
        COALESCE(SUM(CASE WHEN tipo = 'devolucao' THEN quantidade ELSE 0 END), 0) AS entradas
     FROM movimentacoes
     WHERE cidade_id = :cidade_id"
);
$consultaResumo->execute(['cidade_id' => $cidade['id']]);
$resumo = $consultaResumo->fetch();

$consultaInicial = $pdo->prepare(
    'SELECT COALESCE(SUM(quantidade), 0) FROM estoque_inicial WHERE cidade_id = :cidade_id'
);
$consultaInicial->execute(['cidade_id' => $cidade['id']]);
$estoqueInicial = (int) $consultaInicial->fetchColumn();

$consultaGrafico = $pdo->prepare(
    "SELECT DATE(ocorrido_em) AS data,
        SUM(CASE WHEN tipo = 'retirada' THEN quantidade ELSE 0 END) AS saidas,
        SUM(CASE WHEN tipo = 'devolucao' THEN quantidade ELSE 0 END) AS entradas
     FROM movimentacoes
     WHERE cidade_id = :cidade_id
       AND ocorrido_em >= :inicio
       AND ocorrido_em < :fim_exclusivo
     GROUP BY DATE(ocorrido_em)
     ORDER BY data"
);
$consultaGrafico->execute([
    'cidade_id' => $cidade['id'],
    'inicio' => $inicio->format('Y-m-d 00:00:00'),
    'fim_exclusivo' => $fim->modify('+1 day')->format('Y-m-d 00:00:00'),
]);

$porData = [];
foreach ($consultaGrafico->fetchAll() as $linha) {
    $porData[$linha['data']] = [
        'saidas' => (int) $linha['saidas'],
        'entradas' => (int) $linha['entradas'],
    ];
}

$labels = [];
$saidas = [];
$entradas = [];
$data = $inicio;

while ($data <= $fim) {
    $chave = $data->format('Y-m-d');
    $labels[] = $data->format('d/m');
    $saidas[] = $porData[$chave]['saidas'] ?? 0;
    $entradas[] = $porData[$chave]['entradas'] ?? 0;
    $data = $data->modify('+1 day');
}

$totalSaidas = (int) $resumo['saidas'];
$totalEntradas = (int) $resumo['entradas'];

responderJson([
    'cidade' => [
        'nome' => $cidade['nome'],
        'uf' => $cidade['uf'],
        'slug' => $cidade['slug'],
    ],
    'totalSaidas' => $totalSaidas,
    'totalEntradas' => $totalEntradas,
    'saldoPatio' => $estoqueInicial + $totalEntradas - $totalSaidas,
    'grafico' => [
        'labels' => $labels,
        'saidas' => $saidas,
        'entradas' => $entradas,
    ],
    'periodo' => [
        'inicio' => $inicio->format('Y-m-d'),
        'fim' => $fim->format('Y-m-d'),
    ],
]);
