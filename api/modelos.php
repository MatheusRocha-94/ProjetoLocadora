<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responderJson(['erro' => 'Método não permitido.'], 405);
}

$modelos = conexaoBanco()
    ->query('SELECT id, nome FROM modelos ORDER BY nome')
    ->fetchAll();

responderJson([
    'modelos' => array_map(
        static fn (array $modelo): array => [
            'id' => (int) $modelo['id'],
            'nome' => $modelo['nome'],
        ],
        $modelos
    ),
]);
