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
//   2026-11-13 | Leonardo Tonon | Revisao com os resultados do protocolo
//               corrigido (escala da CVM, conta 2 = ativo, varejistas fora
//               do treino, baselines, acuracia balanceada, vazamento,
//               experimento temporal); tabelas de resultados; logo_fci.png
//               restaurado no repositorio.
//   2026-11-17 | Leonardo Tonon | Link do video no YouTube na Secao 8.
// =============================================================================

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, PageBreak, BorderStyle, Header,
  Table, TableRow, TableCell, WidthType, ShadingType,
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
    keepNext: true,
  });
}

function subHeading(text) {
  return new Paragraph({
    children: [run(text, { bold: true, italics: true, size: 24 })],
    spacing: { before: 200, after: 120 },
    keepNext: true,
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

// Tabela simples (Times New Roman 10pt), largura total do texto (9354 DXA)
function tabela(titulo, cab, linhas, larguras) {
  const borda = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
  const bordas = { top: borda, bottom: borda, left: borda, right: borda };
  // keepNext em todas as linhas menos a ultima: a tabela nao quebra entre paginas
  const cel = (t, i, head, ultima = false) => new TableCell({
    width: { size: larguras[i], type: WidthType.DXA }, borders: bordas,
    shading: head ? { type: ShadingType.CLEAR, fill: "E7E6E6", color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
      keepNext: !ultima, keepLines: true, children: [run(t, { size: 20, bold: head })] })],
  });
  return [
    new Paragraph({ children: [run(titulo, { italics: true, size: 20 })], alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 }, keepNext: true }),
    new Table({
      width: { size: larguras.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: larguras,
      alignment: AlignmentType.CENTER,
      rows: [new TableRow({ tableHeader: true, children: cab.map((t, i) => cel(t, i, true)) }),
             ...linhas.map((l, k) => new TableRow({ cantSplit: true,
               children: l.map((t, i) => cel(t, i, false, k === linhas.length - 1)) }))],
    }),
    new Paragraph({ children: [], spacing: { after: 160 } }),
  ];
}
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
      "Este projeto investiga se modelos clássicos de Machine Learning (biblioteca scikit-learn) conseguem classificar o risco financeiro e prever o resultado líquido de companhias brasileiras de capital aberto a partir de indicadores do balanço, motivado pelo caso da fraude contábil da Americanas S.A. (revelada em janeiro de 2023). Na entrega N1, o grupo havia optado pela \"Opção API de LLM\"; na N2, migrou para a \"Opção Framework\", pelo custo da API e pela possibilidade de avaliação quantitativa (Seção 1.4). O dataset foi construído a partir dos dados abertos da Comissão de Valores Mobiliários (CVM) — Demonstrações Financeiras Padronizadas (DFP) de 2023 e 2024 —, com 472 companhias em 2023; o dataset da N1 (quatro varejistas, 2020–2024) foi reaproveitado como estudo de caso. O rótulo de risco (baixo/médio/alto) é uma heurística baseada em patrimônio líquido, resultado e alavancagem. Usando apenas receita líquida e ativo total como entradas e mantendo as quatro varejistas fora do treino, o Random Forest obteve acurácia de 47,4% em validação cruzada de 5 folds repetida — abaixo dos 52,6% de prever sempre a classe mais comum —, mas acurácia balanceada de 44,0% e F1 macro de 0,42, contra 33,3% e 0,23 desse baseline; a Regressão Logística balanceada identificou 73% das empresas de risco alto. No estudo de caso, o modelo errou as quatro varejistas fora do treino, contra quatro acertos quando elas estavam no treino. Um experimento temporal, que usa os dados de 2023 para prever o risco de 2024, alcançou acurácia balanceada de 87,4%, acima dos 84,4% de repetir a classe do ano anterior. Conclui-se que indicadores de tamanho do balanço não bastam para classificar risco e que baselines e dados fora do treino são indispensáveis para não superestimar o modelo.",
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
      "This project investigates whether classical Machine Learning models (scikit-learn) can classify the financial risk and predict the net income of publicly traded Brazilian companies from balance-sheet indicators, motivated by the Americanas S.A. accounting fraud (revealed in January 2023). In N1, the group had chosen the \"LLM API Option\"; in N2, it moved to the \"Framework Option\", due to API cost and the possibility of quantitative evaluation (Section 1.4). The dataset was built from Brazilian Securities and Exchange Commission (CVM) open data — 2023 and 2024 Standardized Financial Statements (DFP) — with 472 companies in 2023; the N1 dataset (four retailers, 2020-2024) was reused as a case study. The risk label (low/medium/high) is a heuristic based on equity, net income and leverage. Using only net revenue and total assets as inputs and keeping the four retailers out of training, the Random Forest reached 47.4% accuracy in repeated 5-fold cross-validation — below the 52.6% obtained by always predicting the majority class — but 44.0% balanced accuracy and 0.42 macro F1, against 33.3% and 0.23 for that baseline; the balanced Logistic Regression flagged 73% of high-risk companies. In the case study, the model missed all four retailers when they were out of training, versus four hits when they were included. A temporal experiment, using 2023 data to predict 2024 risk, reached 87.4% balanced accuracy, above the 84.4% of repeating the previous year's class. Balance-sheet size indicators alone are not enough to classify risk, and baselines and out-of-training data are essential to avoid overestimating the model.",
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
  bullet("Construir um dataset amplo e real a partir dos dados abertos da CVM (DFP 2023 e 2024), com indicadores financeiros de centenas de empresas;"),
  bullet("Treinar e avaliar, com validação cruzada e comparação com baselines, modelos de classificação (risco financeiro) e regressão (resultado líquido) usando scikit-learn;"),
  bullet("Validar os modelos em um estudo de caso com as quatro varejistas da N1, mantidas fora do treino, comparando a predição com o que se sabe ter ocorrido de fato;"),
  bullet("Testar uma formulação temporal: prever o risco do ano seguinte a partir dos dados do ano corrente;"),
  bullet("Discutir os aspectos éticos e as limitações do uso de modelos de ML para classificação de risco financeiro."),
  subHeading("1.4. Opção do projeto"),
  bodyP("Opção Framework — \"Empregar algum framework ou ferramenta de Machine Learning/Deep Learning (scikit-learn) para solucionar um problema de classificação/regressão/predição de negócio\", conforme descrito no enunciado da atividade."),
  bodyP("Nota sobre a mudança de opção entre a N1 e a N2: na primeira entrega, o grupo havia optado pela \"Opção API ChatGPT/LLM\", propondo um assistente baseado em modelo de linguagem para leitura de documentos de RI. Ao iniciar a N2, o grupo reavaliou essa escolha por dois motivos. Primeiro, custo: a API da Anthropic (Claude), para a qual uma chave foi gerada, exige a compra de créditos e não oferece uso gratuito. Segundo, e principalmente, avaliação: as respostas de um modelo de linguagem são difíceis de medir de forma objetiva e reprodutível no prazo de uma disciplina, enquanto um problema de classificação e regressão sobre dados estruturados permite usar validação cruzada, baselines e métricas padronizadas da literatura. Como o enunciado admite a \"Opção Framework\" como alternativa de mesmo peso, o grupo migrou para ela. A motivação (o caso Americanas) e o dataset da N1 foram mantidos, agora como estudo de caso de validação. A mudança e os motivos estão registrados aqui de forma transparente."),
];

