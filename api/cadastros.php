<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$slug = trim((string) ($_GET['cidade'] ?? ''));
$inicioTexto = (string) ($_GET['inicio'] ?? '');
$fimTexto = (string) ($_GET['fim'] ?? '');

if (!preg_match('/^[a-z0-9-]{2,60}$/', $slug)) {
    responderJson(['erro' => 'Informe uma região válida.'], 422);
}

try {
    $inicio = $inicioTexto !== '' ? new DateTimeImmutable($inicioTexto) : new DateTimeImmutable('-6 days');
    $fim = $fimTexto !== '' ? new DateTimeImmutable($fimTexto) : new DateTimeImmutable('today');
} catch (Throwable) {
    responderJson(['erro' => 'Informe datas válidas.'], 422);
}

if ($inicio->format('Y-m-d') !== $inicioTexto && $inicioTexto !== ''
    || $fim->format('Y-m-d') !== $fimTexto && $fimTexto !== ''
    || $inicio > $fim || $inicio->diff($fim)->days > 366) {
    responderJson(['erro' => 'O período deve ter no máximo 366 dias.'], 422);
}

$consulta = conexaoBanco()->prepare(
    'SELECT DATE(cc.cadastrado_em) AS data, SUM(cc.quantidade) AS quantidade
     FROM cadastros_carros cc
     JOIN carros ca ON ca.id = cc.carro_id
     JOIN cidades ci ON ci.id = ca.cidade_id
     WHERE ci.slug = :slug AND cc.cadastrado_em >= :inicio AND cc.cadastrado_em < :fim
     GROUP BY DATE(cc.cadastrado_em) ORDER BY data'
);
$consulta->execute([
    'slug' => $slug,
    'inicio' => $inicio->format('Y-m-d 00:00:00'),
    'fim' => $fim->modify('+1 day')->format('Y-m-d 00:00:00'),
]);
$porData = [];
foreach ($consulta->fetchAll() as $linha) $porData[$linha['data']] = (int) $linha['quantidade'];

$labels = $quantidades = [];
for ($data = $inicio; $data <= $fim; $data = $data->modify('+1 day')) {
    $labels[] = $data->format('d/m');
    $quantidades[] = $porData[$data->format('Y-m-d')] ?? 0;
}

responderJson(['grafico' => ['labels' => $labels, 'quantidades' => $quantidades]]);
