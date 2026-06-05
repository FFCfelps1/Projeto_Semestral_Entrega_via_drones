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

# Frontend: Orquestração e Roteamento
**Pasta:** `/front/src`
**Contexto de Desenvolvimento:** A interface precisava ser rápida e responsiva. O uso de React permitiu criar uma SPA (Single Page Application) onde a transição entre páginas é instantânea, simulando um aplicativo nativo.
**Descrição:** Ponto de entrada da aplicação que gerencia o estado global de autenticação e o roteamento baseado em estado.

---

### Roteamento Customizado
Em vez de bibliotecas pesadas, utilizamos um sistema de estado simples para alternar entre as visualizações:

```javascript
const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Renderização Condicional
  if (currentPath === "/rastreamento") {
    return <DroneTrackingSection themeMode={themeMode} />;
  }

  if (currentPath === "/pedido") {
    return <PedidoPage themeMode={themeMode} />;
  }
  
  // Home por padrão
  return <Hero />;
}
```

### Persistência de Tema (Dark Mode)
O tema é salvo no `localStorage` para que a preferência do usuário seja mantida ao atualizar a página:

```javascript
useEffect(() => {
    // Sincroniza com o atributo data do Bootstrap
    document.documentElement.setAttribute("data-bs-theme", themeMode);
    window.localStorage.setItem("theme-mode", themeMode);
}, [themeMode]);
```
