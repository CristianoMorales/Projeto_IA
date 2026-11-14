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
//   2026-11-14 | Cristiano Morales | Correcao de problemas apontados em
//               revisao interna do grupo: features sem vazamento (passivo
//               circulante em vez de passivo total), estudo de caso com
//               holdout real (sem treinar nas mesmas 4 empresas testadas),
//               baseline majoritario reportado explicitamente, numeros
//               atualizados para o dataset corrigido (454 empresas),
//               referencias de secao corrigidas, nota sobre a Lojas Renner
//               (defasagem de 1 ano) e reformulacao da justificativa de
//               mudanca de opcao (Secao 1.4).
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
      "Este projeto utiliza técnicas clássicas de Machine Learning (biblioteca scikit-learn) para classificar o risco financeiro e prever o resultado líquido de companhias brasileiras de capital aberto a partir de indicadores extraídos de suas demonstrações financeiras, motivado pelo caso da fraude contábil da Americanas S.A. (revelada em janeiro de 2023). Na entrega N1, o grupo havia optado pela \"Opção API de LLM\", mas, diante da indisponibilidade prática de uma API de linguagem gratuita e confiável dentro do prazo do projeto, migrou para a \"Opção Framework\" na N2 — decisão documentada e justificada na Seção 1.4. O dataset principal desta entrega foi construído a partir dos dados abertos da Comissão de Valores Mobiliários (CVM), processando as Demonstrações Financeiras Padronizadas (DFP) de 2023 de 454 companhias abertas brasileiras; o dataset original da N1 (quatro varejistas, 2020–2024) foi reaproveitado como estudo de caso de validação. Foram treinados e avaliados, por validação cruzada estratificada, modelos de classificação (Regressão Logística e Random Forest) para prever uma categoria de risco financeiro (baixo/médio/alto) e modelos de regressão (Linear e Random Forest) para prever o resultado líquido, usando deliberadamente apenas variáveis de \"tamanho\"/estrutura do balanço (receita líquida, ativo total e passivo circulante) como entrada, para evitar uma tarefa trivial/circular. O modelo de Random Forest atingiu 58,6% de acurácia na classificação de risco em validação cruzada de 5 folds — acima do baseline trivial de sempre prever a classe majoritária (55,1%) e do acaso uniforme (33,3%), com acurácia balanceada de 56,1% e F1-macro de 0,557. Já em um teste de holdout real (modelo retreinado excluindo as quatro varejistas do estudo de caso, para então ser aplicado a elas), o modelo acertou apenas 1 das 4 classificações, incluindo um erro na própria Americanas (previsto \"médio\", quando na verdade \"alto\") — resultado que, dada a amostra de apenas 4 empresas, tem alta variância e é discutido com transparência como uma limitação, em vez de ser omitido ou confundido com o desempenho mais robusto obtido na validação cruzada. Os resultados, limitações metodológicas (heterogeneidade setorial, rótulo heurístico, variância do estudo de caso) e possíveis extensões futuras são discutidos em detalhe.",
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
      "This project uses classical Machine Learning techniques (scikit-learn) to classify financial risk and predict the net income of publicly traded Brazilian companies from indicators extracted from their financial statements, motivated by the Americanas S.A. accounting fraud case (revealed in January 2023). In the first deliverable (N1), the group had chosen the \"LLM API Option\", but, given the practical unavailability of a reliable free LLM API within the project deadline, migrated to the \"Framework Option\" in N2 — a decision documented and justified in Section 1.4. The main dataset for this deliverable was built from Brazilian Securities and Exchange Commission (CVM) open data, processing the 2023 Standardized Financial Statements (DFP) of 454 publicly traded companies; the original N1 dataset (four retailers, 2020-2024) was reused as a validation case study. Classification models (Logistic Regression and Random Forest) were trained and evaluated via stratified cross-validation to predict a financial risk category (low/medium/high), and regression models (Linear and Random Forest) to predict net income, deliberately using only balance-sheet \"size\"/structure variables (net revenue, total assets and current liabilities) as inputs, to avoid a trivial/circular task. The Random Forest model achieved 58.6% accuracy on risk classification under 5-fold cross-validation — above both the trivial majority-class baseline (55.1%) and the uniform random baseline (33.3%), with balanced accuracy of 56.1% and macro F1 of 0.557. In a genuine holdout test (the model retrained excluding the four case-study retailers, then applied to them), it correctly classified only 1 of the 4 companies, including a misclassification of Americanas itself (predicted \"medium\" instead of \"high\") — a result that, given the small sample of 4 companies, carries high variance and is discussed transparently as a limitation rather than omitted or conflated with the more robust cross-validation performance. Results, methodological limitations (sector heterogeneity, heuristic label, case-study variance) and possible future extensions are discussed in detail.",
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
  bodyP("Nota sobre a mudança de opção entre a N1 e a N2: na primeira entrega, o grupo havia optado pela \"Opção API ChatGPT/LLM\", propondo um assistente baseado em modelo de linguagem para leitura de documentos de RI. Ao iniciar a N2, o grupo constatou que: (i) a API da Anthropic (Claude), para a qual uma chave foi gerada, exige compra de créditos, sem período gratuito disponível; e (ii) a alternativa gratuita identificada (Google Gemini) exigiria configurar e testar, dentro do prazo remanescente de poucos dias até a entrega, uma integração de API inteiramente nova para o grupo, o que o grupo avaliou como um risco desnecessário para a entrega, frente ao benefício de uma opção já validada. Diante disso, e considerando que o enunciado da atividade permite expressamente a \"Opção Framework\" como alternativa de mesmo peso, o grupo decidiu migrar para essa opção, por oferecer um caminho mais previsível e barato (sem dependência de custos de API) dentro do prazo disponível, reaproveitando o dataset e a análise exploratória da N1 como estudo de caso de validação dos novos modelos. Essa mudança de direção, incluindo os motivos que a levaram, está registrada aqui de forma transparente."),
];