// ---------- 2. Descrição do Problema --------------------------------------------
const s2 = [
  sectionHeading("2. Descrição do Problema"),
  bodyP("Investidores, credores e analistas precisam avaliar continuamente a saúde financeira de centenas de empresas de capital aberto, cada uma publicando anualmente demonstrações financeiras extensas e tecnicamente densas. Esse processo manual tem limitações claras:"),
  bullet("Escala: é inviável para um analista avaliar, com a mesma profundidade, todas as ~900 companhias abertas brasileiras simultaneamente;"),
  bullet("Consistência: critérios de avaliação de risco aplicados manualmente podem variar entre analistas e ao longo do tempo;"),
  bullet("Velocidade: sinais de deterioração financeira podem levar meses para serem plenamente compreendidos, atrasando decisões de investidores e credores — como ilustrado pelo caso Americanas, cuja fragilidade contábil não foi identificada por anos."),
  bodyP("O problema que este projeto busca endereçar é: dado apenas um pequeno conjunto de indicadores de \"tamanho\" do balanço de uma empresa (receita líquida e ativo total) — informações relativamente simples de obter e que não exigem interpretação qualitativa de texto — é possível treinar um modelo de Machine Learning capaz de classificar corretamente seu nível de risco financeiro e estimar seu resultado líquido, de forma consistente e escalável para centenas de empresas? E, mais especificamente: um modelo treinado nesse conjunto amplo e heterogêneo de empresas generaliza bem para um subconjunto específico e de interesse prático — as grandes varejistas brasileiras — incluindo casos conhecidos de risco extremo, como a Americanas?"),
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
  bodyP("O dataset mistura empresas de setores com estruturas de capital muito diferentes (bancos, seguradoras, indústria, varejo). Um banco, por natureza do seu negócio, opera com alavancagem muito superior à de uma varejista sem que isso indique, por si só, risco de insolvência — o que pode enviesar o modelo a sinalizar risco incorretamente para setores inteiros. Essa limitação é discutida explicitamente nos Resultados (Seção 6.1) e na Conclusão (Seção 7), em vez de ser ocultada."),
  subHeading("3.4. Transparência e explicabilidade"),
  bodyP("O grupo optou deliberadamente por não usar patrimônio líquido, resultado líquido, alavancagem ou passivo exigível como entradas do classificador, porque essas variáveis participam diretamente da construção do rótulo de risco ou permitem reconstruí-lo (ativo − passivo exigível = PL). Usá-las tornaria a predição circular — um \"vazamento de rótulo\" (label leakage), cujo efeito é medido na Seção 6.4. As entradas finais são receita líquida e ativo total, e a importância de cada uma no Random Forest é reportada na Seção 6.1, permitindo auditoria da lógica do modelo."),
  subHeading("3.5. Dados pessoais e privacidade"),
  bodyP("O dataset é composto exclusivamente por demonstrações financeiras corporativas já publicamente divulgadas por exigência regulatória da CVM (Comissão de Valores Mobiliários), sem qualquer dado pessoal ou sensível envolvido, dispensando anonimização, em conformidade com os princípios da LGPD (Lei nº 13.709/2018) quanto à ausência de tratamento de dados pessoais."),
  subHeading("3.6. Impacto potencial e uso responsável"),
  bodyP("Classificações de risco incorretas, se divulgadas fora de contexto acadêmico, poderiam influenciar indevidamente decisões de investidores ou afetar a reputação de empresas reais. Por isso, este projeto tem caráter estritamente acadêmico e experimental, e os resultados aqui apresentados não devem ser usados como base para decisões financeiras reais sobre as empresas citadas."),
];

