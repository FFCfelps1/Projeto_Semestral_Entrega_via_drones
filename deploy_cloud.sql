-- ─────────────────────────────────────────────────────────────
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (OTIMIZADO PARA NUVEM)
-- Use este script em provedores como PlanetScale, Aiven, Supabase ou RDS.
-- Nota: Muitos provedores não permitem 'CREATE DATABASE'. 
-- Certifique-se de estar conectado ao banco de dados correto antes de rodar.
-- ─────────────────────────────────────────────────────────────

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Tabela de pedidos (gestao_de_pedidos)
CREATE TABLE IF NOT EXISTS pedidos (
    id CHAR(36) NOT NULL,                 -- UUID
    item VARCHAR(255) NOT NULL,
    peso DECIMAL(10,2) NOT NULL,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL,            -- padrao | expressa | prioritaria
    observacoes TEXT NULL,
    usuario_id INT NULL,                  
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
    preco_estimado DECIMAL(10,2) NOT NULL,
    tempo_estimado INT NOT NULL,          -- minutos
    status_historico JSON NOT NULL,       -- [{ status, momento }]
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- Tabela de notificações
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

-- Tabela de inscrições do barramento de eventos
CREATE TABLE IF NOT EXISTS inscricoes (
    nome VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (nome)
);

-- Inserção de inscrições padrão (ajuste as URLs conforme seu deploy)
-- INSERT INTO inscricoes (nome, url) VALUES 
-- ('notificacoes', 'https://seu-projeto.vercel.app/api/notificacoes'),
-- ('gestao_de_pedidos', 'https://seu-projeto.vercel.app/api/gestao_de_pedidos')
-- ON DUPLICATE KEY UPDATE url=VALUES(url);

-- Inserção de usuário de teste (opcional)
-- INSERT INTO usuarios (nome, email, senha) 
-- VALUES ('Arthur', 'arthur@email.com', '$2b$10$YourHashedPasswordHere')
-- ON DUPLICATE KEY UPDATE email=email;
