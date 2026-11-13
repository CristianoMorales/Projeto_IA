const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, PageBreak, BorderStyle, Header,
} = require("docx");
const fs = require("fs");

const FONT = "Times New Roman";
const FIG = (name) => fs.readFileSync(`../dataset/${name}`);
const LOGO = fs.readFileSync("logo_fci.png");

// ---------- low-level helpers -------------------------------------------------
function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: 24, ...opts }); // 24 half-pt = 12pt default
}

function bodyP(text, opts = {}) {
  // Corpo de texto: justificado, recuo de primeira linha (padrao ABNT 1,25cm = 709 twips)
  return new Paragraph({
    children: [run(text, opts)],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 709 },
    spacing: { after: 160, line: 360 },
  });
}

function bodyPRuns(runs, opts = {}) {
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 709 },
    spacing: { after: 160, line: 360 },
    ...opts,
  });
}

function bullet(text) {
  return new Paragraph({
    children: [run(text)],
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, line: 360 },
  });
}

function sectionHeading(text) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 24 })],
    spacing: { before: 300, after: 160 },
  });
}

function subHeading(text) {
  return new Paragraph({
    children: [run(text, { bold: true, italics: true, size: 24 })],
    spacing: { before: 200, after: 120 },
  });
}

function refEntry(text) {
  return new Paragraph({
    children: [run(text)],
    alignment: AlignmentType.LEFT,
    spacing: { after: 200, line: 276 },
  });
}

