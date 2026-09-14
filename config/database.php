<?php

declare(strict_types=1);

function conexaoBanco(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $porta = getenv('DB_PORT') ?: '3306';
    $banco = getenv('DB_NAME') ?: 'locadora';
    $usuario = getenv('DB_USER') ?: 'root';
    $senha = getenv('DB_PASSWORD') ?: '';

    $dsn = "mysql:host={$host};port={$porta};dbname={$banco};charset=utf8mb4";
    $pdo = new PDO($dsn, $usuario, $senha, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
