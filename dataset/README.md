# Datasets do projeto

Este projeto usa **dois datasets**, de dois momentos diferentes:

1. **`cvm_dfp_2023_empresas.csv`** (N2, dataset principal) — 454 companhias de capital aberto brasileiras, extraído dos dados abertos da CVM. Usado para treinar os modelos de classificação e regressão.
2. **`demonstrativos_financeiros_varejo_br.csv`** (N1, dataset histórico) — 4 varejistas, 2020-2024, capturado manualmente pelo grupo. Reaproveitado na N2 como **estudo de caso** para validar os modelos treinados no dataset CVM.

---

## Dataset 1 — CVM DFP 2023 (`cvm_dfp_2023_empresas.csv`)

### Descrição breve

454 companhias de capital aberto brasileiras, com Receita Líquida, Resultado Líquido, Patrimônio Líquido, Passivo Circulante, Passivo Não Circulante e Ativo Total (ano-base 2023, demonstrações consolidadas), além de indicadores derivados (margem líquida, alavancagem, ROE, endividamento, passivo exigível total) e um rótulo de risco financeiro (`risco_financeiro`: baixo/médio/alto).

### Origem dos dados

Dados **originais, extraídos pelo grupo** a partir dos dados abertos da CVM (Comissão de Valores Mobiliários) — Demonstrações Financeiras Padronizadas (DFP), ano-base 2023, disponíveis publicamente em https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp. Não são dados sintéticos: são as demonstrações financeiras reais, publicamente divulgadas por exigência legal, de todas as companhias abertas brasileiras que entregaram DFP referente a 2023. O processamento (extração dos valores corretos de cada demonstrativo, cálculo dos indicadores e do rótulo de risco) está em `ml/build_dataset.py`.

Não há dados pessoais/sensíveis — são demonstrações financeiras corporativas públicas, sem necessidade de anonimização.

### Limitações conhecidas

- O código de conta de cada linha do demonstrativo varia entre empresas (profundidade do plano de contas); a extração usa correspondência pela **descrição padronizada** da conta (ex.: "Patrimônio Líquido Consolidado"), não pelo código numérico.
- O dataset mistura empresas de setores muito diferentes (bancos, seguradoras, indústria, varejo), com estruturas de capital muito distintas — isso é discutido como limitação na seção de Resultados do relatório (ex.: bancos têm alavancagem naturalmente alta sem necessariamente estarem em risco).
- O rótulo `risco_financeiro` é **heurístico** (patrimônio líquido negativo = alto risco; resultado negativo ou alavancagem > 3x = médio risco; caso contrário, baixo risco), não uma classificação de mercado (rating) oficial.
- Validado por cruzamento com os números já conhecidos das 4 varejistas do dataset da N1 (ver `ml/build_dataset.py`, saída da validação).

### Correção metodológica (14/11/2026): "Passivo Total" era redundante com "Ativo Total"

A primeira versão deste dataset extraía um campo `passivo_total` a partir do código de conta `"2"` da CVM, rotulado "Passivo Total" nos demonstrativos. Em revisão interna do grupo, constatamos que, na estrutura de contas da CVM, esse código já inclui o Patrimônio Líquido como subconta (2.01 Passivo Circulante + 2.02 Passivo Não Circulante + 2.03/2.07/2.08 Patrimônio Líquido = 2 "Passivo Total"). Ou seja, por construção contábil (identidade Ativo = Passivo + PL), esse valor é **sempre idêntico** ao Ativo Total — confirmado empiricamente: `(df['passivo_total'] == df['ativo_total']).sum()` retornava 474 de 474 linhas, diferença máxima 0,0.

Usar essa variável como feature de entrada de um modelo de ML, junto com o Ativo Total, é um problema sério: permite reconstruir algebricamente o Patrimônio Líquido (`PL = Ativo − Passivo`) e, por consequência, o próprio rótulo de risco, que depende do PL. É uma forma de vazamento de rótulo (label leakage) mais sutil do que usar o PL diretamente como feature, mas com o mesmo efeito.

**Correção aplicada**: `ml/build_dataset.py` agora extrai separadamente `passivo_circulante` e `passivo_nao_circulante` (casando pela descrição da conta, já que a posição exata do PL no plano de contas varia por empresa), e soma os dois em `passivo_exigivel_total` — as obrigações com terceiros, excluindo o PL. Esse novo campo é usado apenas para calcular alavancagem/endividamento/rótulo de risco, nunca como feature de entrada do modelo; a feature usada em seu lugar é `passivo_circulante` isoladamente, que não permite a mesma reconstrução algébrica.

