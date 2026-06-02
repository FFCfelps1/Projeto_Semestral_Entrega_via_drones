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

SELECT id, nome, email, senha, data_criacao
FROM skyswift.usuarios;

-- ─────────────────────────────────────────────────────────────
-- Tabela do microsserviço gestao_de_pedidos
-- Substitui o armazenamento em memória (let pedidos = []) por
-- persistência real, necessária para o deploy serverless na Vercel,
-- onde o estado em memória não sobrevive entre requisições.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
    id CHAR(36) NOT NULL,                 -- UUID gerado pela aplicação
    item VARCHAR(255) NOT NULL,
    peso DECIMAL(10,2) NOT NULL,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL,            -- padrao | expressa | prioritaria
    observacoes TEXT NULL,
    usuario_id INT NULL,                  -- opcional; liga ao usuário que criou
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
    preco_estimado DECIMAL(10,2) NOT NULL,
    tempo_estimado INT NOT NULL,          -- em minutos
    status_historico JSON NOT NULL,       -- [{ status, momento }]
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Tabela do microsserviço de notificações
-- Registra notificações globais geradas a partir de eventos do barramento.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(120) NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    pedido_id CHAR(36) NULL,
    evento_tipo VARCHAR(80) NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lida_em TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_notificacoes_lida_criado (lida, criado_em),
    INDEX idx_notificacoes_pedido (pedido_id)
);