// ---------- 4. Dataset -----------------------------------------------------------
const s4 = [
  sectionHeading("4. Dataset"),
  subHeading("4.1. Dataset principal — CVM DFP 2023 e 2024 (472 empresas em 2023)"),
  bodyP("O dataset principal foi construído pelo script ml/build_dataset.py a partir dos arquivos de Demonstrações Financeiras Padronizadas (DFP) de 2023 e 2024 da CVM, disponíveis publicamente em dados.cvm.gov.br. Para cada companhia, o script lê as demonstrações consolidadas — DRE, Balanço Patrimonial Ativo (BPA) e Balanço Patrimonial Passivo (BPP) —, usa apenas o exercício corrente e a versão mais recente de cada documento e extrai receita líquida (conta 3.01), resultado líquido consolidado, ativo total (conta 1), total da conta 2 e patrimônio líquido, casando o resultado e o PL pela descrição padronizada da conta, já que o código varia entre planos de contas. Os valores são convertidos para R$ milhões de acordo com a escala declarada por cada empresa (ESCALA_MOEDA): a maioria informa em milhares de reais, mas algumas informam em reais. Restaram 472 companhias com as cinco contas completas em 2023 e 464 em 2024. O setor de atividade vem do cadastro de companhias abertas da CVM. Não se trata de dado sintético nem há dados pessoais envolvidos."),
  bodyP("Duas verificações feitas na revisão desta entrega mudaram a construção do dataset. Primeiro, a primeira versão convertia todos os valores como se estivessem em milhares; as oito empresas que informam em reais ficaram 1.000 vezes maiores — a Vivara, por exemplo, aparecia com lucro de R$ 369 bilhões e ativo de R$ 3,2 trilhões. Segundo, a conta 2 da CVM, rotulada \"Passivo Total\", é igual ao ativo total em 100% das companhias, porque inclui o patrimônio líquido. Ela não é, portanto, uma variável independente do ativo e foi retirada das entradas do modelo (Seção 5.1). O passivo sem o patrimônio líquido — o passivo exigível, igual à conta 2 menos o PL — também foi calculado, mas é usado apenas como diagnóstico (Seção 6.4)."),
  bodyP("A partir desses valores foram calculados os indicadores derivados: margem líquida (%), alavancagem (conta 2 / PL, o que equivale a ativo / PL, indefinida quando o PL é zero ou negativo), ROE (%), endividamento sobre o ativo (passivo exigível / ativo, %) e uma indicação de PL negativo. O rótulo de risco financeiro foi definido heuristicamente: risco alto se o patrimônio líquido é negativo; risco médio se o resultado é negativo ou a alavancagem é maior que 3; risco baixo nos demais casos. Em 2023, são 182 companhias de risco baixo (38,6%), 248 de risco médio (52,5%) e 42 de risco alto (8,9%) (Figura 1)."),
  bodyP("A extração foi validada contra os valores coletados manualmente na N1. Para 2023, Magazine Luiza e Grupo Casas Bahia conferem exatamente, e a Americanas difere apenas por arredondamento. A Lojas Renner tem duas diferenças de naturezas distintas. A da receita é de escopo: a N1 usa só a receita de varejo, sem a financeira Realize (R$ 11.706,3 milhões, contra R$ 13.647,8 milhões na DFP consolidada). A do resultado líquido é um erro de coleta da N1: o valor registrado para 2023 (R$ 1.196,7 milhões) é o resultado de 2024 na CVM; o de 2023 é R$ 976,3 milhões. O mesmo deslocamento de um ano aparece nos anos anteriores do dataset manual."),
  ...figureML("distribuicao_risco.png", "Figura 1 — Distribuição das 472 companhias de 2023 por categoria de risco financeiro.", 430, 0.618),
  ...figureML("dispersao_ativo_resultado.png", "Figura 2 — Ativo total x Resultado líquido (2023), por categoria de risco, com destaque (zoom) para as 4 varejistas do estudo de caso.", 540, 0.417),
  subHeading("4.2. Dataset de estudo de caso — Varejo brasileiro 2020-2024 (N1)"),
  bodyP("O dataset original da N1 — indicadores financeiros anuais (2020–2024) de Magazine Luiza, Americanas, Via S.A./Grupo Casas Bahia e Lojas Renner, capturado manualmente pelo grupo a partir de divulgações oficiais de RI e imprensa especializada, com rastreabilidade completa em dataset/fontes.csv — é reaproveitado nesta entrega como estudo de caso: as quatro empresas são retiradas do treino, e a classificação de risco prevista para 2023 é comparada com o que se sabe ter ocorrido de fato com cada uma (ver Seção 6.3)."),
  bodyP("Os gráficos a seguir, produzidos na N1, ilustram o histórico dessas quatro empresas e seguem relevantes para contextualizar o estudo de caso:"),
  ...figureDataset("fig_resultado_liquido.png", "Figura 3 — Resultado Líquido (lucro/prejuízo) anual das 4 varejistas, 2020–2024 (R$ milhões)."),
  ...figureDataset("fig_americanas_restatement.png", "Figura 4 — Americanas S.A.: resultado líquido de 2021 originalmente divulgado vs. republicado após a fraude contábil."),
  subHeading("4.3. Preparação dos dados"),
  bullet("Conversão para R$ milhões conforme a escala declarada por cada empresa (ESCALA_MOEDA: milhares ou reais), para consistência com o dataset da N1;"),
  bullet("Uso apenas do exercício corrente e da versão mais recente de cada DFP;"),
  bullet("Tratamento explícito de divisões indefinidas (alavancagem e ROE quando o patrimônio líquido ≤ 0), preservadas como ausentes (NaN) em vez de valores arbitrários;"),
  bullet("Remoção de linhas sem as cinco contas completas ou com ativo não positivo;"),
  bullet("Transformação logarítmica com sinal, sign(x)·log10(1+|x|), da receita e do ativo, para reduzir o efeito de escala entre empresas pequenas e grandes bancos; padronização (StandardScaler) antes dos modelos lineares;"),
  bullet("Retirada das quatro varejistas do estudo de caso do conjunto de treino e avaliação (restam 468 companhias em 2023); elas são usadas apenas no estudo de caso."),
];

