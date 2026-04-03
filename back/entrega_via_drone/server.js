// Importações
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Criação do servidor
const app = express();
app.use(cors());
app.use(express.json());

// Cria um endpoint para calcular rota
app.get('/rota', async (req, res) => {
  const { origemLat, origemLng, destinoLat, destinoLng } = req.query;

  try {
    const url = `https://router.openstreetmap.de/route/v1/driving/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=full&geometries=geojson`;

    const response = await axios.get(url);

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ erro: 'Erro ao calcular rota' });
  }
});

app.listen(3002, () => {
  console.log('Map service rodando na porta 3002');
});