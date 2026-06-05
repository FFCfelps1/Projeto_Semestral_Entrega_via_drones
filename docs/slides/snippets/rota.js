/*
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
*/

// Exemplo simplificado de endpoint de rota (Node.js / Express)
const express = require('express');
const app = express();
app.use(express.json());

app.post('/rota', (req, res) => {
  const { origemLat, origemLng, destinoLat, destinoLng } = req.body;
  // logica de roteirizacao ficticia
  res.json({ ok: true, eta: '00:12:34', path: [ [origemLat, origemLng], [destinoLat, destinoLng] ] });
});

module.exports = app;
