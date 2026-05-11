require('dotenv').config()
const express = require('express');
const cors = require('cors')
const mysql2 = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const app = express()

//middleware
app.use(cors())
app.use(express.json())

let conexao                             //representa a conexão com o banco

//endereço do barramento 
const PORT = Number(process.env.PORT || 3004)
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`
const BARRAMENTO_URL = process.env.BARRAMENTO_URL || 'http://localhost:3001'
const JWT_SECRET = process.env.JWT_SECRET || 'skyswift-dev-secret'

//função para conectar com o banco
const conectar = async () => {          //utilizando promise
    //execução assíncrona para não bloquear
    try{
        conexao = await mysql2.createConnection({
        host: process.env.DB_HOST || process.env.HOST, 
        user: process.env.DB_USER || process.env.USER,
        password: process.env.DB_PASSWORD || process.env.PASSWORD,
        database: process.env.DB_NAME || process.env.DATABASE,
        port: Number(process.env.DB_PORT || 3306)
        })
        console.log('Conectado ao MySQL')
    }
    catch(erro){
        console.log(`Erro ao conectar com o banco: ${erro}`)
    }
}
conectar()

// ******* função para publicar eventos *******
async function publicarEvento(tipo, dados) {
    try {
        await axios.post(`${BARRAMENTO_URL}/eventos`, {
            tipo,
            dados,
            origem: 'cadastro_usuario'
        });
        console.log(`Evento publicado: ${tipo}`);
    } catch (erro) {
        console.log('Erro ao publicar evento:', erro.message);
    }
}

function criarSessao(usuario) {
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        JWT_SECRET,
        { expiresIn: '2h' }
    )

    return {
        message: 'Autenticacao realizada com sucesso.',
        token,
        usuario
    }
}

function autenticarToken(req, res, next) {
    const authHeader = req.headers.authorization || ''
    const [tipo, token] = authHeader.split(' ')

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token de autenticacao nao informado.' })
    }

    try {
        req.auth = jwt.verify(token, JWT_SECRET)
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Token de autenticacao invalido ou expirado.' })
    }
}

// ******* definindo endpoints *******
app.get('/auth/me', autenticarToken, async (req, res) => {
    try {
        const [usuarios] = await conexao.query(
            'SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1',
            [req.auth.id]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' })
        }

        res.json({ usuario: usuarios[0] })
    } catch (error) {
        console.log('Erro ao buscar usuario autenticado:', error.message)
        res.status(500).json({ error: 'Erro ao buscar usuario autenticado.' })
    }
})

app.post('/auth/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios.' })
        }

        if (senha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' })
        }

        const [usuariosExistentes] = await conexao.query(
            'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        )

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({ error: 'Este email ja esta cadastrado.' })
        }

        const senhaHash = await bcrypt.hash(senha, 10)
        const [resultado] = await conexao.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, senhaHash]
        )

        const usuario = {
            id: resultado.insertId,
            nome,
            email
        }

        await publicarEvento('usuario_criado', usuario)

        res.status(201).json(criarSessao(usuario))
    } catch (error) {
        console.log('Erro ao cadastrar usuario:', error.message)
        res.status(500).json({ error: 'Erro ao cadastrar usuario.' })
    }
})

app.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha sao obrigatorios.' })
        }

        const [usuarios] = await conexao.query(
            'SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        )

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Email ou senha invalidos.' })
        }

        const usuarioEncontrado = usuarios[0]
        const senhaJaCriptografada = usuarioEncontrado.senha.startsWith('$2')
        const senhaValida = senhaJaCriptografada
            ? await bcrypt.compare(senha, usuarioEncontrado.senha)
            : senha === usuarioEncontrado.senha

        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha invalidos.' })
        }

        if (!senhaJaCriptografada) {
            const senhaHash = await bcrypt.hash(senha, 10)
            await conexao.query('UPDATE usuarios SET senha = ? WHERE id = ?', [senhaHash, usuarioEncontrado.id])
        }

        const usuario = {
            id: usuarioEncontrado.id,
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email
        }

        res.json(criarSessao(usuario))
    } catch (error) {
        console.log('Erro ao autenticar usuario:', error.message)
        res.status(500).json({ error: 'Erro ao autenticar usuario.' })
    }
})
//cadastrar usuário 
app.post("/usuarios", async (req, res) => {
    try{
        const {nome, email, senha} = req.body         //acessa o corpo da requisição 
        const senhaHash = await bcrypt.hash(senha, 10)
        const [resultado] = await conexao.query(`INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, senhaHash])
        
        //publicar evento
        await publicarEvento('usuario_criado', {
            id: resultado.insertId,
            nome,
            email
        });
        
        res.status(201).json({
            nome: nome,
            email: email,
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
        const [linhas] = await conexao.query('SELECT id, nome, email, data_criacao FROM usuarios')
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
        const senhaHash = await bcrypt.hash(senha, 10)
        const [resultado] = await conexao.query(`UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?`, [nome, email, senhaHash, id])
        
        //publicar evento
        await publicarEvento('usuario_atualizado', {
            id,
            nome,
            email
        });
        
        res.status(201).json({
            nome: nome, 
            email: email
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
        
        //publicar evento
        await publicarEvento('usuario_deletado', {
            id
        });
        
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
        const senhaHash = await bcrypt.hash(senha, 10)
        const [resultado] = await conexao.query("UPDATE usuarios SET senha = ? WHERE id = ?", [senhaHash, id])
        
        // Publicar evento
        await publicarEvento('usuario_senha_atualizada', {
            id
        });
        
        res.status(201).json({mensagem: 'Senha atualizada com sucesso'})
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
        
        // Publicar evento
        await publicarEvento('usuario_email_atualizado', {
            id,
            email
        });
        
        res.status(201).json({
            email: email
        })
    }
    catch(erro){
        console.log(erro);
        res.status(500).json({erro: "Erro ao atualizar email"})
    }
})

// ******* endpoint para receber eventos *******
app.post('/eventos/receber', (req, res) => {
    const { tipo, dados, origem } = req.body;
    console.log(`Evento recebido: ${tipo} de ${origem}`, dados);
    
    // Aqui você pode reagir aos eventos de outros serviços
    
    res.json({ success: true, mensagem: 'Evento recebido' });
});

//inscrever no barramento quando o servidor inicia 
async function inscreverNoBarramento(){
    try{
        await axios.post(`${BARRAMENTO_URL}/inscricao`, {
            nome: 'cadastro_usuario', 
            url: SERVICE_URL
        });
        console.log('Inscrito no barramento de eventos')
    }
    catch(error){
        console.log('Erro ao inscrever no barramento: ', error.message);
    }
}

//executa o servidor 
app.listen(PORT, () => {
    console.log(`Servidor executando na porta ${PORT}`)
    inscreverNoBarramento();
})

