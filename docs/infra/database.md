---
Integrantes:
- Arthur Gama Ruiz (RA: 23.01445-8)
- Enzo Oliveira D’Onofrio (RA: 23.01561-6)
- Felipe Fazio da Costa (RA: 23.00055-4)
- João Vitor Morimoto Sesma (RA: 23.01516-0)
- Leonardo Souza Olivieri (RA: 23.01512-8)
- Pedro Wilian Palumbo Bevilacqua (RA: 23.01307-9)

Data: 04/06/2026
Matérias: 
- ECM516_Arquitetura_de_Computadores
- ECM252_Linguagens_de_Programação_2
---

# Infraestrutura: Banco de Dados e Eventos
**Pasta:** `/back/banco` e `/api/_utils.js`
**Contexto de Desenvolvimento:** O projeto utiliza uma estratégia híbrida. MySQL para o ambiente estável de backend tradicional e SQLite para a versão serverless (Vercel), permitindo deploys rápidos e custo zero.
**Descrição:** Definição das tabelas e conectores que sustentam a persistência do sistema.

---

### Esquema Relacional (SQL)
As tabelas são desenhadas para suportar o relacionamento entre usuários e pedidos:

```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    status ENUM('pendente', 'em_voo', 'entregue'),
    origem_lat DECIMAL(10, 8),
    destino_lat DECIMAL(10, 8),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### Conector MySQL (Pool)
Utilizamos um `Pool` de conexões para evitar sobrecarga no banco de dados e garantir reaproveitamento de conexões ativas:

```javascript
conexao = mysql2.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});
```