function caption(text) {
  return new Paragraph({
    children: [run(text, { italics: true, size: 20 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  });
}

function figure(name, capText, widthPx = 460) {
  const data = FIG(name);
  return [
    new Paragraph({
      children: [new ImageRun({ data, transformation: { width: widthPx, height: Math.round(widthPx * 0.62) }, type: "png" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
    }),
    caption(capText),
  ];
}

// ---------- cabecalho (header) reaproveitando o template da FCI -----------------
const header = new Header({
  children: [
    new Paragraph({
      children: [new ImageRun({ data: LOGO, transformation: { width: 265, height: 59 }, type: "png" })],
      spacing: { after: 40 },
      border: {
        bottom: { color: "FF0000", space: 4, style: BorderStyle.SINGLE, size: 12 },
      },
    }),
  ],
});

// ---------- Bloco frontal: Título / Integrantes / Resumo / Abstract ------------
const frontMatter = [
  new Paragraph({
    children: [run("Sentinela de Risco: Análise Assistida por IA Generativa de Relatórios Financeiros e de Relação com Investidores (RI) do Varejo Brasileiro", { size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
  }),
  new Paragraph({
    children: [
      run("Cristiano Morales ", { bCs: true }),
      run("1", { superScript: true }),
      run("     Caio Carames ", { bCs: true }),
      run("1", { superScript: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120 },
  }),
  new Paragraph({
    children: [
      run("Leonardo Tonon ", { bCs: true }),
      run("1", { superScript: true }),
      run("     Ali Ahmad ", { bCs: true }),
      run("1", { superScript: true }),
    ],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [run("Prof. Dr. Leandro Zerbinatti ", { bCs: true }), run("1", { superScript: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  }),
  new Paragraph({
    children: [run("1", { superScript: true }), run("Faculdade de Computação e Informática (FCI)")],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [run("Universidade Presbiteriana Mackenzie — São Paulo, SP — Brasil")],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  }),
  new Paragraph({
    children: [run("<10437953,10308718,10426930@mackenzista.com.br>", { font: "Courier New", size: 20 })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [run("<lzerbinatti@mackenzie.br>", { font: "Courier New", size: 20 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  }),
  new Paragraph({
    children: [run("2026")],
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
  }),

  new Paragraph({
    children: [run("Resumo", { size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 160 },
  }),
  new Paragraph({
    children: [run(
      "Este projeto propõe um assistente baseado em Modelos de Linguagem de Grande Escala (LLM) para apoiar a análise de risco financeiro de varejistas brasileiras de capital aberto, a partir da leitura de demonstrações financeiras e documentos de Relação com Investidores (RI). A motivação central é o caso da Americanas S.A., cuja fraude contábil, revelada em janeiro de 2023, transformou um lucro líquido divulgado de R$ 544 milhões em 2021 em um prejuízo republicado de R$ 6,2 bilhões, evidenciando os limites da análise manual de balanços. Nesta entrega (N1), o grupo definiu o escopo do projeto, capturou manualmente um dataset original com indicadores financeiros reais (2020–2024) de quatro varejistas — Magazine Luiza, Americanas, Via S.A./Grupo Casas Bahia e Lojas Renner —, realizou a análise exploratória e a preparação desses dados em Python, e discutiu os aspectos éticos e de responsabilidade no uso de IA para essa finalidade. A entrega N2 deverá evoluir o projeto para um protótipo que utiliza a API de um LLM para ler, resumir e sinalizar riscos em documentos de RI, validando os resultados automáticos contra os dados reais aqui coletados.",
      { italics: true }
    )],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 160, line: 360 },
  }),
  new Paragraph({
    children: [
      run("Palavras-chave: ", { bold: true }),
      run("inteligência artificial; modelos de linguagem; análise financeira; relação com investidores; ética em IA."),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 240, line: 360 },
  }),

  new Paragraph({
    children: [run("Abstract", { size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 160 },
  }),
  new Paragraph({
    children: [run(
      "This project proposes a Large Language Model (LLM)-based assistant to support financial risk analysis of publicly traded Brazilian retail companies, based on financial statements and Investor Relations (IR) documents. The core motivation is the Americanas S.A. case, whose accounting fraud, revealed in January 2023, turned a reported 2021 net profit of R$ 544 million into a restated net loss of R$ 6.2 billion, exposing the limits of manual financial statement analysis. In this first deliverable (N1), the group defined the project scope, manually collected an original dataset with real financial indicators (2020-2024) from four retailers — Magazine Luiza, Americanas, Via S.A./Grupo Casas Bahia and Lojas Renner —, performed exploratory data analysis and data preparation in Python, and discussed the ethical and responsibility aspects of using AI for this purpose. The second deliverable (N2) is expected to evolve the project into a prototype that uses an LLM API to read, summarize and flag risks in IR documents, validating the automated outputs against the real data collected here.",
      { italics: true }
    )],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 160, line: 360 },
  }),
  new Paragraph({
    children: [
      run("Keywords: ", { bold: true }),
      run("artificial intelligence; large language models; financial analysis; investor relations; AI ethics."),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 200, line: 360 },
  }),

  new Paragraph({
    children: [run("Integrantes do grupo (nome, RA e e-mail):", { bold: true })],
    spacing: { before: 160, after: 100 },
  }),
  new Paragraph({ children: [run("• Cristiano Morales — RA 10437953 — 10437953@mackenzista.com.br")], spacing: { after: 60 } }),
  new Paragraph({ children: [run("• Caio Carames — RA 10308718 — 10308718@mackenzista.com.br")], spacing: { after: 60 } }),
  new Paragraph({ children: [run("• Leonardo Tonon — RA 10426930 — 10426930@mackenzista.com.br")], spacing: { after: 60 } }),
  new Paragraph({ children: [run("• Ali Ahmad — RA 10427712 — 10427712@mackenzista.com.br")], spacing: { after: 260 } }),
];

// ---------- 1. Introdução -------------------------------------------------------
const s1 = [
  sectionHeading("1. Introdução"),
  subHeading("1.1. Contextualização"),
  bodyP("O varejo é um dos setores mais relevantes da economia brasileira, respondendo por uma parcela significativa do PIB e do emprego formal no país. Nos últimos anos, o setor passou por transformações profundas: aceleração do e-commerce durante e após a pandemia de COVID-19, aumento da concorrência entre operadores físicos e digitais, elevação da taxa de juros (Selic) encarecendo o crédito e o capital de giro das varejistas, e, em alguns casos, crises financeiras agudas — como a fraude contábil da Americanas S.A. (2023) e a reestruturação financeira do Grupo Casas Bahia, que em 2025/2026 chegou a avaliar pedido de recuperação judicial. Nesse cenário, relatórios financeiros e documentos de Relação com Investidores (RI) tornam-se fontes essenciais — porém volumosas e tecnicamente densas — de informação para investidores, credores, analistas e para a própria sociedade civil interessada na saúde financeira dessas companhias."),
  subHeading("1.2. Justificativa"),
  bodyP("A análise manual de demonstrações financeiras (DFP, ITR, releases de resultado, notas explicativas) é trabalhosa, consome tempo especializado e está sujeita a limitações humanas de atenção — o que pode atrasar a percepção de sinais de alerta relevantes. O próprio caso Americanas demonstra que mesmo balanços auditados podem conter inconsistências que passam despercebidas por anos. Modelos de linguagem de grande escala (LLMs), com sua capacidade de processar rapidamente grandes volumes de texto, resumir informações e responder perguntas específicas sobre um documento, apresentam potencial para apoiar — nunca substituir — a análise humana desses relatórios, tornando o processo mais ágil e ampliando a cobertura de empresas que podem ser monitoradas simultaneamente."),
  subHeading("1.3. Objetivo"),
  bodyP("Objetivo geral: desenvolver, ao final do semestre (N2), um assistente baseado em LLM capaz de ler documentos de RI e demonstrações financeiras de varejistas brasileiras, produzir resumos estruturados, extrair indicadores-chave e sinalizar possíveis riscos financeiros, de forma transparente e rastreável às fontes originais."),
  bodyP("Objetivos específicos desta entrega (N1):"),
  bullet("Definir e justificar o escopo do projeto e a opção metodológica (API de LLM aplicada a documentos de negócio);"),
  bullet("Construir um dataset original, real e rastreável, com indicadores financeiros de quatro varejistas brasileiras (2020–2024);"),
  bullet("Realizar a análise exploratória e a preparação desses dados em Python (limpeza, tratamento de valores ausentes, engenharia de indicadores, visualizações);"),
  bullet("Discutir os aspectos éticos e de responsabilidade no uso de IA para análise financeira."),
  subHeading("1.4. Opção do projeto"),
  bodyP("Opção API ChatGPT/LLM — alternativa \"análise de balanço ou de documentos de relação com investidores de empresas\", conforme descrito no enunciado da atividade."),
];

// ---------- 2. Descrição do Problema --------------------------------------------
const s2 = [
  sectionHeading("2. Descrição do Problema"),
  bodyP("Investidores, analistas de crédito, jornalistas econômicos e reguladores precisam avaliar continuamente a saúde financeira de empresas de capital aberto a partir de documentos longos e tecnicamente densos (balanços, demonstrações de resultado, notas explicativas, releases trimestrais). Esse processo hoje é majoritariamente manual: cada novo relatório trimestral precisa ser lido, comparado com períodos anteriores e com pares do setor, e interpretado à luz de eventos relevantes (fatos relevantes, mudanças de gestão, processos judiciais). Esse processo manual tem três limitações centrais que motivam o projeto:"),
  bullet("Escala: é inviável para um único analista acompanhar, com a mesma profundidade, dezenas de empresas do setor simultaneamente;"),
  bullet("Velocidade: sinais de deterioração financeira podem levar meses para serem plenamente compreendidos, atrasando decisões de investidores e credores;"),
  bullet("Sinais textuais qualitativos: informações relevantes muitas vezes estão em texto corrido (notas explicativas, ressalvas de auditoria, seção de riscos) e não apenas em tabelas numéricas — exigindo leitura e interpretação, tarefas em que LLMs se destacam."),
  bodyP("O problema que este projeto busca endereçar é: como estruturar uma solução baseada em IA generativa que auxilie na leitura, resumo e sinalização de risco financeiro a partir de documentos públicos de RI e demonstrações financeiras, de forma confiável, rastreável às fontes e complementar (não substitutiva) ao julgamento humano especializado?"),
];

// ---------- 3. Ética e Responsabilidade -----------------------------------------
const s3 = [
  sectionHeading("3. Aspectos Éticos do Uso da IA e Responsabilidade no Desenvolvimento da Solução"),
  bodyP("O uso de Inteligência Artificial para análise financeira levanta questões éticas e de responsabilidade que o grupo considera centrais para o desenho da solução, e não apenas uma seção formal do relatório:"),
  subHeading("3.1. Risco de alucinação e fidelidade aos dados"),
  bodyP("LLMs podem gerar números ou afirmações plausíveis, porém incorretos (\"alucinações\"), especialmente ao lidar com dados numéricos. Para mitigar esse risco, a solução da N2 deverá adotar uma arquitetura fundamentada (retrieval-augmented generation — RAG), na qual o modelo é obrigado a citar o trecho/página do documento original que sustenta cada afirmação numérica, permitindo verificação humana e reduzindo a chance de números fabricados serem apresentados como fato."),
  subHeading("3.2. Responsabilidade e não substituição do julgamento humano"),
  bodyP("O sistema deve ser tratado explicitamente como uma ferramenta de apoio à decisão, e não como um mecanismo de recomendação de investimento. No Brasil, a análise e recomendação de valores mobiliários é regulada pela CVM (Resolução CVM nº 20/2021, que trata do exercício da profissão de analista de valores mobiliários); portanto, o protótipo acadêmico não deve gerar recomendações de compra/venda, apenas sínteses informativas e sinalizações de risco, sempre acompanhadas de aviso claro de que não substituem análise profissional nem constituem recomendação de investimento."),
  subHeading("3.3. Vieses e cobertura desigual"),
  bodyP("Modelos de linguagem podem ter conhecimento desigual sobre empresas (mais informação disponível sobre grandes companhias do que sobre empresas menores), o que pode enviesar a qualidade da análise a favor de empresas já mais visíveis publicamente. A equipe buscará mitigar esse viés utilizando sempre o texto integral do documento fornecido como contexto (RAG), em vez de depender do conhecimento paramétrico do modelo sobre a empresa."),
  subHeading("3.4. Transparência e explicabilidade"),
  bodyP("Toda saída do sistema deverá indicar o nível de confiança e a fonte (documento e trecho) de cada afirmação relevante, permitindo auditoria humana e evitando a opacidade típica de sistemas de \"caixa-preta\"."),
  subHeading("3.5. Dados pessoais e privacidade"),
  bodyP("O dataset utilizado é composto exclusivamente por informações financeiras corporativas já publicamente divulgadas por exigência regulatória da CVM, não envolvendo dados pessoais sensíveis. Ainda assim, ao processar documentos de RI na íntegra na N2 (que podem eventualmente citar nomes de executivos), a equipe terá atenção para não expor ou tratar indevidamente dados pessoais, seguindo os princípios da LGPD (Lei nº 13.709/2018)."),
  subHeading("3.6. Impacto potencial e uso responsável"),
  bodyP("Informações financeiras incorretas ou mal interpretadas, se divulgadas publicamente, podem influenciar decisões de investimento e até movimentar preços de ações. Por isso, este projeto tem caráter estritamente acadêmico e experimental, sem qualquer uso comercial ou divulgação de sinalizações como aconselhamento financeiro real."),
];

// ---------- 4. Dataset -----------------------------------------------------------
const s4 = [
  sectionHeading("4. Dataset"),
  subHeading("4.1. Descrição geral e origem"),
  bodyP("Para esta entrega, o grupo construiu manualmente um dataset original com indicadores financeiros anuais (2020–2024) de quatro varejistas brasileiras de capital aberto: Magazine Luiza (MGLU3), Americanas S.A. (AMER3), Via S.A./Grupo Casas Bahia (VIIA3 → BHIA3) e Lojas Renner (LREN3). Os dados foram capturados diretamente de divulgações oficiais de Relação com Investidores dessas empresas e, quando o documento oficial não estava disponível de forma direta, de matérias de imprensa especializada em mercado financeiro (InfoMoney, Poder360, Safras & Mercado) que reproduzem números oficiais dos releases de resultado — nunca de fontes não verificadas. Cada valor do dataset está rastreado a uma fonte específica (arquivo fontes.csv, entregue junto ao dataset), com URL de origem."),
  bodyP("Não se trata de um dataset sintético nem de um conjunto de dados acadêmico genérico: os números refletem eventos reais e recentes do mercado brasileiro, incluindo a fraude contábil da Americanas (revelada em 11/01/2023) e a crise financeira do Grupo Casas Bahia — tornando a análise diretamente relevante para o problema descrito na Seção 2. Não há dados pessoais envolvidos, e por isso não foi necessária anonimização: são demonstrações financeiras corporativas cuja divulgação pública é exigida pela CVM."),
  bodyP("O dataset é composto por 5 indicadores numéricos (Receita Líquida, Resultado Líquido, Patrimônio Líquido, Dívida Bruta e Dívida Líquida, todos em R$ milhões) para cada combinação empresa/ano, totalizando 19 linhas (4 empresas × até 5 anos). Trata-se propositalmente de um painel não balanceado — nem todas as empresas possuem todos os anos/indicadores preenchidos, refletindo a realidade da coleta manual de dados dispersos entre múltiplas fontes públicas — e o tratamento dessas lacunas é parte central da preparação de dados descrita a seguir."),
  subHeading("4.2. Análise exploratória e preparação dos dados em Python"),
  bodyP("A análise exploratória e a preparação dos dados foram realizadas em Python (pandas, numpy, matplotlib), documentadas no notebook notebooks/eda_prep.ipynb (entregue junto a este relatório). As principais etapas foram:"),
  bullet("Padronização de tipos numéricos e diagnóstico de completude de dados (percentual de valores ausentes por coluna);"),
  bullet("Remoção de linhas sem nenhum dado numérico coletado (empresa-ano totalmente vazio);"),
  bullet("Engenharia de indicadores derivados: margem líquida (%), alavancagem (dívida bruta / patrimônio líquido) e uma flag booleana de patrimônio líquido negativo — situação de passivo a descoberto, considerada um forte sinal de risco financeiro;"),
  bullet("Construção de uma heurística simples de \"sinal de alerta de risco\" (resultado líquido negativo e/ou patrimônio líquido negativo), que servirá de ponto de partida para o refinamento com o LLM na N2;"),
  bullet("Estatísticas descritivas gerais e por empresa (médias de margem líquida no período disponível);"),
  bullet("Visualizações comparativas entre as quatro empresas: evolução da receita líquida, evolução do resultado líquido (lucro/prejuízo), evolução do patrimônio líquido e matriz de correlação entre os indicadores numéricos;"),
  bullet("Um estudo de caso específico comparando o resultado líquido de 2021 da Americanas conforme originalmente divulgado (lucro de R$ 544 milhões) e conforme republicado após a descoberta da fraude contábil (prejuízo de R$ 6,2 bilhões) — ilustrando por que sinais textuais podem ser tão importantes quanto os números reportados, e motivando a abordagem baseada em LLM da N2."),
  bodyP("Os gráficos a seguir ilustram os principais achados da análise exploratória:"),
  ...figure("fig_receita_liquida.png", "Figura 1 — Receita Líquida anual por empresa (R$ milhões)."),
  ...figure("fig_resultado_liquido.png", "Figura 2 — Resultado Líquido (lucro/prejuízo) anual por empresa (R$ milhões)."),
  ...figure("fig_patrimonio_liquido.png", "Figura 3 — Patrimônio Líquido por empresa (R$ milhões); valores negativos indicam passivo a descoberto."),
  ...figure("fig_americanas_restatement.png", "Figura 4 — Americanas S.A.: resultado líquido de 2021 originalmente divulgado vs. republicado após a fraude contábil."),
  ...figure("fig_correlacao.png", "Figura 5 — Matriz de correlação entre os indicadores financeiros do dataset.", 360),
  subHeading("4.3. Principais achados"),
  bullet("Das quatro empresas, apenas a Lojas Renner apresentou resultado líquido positivo em todos os anos disponíveis; Americanas e Via/Grupo Casas Bahia concentram os períodos de prejuízo mais acentuado;"),
  bullet("A Americanas é a única empresa da amostra com patrimônio líquido negativo em múltiplos anos (2022 e 2023), sinal extremo de risco financeiro;"),
  bullet("O caso do restatement de 2021 demonstra que um único número reportado pode mascarar risco real relevante, reforçando a necessidade de analisar o texto qualitativo dos relatórios (não apenas os números), o que motiva diretamente a abordagem via LLM proposta para a N2;"),
  bullet("As lacunas de dados identificadas (sobretudo para Via/Grupo Casas Bahia em 2021 e para Lojas Renner em 2024) apontam para a necessidade, na N2, de complementar a coleta manual com fontes estruturadas em maior escala, como os dados abertos da CVM (DFP/ITR)."),
];

// ---------- 5. Metodologia e Resultados Esperados --------------------------------
const s5 = [
  sectionHeading("5. Metodologia e Resultados Esperados"),
  subHeading("5.1. Abordagem planejada para a N2"),
  bodyP("A partir do dataset e da análise exploratória desenvolvidos na N1, o grupo pretende construir, na N2, um assistente baseado em LLM (via API) estruturado nas seguintes etapas:"),
  bullet("Ampliação da coleta de dados: incorporação dos dados abertos da CVM (formulários DFP/ITR) e do texto integral dos releases de resultado e relatórios de RI das quatro empresas estudadas, ampliando a cobertura temporal e a granularidade (trimestral);"),
  bullet("Construção de um pipeline de Retrieval-Augmented Generation (RAG): segmentação (chunking) dos documentos de RI, geração de embeddings e indexação em uma base vetorial, permitindo que o LLM responda com base em trechos reais dos documentos, e não apenas em seu conhecimento paramétrico;"),
  bullet("Engenharia de prompts estruturados para: (i) extração automática de indicadores financeiros-chave; (ii) resumo executivo de cada relatório; (iii) identificação de menções textuais a fatores de risco (ex.: \"recuperação judicial\", \"reestruturação de dívida\", \"ressalva de auditoria\", \"fraude\", \"passivo a descoberto\");"),
  bullet("Comparação automática entre empresas e entre períodos, com geração de uma sinalização qualitativa de risco (baixo/médio/alto) acompanhada de justificativa textual e citação da fonte;"),
  bullet("Validação dos resultados do LLM contra o dataset numérico real construído na N1, que funciona como gabarito (ground truth) para aferir a acurácia da extração automática de números."),
  subHeading("5.2. Resultados esperados"),
  bullet("Um protótipo funcional capaz de receber um novo documento de RI (ou balanço) e produzir um resumo estruturado com indicadores-chave, comparação histórica e sinalização de risco com justificativa;"),
  bullet("Avaliação quantitativa: percentual de indicadores numéricos extraídos corretamente pelo LLM quando comparados ao dataset real (gabarito) construído nesta N1;"),
  bullet("Avaliação qualitativa: análise humana da coerência, utilidade e clareza dos resumos e sinalizações gerados, incluindo um teste retrospectivo — verificar se, a partir dos documentos disponíveis à época, o sistema teria sido capaz de sinalizar risco na Americanas antes da revelação pública da fraude em janeiro de 2023;"),
  bullet("Discussão explícita das limitações do sistema (dependência da qualidade dos documentos de entrada, risco residual de alucinação, necessidade de supervisão humana) como parte dos resultados, alinhada à seção de ética e responsabilidade deste relatório."),
];

// ---------- 6. Referências ---------------------------------------------------------
const s6 = [
  sectionHeading("6. Referências"),
  bodyP("As referências abaixo foram citadas ao longo do texto deste relatório, seguindo a norma ABNT NBR 6023 (ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS, 2018)."),
  refEntry("ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 6023: informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018."),
  refEntry("BRASIL. Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais — LGPD)."),
  refEntry("CAMELO, L. API do ChatGPT: como usar todo o poder da inteligência artificial? Agosto, 2023. Disponível em: https://pluga.co/blog/api-chatgpt/. Acesso em: 10 fev. 2025."),
  refEntry("COMISSÃO DE VALORES MOBILIÁRIOS (CVM). Resolução CVM nº 20, de 25 de fevereiro de 2021. Dispõe sobre o exercício da atividade de analista de valores mobiliários. Disponível em: https://www.gov.br/cvm. Acesso em: 13 set. 2026."),
  refEntry("GRUPO CASAS BAHIA. Destaques dos Resultados 4T25/2025 e comparativos 2024/2023. Relação com Investidores. Disponível em: https://ri.casasbahia.com.br. Acesso em: 13 set. 2026."),
  refEntry("INFOMONEY. Americanas (AMER3) tem prejuízo de R$ 12,9 bi em 2022 e revisa lucro de 2021 para prejuízo de R$ 6,2 bi. Disponível em: https://www.infomoney.com.br/mercados/americanas-amer3-resultados-2021-2022/. Acesso em: 13 set. 2026."),
  refEntry("LOJAS RENNER. Relatório Anual 2024. Relação com Investidores. Disponível em: https://www.lojasrennersa.com.br. Acesso em: 13 set. 2026."),
  refEntry("MAGAZINE LUIZA. Demonstrações Financeiras em 31 de dezembro de 2023 e 2022. Relação com Investidores. Disponível em: https://ri.magazineluiza.com.br. Acesso em: 13 set. 2026."),
  refEntry("MAGAZINE LUIZA. Divulgação de Resultados 2021 e 4T21. Relação com Investidores. Disponível em: https://ri.magazineluiza.com.br. Acesso em: 13 set. 2026."),
  refEntry("OPENAI. How can I access the ChatGPT API? Agosto, 2024. Disponível em: https://help.openai.com/en/articles/7039783-how-can-i-access-the-chatgpt-api. Acesso em: 10 fev. 2025."),
  refEntry("PODER360. Americanas tem prejuízo de R$ 2,27 bilhões em 2023. Disponível em: https://www.poder360.com.br/poder-economia/americanas-tem-prejuizo-de-r-227-bilhoes-em-2023/. Acesso em: 13 set. 2026."),
  refEntry("PODER360. Via Varejo tem prejuízo de R$ 342 milhões em 2022. Disponível em: https://www.poder360.com.br/economia/via-varejo-tem-prejuizo-de-r-342-milhoes-em-2022/. Acesso em: 13 set. 2026."),
  refEntry("SAFRAS & MERCADO. Americanas reverte lucro e registra prejuízo de R$ 586 mi no 4º trimestre de 2024. Disponível em: https://safras.com.br/americanas-reverte-lucro-e-registra-prejuizo-de-r-586-mi-no-4-trimestre-de-2024/. Acesso em: 13 set. 2026."),
];

// ---------- 7. Bibliografia --------------------------------------------------------
const s7 = [
  sectionHeading("7. Bibliografia"),
  bodyP("Obras e materiais nos quais o grupo pretende se basear para o desenvolvimento das próximas etapas do projeto (N2):"),
  refEntry("ANTHROPIC. Documentação da API Claude. Disponível em: https://docs.claude.com."),
  refEntry("COMISSÃO DE VALORES MOBILIÁRIOS (CVM). Portal de Dados Abertos — Companhias Abertas: Documentos DFP e ITR. Disponível em: https://dados.cvm.gov.br."),
  refEntry("LEWIS, P. et al. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. In: Advances in Neural Information Processing Systems (NeurIPS), 2020."),
  refEntry("MCKINNEY, W. Python for Data Analysis. 3. ed. Sebastopol: O'Reilly Media, 2022."),
  refEntry("OPENAI. Documentação da API OpenAI. Disponível em: https://platform.openai.com/docs."),
  refEntry("RUSSELL, S.; NORVIG, P. Inteligência Artificial: Uma Abordagem Moderna. 4. ed. Rio de Janeiro: LTC, 2022."),
  refEntry("VASWANI, A. et al. Attention Is All You Need. In: Advances in Neural Information Processing Systems (NeurIPS), 2017."),
  refEntry("WHITE, J. et al. A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT. arXiv:2302.11382, 2023."),
];

// ---------- montagem final -------------------------------------------------------
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { left: 1418, right: 1134, top: 1843, bottom: 1247, header: 709 },
        },
      },
      headers: { default: header },
      children: [
        ...frontMatter,
        ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Relatorio_Projeto_N1.docx", buffer);
  console.log("Relatorio_Projeto_N1.docx (v2, no template da FCI) gerado com sucesso.");
});