// ---------- 2. Descrição do Problema --------------------------------------------
const s2 = [
  sectionHeading("2. Descrição do Problema"),
  bodyP("Investidores, credores e analistas precisam avaliar continuamente a saúde financeira de centenas de empresas de capital aberto, cada uma publicando anualmente demonstrações financeiras extensas e tecnicamente densas. Esse processo manual tem limitações claras:"),
  bullet("Escala: é inviável para um analista avaliar, com a mesma profundidade, todas as ~900 companhias abertas brasileiras simultaneamente;"),
  bullet("Consistência: critérios de avaliação de risco aplicados manualmente podem variar entre analistas e ao longo do tempo;"),
  bullet("Velocidade: sinais de deterioração financeira podem levar meses para serem plenamente compreendidos, atrasando decisões de investidores e credores — como ilustrado pelo caso Americanas, cuja fragilidade contábil não foi identificada por anos."),
  bodyP("O problema que este projeto busca endereçar é: dado apenas um pequeno conjunto de indicadores de \"tamanho\" do balanço de uma empresa (receita líquida, ativo total, passivo circulante) — informações relativamente simples de obter e que não exigem interpretação qualitativa de texto — é possível treinar um modelo de Machine Learning capaz de classificar corretamente seu nível de risco financeiro e estimar seu resultado líquido, de forma consistente e escalável para centenas de empresas? E, mais especificamente: um modelo treinado nesse conjunto amplo e heterogêneo de empresas generaliza bem para um subconjunto específico e de interesse prático — as grandes varejistas brasileiras — incluindo casos conhecidos de risco extremo, como a Americanas?"),
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
  bodyP("O dataset mistura empresas de setores com estruturas de capital muito diferentes (bancos, seguradoras, indústria, varejo). Um banco, por natureza do seu negócio, opera com alavancagem muito superior à de uma varejista sem que isso indique, por si só, risco de insolvência — o que pode enviesar o modelo a sinalizar risco incorretamente para setores inteiros. Essa limitação é discutida explicitamente nos Resultados (Seção 6) e na Conclusão (Seção 7), em vez de ser ocultada."),
  subHeading("3.4. Transparência e explicabilidade"),
  bodyP("O grupo optou deliberadamente por não usar patrimônio líquido, resultado líquido ou alavancagem como variáveis de entrada do classificador, justamente por essas variáveis participarem diretamente da construção do rótulo de risco — usá-las tornaria a predição circular/trivial (um \"vazamento de rótulo\", ou label leakage). O grupo também identificou, em revisão interna, uma segunda forma mais sutil do mesmo problema: o indicador \"Passivo Total\" originalmente extraído da CVM já inclui o Patrimônio Líquido como subconta (pela identidade contábil Ativo = Passivo + PL), de modo que usá-lo junto com o Ativo Total como entrada permitiria reconstruir algebricamente o Patrimônio Líquido — e, por consequência, o próprio rótulo. A correção adotada (detalhada na Seção 4.1) foi substituir essa variável pelo Passivo Circulante, que não permite essa reconstrução. Essa escolha metodológica, e a importância relativa de cada variável de entrada no modelo de Random Forest, são reportadas de forma explícita na Seção 6, permitindo auditoria da lógica do modelo."),
  subHeading("3.5. Dados pessoais e privacidade"),
  bodyP("O dataset é composto exclusivamente por demonstrações financeiras corporativas já publicamente divulgadas por exigência regulatória da CVM (Comissão de Valores Mobiliários), sem qualquer dado pessoal ou sensível envolvido, dispensando anonimização, em conformidade com os princípios da LGPD (Lei nº 13.709/2018) quanto à ausência de tratamento de dados pessoais."),
  subHeading("3.6. Impacto potencial e uso responsável"),
  bodyP("Classificações de risco incorretas, se divulgadas fora de contexto acadêmico, poderiam influenciar indevidamente decisões de investidores ou afetar a reputação de empresas reais. Por isso, este projeto tem caráter estritamente acadêmico e experimental, e os resultados aqui apresentados não devem ser usados como base para decisões financeiras reais sobre as empresas citadas."),
];

