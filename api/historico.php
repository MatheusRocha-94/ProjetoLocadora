<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$cidade = trim((string) ($_GET['cidade'] ?? ''));
$modeloId = filter_var($_GET['modeloId'] ?? null, FILTER_VALIDATE_INT);
$tipo = trim((string) ($_GET['tipo'] ?? ''));
$inicio = trim((string) ($_GET['inicio'] ?? ''));
$fim = trim((string) ($_GET['fim'] ?? ''));

if ($cidade !== '' && !preg_match('/^[a-z0-9-]{2,60}$/', $cidade)) {
    responderJson(['erro' => 'Informe uma região válida.'], 422);
}
if (isset($_GET['modeloId']) && $_GET['modeloId'] !== '' && ($modeloId === false || $modeloId < 1)) {
    responderJson(['erro' => 'Informe um modelo válido.'], 422);
}
if ($tipo !== '' && !in_array($tipo, ['retirada', 'devolucao', 'manutencao', 'retido', 'sinistro'], true)) {
    responderJson(['erro' => 'Informe um tipo de operação válido.'], 422);
}

$validarData = static function (string $valor): bool {
    if ($valor === '') return true;
    $data = DateTimeImmutable::createFromFormat('!Y-m-d', $valor);
    return $data !== false && $data->format('Y-m-d') === $valor;
};

if (!$validarData($inicio) || !$validarData($fim)) {
    responderJson(['erro' => 'Informe as datas no formato válido.'], 422);
}
if ($inicio !== '' && $fim !== '' && $inicio > $fim) {
    responderJson(['erro' => 'A data inicial não pode ser posterior à data final.'], 422);
}

$sql = "SELECT data, cidade, uf, cidade_slug, modelo_id, modelo, tipo, operacao, quantidade, observacao
        FROM (
            SELECT mv.ocorrido_em AS data, c.nome AS cidade, c.uf, c.slug AS cidade_slug,
                   m.id AS modelo_id, m.nome AS modelo, mv.tipo, mv.tipo AS operacao,
                   mv.quantidade, NULL AS observacao
            FROM movimentacoes mv
            JOIN cidades c ON c.id = mv.cidade_id
            LEFT JOIN modelos m ON m.id = mv.modelo_id

            UNION ALL

            SELECT ms.ocorrido_em AS data, c.nome AS cidade, c.uf, c.slug AS cidade_slug,
                   m.id AS modelo_id, m.nome AS modelo, ms.status AS tipo, ms.operacao,
                   ms.quantidade, ms.observacao
            FROM movimentacoes_status ms
            JOIN cidades c ON c.id = ms.cidade_id
            JOIN modelos m ON m.id = ms.modelo_id
        ) AS historico";

$condicoes = [];
$parametros = [];
if ($cidade !== '') {
    $condicoes[] = 'cidade_slug = :cidade';
    $parametros['cidade'] = $cidade;
}
if ($modeloId !== false && $modeloId !== null) {
    $condicoes[] = 'modelo_id = :modelo_id';
    $parametros['modelo_id'] = $modeloId;
}
if ($tipo !== '') {
    $condicoes[] = 'tipo = :tipo';
    $parametros['tipo'] = $tipo;
}
if ($inicio !== '') {
    $condicoes[] = 'data >= :inicio';
    $parametros['inicio'] = $inicio . ' 00:00:00';
}
if ($fim !== '') {
    $condicoes[] = 'data < :fim_exclusivo';
    $parametros['fim_exclusivo'] = (new DateTimeImmutable($fim))->modify('+1 day')->format('Y-m-d 00:00:00');
}
if ($condicoes) $sql .= ' WHERE ' . implode(' AND ', $condicoes);
$sql .= ' ORDER BY data DESC LIMIT 1000';

$consulta = conexaoBanco()->prepare($sql);
$consulta->execute($parametros);
$registros = array_map(
    static fn (array $linha): array => [
        'data' => $linha['data'],
        'cidade' => $linha['cidade'],
        'uf' => $linha['uf'],
        'modelo' => $linha['modelo'] ?? 'Não informado',
        'tipo' => $linha['tipo'],
        'operacao' => $linha['operacao'],
        'quantidade' => (int) $linha['quantidade'],
        'observacao' => $linha['observacao'],
    ],
    $consulta->fetchAll()
);

responderJson([
    'totalRegistros' => count($registros),
    'totalVeiculos' => array_sum(array_column($registros, 'quantidade')),
    'limite' => 1000,
    'registros' => $registros,
]);
