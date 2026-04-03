// Importações
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Criação do servidor
const app = express();
app.use(cors());
app.use(express.json());