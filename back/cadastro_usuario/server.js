require('dotenv').config()
const express = require('express');
const mysql2 = require('mysql2/promise')
const axios = require('axios')
const app = express()

//middleware
app.use(express.json())

let conexao                             //representa a conexão com o banco

//endereço do barramento 
const BARRAMENTO_URL = 'http://localhost:3001'

//função para conectar com o banco
const conectar = async () => {          //utilizando promise
    //execução assíncrona para não bloquear
    try{
        conexao = await mysql2.createConnection({
        host: process.env.HOST, 
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        port: process.env.PORT
        })
        console.log('Conectado ao MySQL')
    }
    catch(erro){
        console.log(`Erro ao conectar com o banco: ${erro}`)
    }
}
conectar()

// ******* definindo endpoints *******
//cadastrar usuário 
app.post("/usuarios", async (req, res) => {
    try{
        const {nome, email, senha} = req.body         //acessa o corpo da requisição 
        const [resultado] = await conexao.query(`INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, senha])
        res.status(201).json({
            nome: nome,
            email: email,
            senha: senha, 
            id: resultado.insertId
        })
    } 
    catch(error){
        console.log(error)
        res.status(500).json({erro: 'Erro ao inserir usuário'})
    }
})

//consultar usuários
app.get("/usuarios", async (req, res) => {
    try{
        const [linhas] = await conexao.query('SELECT * FROM usuarios')
        res.json(linhas)
    } 
    catch(error){
        console.log(error);
        res.status(500).json({erro: 'Erro ao buscar usuarios'}) 
    }
})

//atualizar completamente um usuario especifico
app.put('/usuarios/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {nome, email, senha} = req.body
        const [resultado] = await conexao.query(`UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?`, [nome, email, senha, id])
        res.status(201).json({
            nome: nome, 
            email: email,
            senha: senha, 
        })
    }
    catch(erro){
        console.log(erro)
        res.status(500).json({ erro: "Erro ao atualizar nome, email e senha"})
    }
})

//remoção de um usuário
app.delete('/usuarios/:id', async (req, res) => {
    try{
        const {id} = req.params
        const sql = 'DELETE FROM usuarios WHERE id = ?'
        await conexao.query(sql, [id])
        res.json({mensagem: "Usuário excluído com sucesso!"})
    }
    catch(erro){
        console.log(erro)
        res.status(500).json({
            erro: 'Erro ao excluir usuário'
        })
    }

})

//atualizar parcialmente um usuário (senha)
app.patch('/usuarios/senha/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {senha} = req.body
        const [resultado] = await conexao.query("UPDATE usuarios SET senha = ? WHERE id = ?", [senha, id])
        res.status(201).json({
            senha: senha
        })
    } 
    catch(error){
        console.log(error);
        res.status(500).json({erro: 'Erro ao atualizar senha'})
    }
})

//atualizar parcialmente um usuario (email)
app.patch('/usuarios/email/:id', async (req, res) => {
    try{
        const {id} = req.params
        const {email} = req.body
        const [resultado] = await conexao.query("UPDATE usuarios SET email = ? WHERE id = ?", [email, id])
        res.status(201).json({
            email: email
        })
    }
    catch(erro){
        console.log(erro);
        res.status(500).json({erro: "Erro ao atualizar email"})
    }
})

//inscrever no barramento quando o servidor inicia 
async function increverNoBarramento(){
    try{
        await axios.post(`${BARRAMENTO_URL}/inscricao`, {
            nome: 'cadastro_usuario', 
            url: 'http://lcoalhost:3002'
        });
        console.log('Inscrito no barramento de eventos')
    }
    catch(error){
        console.log('Erro ao inscrever no barramento: ', error.message);
    }
}

//executa o servidor 
const port = 3002
app.listen(port, () => {
    console.log(`Servidor executando na porta ${port}`)
    inscreverNoBarramento();
})

//receber eventos do barramento 
app.post('/eventos/receber', (req, res) => {
    const {tipo, dados, origem} = req.body
    console.log(`Evento recebido: ${tipo} de ${origem}`, dados)
    res.json({success: true ,mensagem: 'Evento recebido'})
})