// ---------- 5. Metodologia --------------------------------------------------------
const s5 = [
  sectionHeading("5. Metodologia"),
  subHeading("5.1. Desenho dos experimentos"),
  bodyP("Foram conduzidos três experimentos com scikit-learn, avaliados por validação cruzada de 5 folds (estratificada na classificação), repetida cinco vezes com embaralhamentos diferentes; os valores reportados são as médias das repetições. A avaliação usa as 468 companhias de 2023 que não fazem parte do estudo de caso:"),
  bullet("Classificação (principal): prever a categoria de risco a partir de receita líquida e ativo total, variáveis que não entram no rótulo. Modelos: Regressão Logística com classes balanceadas e Random Forest (300 árvores, classes balanceadas), comparados com um baseline que sempre prevê a classe mais comum (DummyClassifier);"),
  bullet("Regressão: prever o resultado líquido (R$ milhões) a partir das mesmas variáveis, com Regressão Linear e Random Forest Regressor, comparados com um baseline que prevê sempre a média;"),
  bullet("Classificação temporal (complementar): prever o risco de 2024 a partir dos dados de 2023 (receita, ativo, margem líquida, PL sobre ativo e indicação de prejuízo), para as 442 companhias presentes nos dois anos e fora do estudo de caso. Como o alvo está no ano seguinte, usar o PL e o resultado de 2023 como entrada não é circular. Além do baseline da classe mais comum, esse experimento é comparado com o baseline de persistência, que repete a classe de 2023."),
  bodyP("Como as classes são desbalanceadas (52,5% médio e 8,9% alto), a acurácia simples é enganosa: um modelo que sempre responde \"médio\" acerta 52,6%. Por isso, além da acurácia, são reportadas a acurácia balanceada (média do recall das três classes, que vale 33,3% para esse chute), o F1 macro e o recall da classe \"alto\"."),
  subHeading("5.2. Estudo de caso de validação"),
  bodyP("Os modelos finais são treinados nas 468 companhias e aplicados às quatro varejistas, que não participaram do treino. A categoria prevista é comparada com a real (construída a partir do balanço completo, incluindo patrimônio líquido e resultado, que não são entradas do modelo) e com o que se sabe sobre cada empresa (ex.: Americanas em recuperação judicial). Para mostrar o efeito do protocolo da primeira versão desta entrega, o resultado também é comparado com o de um modelo treinado com as varejistas incluídas."),
];

