# Dataset — Demonstrativos Financeiros de Varejistas Brasileiras (2020–2024)

## Descrição breve

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

Este dataset alimenta a análise exploratória de dados (Python) da entrega N1. Na N2, os textos completos dos relatórios de RI dessas mesmas empresas serão usados como corpus para a solução baseada em LLM (Opção API de LLM), que deverá resumir, comparar e sinalizar riscos financeiros a partir da leitura desses documentos.
