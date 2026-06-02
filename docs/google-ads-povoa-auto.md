# Google Ads — Póvoa Seguros Auto

## Objetivo
Gerar leads qualificadas para seguro automóvel com destino à landing:

- URL final: `https://povoaseguros.pt/pt/povoa-auto`
- URL com UTM sugerida: `https://povoaseguros.pt/pt/povoa-auto?utm_source=google&utm_medium=cpc&utm_campaign=search_povoa_auto&utm_content={creative}&utm_term={keyword}`

## Proposta de valor da landing
A campanha deve bater sempre nestes pontos:

- descontos por experiência do condutor
- descontos extra
- vantagens para bons condutores
- comparação entre seguradoras
- proposta rápida sem compromisso
- contacto imediato por WhatsApp
- foco geográfico em Póvoa de Santa Iria e Forte da Casa

## Estrutura recomendada
Criar **1 campanha Search** com **3 grupos de anúncios**.

### Campanha
- Nome: `Search | Seguro Auto | Povoa`
- Objetivo: `Leads`
- Redes: `Só Rede de Pesquisa`
- Localização: `Póvoa de Santa Iria`, `Forte da Casa` e raio de `10-15 km`
- Idioma: `Português`
- Orçamento inicial: `15€–25€/dia`
- Lances:
  - sem tracking configurado: `Maximizar cliques` com CPC máx. de controlo
  - com tracking configurado: `Maximizar conversões`
- Programação: `08:00–22:00`, todos os dias

### Grupo 1 — Seguro Auto Local
**Intenção:** pessoas a procurar seguro auto na zona.

Keywords sugeridas:
- [seguro auto povoa de santa iria]
- [seguro automovel povoa de santa iria]
- [seguro auto forte da casa]
- [seguro carro povoa de santa iria]
- "seguro auto povoa"
- "seguro automovel povoa"
- "seguro auto forte da casa"

### Grupo 2 — Simulação Seguro Auto
**Intenção:** pessoas prontas a pedir proposta.

Keywords sugeridas:
- [simulacao seguro auto]
- [simular seguro auto]
- [pedir seguro auto]
- [cotacao seguro auto]
- "simulacao seguro auto"
- "simular seguro automovel"
- "cotacao seguro carro"

### Grupo 3 — Descontos / Bons Condutores
**Intenção:** procura por preço, poupança e perfil de baixo risco.

Keywords sugeridas:
- [seguro auto barato]
- [desconto seguro auto]
- [seguro auto bons condutores]
- [seguro auto condutor experiente]
- "seguro auto desconto"
- "seguro auto barato"
- "seguro automovel bons condutores"

## Lista inicial de negativas
Adicionar logo no arranque:

- emprego
- recrutamento
- vagas
- curso
- formacao
- stand
- usados
- carros usados
- oficina
- mecanico
- peças
- pecas
- rent a car
- aluguer
- simulador imposto
- selo automovel
- seguro mota
- seguro saude
- seguro vida
- seguro casa
- pdf
- apk
- download

## RSA — Headlines
Usa 10-15 headlines. Aqui tens uma base pronta:

1. Seguro Auto em Póvoa
2. Simulação Grátis de Seguro
3. Descontos Para Bons Condutores
4. Seguro Auto Com Descontos Extra
5. Compare Seguradoras
6. Proposta Rápida Sem Compromisso
7. Seguro Auto Forte da Casa
8. Menor Preço Com Boa Cobertura
9. Peça Já a Sua Simulação
10. Seguro Auto Para O Seu Perfil
11. Apoio Próximo e Rápido
12. Fale Connosco no WhatsApp
13. Coberturas e Franquias Claras
14. Seguro Auto Condutor Experiente
15. Resposta Habitual em 24h

## RSA — Descriptions
Usa 4 descrições. Base sugerida:

1. Compare opções de seguro auto com descontos por experiência, vantagens para bons condutores e resposta rápida.
2. Peça a sua simulação grátis em Póvoa de Santa Iria e Forte da Casa. Sem compromisso e com apoio próximo.
3. Analisamos coberturas, franquias e preço para encontrar uma proposta ajustada ao seu perfil e ao seu carro.
4. Fale já por WhatsApp ou comece a simulação online. Processo simples, rápido e orientado para leads locais.

