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
let conectandoBanco = false

//endereço do barramento 
const PORT = Number(process.env.PORT || 3004)
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`
const BARRAMENTO_URL = process.env.BARRAMENTO_URL || 'http://localhost:3001'
const JWT_SECRET = process.env.JWT_SECRET || 'skyswift-dev-secret'
const DB_RETRY_MS = Number(process.env.DB_RETRY_MS || 5000)

//função para conectar com o banco
const conectar = async () => {          //utilizando promise
    if (conectandoBanco) return conexao

    conectandoBanco = true

    //execução assíncrona para não bloquear
    try{
        conexao = mysql2.createPool({
        host: process.env.DB_HOST || process.env.HOST, 
        user: process.env.DB_USER || process.env.USER,
        password: process.env.DB_PASSWORD || process.env.PASSWORD,
        database: process.env.DB_NAME || process.env.DATABASE,
        port: Number(process.env.DB_PORT || 3306),
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
        })
        await conexao.query('SELECT 1')
        console.log('Conectado ao MySQL')
    }
    catch(erro){
        conexao = null
        console.log(`Erro ao conectar com o banco: ${erro.message}`)
        setTimeout(conectar, DB_RETRY_MS)
    }
    finally {
        conectandoBanco = false
    }
}
conectar()

async function obterConexao() {
    if (!conexao) {
        await conectar()
    }

    return conexao
}

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

function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase()
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
app.get('/health', async (req, res) => {
    try {
        const banco = await obterConexao()

        if (!banco) {
            throw new Error('Banco de dados indisponivel.')
        }

        await banco.query('SELECT 1')

        res.json({
            status: 'ok',
            service: 'cadastro_usuario'
        })
    } catch (error) {
        res.status(503).json({
            status: 'erro',
            service: 'cadastro_usuario',
            error: 'Banco de dados indisponivel.'
        })
    }
})

app.use(async (req, res, next) => {
    const banco = await obterConexao()

    if (!banco) {
        return res.status(503).json({ error: 'Banco de dados indisponivel.' })
    }

    next()
})

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

app.patch('/auth/me', autenticarToken, async (req, res) => {
    try {
        const nome = req.body.nome !== undefined ? String(req.body.nome).trim() : undefined
        const email = req.body.email !== undefined ? normalizarEmail(req.body.email) : undefined

        if (nome === undefined && email === undefined) {
            return res.status(400).json({ error: 'Informe nome ou email para atualizar.' })
        }

        if (nome !== undefined && !nome) {
            return res.status(400).json({ error: 'Nome nao pode ficar vazio.' })
        }

        if (email !== undefined && !emailValido(email)) {
            return res.status(400).json({ error: 'Informe um email valido.' })
        }

        const [usuarios] = await conexao.query(
            'SELECT id, nome, email FROM usuarios WHERE id = ? LIMIT 1',
            [req.auth.id]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' })
        }

        if (email !== undefined && email !== usuarios[0].email) {
            const [usuariosComEmail] = await conexao.query(
                'SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1',
                [email, req.auth.id]
            )

            if (usuariosComEmail.length > 0) {
                return res.status(409).json({ error: 'Este email ja esta cadastrado.' })
            }
        }

        const usuario = {
            id: usuarios[0].id,
            nome: nome ?? usuarios[0].nome,
            email: email ?? usuarios[0].email
        }

        await conexao.query(
            'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
            [usuario.nome, usuario.email, usuario.id]
        )

        await publicarEvento('usuario_atualizado', usuario)

        res.json({
            message: 'Perfil atualizado com sucesso.',
            usuario
        })
    } catch (error) {
        console.log('Erro ao atualizar perfil autenticado:', error.message)
        res.status(500).json({ error: 'Erro ao atualizar perfil autenticado.' })
    }
})

app.patch('/auth/me/senha', autenticarToken, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body

        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias.' })
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' })
        }

        const [usuarios] = await conexao.query(
            'SELECT id, senha FROM usuarios WHERE id = ? LIMIT 1',
            [req.auth.id]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' })
        }

        const usuario = usuarios[0]
        const senhaJaCriptografada = usuario.senha.startsWith('$2')
        const senhaAtualValida = senhaJaCriptografada
            ? await bcrypt.compare(senhaAtual, usuario.senha)
            : senhaAtual === usuario.senha

        if (!senhaAtualValida) {
            return res.status(401).json({ error: 'Senha atual invalida.' })
        }

        const senhaHash = await bcrypt.hash(novaSenha, 10)
        await conexao.query('UPDATE usuarios SET senha = ? WHERE id = ?', [senhaHash, req.auth.id])

        await publicarEvento('usuario_senha_atualizada', { id: req.auth.id })

        res.json({ message: 'Senha atualizada com sucesso.' })
    } catch (error) {
        console.log('Erro ao atualizar senha autenticada:', error.message)
        res.status(500).json({ error: 'Erro ao atualizar senha autenticada.' })
    }
})

app.delete('/auth/me', autenticarToken, async (req, res) => {
    try {
        const [resultado] = await conexao.query('DELETE FROM usuarios WHERE id = ?', [req.auth.id])

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario nao encontrado.' })
        }

        await publicarEvento('usuario_deletado', { id: req.auth.id })

        res.json({ message: 'Conta excluida com sucesso.' })
    } catch (error) {
        console.log('Erro ao excluir conta autenticada:', error.message)
        res.status(500).json({ error: 'Erro ao excluir conta autenticada.' })
    }
})

app.post('/auth/cadastro', async (req, res) => {
    try {
        const { senha } = req.body
        const nome = String(req.body.nome || '').trim()
        const email = normalizarEmail(req.body.email)

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios.' })
        }

        if (!emailValido(email)) {
            return res.status(400).json({ error: 'Informe um email valido.' })
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
        const { senha } = req.body
        const email = normalizarEmail(req.body.email)

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha sao obrigatorios.' })
        }

        if (!emailValido(email)) {
            return res.status(400).json({ error: 'Informe um email valido.' })
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
// ******* endpoint para receber eventos *******
app.post('/eventos/receber', (req, res) => {
    const { tipo, dados, origem } = req.body;
    console.log(`Evento recebido: ${tipo} de ${origem}`, dados);
    
    // Aqui você pode reagir aos eventos de outros serviços
    
    res.json({ success: true, message: 'Evento recebido' });
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

