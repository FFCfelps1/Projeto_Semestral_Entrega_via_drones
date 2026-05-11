CREATE DATABASE IF NOT EXISTS skyswift;

USE skyswift;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

INSERT INTO usuarios (nome, email, senha)
SELECT 'Arthur', 'arthur@email.com', '123456'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'arthur@email.com'
);

SELECT id, nome, email, data_criacao FROM usuarios;