// ---------- 4. Dataset -----------------------------------------------------------
const s4 = [
  sectionHeading("4. Dataset"),
  subHeading("4.1. Dataset principal — CVM DFP 2023 (454 empresas)"),
  bodyP("O dataset principal desta entrega foi construído processando os arquivos brutos de Demonstrações Financeiras Padronizadas (DFP) de 2023 da CVM (Comissão de Valores Mobiliários), disponíveis publicamente em dados.cvm.gov.br — especificamente os demonstrativos consolidados de Resultado (DRE), Balanço Patrimonial Passivo (BPP) e Balanço Patrimonial Ativo (BPA). O script ml/build_dataset.py extrai, para cada companhia, a Receita Líquida, o Resultado Líquido, o Patrimônio Líquido, o Passivo Circulante, o Passivo Não Circulante e o Ativo Total, casando as linhas corretas de cada demonstrativo pela descrição padronizada da conta (já que o código numérico da conta varia conforme a profundidade do plano de contas de cada empresa). Após cruzar os três demonstrativos, restam 454 companhias com dados completos (20 empresas adicionais foram descartadas por usarem descrições de conta não-padronizadas para o passivo circulante/não circulante, não capturadas pelos padrões de texto do script)."),
  bodyP("Vale registrar uma correção metodológica feita durante a elaboração deste relatório: a primeira versão do dataset extraía um \"Passivo Total\" a partir do código de conta \"2\" da CVM. Em revisão interna, o grupo constatou que esse código, na estrutura de contas da CVM, já inclui o Patrimônio Líquido como subconta (Passivo Circulante + Passivo Não Circulante + Patrimônio Líquido = \"Passivo Total\") — ou seja, por construção contábil, esse valor é sempre idêntico ao Ativo Total (identidade Ativo = Passivo + PL), o que foi confirmado empiricamente nas 474 empresas da versão original (diferença de 0,0 em 100% dos casos). Isso tornava a variável inútil como indicador de endividamento e, mais grave, arriscado como feature de entrada do modelo (ver Seção 3.4). A correção substituiu essa extração por Passivo Circulante e Passivo Não Circulante, somados para formar o \"passivo exigível total\" (as obrigações com terceiros, excluindo o PL) — usado apenas para calcular alavancagem e o rótulo de risco, nunca como entrada do modelo. Essa correção também alterou o número de empresas no dataset (de 474 para 454) e a distribuição de risco (de 185 baixo/247 médio/42 alto para 250 baixo/162 médio/42 alto), já refletidos em todo este relatório."),
  bodyP("A partir desses valores brutos, foram calculados os indicadores derivados: margem líquida (%), alavancagem (passivo exigível total / patrimônio líquido, indefinida quando o patrimônio líquido é negativo ou zero), ROE (%), endividamento sobre o ativo (%) e uma flag de patrimônio líquido negativo. O rótulo de risco financeiro (baixo/médio/alto) foi então definido heuristicamente: risco alto se patrimônio líquido negativo; risco médio se resultado líquido negativo ou alavancagem acima de 3x; risco baixo nos demais casos."),
  bodyP("A extração foi validada cruzando os valores obtidos para as quatro varejistas do estudo de caso com os números já coletados manualmente na N1: Magazine Luiza e Grupo Casas Bahia bateram de forma exata; a Lojas Renner apresentou uma diferença maior que o esperado — o resultado líquido de 2023 extraído da CVM (R$ 976,3 milhões) corresponde, na verdade, ao valor de 2022 do dataset da N1 (R$ 976,3 milhões), não ao valor de 2023 da N1 (R$ 1.196,7 milhões). A causa provável é que a Lojas Renner adota ano fiscal não-calendário (fevereiro a janeiro), de modo que o exercício \"2023\" da DFP consolidada da CVM pode estar defasado em um ano em relação ao \"2023\" calendário usado no dataset manual da N1. Diferente da diferença já conhecida de receita (que é uma diferença de escopo — a N1 usa só a operação de varejo, excluindo a financeira Realize), esta é uma diferença de período, e está registrada aqui e em dataset/README.md para transparência; ela não invalida o uso da Lojas Renner no estudo de caso (Seção 6.3), mas é um lembrete de que comparar exercícios fiscais não-calendário exige atenção redobrada."),
  ...figureML("distribuicao_risco.png", "Figura 1 — Distribuição das 454 empresas por categoria de risco financeiro."),
  ...figureML("dispersao_ativo_resultado.png", "Figura 2 — Ativo total x Resultado líquido, por categoria de risco, com destaque (zoom) para as 4 varejistas do estudo de caso.", 520, 0.42),
  subHeading("4.2. Dataset de estudo de caso — Varejo brasileiro 2020-2024 (N1)"),
  bodyP("O dataset original da N1 — indicadores financeiros anuais (2020–2024) de Magazine Luiza, Americanas, Via S.A./Grupo Casas Bahia e Lojas Renner, capturado manualmente pelo grupo a partir de divulgações oficiais de RI e imprensa especializada, com rastreabilidade completa em dataset/fontes.csv — é reaproveitado nesta entrega como estudo de caso: um modelo de Random Forest, retreinado excluindo estas quatro empresas (holdout real), é aplicado a elas (ano de 2023, presentes também no dataset CVM), e a classificação de risco prevista é comparada com o que se sabe ter ocorrido de fato com cada uma (ver Seção 6)."),
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
  bodyP("Foram conduzidos dois experimentos independentes com scikit-learn, ambos usando deliberadamente apenas três variáveis de entrada (features) — receita líquida, ativo total e passivo circulante — escolhidas por não participarem diretamente da construção do rótulo de risco nem do cálculo do resultado líquido, evitando uma tarefa circular/trivial (ver Seção 3.4). Note-se que passivo circulante, sozinho, também não permite reconstruir o patrimônio líquido a partir do ativo total (faltaria o passivo não circulante), diferente do que ocorria com a variável originalmente usada (ver Seção 4.1):"),
  bullet("Classificação: prever a categoria de risco financeiro (baixo/médio/alto) com Regressão Logística (com ponderação balanceada de classes, dado o desbalanceamento: 250 baixo, 162 médio, 42 alto) e Random Forest (300 árvores, também balanceado);"),
  bullet("Regressão: prever o resultado líquido (R$ milhões) com Regressão Linear e Random Forest Regressor."),
  bodyP("Ambos os experimentos foram avaliados por validação cruzada (5-fold), em vez de uma única divisão treino/teste, para obter estimativas mais estáveis — especialmente relevante para a classe minoritária \"risco alto\" (42 das 454 empresas, ~9,3%). Para a classificação, a validação cruzada foi estratificada (StratifiedKFold), preservando a proporção de cada classe em cada fold. Além da acurácia bruta, também reportamos a acurácia balanceada (média do recall de cada classe) e o F1-macro, métricas mais informativas que a acurácia simples em um problema de classes desbalanceadas — e comparamos explicitamente com dois baselines: o acaso uniforme (33,3%, três classes) e o baseline trivial de sempre prever a classe majoritária (55,1%, \"baixo\")."),
  subHeading("5.2. Estudo de caso de validação (holdout real)"),
  bodyP("Uma primeira versão deste experimento testou as quatro varejistas do estudo de caso usando o mesmo modelo de Random Forest treinado no dataset completo — mas esse dataset completo inclui as próprias quatro varejistas, o que configura vazamento entre treino e teste (o modelo já havia \"visto\" as respostas dessas empresas durante o treino, tornando o teste inválido como medida de generalização). A versão corrigida, usada nos resultados da Seção 6.3, treina um modelo de Random Forest separado, excluindo explicitamente as quatro varejistas do conjunto de treino (450 das 454 empresas), e só então o aplica a elas — um holdout real. A categoria de risco prevista é comparada com a categoria real (construída a partir do balanço completo de cada uma, incluindo patrimônio líquido e resultado — informação não usada como entrada do modelo) e com o conhecimento público sobre a situação de cada empresa (ex.: Americanas em recuperação judicial)."),
];

