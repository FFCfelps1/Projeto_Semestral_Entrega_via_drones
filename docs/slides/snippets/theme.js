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

// Dark mode theme persistence (example)
const themeKey = 'sky_swt_theme';
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem(themeKey, dark ? 'dark' : 'light');
}
function toggleTheme() {
  const dark = localStorage.getItem(themeKey) !== 'dark';
  setTheme(dark);
}
// init
setTheme(localStorage.getItem(themeKey) === 'dark');