// ---------- 6. Resultados ---------------------------------------------------------
const L5 = [3254, 1400, 1700, 1400, 1600];
const s6 = [
  sectionHeading("6. Resultados"),
  subHeading("6.1. Classificação de risco financeiro"),
  ...tabela("Tabela 1 — Classificação do risco em 2023 (5-fold CV repetido 5 vezes; 468 companhias, varejistas fora)",
    ["Modelo", "Acurácia", "Acur. balanceada", "F1 macro", "Recall \"alto\""],
    [["Baseline (sempre \"médio\")", "52,6%", "33,3%", "0,230", "0%"],
     ["Regressão Logística (balanceada)", "44,1%", "50,6%", "0,404", "73,2%"],
     ["Random Forest (balanceado)", "47,4%", "44,0%", "0,424", "35,1%"]], L5),
  bodyP("Nenhum dos modelos supera o baseline em acurácia simples: ambos acertam menos do que responder sempre \"médio\". Em acurácia balanceada e F1 macro, porém, os dois ficam acima do baseline, o que indica que receita e ativo carregam algum sinal sobre o risco, ainda que fraco. Entre as repetições, a acurácia balanceada variou pouco (desvio-padrão de 0,9 ponto percentual na Regressão Logística e de 2,7 no Random Forest). A Regressão Logística balanceada troca acurácia por sensibilidade: identifica 73% das empresas de risco alto, ao custo de muitos falsos positivos — um perfil que pode interessar a um sistema de alerta, no qual deixar passar um caso de risco alto custa mais do que um alarme falso."),
  ...figureML("confusao_random_forest.png", "Figura 5 — Matriz de confusão (5-fold CV, varejistas fora do treino) — Random Forest.", 360, 0.846),
  ...figureML("confusao_regressao_logistica.png", "Figura 6 — Matriz de confusão (5-fold CV, varejistas fora do treino) — Regressão Logística (balanceada).", 360, 0.846),
  bodyP("Na primeira versão, com receita, ativo e \"passivo total\" como entradas, as importâncias do Random Forest ficaram quase iguais entre as três variáveis (35,1%, 32,5% e 32,5% nesta reexecução). Isso se explica por ativo e conta 2 serem a mesma variável. Com a correção, receita e ativo dividem a importância (50,2% e 49,8%) e o desempenho não piora (acurácia balanceada de 41,3% com as três variáveis e de 44,0% com as duas), o que confirma que a terceira variável não acrescentava informação. A acurácia de 47,7% reportada antes, com as varejistas no treino e os valores fora de escala, cai para 44,3% nesse mesmo desenho de três variáveis, com o dataset corrigido e as varejistas fora do treino."),
  bodyP("Retirando as 34 instituições financeiras do treino (restam 434 companhias), a acurácia balanceada do Random Forest fica em 43,6%, praticamente igual. A mistura de setores (Seção 3.3), portanto, não é a principal causa do desempenho fraco: o limite está nas próprias variáveis de entrada."),
  ...figureML("alavancagem_por_risco.png", "Figura 7 — Alavancagem (conta 2 / patrimônio líquido) por categoria de risco. A categoria \"alto\" não tem alavancagem definida, pois é causada justamente por patrimônio líquido negativo.", 400, 0.667),
  subHeading("6.2. Regressão do resultado líquido"),
  ...tabela("Tabela 2 — Regressão do resultado líquido de 2023 (5-fold CV repetido 5 vezes; 468 companhias)",
    ["Modelo", "R² médio", "R² (mín.; máx.)", "MAE (R$ mi)", "Mediana do erro (R$ mi)"],
    [["Baseline (média)", "−0,01", "−0,01; 0,00", "1.825,8", "1.079,0"],
     ["Regressão Linear", "0,04", "−0,26; 0,19", "1.504,5", "374,8"],
     ["Random Forest Regressor", "0,20", "−0,11; 0,35", "1.223,4", "211,8"]], L5),
  bodyP("O R² de 0,905 reportado na primeira versão era consequência do erro de escala descrito na Seção 4.1: a Vivara, com valores 1.000 vezes maiores, concentrava sozinha a maior parte da variância do resultado, e a Regressão Linear a ajustava com facilidade. Nos dados da primeira versão, retirar apenas a Vivara já derrubava o R² para 0,50. Com o dataset corrigido e as varejistas fora, a Regressão Linear explica 4% da variância do resultado e o Random Forest, 20%, com grande variação entre repetições, porque poucas empresas gigantes (Petrobras e grandes bancos) concentram a variância. A medida mais estável é a mediana do erro absoluto: o Random Forest erra tipicamente R$ 212 milhões, contra R$ 1.079 milhões do baseline. É uma melhora real, mas o erro ainda é do tamanho do resultado típico das companhias (mediana de R$ 192 milhões em valor absoluto)."),
  subHeading("6.3. Estudo de caso — as 4 varejistas"),
  ...tabela("Tabela 3 — Risco previsto pelo Random Forest para as varejistas em 2023",
    ["Varejista", "Risco real", "Previsto (fora do treino)", "Previsto (com a varejista no treino)"],
    [["Americanas", "alto", "médio", "alto"],
     ["Grupo Casas Bahia", "médio", "baixo", "médio"],
     ["Magazine Luiza", "médio", "baixo", "médio"],
     ["Lojas Renner", "baixo", "médio", "baixo"]], [2554, 1500, 2400, 2900]),
  bodyP("Fora do treino, o Random Forest errou as quatro varejistas. Com elas no treino, acertou as quatro — o mesmo \"4 de 4\" da primeira versão. A diferença mostra que aquele resultado era memorização: um Random Forest reproduz os rótulos dos exemplos que já viu, e o mesmo protocolo produz 4 de 4 até com dados aleatórios. O caso Americanas é o mais ilustrativo: receita e ativo de 2023 não distinguem a empresa de varejistas saudáveis, e nada nessas duas variáveis revela um patrimônio líquido de −R$ 28,9 bilhões."),
  subHeading("6.4. Diagnóstico de vazamento de rótulo"),
  bodyP("Para medir o efeito da escolha das variáveis, o experimento foi repetido trocando a conta 2 pelo passivo exigível (conta 2 − PL). A Regressão Logística salta para 80,9% de acurácia e 83,7% de acurácia balanceada. O salto não é aprendizado: como ativo − passivo exigível = PL, e o PL define o rótulo, o modelo reconstrói o rótulo a partir das entradas. É o vazamento descrito na Seção 3.4, e por isso essa variável não é usada no modelo final."),
  subHeading("6.5. Experimento temporal — 2023 prevendo 2024"),
  ...tabela("Tabela 4 — Previsão do risco de 2024 com dados de 2023 (5-fold CV repetido 5 vezes; 442 companhias)",
    ["Modelo", "Acurácia", "Acur. balanceada", "F1 macro", "Recall \"alto\""],
    [["Baseline (sempre \"médio\")", "50,2%", "33,3%", "0,223", "0%"],
     ["Persistência (repete 2023)", "86,7%", "84,4%", "0,861", "78,3%"],
     ["Regressão Logística (balanceada)", "83,6%", "84,5%", "0,833", "87,0%"],
     ["Random Forest (balanceado)", "86,3%", "87,4%", "0,861", "90,4%"]], L5),
  bodyP("Entre 2023 e 2024, só 13,5% das companhias mudaram de classe; por isso, repetir a classe do ano anterior já acerta 86,7%. O Random Forest empata com esse baseline em acurácia e F1 macro, mas o supera em acurácia balanceada (87,4% contra 84,4%), porque identifica mais empresas que estarão em risco alto no ano seguinte (90,4% contra 78,3%). Nas varejistas, fora do treino, acertou 3 de 4. Errou a Americanas: manteve a previsão de risco alto, enquanto a empresa, após a reestruturação da dívida na recuperação judicial, voltou a ter PL positivo (R$ 4,97 bilhões) e lucro em 2024. Esse desenho é o mais próximo do objetivo do projeto — antecipar o risco —, mas o ganho sobre a persistência é modesto e foi medido em um único par de anos."),
  ...figureML("comparacao_modelos.png", "Figura 8 — Acurácia balanceada dos modelos e dos baselines nos dois experimentos de classificação.", 520, 0.5175),
];