// ---------- 6. Resultados ---------------------------------------------------------
const s6 = [
  sectionHeading("6. Resultados"),
  subHeading("6.1. Classificação de risco financeiro"),
  bodyP("Em validação cruzada de 5 folds sobre as 454 empresas, o Random Forest atingiu acurácia bruta de 58,6% — acima do baseline trivial de sempre prever a classe majoritária \"baixo\" (55,1%) e do acaso uniforme para 3 classes (33,3%) — com acurácia balanceada de 56,1% e F1-macro de 0,557, e recall razoavelmente equilibrado entre as três classes (F1-score de 0,53 em \"alto\", 0,68 em \"baixo\" e 0,46 em \"médio\"). A Regressão Logística, com ponderação balanceada, priorizou fortemente a classe \"alto\" (86% de recall nessa classe), mas à custa de acurácia geral: sua acurácia bruta (33,0%) ficou abaixo do próprio baseline majoritário, embora sua acurácia balanceada (46,8%) e F1-macro (0,325) sejam mais informativos do que a acurácia bruta isoladamente sugere. Reportamos essa comparação com o baseline de forma explícita, em vez de apresentar apenas a acurácia bruta, justamente para evitar a leitura equivocada de que qualquer acurácia acima do acaso (33%) já seria um resultado forte — o padrão de comparação correto, em um problema desbalanceado como este, é o baseline majoritário (55,1%), que só o Random Forest supera."),
  ...figureML("confusao_random_forest.png", "Figura 5 — Matriz de confusão (5-fold CV) — Random Forest.", 360, 0.82),
  ...figureML("confusao_regressao_logistica.png", "Figura 6 — Matriz de confusão (5-fold CV) — Regressão Logística (balanceada).", 360, 0.82),
  bodyP("A importância das variáveis no Random Forest ficou distribuída de forma equilibrada entre as três entradas: passivo circulante (34,7%), ativo total (33,7%) e receita líquida (31,7%) — nenhuma variável domina isoladamente, sugerindo que o sinal de risco emerge da combinação das três, não de uma única métrica de tamanho."),
  ...figureML("alavancagem_por_risco.png", "Figura 7 — Alavancagem (passivo exigível total / patrimônio líquido) por categoria de risco. A categoria \"alto\" não tem alavancagem definida, pois é causada justamente por patrimônio líquido negativo."),
  subHeading("6.2. Regressão do resultado líquido"),
  bodyP("A Regressão Linear obteve R² = -1,481 e erro médio absoluto (MAE) de R$ 3.517,0 milhões; o Random Forest Regressor obteve R² = 0,313 e MAE de R$ 2.015,3 milhões. Um R² negativo significa que a Regressão Linear, em validação cruzada, performa PIOR do que simplesmente prever a média do resultado líquido para todas as empresas — um resultado fraco, mas honesto: diferente da versão preliminar deste experimento (que usava o \"passivo total\", redundante com o ativo total, como terceira feature), a versão corrigida usa apenas informação genuinamente nova em cada variável, e o modelo linear simplesmente não consegue capturar, com uma combinação linear de receita/ativo/passivo circulante, a relação (fortemente não-linear e heterogênea entre setores) com o resultado líquido. O Random Forest Regressor, por conseguir capturar não-linearidades e interações entre as variáveis, generaliza melhor (R² = 0,313), mas ainda com erro médio absoluto elevado (R$ 2.015,3 milhões) — o que é esperado dado que o dataset mistura empresas de escalas extremamente diferentes (de companhias pequenas a grandes bancos, com ativos na casa dos trilhões de reais). Esse resultado reforça, de forma ainda mais direta do que a versão anterior, que três variáveis de tamanho do balanço, usadas de forma genuinamente não-circular, não bastam para prever o resultado líquido com precisão em um conjunto heterogêneo de setores."),
  subHeading("6.3. Estudo de caso — as 4 varejistas (holdout real)"),
  bodyP("Um modelo de Random Forest treinado excluindo as quatro varejistas do conjunto de treino (450 das 454 empresas) foi aplicado a elas, usando apenas receita líquida, ativo total e passivo circulante. O resultado foi 1 acerto em 4: o modelo classificou corretamente apenas a Lojas Renner (risco baixo); errou a Americanas (previu \"médio\", quando o risco real — dado o patrimônio líquido negativo após a fraude contábil — é \"alto\"), o Grupo Casas Bahia (previu \"baixo\" em vez de \"médio\") e a Magazine Luiza (previu \"baixo\" em vez de \"médio\")."),
  bodyP("Esse resultado contrasta com o de uma versão preliminar deste experimento, que testava as mesmas quatro empresas usando o modelo \"geral\" treinado no dataset inteiro — ou seja, incluindo as próprias quatro varejistas no treino. Esse teste preliminar reportava 4 de 4 acertos, mas constitui vazamento entre treino e teste (o modelo já havia visto as respostas certas durante o ajuste), não uma validação de generalização; por isso foi descartado e substituído pelo holdout real descrito acima, identificado durante a revisão metodológica do grupo. A diferença entre os dois resultados (de 100% de acerto para 25%) ilustra concretamente por que avaliar um modelo nos mesmos dados usados para treiná-lo produz uma estimativa de desempenho enganosamente otimista."),
  bodyP("O resultado de 1 em 4 também deve ser interpretado com cautela na direção oposta: por ser uma amostra de apenas 4 empresas, o resultado tem alta variância — um único acerto ou erro adicional mudaria a taxa de acerto em 25 pontos percentuais. O indicador mais confiável do desempenho do modelo é, portanto, a validação cruzada de 5 folds da Seção 6.1 (acurácia balanceada de 56,1%, acima do acaso, mas moderada), não este teste pontual. O caso da Americanas é, ainda assim, instrutivo: o modelo previu risco \"médio\" (não \"baixo\"), ou seja, captou algum sinal de deterioração financeira a partir de receita/ativo/passivo circulante, mesmo sem classificá-la corretamente como \"alto\" — um resultado parcial, não uma falha completa do modelo."),
];

