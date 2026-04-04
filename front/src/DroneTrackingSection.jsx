import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

import "leaflet/dist/leaflet.css";

//configuração dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ORIGEM_FIXA = [-23.5505, -46.6333]; // SkySwift (marco zero de sp)
const NOME_ORIGEM = "Centro Logístico SkySwift, Bloco B";

const DroneTrackingSection = ({ themeMode }) => {
  const [enderecoDestino, setEnderecoDestino] = useState("");   //endereço do estino
  const [destino, setDestino] = useState(null);                 //coodenadas do destino (lat, long)
  const [rotaPontos, setRotaPontos] = useState([]);             //pontos utilizados para traçar rota
  const [loading, setLoading] = useState(false);                //status do botão 

  const buscarRota = async () => {
    if (!enderecoDestino.trim()) {      //trim: retira espaços extras da string
      alert("Por favor, digite o endereço de destino."); //se o endereço não for digitado, gera um alerta
      return;
    }

    setLoading(true);                   //altera status do botão
    setRotaPontos([]);

    try {
      //Geocoding - Converte endereço em coordenadas
      const geoResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDestino)}&limit=1`
      );

      //tratamento caso o endereço não seja encontrado
      if (geoResponse.data.length === 0) {    
        alert("Endereço não encontrado. Tente ser mais específico.");
        setLoading(false);
        return;
      }

      const { lat, lon } = geoResponse.data[0];
      const destinoCoord = [parseFloat(lat), parseFloat(lon)];      //coordenadas do destino

      setDestino(destinoCoord);

      //busca a rota na API
      console.log("Enviando requisição para:", "http://localhost:3002/rota", {
        origemLat: ORIGEM_FIXA[0],
        origemLng: ORIGEM_FIXA[1],
        destinoLat: destinoCoord[0],
        destinoLng: destinoCoord[1],
      });

      const rotaResponse = await axios.get("http://localhost:3002/rota", {
        params: {
          origemLat: ORIGEM_FIXA[0],
          origemLng: ORIGEM_FIXA[1],
          destinoLat: destinoCoord[0],
          destinoLng: destinoCoord[1],
        },
        timeout: 60000, // aumentado para 60 segundos
      });

      console.log("Resposta da rota:", rotaResponse.data);

      //lista de pontos 
      let pontos = [];
      if (rotaResponse.data?.rota && Array.isArray(rotaResponse.data.rota)) {
        pontos = rotaResponse.data.rota;
      } else if (Array.isArray(rotaResponse.data)) {
        pontos = rotaResponse.data;
      }
      console.log("Pontos processados:", pontos.length);
      
      //tratamento de erro caso a API retorne poucos pontos 
      if (pontos.length < 2) {        //desenhar linha reta
        console.warn("Poucos pontos retornados, usando linha reta");
        pontos = [ORIGEM_FIXA, destinoCoord];
      }

      setRotaPontos(pontos);          //altera pontos da rota

    } catch (erro) {
      console.error("❌ Erro ao calcular rota:");
      console.error("Message:", erro.message);
      console.error("Status:", erro.response?.status);
      console.error("Response Data:", erro.response?.data);
      console.error("URL:", erro.config?.url);
      console.error("Full Error:", erro);
      
      let mensagemErro = "Não foi possível calcular a rota.";
      
      if (erro.message.includes('timeout')) {
        mensagemErro = "⏱️ A API de roteamento está lenta. Por favor, aguarde alguns segundos e tente novamente...";
      } else if (erro.response?.status === 0 || erro.message === 'Network Error') {
        mensagemErro = "❌ Erro de conexão. O backend está rodando em localhost:3002?";
      } else if (erro.response?.status === 503) {
        mensagemErro = "⚠️ A API OSRM não está disponível. Verifique sua conexão e tente novamente.";
      } else if (erro.response?.data?.erro) {
        mensagemErro = `❌ ${erro.response.data.erro}`;
      }
      alert(mensagemErro);
    } finally {
      setLoading(false);            //altera status do botão
    }
  };

  return (
    <div className="container mt-4" data-bs-theme={themeMode}>
      <h2 className={`mb-4 ${themeMode === "dark" ? "text-light" : "text-dark"}`}>
        Rastreamento de Entrega por Drone
      </h2>

      {/* Origem e destino */}
      <div 
        className="mb-3 p-2 rounded-3 border"
        style={{
          backgroundColor: themeMode === "dark" ? "#1e2937" : "#f8f9fa",
          color: themeMode === "dark" ? "#e6f0ff" : "#212529",
          borderColor: themeMode === "dark" ? "#334155" : "#dee2e6"
        }}
      >
        <strong>Origem:</strong> {NOME_ORIGEM}
        <p>
          <strong>Destino: </strong> {enderecoDestino} 
        </p>
      </div>
      {/* campo de Destino */}
      <div className="row mb-4">
        <div className="col-md-8">
          <label className={`form-label fw-bold ${themeMode === "dark" ? "text-light" : "text-dark"}`}>
            Destino da Entrega
          </label>
          {/* input com controle do tema da página */}
          <input
            type="text"
            className={`form-control form-control-lg ${
              themeMode === "dark" ? "bg-dark text-light border-secondary" : ""
            }`}
            placeholder="Ex.: Avenida Paulista, 1000 - São Paulo, SP"
            value={enderecoDestino} 
            onChange={(e) => setEnderecoDestino(e.target.value)}
          />
        </div>
        {/* botão de calcualr rota */}
        <div className="col-md-4 d-flex align-items-end">
          <button
            className={`btn btn-lg w-100 ${
              themeMode === "dark" ? "btn-light text-dark" : "btn-success"
            }`}
            onClick={buscarRota}
            disabled={loading}
          >
            {loading ? "Calculando Rota..." : "Calcular Rota"}
          </button>
        </div>
      </div>

      {/* mapa */}
      <div
        className="border rounded-3 overflow-hidden shadow-sm"
        style={{ height: "400px", width: "100%", flexDirection: "column", alignContent: "center", padding: 10}}
      >
        <MapContainer
          center={ORIGEM_FIXA}
          zoom={13}       //valor inicial do zoom
          style={{ height: "100%", width: "100%" }}
        >
          {/* Desenha o mapa de fato */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'   //crédito ao provedor do mapa 
          />

          {/* Marcador de origem */}
          <Marker position={ORIGEM_FIXA} />

          {/* Marcador de destino */}
          {destino && <Marker position={destino} />}

          {/* Rota */}
          {rotaPontos.length > 1 && (
            <Polyline
              positions={rotaPontos}
              color="#0066ff"
              weight={7}
              opacity={0.9}
            />
          )}
        </MapContainer>
      </div>

      {/* Box do destino real - melhorado e adaptável ao tema */}
      {destino && (
        <div 
          className={`mt-4 p-4 rounded-3 border shadow-sm ${
            themeMode === "dark" ? "bg-dark border-secondary text-light" : "bg-white border-primary"
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <div 
              className={`rounded-circle p-3 d-flex align-items-center justify-content-center ${
                themeMode === "dark" ? "bg-primary" : "bg-primary"
              }`}
              style={{ width: "48px", height: "48px" }}
            >
              📍
            </div>

            <div>
              <h5 className={`mb-1 fw-semibold ${themeMode === "dark" ? "text-primary" : "text-primary"}`}>
                Destino da Entrega
              </h5>
              <p className="mb-1 fs-5 fw-medium">
                {enderecoDestino}
              </p>
              <p className={`mb-0 font-mono ${themeMode === "dark" ? "text-light" : "text-muted"}`}>
                Coordenadas: {destino[0].toFixed(4)}, {destino[1].toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneTrackingSection;