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

# Microsserviço: Entrega via Drone
**Pasta:** `/back/entrega_via_drone`
**Contexto de Desenvolvimento:** Este serviço foi concebido para abstrair a complexidade geográfica da operação. Ele permite que o sistema saiba quanto tempo e qual caminho um drone percorrerá, integrando-se com provedores externos de mapas ou utilizando cálculos matemáticos próprios.
**Descrição:** Responsável pelo cálculo de rotas GPS, estimativa de tempo de chegada (ETA) e monitoramento de trajetórias.

---

### Inteligência de Roteamento
O serviço tenta consumir APIs externas (OSRM). Caso falhem, ele utiliza a fórmula de Haversine para calcular a distância em linha reta e estimar o tempo com base na velocidade média do drone:

```javascript
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000; // metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
```

### Evento de Rota
Ao finalizar um cálculo, o serviço emite um sinal para que o sistema de monitoramento no frontend possa atualizar o mapa do usuário:

```javascript
publicarEvento('RotaCalculada', {
    origemLat, origemLng,
    destinoLat, destinoLng,
    distancia, duracao,
    fallback: true // Indica se foi usado cálculo manual
});
```