// ---------- 7. Conclusão -----------------------------------------------------------
const s7 = [
  sectionHeading("7. Conclusão"),
  bodyP("Os resultados obtidos atendem parcialmente aos objetivos propostos. Por um lado, foi possível treinar e avaliar, com rigor estatístico (validação cruzada estratificada, comparação explícita com baselines, holdout real no estudo de caso, cuidado ativo contra duas formas distintas de vazamento de rótulo), modelos de classificação e regressão sobre um dataset real e amplo — algo que teria sido mais difícil de avaliar quantitativamente com a abordagem original de LLM dentro do prazo disponível. Em validação cruzada, o Random Forest de classificação superou o baseline trivial (58,6% de acurácia contra 55,1%, com acurácia balanceada de 56,1%), demonstrando que as variáveis escolhidas carregam algum sinal genuíno de risco financeiro, ainda que modesto."),
  bodyP("Por outro lado, o estudo de caso de validação nas quatro varejistas, quando corrigido para um holdout real (modelo treinado sem essas empresas), acertou apenas 1 das 4 classificações — bem abaixo do resultado (4 de 4) de uma versão preliminar deste experimento que, como identificado em revisão interna do grupo e descrito na Seção 6.3, continha vazamento entre treino e teste. Esse resultado corrigido, somado ao desempenho fraco da regressão do resultado líquido (R² negativo para a Regressão Linear) e à acurácia bruta inferior ao baseline na Regressão Logística, evidencia que prever risco financeiro ou resultado líquido a partir de apenas três variáveis de tamanho/estrutura do balanço, para um conjunto heterogêneo de setores, é uma tarefa genuinamente difícil. Entendemos isso como um resultado honesto e relevante, e não como um defeito a esconder: tamanho de balanço sozinho não é suficiente para capturar risco financeiro de forma confiável entre setores tão distintos quanto bancos, indústria e varejo, nem para generalizar com segurança a partir de uma amostra de apenas 4 empresas. Isso reforça a importância de abordagens setorizadas (treinar/avaliar modelos separados por segmento), de conjuntos de indicadores mais ricos (liquidez corrente, ciclo operacional, séries temporais multi-ano) e de estudos de caso com amostras maiores, como trabalho futuro."),
  bodyP("O processo de revisão interna do grupo, que levou às três correções descritas nas Seções 3.4, 4.1, 5.2 e 6 (a variável de passivo redundante com o ativo total, o vazamento treino/teste no estudo de caso original, e a comparação ausente com o baseline majoritário), é, por si só, parte do aprendizado desta entrega: os resultados mais \"bonitos\" da primeira versão do pipeline (47,7% de acurácia soando bem acima do acaso, e 4 de 4 no estudo de caso) eram, em maior ou menor grau, artefatos metodológicos, não evidência robusta de que o modelo funciona bem. Os números corrigidos são menos impressionantes, mas mais confiáveis."),
  bodyP("Em relação à mudança de opção do projeto (Seção 1.4), o grupo entende que a decisão foi acertada diante das restrições de prazo: permitiu entregar um pipeline de ML completo, avaliado com métricas padrão da literatura (acurácia, acurácia balanceada, F1-macro, R², MAE) e comparado de forma honesta com baselines simples, mantendo a mesma motivação (o caso Americanas) e parte do dataset construído na N1."),
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