## Assets recomendados
### Sitelinks
- `Simulação Auto` → `https://povoaseguros.pt/pt/simulacao-auto`
- `Falar no WhatsApp` → `https://povoaseguros.pt/pt/contato`
- `Produto Auto` → `https://povoaseguros.pt/pt/produto-auto`
- `Contacto` → `https://povoaseguros.pt/pt/contato`

### Callouts
- Simulação grátis
- Resposta rápida
- Descontos extra
- Bons condutores
- Apoio local
- Sem compromisso
- Coberturas claras
- Contacto imediato

### Structured snippets
**Cabeçalho:** `Serviços`
- Simulação auto
- Comparação de seguradoras
- Apoio em sinistro
- Renovação de apólice

## Conversões a configurar antes de escalar
Não encontrei integração visível de `GA4`, `Google Ads conversion tracking` ou `GTM` no frontend. Antes de subir orçamento, configura pelo menos:

### Primárias
- envio de formulário de `simulação auto`
- clique para `WhatsApp`
- envio de formulário de `contacto`

### Secundárias
- clique no CTA principal da landing
- scroll > 75%
- visita à página de contacto

## Recomendação de tracking
### Mínimo viável
- instalar `Google Tag Manager` ou `Google tag`
- criar eventos para:
  - `generate_lead`
  - `whatsapp_click`
  - `contact_submit`
  - `quote_start`
- importar conversões para Google Ads

### Implementação técnica já preparada no frontend
O frontend já ficou preparado para disparar eventos em:

- clique em `Começar simulação` na landing
- clique em CTA de `WhatsApp`/contacto na landing
- clique real em `WhatsApp` no `ChatWidget`
- envio com sucesso do formulário de `Contacto`
- envio com sucesso de `Simulação Auto`
- `page_view` nas rotas da SPA

## Variáveis de ambiente suportadas
Adicionar no ambiente de produção as que fizerem sentido:

- `VITE_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX`
- `VITE_GA4_MEASUREMENT_ID=G-XXXXXXX`
- `VITE_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX`
- `VITE_GOOGLE_ADS_LABEL_QUOTE_START=xxxxxxxxxxxxxxx`
- `VITE_GOOGLE_ADS_LABEL_WHATSAPP_CLICK=xxxxxxxxxxxxxxx`
- `VITE_GOOGLE_ADS_LABEL_GENERATE_LEAD=xxxxxxxxxxxxxxx`
- `VITE_GOOGLE_ADS_LABEL_PHONE_CLICK=xxxxxxxxxxxxxxx`

Notas:

- se definires `GTM`, o site usa `dataLayer` e o container GTM
- se definires `GA4` e/ou `Google Ads`, o site carrega `gtag.js`
- podes usar só `GA4`, só `Google Ads`, ou ambos
- para Google Ads direto, precisas do `AW-...` e respetivos `labels`

## Onde encontrar cada ID
### 1. `VITE_GOOGLE_TAG_MANAGER_ID`
No Google Tag Manager:

- entrar no container certo
- olhar para o canto superior direito
- copiar o ID no formato `GTM-XXXXXXX`

### 2. `VITE_GA4_MEASUREMENT_ID`
No Google Analytics 4:

- `Admin`
- `Fluxos de dados`
- escolher o fluxo Web do domínio `povoaseguros.pt`
- copiar o `Measurement ID` no formato `G-XXXXXXXXXX`

### 3. `VITE_GOOGLE_ADS_CONVERSION_ID`
No Google Ads:

- `Objetivos`
- `Conversões`
- abrir qualquer ação de conversão Web já criada
- em `Configuração da tag`, copiar o ID global no formato `AW-XXXXXXXXX`

### 4. Conversion labels (`VITE_GOOGLE_ADS_LABEL_*`)
No Google Ads, dentro de cada conversão Web:

- abrir a conversão
- entrar em `Configuração da tag`
- copiar o `Event snippet`
- encontrar o valor depois de `send_to: 'AW-XXXXXXXXX/ESTE_VALOR'`
- o fragmento depois da barra é o `label`

Exemplo:

```text
send_to: 'AW-123456789/AbCdEfGhIjKlMnOpQr'
```

Neste caso:

- conversion ID = `AW-123456789`
- conversion label = `AbCdEfGhIjKlMnOpQr`

## Conversões que recomendo criar no Google Ads
Criar 4 ações de conversão Web para casar com o tracking já implementado:

- `Quote Start - Povoa Auto`
- `WhatsApp Click - Povoa Auto`
- `Generate Lead - Auto Quote`
- `Phone Click - Contact`

## Lista exata para criar no Google Ads
Criar estas 4 conversões com estes nomes e esta lógica.

### 1. `Generate Lead - Auto Quote`
- **Tipo**: Website
- **Objetivo**: `Leads`
- **Categoria**: `Enviar formulário de lead`
- **Primária/Secundária**: `Primária`
- **Valor**: `Não usar valor` ou `1`
- **Contagem**: `Uma`
- **Janela de conversão**: `30 dias`
- **Evento do site**: `generate_lead`
- **Quando dispara**: após envio com sucesso de `Simulação Auto`
- **Uso**: conversão principal da campanha

### 2. `WhatsApp Click - Povoa Auto`
- **Tipo**: Website
- **Objetivo**: `Leads`
- **Categoria**: `Contacto`
- **Primária/Secundária**: `Secundária` no arranque
- **Valor**: `Não usar valor` ou `1`
- **Contagem**: `Uma`
- **Janela de conversão**: `30 dias`
- **Evento do site**: `whatsapp_click`
- **Quando dispara**: clique nos CTAs de contacto da landing e no botão real do `ChatWidget`
- **Uso**: medir intenção forte, sem misturar logo com lead final

### 3. `Quote Start - Povoa Auto`
- **Tipo**: Website
- **Objetivo**: `Leads`
- **Categoria**: `Iniciar pedido`
- **Primária/Secundária**: `Secundária`
- **Valor**: `Não usar valor` ou `1`
- **Contagem**: `Uma`
- **Janela de conversão**: `30 dias`
- **Evento do site**: `quote_start`
- **Quando dispara**: clique em `Começar simulação` na landing
- **Uso**: microconversão para perceber intenção antes do lead final

### 4. `Phone Click - Contact`
- **Tipo**: Website
- **Objetivo**: `Leads`
- **Categoria**: `Chamada telefónica`
- **Primária/Secundária**: `Secundária`
- **Valor**: `Não usar valor` ou `1`
- **Contagem**: `Uma`
- **Janela de conversão**: `30 dias`
- **Evento do site**: `phone_click`
- **Quando dispara**: clique no telefone ou CTA de chamada na página `Contacto`
- **Uso**: medir leads que preferem telefonar

## Prioridade recomendada para otimização
### Fase 1 — arranque
Usar como conversão principal apenas:

- `Generate Lead - Auto Quote`

Manter como observação/secundárias:

- `WhatsApp Click - Povoa Auto`
- `Quote Start - Povoa Auto`
- `Phone Click - Contact`

### Fase 2 — depois de validares a qualidade dos contactos
Se os contactos por WhatsApp forem realmente bons, podes testar promover também:

- `WhatsApp Click - Povoa Auto`

para primária.

## Mapeamento direto para as env vars
- `VITE_GOOGLE_ADS_LABEL_GENERATE_LEAD` → `Generate Lead - Auto Quote`
- `VITE_GOOGLE_ADS_LABEL_WHATSAPP_CLICK` → `WhatsApp Click - Povoa Auto`
- `VITE_GOOGLE_ADS_LABEL_QUOTE_START` → `Quote Start - Povoa Auto`
- `VITE_GOOGLE_ADS_LABEL_PHONE_CLICK` → `Phone Click - Contact`