// ---------- 7. Conclusão -----------------------------------------------------------
const s7 = [
  sectionHeading("7. Conclusão"),
  bodyP("Os resultados atendem parcialmente aos objetivos propostos. Foi construído um pipeline reprodutível, com dados reais da CVM e modelos do scikit-learn, avaliado com validação cruzada repetida, baselines e dados fora do treino. A principal conclusão é negativa: receita e ativo não bastam para classificar o risco financeiro. Os modelos acertam menos que o chute da classe mais comum em acurácia simples (47,4% contra 52,6%) e só o superam nas métricas balanceadas (acurácia balanceada de até 50,6% e F1 macro de até 0,42, contra 33,3% e 0,23). No estudo de caso, fora do treino, o modelo errou as quatro varejistas."),
  bodyP("A revisão desta entrega corrigiu quatro problemas da primeira versão: valores de oito empresas estavam 1.000 vezes maiores por desconsiderar a escala informada à CVM, o que produzia o R² de 0,905 da regressão; o estudo de caso tinha as varejistas dentro do treino, e o \"4 de 4\" era memorização; a acurácia de 47,7% foi apresentada como acima do acaso, quando estava abaixo do baseline de cerca de 52%; e a variável \"passivo total\" era, na CVM, igual ao ativo total. O diagnóstico de vazamento (Seção 6.4) mostrou o risco oposto: com uma variável que reconstrói o PL, a acurácia sobe para 81% sem que o modelo aprenda nada útil. As métricas só têm valor quando comparadas a baselines e medidas em dados fora do treino."),
  bodyP("O experimento temporal indica o caminho mais promissor: usar os indicadores do ano corrente para prever o risco do ano seguinte, com acurácia balanceada de 87,4% e recall de 90% no risco alto, acima da persistência. Como trabalho futuro, o grupo propõe séries de mais anos, indicadores de liquidez e de endividamento de curto prazo, modelos por setor e o teste do caso Americanas com os dados de 2021 e 2022, antes de a fraude aparecer nos números."),
  bodyP("Em relação à mudança de opção do projeto (Seção 1.4), a migração para ML permitiu medir o desempenho de forma objetiva — e foi essa medição que revelou tanto as limitações do modelo quanto os erros da primeira versão, o que não teria sido possível com a mesma clareza na abordagem original."),
];


// ---------- 8. GitHub e vídeo -------------------------------------------------------
const s8 = [
  sectionHeading("8. Endereço do GitHub e do Vídeo"),
  bodyP("Repositório GitHub (público): https://github.com/CristianoMorales/Projeto_IA"),
  bodyP("Vídeo no YouTube: https://www.youtube.com/watch?v=PzWHHcvsTgY"),
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
