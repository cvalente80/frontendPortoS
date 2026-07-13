# language: pt
@zurich-real
Funcionalidade: Zurich Auto real com checkpoints BDD
  Como quero controlar os passos do fluxo Zurich real
  Quero disparar a automação por checkpoints explícitos
  Para validar cada etapa em Gherkin

  Esquema do Cenário: Executar um checkpoint real da Zurich
    Dado que tenho um payload real Zurich em "scripts/playwright-transfer/sample-zurich-auto-job.json"
    E que defini o checkpoint Zurich "<checkpoint>"
    Quando executo a automação Zurich real em modo "<modo>"
    Então o resultado Zurich deve estar consistente com o checkpoint
    E o meta Zurich deve conter o passo "<metaStep>"

    Exemplos:
      | checkpoint                                   | modo   | metaStep                                         |
      | pause-dados-auto                             | dry    | simulationSourcePath                             |
      | click-seguinte-escolher-essencial-terceiros  | dry    | simulationSourcePreference                       |
      | click-resumo-learned-coberturas-drag-calcular| dry    | simulationPayloadSample                          |

  @zurich-live
  Cenário: Executar um checkpoint live da Zurich
    Dado que tenho um payload real Zurich em "scripts/playwright-transfer/sample-zurich-auto-job.json"
    E que defini o checkpoint Zurich "pause-dados-auto"
    E que a verificação Zurich usa o último código recebido por email
    Quando executo a automação Zurich real em modo "real"
    Então o resultado Zurich deve estar consistente com o checkpoint
    E o meta Zurich deve conter o passo "simulationSourcePath"