## Ordem recomendada de criação no Google Ads
1. criar `Generate Lead - Auto Quote`
2. criar `WhatsApp Click - Povoa Auto`
3. criar `Quote Start - Povoa Auto`
4. criar `Phone Click - Contact`
5. copiar o `AW-...` e cada `label`
6. preencher o `.env.local` ou as variáveis do ambiente de produção
7. publicar e validar no `Tag Assistant`

Sugestão de classificação:

- `Quote Start - Povoa Auto` → secundária
- `WhatsApp Click - Povoa Auto` → primária ou secundária, consoante o teu processo comercial
- `Generate Lead - Auto Quote` → primária
- `Phone Click - Contact` → secundária

## Exemplo de `.env.local`
Preenche localmente assim:

```dotenv
VITE_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_ADS_CONVERSION_ID=AW-123456789
VITE_GOOGLE_ADS_LABEL_QUOTE_START=AbCdEfQuote123
VITE_GOOGLE_ADS_LABEL_WHATSAPP_CLICK=AbCdEfWhats456
VITE_GOOGLE_ADS_LABEL_GENERATE_LEAD=AbCdEfLead789
VITE_GOOGLE_ADS_LABEL_PHONE_CLICK=AbCdEfPhone321
```

Se fores usar só GTM no arranque, podes deixar apenas:

```dotenv
VITE_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
```

e disparar/importar tudo via `dataLayer` dentro do container.

## Ordem ideal de configuração
1. criar o fluxo Web no `GA4`
2. criar ou confirmar o container `GTM`
3. criar as 4 conversões no `Google Ads`
4. copiar os IDs/labels para `.env.local` ou ambiente de produção
5. publicar o site
6. validar no `Tag Assistant`
7. só depois ativar a campanha com orçamento normal

### Convenção sugerida de eventos
- `generate_lead` → submit de simulação ou contacto
- `whatsapp_click` → clique em botão WhatsApp
- `quote_start` → clique em `Começar simulação`
- `phone_click` → clique em número/CTA telefónico
- `page_view` → navegação SPA

## Como validar os eventos
### Em local
- abrir a landing em `http://localhost:5175/pt/povoa-auto`
- abrir o Tag Assistant ou a consola de preview do GTM
- validar os eventos:
  - `page_view`
  - `quote_start`
  - `whatsapp_click`
  - `generate_lead`

### Eventos práticos a testar
- clicar em `Começar simulação` na landing
- clicar no CTA de contacto/WhatsApp da landing
- abrir o `ChatWidget` e clicar no botão real de WhatsApp
- enviar o formulário de `Contacto`
- enviar uma `Simulação Auto`

## Segmentação inicial
- Localização: Póvoa de Santa Iria, Forte da Casa, Alverca e zona envolvente
- Dispositivos: manter `desktop + mobile`, mas monitorizar forte peso do mobile
- Audiências em observação:
  - In-market seguros
  - Utilizadores a pesquisar automóvel
  - Visitantes da landing nos últimos 30 dias

## Regras de otimização para os primeiros 14 dias
- pausar keywords sem cliques qualificados
- cortar termos irrelevantes via relatório de termos de pesquisa
- subir orçamento apenas se houver conversões reais
- não escalar antes de validar:
  - taxa de conversão da landing
  - custo por lead
  - qualidade dos contactos

## Meta inicial realista
Primeira fase de validação:

- 10 a 20 leads nos primeiros 14 dias
- CPL alvo inicial: `10€–25€`
- taxa de conversão landing alvo: `6%–12%`

## Checklist de lançamento
- campanha criada só para Pesquisa
- keywords em correspondência exata e de frase
- negativas iniciais aplicadas
- RSA preenchido com headlines e descriptions
- sitelinks + callouts ativos
- URL final com UTM
- conversões configuradas
- orçamento diário definido
- geografia local confirmada
- revisão em 72 horas marcada

## Próximo passo mais importante
Antes de investir a sério, configurar tracking de conversões para:

- `simulação auto`
- `contacto`
- `WhatsApp`

Sem isso, consegues tráfego, mas não consegues otimizar bem para leads reais.
