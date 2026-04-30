require('dotenv').config()
const express = require('express');
const mysql2 = require('mysql2/promise')

const app = express()

//middleware
app.use(express.json())

let conexao                             //representa a conexão com o banco

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
        const {id, nome, email, senha} = req.body         //acessa o corpo da requisição 
        const [resultado] = await conexao.query(`INSERT INTO usuarios (id, nome, email, senha) VALUES (?, ?, ?, ?)`, [id, nome, email, senha])
        res.status(201).json({
            id: id,
            nome: nome,
            email: email,
            senha: senha
        })
    } 
    catch(error){
        console.log(error)
        res.status(500).json({erro: 'Erro ao inserir usuário'})
    }
})