<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$conteudo = file_get_contents('php://input');
$dados = json_decode($conteudo ?: '', true);

if (!is_array($dados)) {
    responderJson(['erro' => 'Envie os dados em JSON válido.'], 400);
}

$cidadeSlug = trim((string) ($dados['cidade'] ?? ''));
$modeloId = filter_var($dados['modeloId'] ?? null, FILTER_VALIDATE_INT);
$quantidade = filter_var($dados['quantidade'] ?? null, FILTER_VALIDATE_INT);
$tipo = (string) ($dados['tipo'] ?? '');

if (!preg_match('/^[a-z0-9-]{2,60}$/', $cidadeSlug)) {
    responderJson(['erro' => 'Informe uma região válida.'], 422);
}

if ($modeloId === false || $modeloId < 1 || $quantidade === false || $quantidade < 1) {
    responderJson(['erro' => 'Modelo e quantidade devem ser válidos.'], 422);
}

if (!in_array($tipo, ['retirada', 'devolucao'], true)) {
    responderJson(['erro' => 'O movimento deve ser retirada ou devolução.'], 422);
}

$pdo = conexaoBanco();
$pdo->beginTransaction();

try {
    $consultaCadastro = $pdo->prepare(
        'SELECT c.id AS cidade_id, m.id AS modelo_id
         FROM cidades c
         JOIN modelos m ON m.id = :modelo_id
         WHERE c.slug = :slug'
    );
    $consultaCadastro->execute(['modelo_id' => $modeloId, 'slug' => $cidadeSlug]);
    $cadastro = $consultaCadastro->fetch();

    if (!$cadastro) {
        $pdo->rollBack();
        responderJson(['erro' => 'Região ou modelo não encontrado.'], 404);
    }

    $consultaEstoque = $pdo->prepare(
        "SELECT
            e.quantidade
            + COALESCE(SUM(CASE WHEN mv.tipo = 'devolucao' THEN mv.quantidade ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN mv.tipo = 'retirada' THEN mv.quantidade ELSE 0 END), 0) AS saldo
         FROM estoque_inicial e
         LEFT JOIN movimentacoes mv
           ON mv.cidade_id = e.cidade_id AND mv.modelo_id = e.modelo_id
         WHERE e.cidade_id = :cidade_id AND e.modelo_id = :modelo_id
         GROUP BY e.quantidade
         FOR UPDATE"
    );
    $consultaEstoque->execute([
        'cidade_id' => $cadastro['cidade_id'],
        'modelo_id' => $cadastro['modelo_id'],
    ]);
    $saldo = $consultaEstoque->fetchColumn();

    if ($saldo === false) {
        $pdo->rollBack();
        responderJson(['erro' => 'Não existe estoque inicial para esse modelo e região.'], 422);
    }

    if ($tipo === 'retirada' && $quantidade > (int) $saldo) {
        $pdo->rollBack();
        responderJson(['erro' => "Saída maior que o saldo disponível ({$saldo})."], 422);
    }

    $inserir = $pdo->prepare(
        'INSERT INTO movimentacoes (cidade_id, modelo_id, tipo, quantidade, ocorrido_em)
         VALUES (:cidade_id, :modelo_id, :tipo, :quantidade, NOW())'
    );
    $inserir->execute([
        'cidade_id' => $cadastro['cidade_id'],
        'modelo_id' => $cadastro['modelo_id'],
        'tipo' => $tipo,
        'quantidade' => $quantidade,
    ]);

    $movimentacaoId = (int) $pdo->lastInsertId();
    $pdo->commit();
    $novoSaldo = (int) $saldo + ($tipo === 'devolucao' ? $quantidade : -$quantidade);

    responderJson([
        'mensagem' => ($tipo === 'retirada' ? 'Saída (retirada)' : 'Entrada (devolução)') . ' registrada com sucesso.',
        'movimentacaoId' => $movimentacaoId,
        'saldoModelo' => $novoSaldo,
    ], 201);
} catch (Throwable $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    throw $erro;
}
