<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$dados = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($dados)) responderJson(['erro' => 'Envie os dados em JSON válido.'], 400);

$cidadeSlug = trim((string) ($dados['cidade'] ?? ''));
$modeloId = filter_var($dados['modeloId'] ?? null, FILTER_VALIDATE_INT);
$quantidade = filter_var($dados['quantidade'] ?? null, FILTER_VALIDATE_INT);
$status = (string) ($dados['status'] ?? '');
$operacao = (string) ($dados['operacao'] ?? '');
$observacao = trim((string) ($dados['observacao'] ?? ''));

if (!preg_match('/^[a-z0-9-]{2,60}$/', $cidadeSlug)) responderJson(['erro' => 'Informe uma região válida.'], 422);
if ($modeloId === false || $modeloId < 1 || $quantidade === false || $quantidade < 1) responderJson(['erro' => 'Modelo e quantidade devem ser válidos.'], 422);
if (!in_array($status, ['manutencao', 'retido', 'sinistro'], true)) responderJson(['erro' => 'Informe uma situação válida.'], 422);
if (!in_array($operacao, ['entrada', 'liberacao'], true)) responderJson(['erro' => 'A operação deve ser entrada ou liberação.'], 422);
if (mb_strlen($observacao) > 255) responderJson(['erro' => 'A observação deve ter no máximo 255 caracteres.'], 422);

$pdo = conexaoBanco();
$pdo->beginTransaction();

try {
    $consulta = $pdo->prepare('SELECT c.id AS cidade_id, m.id AS modelo_id FROM cidades c JOIN modelos m ON m.id = :modelo_id WHERE c.slug = :slug');
    $consulta->execute(['modelo_id' => $modeloId, 'slug' => $cidadeSlug]);
    $cadastro = $consulta->fetch();
    if (!$cadastro) {
        $pdo->rollBack();
        responderJson(['erro' => 'Região ou modelo não encontrado.'], 404);
    }

    $bloqueio = $pdo->prepare('SELECT quantidade FROM estoque_inicial WHERE cidade_id = :cidade_id AND modelo_id = :modelo_id FOR UPDATE');
    $bloqueio->execute($cadastro);
    $estoqueInicial = $bloqueio->fetchColumn();
    if ($estoqueInicial === false) {
        $pdo->rollBack();
        responderJson(['erro' => 'Não existe estoque inicial para esse modelo e região.'], 422);
    }

    $movimentos = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN tipo = 'devolucao' THEN quantidade ELSE -quantidade END), 0) FROM movimentacoes WHERE cidade_id = :cidade_id AND modelo_id = :modelo_id");
    $movimentos->execute($cadastro);
    $statusTodos = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN operacao = 'entrada' THEN quantidade ELSE -quantidade END), 0) FROM movimentacoes_status WHERE cidade_id = :cidade_id AND modelo_id = :modelo_id");
    $statusTodos->execute($cadastro);
    $statusAtual = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN operacao = 'entrada' THEN quantidade ELSE -quantidade END), 0) FROM movimentacoes_status WHERE cidade_id = :cidade_id AND modelo_id = :modelo_id AND status = :status");
    $statusAtual->execute($cadastro + ['status' => $status]);

    $patio = (int) $estoqueInicial + (int) $movimentos->fetchColumn();
    $disponiveis = $patio - (int) $statusTodos->fetchColumn();
    $saldoStatus = (int) $statusAtual->fetchColumn();

    if ($operacao === 'entrada' && $quantidade > $disponiveis) {
        $pdo->rollBack();
        responderJson(['erro' => "Quantidade maior que o saldo disponível ({$disponiveis})."], 422);
    }
    if ($operacao === 'liberacao' && $quantidade > $saldoStatus) {
        $pdo->rollBack();
        responderJson(['erro' => "Liberação maior que o saldo dessa situação ({$saldoStatus})."], 422);
    }

    $inserir = $pdo->prepare('INSERT INTO movimentacoes_status (cidade_id, modelo_id, status, operacao, quantidade, observacao, ocorrido_em) VALUES (:cidade_id, :modelo_id, :status, :operacao, :quantidade, :observacao, NOW())');
    $inserir->execute($cadastro + [
        'status' => $status, 'operacao' => $operacao, 'quantidade' => $quantidade,
        'observacao' => $observacao !== '' ? $observacao : null,
    ]);
    $id = (int) $pdo->lastInsertId();
    $pdo->commit();
    $rotulos = ['manutencao' => 'manutenção', 'retido' => 'retenção', 'sinistro' => 'sinistro'];
    responderJson([
        'mensagem' => ($operacao === 'entrada' ? 'Entrada em ' : 'Liberação de ') . $rotulos[$status] . ' registrada com sucesso.',
        'movimentacaoId' => $id,
        'saldoStatus' => $saldoStatus + ($operacao === 'entrada' ? $quantidade : -$quantidade),
    ], 201);
} catch (Throwable $erro) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $erro;
}
