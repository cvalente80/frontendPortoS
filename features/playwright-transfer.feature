# language: pt
@demo
Funcionalidade: Transferência Playwright com steps Gherkin
  Como quero controlar os passos da automação
  Quero correr o fluxo local em Gherkin
  Para validar cada etapa separadamente

  Cenário: Preencher e submeter a simulação local por steps
    Dado que abro a demo local de transferência
    E que carrego o payload de exemplo da transferência
    Quando preencho o formulário de transferência com o payload
    E submeto o formulário de transferência
    Então devo ver o contentor de resultado da simulação
    E o texto de resultado deve conter "Simulação recebida"
