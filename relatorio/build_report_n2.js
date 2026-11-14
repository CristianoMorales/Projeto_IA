// =============================================================================
// Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
// Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
//
// Titulo do arquivo: build_report_n2.js
// Sintese do conteudo: Gera o Relatorio do Projeto da N2 (Relatorio_Projeto_N2.docx)
//   no template oficial da FCI/Mackenzie (logo + linha vermelha no cabecalho,
//   fonte Times New Roman), com os 12 itens exigidos pelo enunciado da N2.
//   Reaproveita o helper de layout e o logo do script da N1
//   (build_report.js / logo_fci.png), mas reescreve todo o conteudo textual
//   para refletir a mudanca de "Opcao API de LLM" para "Opcao Framework"
//   (ver Secao 1.4 do relatorio gerado).
//
// Integrantes do grupo:
//   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
//   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
//   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
//   - Ali Ahmad              | RA 10427712 | 10427712@mackenzista.com.br
//
// Historico de atualizacoes:
//   2026-11-13 | Cristiano Morales | Criacao do relatorio da N2 (pivot para
//               Opcao Framework): novo dataset CVM, modelos de classificacao
//               e regressao, estudo de caso, resultados e conclusao.
// =============================================================================

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, PageBreak, BorderStyle, Header,
} = require("docx");
const fs = require("fs");

const FONT = "Times New Roman";
const FIG_DATASET = (name) => fs.readFileSync(`../dataset/${name}`);
const FIG_ML = (name) => fs.readFileSync(`../ml/figuras/${name}`);
const LOGO = fs.readFileSync("logo_fci.png");

// ---------- low-level helpers -------------------------------------------------
function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: 24, ...opts }); // 24 half-pt = 12pt default
}