**Efeito colateral**: a correção reduziu o dataset de 474 para 454 empresas (20 empresas usam descrições de conta não-padronizadas para o passivo circulante/não circulante, não capturadas pelos padrões de texto do script) e mudou a distribuição de risco de 185 baixo / 247 médio / 42 alto para **250 baixo / 162 médio / 42 alto**.

### Nota (14/11/2026): defasagem de um ano nos dados da Lojas Renner

Ao validar o dataset CVM contra os números já conhecidos da N1, encontramos uma diferença inesperada no resultado líquido de 2023 da Lojas Renner: o valor extraído da CVM (R$ 976,3 milhões) corresponde ao valor de **2022** no dataset da N1, não ao valor de 2023 da N1 (R$ 1.196,7 milhões). A causa provável é que a Lojas Renner adota ano fiscal não-calendário (fevereiro a janeiro), então o exercício "2023" da DFP consolidada da CVM pode cobrir um período defasado em relação ao ano calendário "2023" usado no dataset manual da N1. Essa é uma diferença de **período**, distinta da diferença de **escopo** já documentada acima (receita só da operação de varejo vs. grupo consolidado). Isso não invalida o uso da Lojas Renner no estudo de caso, mas é registrado aqui para transparência.

---

## Dataset 2 — Varejo Brasileiro 2020-2024 (`demonstrativos_financeiros_varejo_br.csv`)

### Descrição breve

Este dataset reúne indicadores financeiros anuais consolidados (Receita Líquida, Resultado Líquido, Patrimônio Líquido, Dívida Bruta e Dívida Líquida, em R$ milhões) de quatro varejistas brasileiras de capital aberto:

- **Magazine Luiza (MGLU3)**
- **Americanas S.A. (AMER3)**
- **Via S.A. / Grupo Casas Bahia (VIIA3 → BHIA3)**
- **Lojas Renner (LREN3)**

para o período de 2020 a 2024, com foco especial em 2021–2024, janela que inclui a descoberta da fraude contábil da Americanas (jan/2023) e a crise financeira do Grupo Casas Bahia.

## Origem dos dados

Os dados **não são sintéticos**: foram capturados manualmente pelo grupo diretamente de divulgações oficiais de Relação com Investidores (RI) das próprias empresas e, quando o documento oficial não estava disponível publicamente de forma direta, de matérias de veículos de imprensa especializada em mercado financeiro (InfoMoney, Poder360, Safras & Mercado) que reproduzem números oficiais dos releases de resultado. Cada valor está rastreado em `fontes.csv`, com a URL exata utilizada.

Não há dados pessoais/sensíveis envolvidos — são demonstrações financeiras corporativas já publicamente divulgadas por lei (CVM), portanto não foi necessária anonimização.

## Arquivos

- `demonstrativos_financeiros_varejo_br.csv`: dataset principal (formato longo/tidy: uma linha por empresa-ano).
- `fontes.csv`: rastreabilidade — qual fonte/URL originou cada bloco de valores.

## Limitações conhecidas (importante para a análise exploratória)

- O dataset é um **painel não balanceado**: nem todas as empresas têm todos os anos/métricas preenchidos (ver coluna `observacao` e células vazias). Isso é proposital e reflete a realidade de coleta manual de dados públicos dispersos — o tratamento dessas lacunas é parte da preparação de dados feita no notebook.
- Os valores da Americanas para 2021 são os **republicados** após a descoberta da fraude (bem diferentes dos originalmente divulgados), o que é, em si, um dado relevante para a discussão de ética/responsabilidade do projeto.
- A Receita Líquida da Lojas Renner refere-se à operação de varejo (não inclui a receita financeira da Realize, sua financeira).
- Este é o dataset da entrega N1. Na N2, o grupo pretende ampliar a cobertura (mais anos, mais empresas do setor, e incorporação do texto integral dos releases/RI para a análise via LLM).

## Uso pretendido no projeto

Este dataset alimentou a análise exploratória de dados (Python) da entrega N1. Na N2 (após a migração para a Opção Framework), ele é reaproveitado como **estudo de caso de validação**: os modelos de classificação treinados no dataset CVM (acima) são aplicados a estas mesmas 4 empresas, e o risco previsto é comparado com o que se sabe ter de fato acontecido com cada uma (ex.: Americanas em recuperação judicial = risco alto esperado).
