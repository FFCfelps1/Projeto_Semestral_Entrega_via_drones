# Redesenho do login SkySwift com commits incrementais

## Objetivo e decisões aprovadas

Melhorar a apresentação, acessibilidade e usabilidade local do aplicativo
Flutter. A implementação ocorre na branch `feat/entrega-18-10`, em mudanças
pequenas, verificadas e registradas separadamente com Conventional Commits.

Referências aprovadas:

- [Wireframe](../design/login-wireframe.png).
- [Modelo visual claro e escuro](../design/login-modelo.png).

A composição segue marca e tema, ilustração, título e subtítulo, e-mail,
senha, recuperação, botão Entrar e cadastro. A imagem é uma referência;
textos e controles devem ser widgets Flutter, nunca uma captura da tela.

## Sistema visual

| Elemento | Definição |
| --- | --- |
| Margens horizontais | 24 unidades lógicas |
| Largura máxima | 440 unidades, centralizada |
| Ilustração | 130 unidades de altura |
| Campos e botão principal | Altura mínima de 56 unidades |
| Área de toque | Mínimo de 48 × 48 unidades |
| Raio dos campos e botão | 12 unidades |
| Tipografia | Manrope na marca/título e Roboto no formulário |
| Tamanhos-base | Título 28, corpo/entradas 16, rótulos 14 |
| Espaçamentos | Escala baseada em múltiplos de 8 |

| Cor | Claro | Escuro |
| --- | --- | --- |
| Fundo | `#FFFFFF` | `#0B1220` |
| Campos | `#F8FAFC` | `#111D30` |
| Texto principal | `#0F172A` | `#F8FAFC` |
| Texto secundário | `#475569` | `#A8B4C7` |
| Botão principal | `#2563EB` | `#2563EB` |
| Links | `#1D4ED8` | `#60A5FA` |

Rótulos devem permanecer visíveis. Bordas e ícones precisam de contraste
suficiente; os tons intermediários podem ser ajustados para satisfazer esse
critério sem mudar a direção visual aprovada.

## Arquitetura e comportamento

- `SkySwiftApp` centraliza MaterialApp e temas em `front_mobile/lib/main.dart`.
- A página de login mantém formulário, controladores e foco locais.
- O aplicativo inicia pelo tema do sistema; a alternância manual vale na sessão.
- Fontes e imagens são recursos locais, com licença quando aplicável.
- O conteúdo usa área segura, rolagem e largura máxima. A ilustração é ocultada
  com o teclado aberto. O cadastro acompanha o conteúdo, sem rodapé fixo.
- Campos usam teclado apropriado, preenchimento automático e ações Próximo e
  Concluir. Colar texto continua disponível.
- Validar no envio e, após a primeira tentativa, durante a edição. E-mail exige
  preenchimento e formato básico; senha exige apenas preenchimento.
- Mensagens: “Informe seu e-mail.”, “Digite um e-mail válido.” e
  “Informe sua senha.”. O primeiro campo inválido recebe foco.
- Alternar tema ou visibilidade da senha preserva texto, seleção e foco.
- Controladores e recursos de foco são liberados ao fechar a página.
- Com dados válidos, Entrar informa: “Esta versão ainda não realiza login.”.
- Recuperação e cadastro mostram avisos de indisponibilidade; não navegam.
- Controles possuem descrições acessíveis; o título é identificado como título.

Autenticação HTTP, sessão, biometria e telas reais de cadastro/recuperação não
fazem parte desta entrega. Backend, Kubernetes e microsserviço Dart permanecem
inalterados.

## Sequência de commits

1. `docs(login): registra plano e referencias visuais aprovadas`
2. `refactor(app): separa configuracao do aplicativo da tela de login`
3. `feat(tema): adiciona temas claro e escuro com preferencia do sistema`
4. `feat(marca): adiciona identidade visual do SkySwift ao login`
5. `feat(layout): adapta login para telas pequenas e teclado`
6. `style(login): padroniza campos, textos e botao principal`
7. `feat(formulario): adiciona validacao local e navegacao por teclado`
8. `feat(login): adiciona avisos para acoes ainda indisponiveis`
9. `fix(acessibilidade): completa semantica dos controles de login`

Cada commit contém somente arquivos relacionados e inclui os testes do
comportamento introduzido. O aplicativo deve continuar compilando, com análise
estática e testes aprovados. Correções posteriores são novos commits, sem
reescrever o histórico. Alterações externas são preservadas.

## Organização e verificação

Usar nomes claros, formatação Dart, const quando aplicável e widgets privados
com responsabilidades definidas. Centralizar medidas, cores e tipografia.
Comentários em português explicam decisões, teclado, validação, preservação
do foco e descarte dos recursos; evitar narrar instruções evidentes ou manter
código antigo comentado.

Verificar campos vazios, e-mail malformado, avisos, preservação de valores,
temas, visibilidade da senha, ordem do teclado, foco no primeiro erro, área
ocupada pelo teclado, texto ampliado em 200% e semântica dos controles.

Comparar no navegador os dois temas em 320 × 568, 360 × 800, 390 × 844 e janela
ampla. Aceitação: análise e testes aprovados, sem transbordamentos, sem erros
relevantes no console e com fidelidade à referência. Testes de comportamento
acompanham sua etapa; ajustes puramente visuais usam conferência visual.

## Referências

- [Acessibilidade visual no Flutter](https://docs.flutter.dev/ui/accessibility/ui-design-and-styling).
- [Validação de formulários no Flutter](https://docs.flutter.dev/cookbook/forms/validation).
- [Rótulos de formulário — W3C](https://www.w3.org/WAI/tutorials/forms/labels/).

Modelo recomendado para a execução: GPT-6.1 Sol com raciocínio Alto. A
eficiência será avaliada por correção, validações e retrabalho; não foi
estabelecido benchmark percentual para este projeto.