function bodyP(text, opts = {}) {
  return new Paragraph({
    children: [run(text, opts)],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 709 },
    spacing: { after: 160, line: 360 },
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

function figureFrom(loader, name, capText, widthPx = 460, aspect = 0.62) {
  const data = loader(name);
  return [
    new Paragraph({
      children: [new ImageRun({ data, transformation: { width: widthPx, height: Math.round(widthPx * aspect) }, type: "png" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
    }),
    caption(capText),
  ];
}
const figureDataset = (name, cap, w, a) => figureFrom(FIG_DATASET, name, cap, w, a);
const figureML = (name, cap, w, a) => figureFrom(FIG_ML, name, cap, w, a);

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
    children: [run("Sentinela de Risco: Classificação de Risco Financeiro de Empresas Brasileiras com Machine Learning", { size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
  }),
  new Paragraph({
    children: [
      run("Cristiano Morales ", { bCs: true }), run("1", { superScript: true }),
      run("     Caio Carames ", { bCs: true }), run("1", { superScript: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120 },
  }),
  new Paragraph({
    children: [
      run("Leonardo Tonon ", { bCs: true }), run("1", { superScript: true }),
      run("     Ali Ahmad ", { bCs: true }), run("1", { superScript: true }),
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
    children: [run("<10437953,10308718,10426930,10427712@mackenzista.com.br>", { font: "Courier New", size: 20 })],
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
      "Este projeto utiliza técnicas clássicas de Machine Learning (biblioteca scikit-learn) para classificar o risco financeiro e prever o resultado líquido de companhias brasileiras de capital aberto a partir de indicadores extraídos de suas demonstrações financeiras, motivado pelo caso da fraude contábil da Americanas S.A. (revelada em janeiro de 2023). Na entrega N1, o grupo havia optado pela \"Opção API de LLM\", mas, diante da indisponibilidade prática de uma API de linguagem gratuita e confiável dentro do prazo do projeto, migrou para a \"Opção Framework\" na N2 — decisão documentada e justificada na Seção 1.4. O dataset principal desta entrega foi construído a partir dos dados abertos da Comissão de Valores Mobiliários (CVM), processando as Demonstrações Financeiras Padronizadas (DFP) de 2023 de 474 companhias abertas brasileiras; o dataset original da N1 (quatro varejistas, 2020–2024) foi reaproveitado como estudo de caso de validação. Foram treinados e avaliados, por validação cruzada estratificada, modelos de classificação (Regressão Logística e Random Forest) para prever uma categoria de risco financeiro (baixo/médio/alto) e modelos de regressão (Linear e Random Forest) para prever o resultado líquido, usando deliberadamente apenas variáveis de \"tamanho\" do balanço (receita líquida, ativo total e passivo total) como entrada, para evitar uma tarefa trivial/circular. O modelo de Random Forest atingiu 47,7% de acurácia na classificação de risco (contra um acerto esperado de aproximadamente 33% ao acaso, em um problema de três classes) e acertou corretamente a categoria de risco das quatro varejistas do estudo de caso, incluindo a sinalização de risco alto para a Americanas. Os resultados, limitações metodológicas (heterogeneidade setorial, rótulo heurístico) e possíveis extensões futuras são discutidos em detalhe.",
      { italics: true }
    )],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 160, line: 360 },
  }),
  new Paragraph({
    children: [
      run("Palavras-chave: ", { bold: true }),
      run("inteligência artificial; machine learning; classificação; regressão; risco financeiro; scikit-learn."),
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
      "This project uses classical Machine Learning techniques (scikit-learn) to classify financial risk and predict the net income of publicly traded Brazilian companies from indicators extracted from their financial statements, motivated by the Americanas S.A. accounting fraud case (revealed in January 2023). In the first deliverable (N1), the group had chosen the \"LLM API Option\", but, given the practical unavailability of a reliable free LLM API within the project deadline, migrated to the \"Framework Option\" in N2 — a decision documented and justified in Section 1.4. The main dataset for this deliverable was built from Brazilian Securities and Exchange Commission (CVM) open data, processing the 2023 Standardized Financial Statements (DFP) of 474 publicly traded companies; the original N1 dataset (four retailers, 2020-2024) was reused as a validation case study. Classification models (Logistic Regression and Random Forest) were trained and evaluated via stratified cross-validation to predict a financial risk category (low/medium/high), and regression models (Linear and Random Forest) to predict net income, deliberately using only balance-sheet \"size\" variables (net revenue, total assets and total liabilities) as inputs, to avoid a trivial/circular task. The Random Forest model achieved 47.7% accuracy on risk classification (against an expected ~33% random baseline for a three-class problem) and correctly classified the risk category of all four case-study retailers, including flagging Americanas as high risk. Results, methodological limitations (sector heterogeneity, heuristic label) and possible future extensions are discussed in detail.",
      { italics: true }
    )],
    alignment: AlignmentType.JUSTIFIED,
    indent: { start: 454, end: 454 },
    spacing: { after: 160, line: 360 },
  }),
  new Paragraph({
    children: [
      run("Keywords: ", { bold: true }),
      run("artificial intelligence; machine learning; classification; regression; financial risk; scikit-learn."),
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
  bodyP("O varejo é um dos setores mais relevantes da economia brasileira, respondendo por parcela significativa do PIB e do emprego formal. Nos últimos anos, o setor enfrentou juros altos, encarecimento do capital de giro e, em casos extremos, crises financeiras agudas — como a fraude contábil da Americanas S.A. (2023), que transformou um lucro declarado de R$ 544 milhões (2021) em um prejuízo republicado de R$ 6,2 bilhões, e a reestruturação financeira do Grupo Casas Bahia. Esses episódios mostram que sinais de risco financeiro severo nem sempre são óbvios a partir de uma leitura superficial dos números — mas também levantam uma pergunta mais ampla e generalizável: olhando apenas para o \"tamanho\" e a estrutura do balanço de uma empresa qualquer (não só do varejo), é possível antecipar, de forma automatizada, que ela está em situação de risco financeiro?"),
  subHeading("1.2. Justificativa"),
  bodyP("A análise manual de demonstrações financeiras para identificar risco de insolvência é trabalhosa e não escala para o universo de centenas de companhias abertas brasileiras. Técnicas clássicas de Machine Learning aplicadas a indicadores contábeis têm décadas de uso consolidado em finanças corporativas — o exemplo mais conhecido é o Z-Score de Altman (1968), um modelo estatístico que combina índices de balanço para prever probabilidade de falência. Este projeto se inspira nessa tradição, propondo um pipeline de classificação/regressão com scikit-learn sobre um dataset real e amplo (dados abertos da CVM), capaz de ser treinado, avaliado e validado com rigor estatístico — algo que a abordagem originalmente planejada (API de LLM) tornaria mais difícil de avaliar quantitativamente dentro do prazo disponível."),
  subHeading("1.3. Objetivo"),
  bodyP("Objetivo geral: desenvolver e avaliar modelos de Machine Learning (classificação e regressão) capazes de estimar o risco financeiro e o resultado líquido de companhias brasileiras de capital aberto a partir de indicadores de tamanho do balanço, validando os modelos treinados em um dataset amplo (CVM) por meio de um estudo de caso aplicado às quatro varejistas analisadas desde a N1."),
  bodyP("Objetivos específicos desta entrega (N2):"),
  bullet("Documentar e justificar a mudança de opção do projeto (de API de LLM para Framework de ML), ocorrida entre a N1 e a N2;"),
  bullet("Construir um dataset amplo e real a partir dos dados abertos da CVM (DFP 2023), com indicadores financeiros de centenas de empresas;"),
  bullet("Treinar e avaliar, com validação cruzada, modelos de classificação (risco financeiro) e regressão (resultado líquido) usando scikit-learn;"),
  bullet("Validar os modelos treinados em um estudo de caso aplicado às quatro varejistas do dataset da N1, comparando a predição automática com o que se sabe ter ocorrido de fato;"),
  bullet("Discutir os aspectos éticos e as limitações do uso de modelos de ML para classificação de risco financeiro."),
  subHeading("1.4. Opção do projeto"),
  bodyP("Opção Framework — \"Empregar algum framework ou ferramenta de Machine Learning/Deep Learning (scikit-learn) para solucionar um problema de classificação/regressão/predição de negócio\", conforme descrito no enunciado da atividade."),
  bodyP("Nota sobre a mudança de opção entre a N1 e a N2: na primeira entrega, o grupo havia optado pela \"Opção API ChatGPT/LLM\", propondo um assistente baseado em modelo de linguagem para leitura de documentos de RI. Ao iniciar a N2, o grupo constatou que: (i) a API da Anthropic (Claude), para a qual uma chave foi gerada, exige compra de créditos, sem período gratuito disponível; e (ii) ainda que uma API gratuita (Google Gemini) estivesse disponível, o ambiente de desenvolvimento usado para construir o projeto não tinha acesso de rede a ela, exigindo que toda chamada à API fosse testada manualmente pelo grupo, fora de qualquer ferramenta de apoio, o que se mostrou operacionalmente inviável dentro do prazo remanescente de poucos dias até a entrega. Diante disso, e considerando que o enunciado da atividade permite expressamente a \"Opção Framework\" como alternativa de mesmo peso, o grupo decidiu migrar para essa opção, reaproveitando o dataset e a análise exploratória da N1 como estudo de caso de validação dos novos modelos. Essa mudança de direção, incluindo os motivos técnicos que a levaram, está registrada aqui de forma transparente."),
];

// ---------- 2. Descrição do Problema --------------------------------------------
const s2 = [
  sectionHeading("2. Descrição do Problema"),
  bodyP("Investidores, credores e analistas precisam avaliar continuamente a saúde financeira de centenas de empresas de capital aberto, cada uma publicando anualmente demonstrações financeiras extensas e tecnicamente densas. Esse processo manual tem limitações claras:"),
  bullet("Escala: é inviável para um analista avaliar, com a mesma profundidade, todas as ~900 companhias abertas brasileiras simultaneamente;"),
  bullet("Consistência: critérios de avaliação de risco aplicados manualmente podem variar entre analistas e ao longo do tempo;"),
  bullet("Velocidade: sinais de deterioração financeira podem levar meses para serem plenamente compreendidos, atrasando decisões de investidores e credores — como ilustrado pelo caso Americanas, cuja fragilidade contábil não foi identificada por anos."),
  bodyP("O problema que este projeto busca endereçar é: dado apenas um pequeno conjunto de indicadores de \"tamanho\" do balanço de uma empresa (receita líquida, ativo total, passivo total) — informações relativamente simples de obter e que não exigem interpretação qualitativa de texto — é possível treinar um modelo de Machine Learning capaz de classificar corretamente seu nível de risco financeiro e estimar seu resultado líquido, de forma consistente e escalável para centenas de empresas? E, mais especificamente: um modelo treinado nesse conjunto amplo e heterogêneo de empresas generaliza bem para um subconjunto específico e de interesse prático — as grandes varejistas brasileiras — incluindo casos conhecidos de risco extremo, como a Americanas?"),
];

// ---------- 3. Ética e Responsabilidade -----------------------------------------
const s3 = [
  sectionHeading("3. Aspectos Éticos do Uso da IA e Responsabilidade no Desenvolvimento da Solução"),
  bodyP("O uso de Machine Learning para classificar risco financeiro de empresas reais levanta questões éticas que o grupo considera centrais, e não apenas uma seção formal do relatório:"),
  subHeading("3.1. Rótulo heurístico e risco de reificação"),
  bodyP("A categoria de risco (baixo/médio/alto) usada para treinar e avaliar os modelos é uma heurística definida pelo próprio grupo (patrimônio líquido negativo, resultado negativo e/ou alavancagem elevada), não uma classificação oficial de agência de rating nem uma previsão de falência validada externamente. Há o risco de que, uma vez \"aprendida\" por um modelo estatístico, essa heurística passe a ser tratada como um fato objetivo sobre a empresa, quando na verdade é uma construção metodológica sujeita a limitações e escolhas de projeto — por isso essa distinção é reforçada explicitamente aqui e na Seção 7."),
  subHeading("3.2. Não substituição do julgamento humano e regulação"),
  bodyP("O sistema deve ser tratado como ferramenta de apoio exploratório/acadêmico, nunca como recomendação de investimento. No Brasil, a análise e recomendação de valores mobiliários é regulada pela CVM (Resolução CVM nº 20/2021); o protótipo acadêmico não gera recomendações de compra/venda, apenas uma classificação de risco e uma estimativa de resultado, sempre com a ressalva de que não substituem análise profissional nem constituem aconselhamento financeiro."),
  subHeading("3.3. Viés de heterogeneidade setorial"),
  bodyP("O dataset mistura empresas de setores com estruturas de capital muito diferentes (bancos, seguradoras, indústria, varejo). Um banco, por natureza do seu negócio, opera com alavancagem muito superior à de uma varejista sem que isso indique, por si só, risco de insolvência — o que pode enviesar o modelo a sinalizar risco incorretamente para setores inteiros. Essa limitação é discutida explicitamente nos Resultados (Seção 9) e na Conclusão (Seção 10), em vez de ser ocultada."),
  subHeading("3.4. Transparência e explicabilidade"),
  bodyP("O grupo optou deliberadamente por não usar patrimônio líquido, resultado líquido ou alavancagem como variáveis de entrada do classificador, justamente por essas variáveis participarem diretamente da construção do rótulo de risco — usá-las tornaria a predição circular/trivial (um \"vazamento de rótulo\", ou label leakage). Essa escolha metodológica, e a importância relativa de cada variável de entrada no modelo de Random Forest, são reportadas de forma explícita na Seção 9, permitindo auditoria da lógica do modelo."),
  subHeading("3.5. Dados pessoais e privacidade"),
  bodyP("O dataset é composto exclusivamente por demonstrações financeiras corporativas já publicamente divulgadas por exigência regulatória da CVM (Comissão de Valores Mobiliários), sem qualquer dado pessoal ou sensível envolvido, dispensando anonimização, em conformidade com os princípios da LGPD (Lei nº 13.709/2018) quanto à ausência de tratamento de dados pessoais."),
  subHeading("3.6. Impacto potencial e uso responsável"),
  bodyP("Classificações de risco incorretas, se divulgadas fora de contexto acadêmico, poderiam influenciar indevidamente decisões de investidores ou afetar a reputação de empresas reais. Por isso, este projeto tem caráter estritamente acadêmico e experimental, e os resultados aqui apresentados não devem ser usados como base para decisões financeiras reais sobre as empresas citadas."),
];

// ---------- 4. Dataset -----------------------------------------------------------
const s4 = [
  sectionHeading("4. Dataset"),
  subHeading("4.1. Dataset principal — CVM DFP 2023 (474 empresas)"),
  bodyP("O dataset principal desta entrega foi construído processando os arquivos brutos de Demonstrações Financeiras Padronizadas (DFP) de 2023 da CVM (Comissão de Valores Mobiliários), disponíveis publicamente em dados.cvm.gov.br — especificamente os demonstrativos consolidados de Resultado (DRE), Balanço Patrimonial Passivo (BPP) e Balanço Patrimonial Ativo (BPA). O script ml/build_dataset.py extrai, para cada companhia, a Receita Líquida, o Resultado Líquido, o Patrimônio Líquido, o Passivo Total e o Ativo Total, casando as linhas corretas de cada demonstrativo pela descrição padronizada da conta (já que o código numérico da conta varia conforme a profundidade do plano de contas de cada empresa). Após cruzar os três demonstrativos, restam 474 companhias com dados completos. Não se trata de dado sintético: são as demonstrações financeiras reais e oficiais de todas as companhias abertas brasileiras que entregaram DFP referente a 2023. Não há dados pessoais envolvidos."),
  bodyP("A partir desses cinco valores brutos, foram calculados os indicadores derivados: margem líquida (%), alavancagem (passivo total / patrimônio líquido, indefinida quando o patrimônio líquido é negativo ou zero), ROE (%), endividamento sobre o ativo (%) e uma flag de patrimônio líquido negativo. O rótulo de risco financeiro (baixo/médio/alto) foi então definido heuristicamente: risco alto se patrimônio líquido negativo; risco médio se resultado líquido negativo ou alavancagem acima de 3x; risco baixo nos demais casos."),
  bodyP("A extração foi validada cruzando os valores obtidos para as quatro varejistas do estudo de caso com os números já coletados manualmente na N1: Magazine Luiza e Grupo Casas Bahia bateram de forma exata; a Lojas Renner apresentou uma pequena diferença de receita, já esperada e documentada desde a N1 (o dataset da N1 usa receita líquida apenas da operação de varejo, excluindo a financeira Realize, enquanto a DFP consolidada da CVM inclui o grupo todo)."),
  ...figureML("distribuicao_risco.png", "Figura 1 — Distribuição das 474 empresas por categoria de risco financeiro."),
  ...figureML("dispersao_ativo_resultado.png", "Figura 2 — Ativo total x Resultado líquido, por categoria de risco, com destaque (zoom) para as 4 varejistas do estudo de caso.", 520, 0.42),
  subHeading("4.2. Dataset de estudo de caso — Varejo brasileiro 2020-2024 (N1)"),
  bodyP("O dataset original da N1 — indicadores financeiros anuais (2020–2024) de Magazine Luiza, Americanas, Via S.A./Grupo Casas Bahia e Lojas Renner, capturado manualmente pelo grupo a partir de divulgações oficiais de RI e imprensa especializada, com rastreabilidade completa em dataset/fontes.csv — é reaproveitado nesta entrega como estudo de caso: os modelos treinados no dataset CVM amplo são aplicados a estas quatro empresas (ano de 2023, presentes também no dataset CVM), e a classificação de risco prevista é comparada com o que se sabe ter ocorrido de fato com cada uma (ver Seção 9)."),
  bodyP("Os gráficos a seguir, produzidos na N1, ilustram o histórico dessas quatro empresas e seguem relevantes para contextualizar o estudo de caso:"),
  ...figureDataset("fig_resultado_liquido.png", "Figura 3 — Resultado Líquido (lucro/prejuízo) anual das 4 varejistas, 2020–2024 (R$ milhões)."),
  ...figureDataset("fig_americanas_restatement.png", "Figura 4 — Americanas S.A.: resultado líquido de 2021 originalmente divulgado vs. republicado após a fraude contábil."),
  subHeading("4.3. Preparação dos dados"),
  bullet("Conversão de unidade (milhares de reais, padrão CVM) para milhões de reais, para consistência com o dataset da N1;"),
  bullet("Tratamento explícito de divisões indefinidas (alavancagem e ROE quando patrimônio líquido ≤ 0), preservadas como ausentes (NaN) em vez de valores arbitrários;"),
  bullet("Remoção de linhas sem os três demonstrativos completos;"),
  bullet("Padronização (StandardScaler) das variáveis de entrada antes dos modelos lineares (Regressão Logística e Regressão Linear); modelos de árvore (Random Forest) usam os valores brutos, por não exigirem escala."),
];

// ---------- 5. Metodologia --------------------------------------------------------
const s5 = [
  sectionHeading("5. Metodologia"),
  subHeading("5.1. Desenho dos experimentos"),
  bodyP("Foram conduzidos dois experimentos independentes com scikit-learn, ambos usando deliberadamente apenas três variáveis de entrada (features) — receita líquida, ativo total e passivo total — escolhidas por não participarem diretamente da construção do rótulo de risco nem do cálculo do resultado líquido, evitando uma tarefa circular/trivial (ver Seção 3.4):"),
  bullet("Classificação: prever a categoria de risco financeiro (baixo/médio/alto) com Regressão Logística (com ponderação balanceada de classes, dado o desbalanceamento: 185 baixo, 247 médio, 42 alto) e Random Forest (300 árvores, também balanceado);"),
  bullet("Regressão: prever o resultado líquido (R$ milhões) com Regressão Linear e Random Forest Regressor."),
  bodyP("Ambos os experimentos foram avaliados por validação cruzada (5-fold), em vez de uma única divisão treino/teste, para obter estimativas mais estáveis — especialmente relevante para a classe minoritária \"risco alto\" (42 das 474 empresas, ~8,9%). Para a classificação, a validação cruzada foi estratificada (StratifiedKFold), preservando a proporção de cada classe em cada fold."),
  subHeading("5.2. Estudo de caso de validação"),
  bodyP("Após o treinamento, o modelo de Random Forest (classificação) treinado no dataset completo foi aplicado às quatro varejistas do estudo de caso (Seção 4.2), e a categoria de risco prevista foi comparada com a categoria real (construída a partir do balanço completo de cada uma, incluindo patrimônio líquido e resultado — informação não usada como entrada do modelo) e com o conhecimento público sobre a situação de cada empresa (ex.: Americanas em recuperação judicial)."),
];

// ---------- 6. Resultados ---------------------------------------------------------
const s6 = [
  sectionHeading("6. Resultados"),
  subHeading("6.1. Classificação de risco financeiro"),
  bodyP("Em validação cruzada de 5 folds sobre as 474 empresas, o Random Forest atingiu acurácia de 47,7% — bem acima do esperado ao acaso para um problema de 3 classes (~33%, ou ~52% se o modelo simplesmente sempre previsse a classe majoritária \"médio\") e com recall não-trivial nas três classes (18% em \"alto\", 46% em \"baixo\", 55% em \"médio\" de F1-score). A Regressão Logística, com ponderação balanceada, priorizou fortemente a classe \"alto\" (83% de recall nessa classe), mas à custa de acurácia geral (21,5%) — um trade-off interessante e relevante para a motivação original do projeto: para um sistema de alerta de risco, pode ser preferível errar a classificação geral com mais frequência, desde que capture a maior parte dos casos de risco alto (poucos falsos negativos), mesmo ao custo de mais falsos positivos."),
  ...figureML("confusao_random_forest.png", "Figura 5 — Matriz de confusão (5-fold CV) — Random Forest.", 360, 0.82),
  ...figureML("confusao_regressao_logistica.png", "Figura 6 — Matriz de confusão (5-fold CV) — Regressão Logística (balanceada).", 360, 0.82),
  bodyP("A importância das variáveis no Random Forest ficou distribuída de forma relativamente equilibrada entre as três entradas: receita líquida (35,1%), passivo total (32,5%) e ativo total (32,3%) — nenhuma variável domina isoladamente, sugerindo que o sinal de risco emerge da combinação das três, não de uma única métrica de tamanho."),
  ...figureML("alavancagem_por_risco.png", "Figura 7 — Alavancagem (passivo total / patrimônio líquido) por categoria de risco. A categoria \"alto\" não tem alavancagem definida, pois é causada justamente por patrimônio líquido negativo."),
  subHeading("6.2. Regressão do resultado líquido"),
  bodyP("A Regressão Linear obteve R² = 0,905 e erro médio absoluto (MAE) de R$ 1.971,4 milhões; o Random Forest Regressor obteve R² = 0,383 e MAE de R$ 2.034,7 milhões. O R² elevado da Regressão Linear deve ser interpretado com cautela: o dataset mistura empresas de escalas extremamente diferentes (de companhias pequenas a grandes bancos, com ativos na casa dos trilhões de reais), e boa parte da variância total do resultado líquido é explicada simplesmente pelo fato de empresas maiores terem lucros (ou prejuízos) proporcionalmente maiores em valor absoluto — um efeito de escala, não necessariamente uma relação fina e precisa entre os indicadores e o resultado. O desempenho mais modesto do Random Forest Regressor é consistente com essa leitura: por não extrapolar bem para valores fora da faixa vista no treino (característica conhecida de modelos baseados em árvores), ele generaliza pior para as poucas empresas de escala extrema presentes no dataset."),
  subHeading("6.3. Estudo de caso — as 4 varejistas"),
  bodyP("O modelo de Random Forest (classificação), usando apenas receita líquida, ativo total e passivo total das quatro varejistas, acertou corretamente a categoria de risco das 4 empresas (100% de acerto neste subconjunto), incluindo a sinalização de risco alto para a Americanas (em recuperação judicial) e risco baixo para a Lojas Renner (única com resultado consistentemente positivo). Esse resultado — bem acima da acurácia média geral de 47,7% sobre as 474 empresas — é coerente com a hipótese discutida na Seção 3.3: dentro de um mesmo setor (varejo), com estruturas de capital mais homogêneas, o sinal capturado pelo modelo é mais confiável do que na comparação entre setores muito distintos."),
];

// ---------- 7. Conclusão -----------------------------------------------------------
const s7 = [
  sectionHeading("7. Conclusão"),
  bodyP("Os resultados obtidos atendem parcialmente aos objetivos propostos. Por um lado, foi possível treinar e validar, com rigor estatístico (validação cruzada, cuidado explícito contra vazamento de rótulo), modelos de classificação e regressão sobre um dataset real e amplo — algo que teria sido mais difícil de avaliar quantitativamente com a abordagem original de LLM dentro do prazo disponível. O estudo de caso de validação nas quatro varejistas teve resultado positivo e objetivamente mensurável: o modelo classificou corretamente o risco das 4 empresas, incluindo o caso mais crítico (Americanas)."),
  bodyP("Por outro lado, a acurácia geral da classificação (47,7%) e o desempenho mais fraco do Random Forest Regressor evidenciam que prever risco financeiro ou resultado líquido a partir de apenas três variáveis de tamanho do balanço, para um conjunto heterogêneo de setores, é uma tarefa genuinamente difícil — o que é, em si, um resultado honesto e relevante: tamanho de balanço sozinho não é suficiente para capturar risco financeiro de forma confiável entre setores tão distintos quanto bancos, indústria e varejo. Isso reforça a importância de abordagens setorizadas (treinar/avaliar modelos separados por segmento) e de conjuntos de indicadores mais ricos (liquidez corrente, ciclo operacional, séries temporais multi-ano) como trabalho futuro."),
  bodyP("Em relação à mudança de opção do projeto (Seção 1.4), o grupo entende que a decisão foi acertada diante das restrições de prazo e de acesso a API gratuita de LLM: permitiu entregar um pipeline de ML completo, avaliado com métricas padrão da literatura (acurácia, precisão, recall, R², MAE) e validado em um estudo de caso de interesse prático direto, mantendo a mesma motivação (o caso Americanas) e parte do dataset construído na N1."),
];

// ---------- 8. GitHub e vídeo -------------------------------------------------------
const s8 = [
  sectionHeading("8. Endereço do GitHub e do Vídeo"),
  bodyP("Repositório GitHub (público): https://github.com/CristianoMorales/Projeto_IA"),
  bodyP("Vídeo no YouTube (até 5 minutos): [ENDEREÇO A SER PREENCHIDO PELO GRUPO APÓS A GRAVAÇÃO E PUBLICAÇÃO DO VÍDEO — ver roteiro em video/roteiro.md no repositório]"),
];

// ---------- 9. Referências ---------------------------------------------------------
const s9 = [
  sectionHeading("9. Referências"),
  bodyP("As referências abaixo foram citadas ao longo do texto deste relatório, seguindo a norma ABNT NBR 6023 (ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS, 2018)."),
  refEntry("ALTMAN, E. I. Financial Ratios, Discriminant Analysis and the Prediction of Corporate Bankruptcy. The Journal of Finance, v. 23, n. 4, p. 589-609, 1968."),
  refEntry("ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 6023: informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018."),
  refEntry("BRASIL. Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de Dados Pessoais — LGPD)."),
  refEntry("COMISSÃO DE VALORES MOBILIÁRIOS (CVM). Dados Abertos — Demonstrações Financeiras Padronizadas (DFP). Disponível em: https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp. Acesso em: 13 nov. 2026."),
  refEntry("COMISSÃO DE VALORES MOBILIÁRIOS (CVM). Resolução CVM nº 20, de 25 de fevereiro de 2021. Dispõe sobre o exercício da atividade de analista de valores mobiliários. Disponível em: https://www.gov.br/cvm. Acesso em: 13 set. 2026."),
  refEntry("HARRIS, C. R. et al. Array programming with NumPy. Nature, v. 585, p. 357-362, 2020."),
  refEntry("HUNTER, J. D. Matplotlib: A 2D Graphics Environment. Computing in Science & Engineering, v. 9, n. 3, p. 90-95, 2007."),
  refEntry("MCKINNEY, W. Python for Data Analysis. 3. ed. Sebastopol: O'Reilly Media, 2022."),
  refEntry("PEDREGOSA, F. et al. Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, v. 12, p. 2825-2830, 2011."),
  refEntry("INFOMONEY. Americanas (AMER3) tem prejuízo de R$ 12,9 bi em 2022 e revisa lucro de 2021 para prejuízo de R$ 6,2 bi. Disponível em: https://www.infomoney.com.br/mercados/americanas-amer3-resultados-2021-2022/. Acesso em: 13 set. 2026."),
  refEntry("RUSSELL, S.; NORVIG, P. Inteligência Artificial: Uma Abordagem Moderna. 4. ed. Rio de Janeiro: LTC, 2022."),
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
        ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7, ...s8, ...s9,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Relatorio_Projeto_N2.docx", buffer);
  console.log("Relatorio_Projeto_N2.docx gerado com sucesso.");
});
