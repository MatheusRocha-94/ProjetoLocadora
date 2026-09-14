<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once dirname(__DIR__) . '/config/database.php';

function responderJson(array $conteudo, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($conteudo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

set_exception_handler(static function (Throwable $erro): void {
    error_log($erro->__toString());
    responderJson(['erro' => 'Erro interno ao consultar os dados.'], 500);
});
