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
$carroId = filter_var($dados['carroId'] ?? null, FILTER_VALIDATE_INT);
$quantidade = filter_var($dados['quantidade'] ?? null, FILTER_VALIDATE_INT);
$tipo = (string) ($dados['tipo'] ?? '');

if (!preg_match('/^[a-z0-9-]{2,60}$/', $cidadeSlug)) {
    responderJson(['erro' => 'Informe uma região válida.'], 422);
}

if ($carroId === false || $carroId < 1 || $quantidade === false || $quantidade < 1) {
    responderJson(['erro' => 'Carro e quantidade devem ser válidos.'], 422);
}

if (!in_array($tipo, ['retirada', 'devolucao'], true)) {
    responderJson(['erro' => 'O movimento deve ser retirada ou devolução.'], 422);
}

$pdo = conexaoBanco();
$pdo->beginTransaction();

try {
    $consultaCadastro = $pdo->prepare(
        'SELECT ca.id AS carro_id, ca.cidade_id, ca.modelo_id
         FROM carros ca
         JOIN cidades c ON c.id = ca.cidade_id
         WHERE ca.id = :carro_id AND c.slug = :slug
         FOR UPDATE'
    );
    $consultaCadastro->execute(['carro_id' => $carroId, 'slug' => $cidadeSlug]);
    $cadastro = $consultaCadastro->fetch();

    if (!$cadastro) {
        $pdo->rollBack();
        responderJson(['erro' => 'Carro não encontrado nessa região.'], 404);
    }

    $consultaEstoque = $pdo->prepare(
        "SELECT
            ca.quantidade_inicial
            + COALESCE(SUM(CASE WHEN mv.tipo = 'devolucao' THEN mv.quantidade ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN mv.tipo = 'retirada' THEN mv.quantidade ELSE 0 END), 0) AS saldo
         FROM carros ca
         LEFT JOIN movimentacoes mv ON mv.carro_id = ca.id
         WHERE ca.id = :carro_id
         GROUP BY ca.id, ca.quantidade_inicial"
    );
    $consultaEstoque->execute([
        'carro_id' => $cadastro['carro_id'],
    ]);
    $saldo = $consultaEstoque->fetchColumn();

    if ($saldo === false) {
        $pdo->rollBack();
        responderJson(['erro' => 'Não existe estoque para esse carro.'], 422);
    }

    if ($tipo === 'retirada' && $quantidade > (int) $saldo) {
        $pdo->rollBack();
        responderJson(['erro' => "Saída maior que o saldo disponível ({$saldo})."], 422);
    }

    $inserir = $pdo->prepare(
        'INSERT INTO movimentacoes (cidade_id, modelo_id, carro_id, tipo, quantidade, ocorrido_em)
         VALUES (:cidade_id, :modelo_id, :carro_id, :tipo, :quantidade, NOW())'
    );
    $inserir->execute([
        'cidade_id' => $cadastro['cidade_id'],
        'modelo_id' => $cadastro['modelo_id'],
        'carro_id' => $cadastro['carro_id'],
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
