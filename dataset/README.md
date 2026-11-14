# Datasets do projeto

Este projeto usa **dois datasets**, de dois momentos diferentes:

1. **`cvm_dfp_empresas.csv`** (N2, dataset principal) — companhias de capital aberto brasileiras (472 em 2023 e 464 em 2024), extraído dos dados abertos da CVM. Usado para treinar os modelos de classificação e regressão.
2. **`demonstrativos_financeiros_varejo_br.csv`** (N1, dataset histórico) — 4 varejistas, 2020-2024, capturado manualmente pelo grupo. Reaproveitado na N2 como **estudo de caso** para validar os modelos treinados no dataset CVM.

---

## Dataset 1 — CVM DFP 2023 e 2024 (`cvm_dfp_empresas.csv`)

### Descrição breve

Uma linha por companhia e ano (coluna `ano`): 472 companhias em 2023 e 464 em 2024, com Receita Líquida, Resultado Líquido, Ativo Total, total da conta 2 (`passivo_total`), Patrimônio Líquido e Passivo Exigível (conta 2 − PL), em R$ milhões, demonstrações consolidadas; indicadores derivados (margem líquida, alavancagem, ROE, endividamento); setor de atividade do cadastro da CVM (`setor`, `financeira`); marcação das 4 varejistas da N1 (`varejista`); e o rótulo de risco financeiro (`risco_financeiro`: baixo/medio/alto).

### Origem dos dados

Dados **originais, extraídos pelo grupo** a partir dos dados abertos da CVM (Comissão de Valores Mobiliários) — Demonstrações Financeiras Padronizadas (DFP), anos-base 2023 e 2024, disponíveis publicamente em https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp. Não são dados sintéticos: são as demonstrações financeiras reais, publicamente divulgadas por exigência legal, de todas as companhias abertas brasileiras que entregaram DFP referente a esses anos. O processamento (extração dos valores corretos de cada demonstrativo, cálculo dos indicadores e do rótulo de risco) está em `ml/build_dataset.py`.

Não há dados pessoais/sensíveis — são demonstrações financeiras corporativas públicas, sem necessidade de anonimização.

### Limitações conhecidas

- O código de conta de cada linha do demonstrativo varia entre empresas (profundidade do plano de contas); a extração do resultado e do PL usa correspondência pela **descrição padronizada** da conta (ex.: "Patrimônio Líquido Consolidado"), com o código como reserva.
- Os valores são convertidos para R$ milhões conforme a escala declarada por cada empresa (`ESCALA_MOEDA`): a maioria informa em milhares, mas algumas informam em reais (sem essa conversão, 8 empresas ficariam 1.000 vezes maiores). Usa-se apenas a versão mais recente de cada DFP.
- A conta 2 da CVM ("Passivo Total") inclui o patrimônio líquido e é igual ao ativo total; por isso não é usada como variável de entrada. O passivo sem o PL está em `passivo_exigivel`.
- O dataset mistura empresas de setores muito diferentes (bancos, seguradoras, indústria, varejo), com estruturas de capital muito distintas — isso é discutido como limitação na seção de Resultados do relatório (ex.: bancos têm alavancagem naturalmente alta sem necessariamente estarem em risco).
- O rótulo `risco_financeiro` é **heurístico** (patrimônio líquido negativo = alto risco; resultado negativo ou alavancagem (conta 2 / PL) > 3x = médio risco; caso contrário, baixo risco), não uma classificação de mercado (rating) oficial.
- Validado por cruzamento com os números das 4 varejistas do dataset da N1: Magazine Luiza e Grupo Casas Bahia conferem exatamente em 2023; a Americanas difere por arredondamento; a receita da Lojas Renner difere por escopo (a N1 exclui a Realize), e o resultado líquido da Renner na N1 está deslocado em um ano (o valor de 2023 na N1, R$ 1.196,7 mi, é o de 2024 na CVM).

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
- **Erro de coleta identificado na N2:** os resultados líquidos da Lojas Renner estão deslocados em um ano (ex.: o valor registrado para 2023, R$ 1.196,7 mi, é o resultado de 2024 na CVM; o de 2023 é R$ 976,3 mi).
- Este é o dataset da entrega N1. Na N2, o grupo pretende ampliar a cobertura (mais anos, mais empresas do setor, e incorporação do texto integral dos releases/RI para a análise via LLM).

## Uso pretendido no projeto

Este dataset alimentou a análise exploratória de dados (Python) da entrega N1. Na N2 (após a migração para a Opção Framework), ele é reaproveitado como **estudo de caso de validação**: os modelos de classificação treinados no dataset CVM (acima) são aplicados a estas mesmas 4 empresas, e o risco previsto é comparado com o que se sabe ter de fato acontecido com cada uma (ex.: Americanas em recuperação judicial = risco alto esperado).
