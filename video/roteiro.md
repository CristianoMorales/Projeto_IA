<!--
Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica

Titulo do arquivo: roteiro.md
Sintese do conteudo: Roteiro do video de apresentacao da N2 (ate 5 minutos),
  cobrindo os 5 pontos exigidos pelo enunciado: identificacao do grupo,
  definicao do tema, explicacao do uso de IA, explicacao da solucao e
  demonstracao do artefato, e apresentacao da area do GitHub.

Integrantes do grupo:
  - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
  - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
  - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
  - Ali Ahmad              | RA 10427712 | 10427712@mackenzista.com.br

Historico de atualizacoes:
  2026-11-13 | Cristiano Morales | Criacao do roteiro do video da N2.
  2026-11-13 | Leonardo Tonon | Falas e telas atualizadas com os resultados
               do protocolo corrigido (varejistas fora do treino, baselines,
               vazamento, experimento temporal).
-->

# Roteiro do vídeo — N2 (máximo 5 minutos)

**Formato sugerido:** tela compartilhada (relatório PDF + terminal/VS Code + GitHub no navegador), com um ou mais integrantes narrando. Pode ser só uma pessoa falando o roteiro todo, ou dividido — o enunciado não exige que todos apareçam, só que o vídeo seja publicado no canal de **um** dos integrantes.

---

## 1. Abertura (0:00 – 0:30) — ~30s

**Fala:**
> "Olá, somos Cristiano Morales, Caio Carames, Leonardo Tonon e Ali Ahmad, do curso de Sistemas de Informação, turma 7ºK Noite, da Universidade Presbiteriana Mackenzie. Este é o projeto da disciplina de Inteligência Artificial, do professor Leandro Zerbinatti: Sentinela de Risco — classificação de risco financeiro de empresas brasileiras com Machine Learning."

**Tela:** capa do relatório (página 1 do PDF) ou um slide simples com título + nomes.

---

## 2. Definição do tema/problema (0:30 – 1:30) — ~60s

**Fala (ideias-chave, adaptem com suas palavras):**
> "O projeto nasce de um caso real: a fraude contábil da Americanas, revelada em janeiro de 2023, que transformou um lucro declarado de R$ 544 milhões em um prejuízo de R$ 6,2 bilhões. Isso mostra como é difícil, analisando balanços manualmente, perceber a tempo que uma empresa está em risco financeiro grave.
>
> A pergunta que guiou o projeto foi: será que dá pra usar só alguns números simples do balanço de uma empresa — receita e ativo total — para prever automaticamente se ela está em risco financeiro, sem precisar ler relatórios inteiros? E será que dá pra antecipar o risco do ano seguinte?"

**Tela:** gráfico `fig_americanas_restatement.png` (dataset/) e/ou a Seção 2 do relatório (Descrição do Problema).

---

## 3. Uso de IA e fundamentos da disciplina (1:30 – 2:30) — ~60s

**Fala:**
> "Na N1 a gente tinha escolhido a opção de API de LLM. Na N2 migramos para a 'Opção Framework', com Machine Learning clássico no scikit-learn: a API paga tinha custo e, principalmente, com dados estruturados dá pra medir o desempenho de forma objetiva. Isso está explicado na seção 1.4 do relatório.
>
> Usamos aprendizado supervisionado em duas tarefas: classificação, pra prever o risco (baixo, médio ou alto), e regressão, pra prever o resultado líquido. Avaliamos com validação cruzada repetida e sempre comparando com um baseline — o 'chute' de responder sempre a classe mais comum.
>
> Dois cuidados importantes: o modelo não vê patrimônio líquido nem resultado, que definem o rótulo — senão seria vazamento de rótulo; e as quatro varejistas do estudo de caso ficam fora do treino, pra testar o modelo em empresas que ele nunca viu."

**Tela:** Seção 5 (Metodologia) do relatório.

---

## 4. Solução proposta e demonstração do artefato (2:30 – 4:15) — ~105s

**Fala:**
> "O dataset vem dos dados abertos da CVM: as demonstrações de 2023 e 2024 de todas as companhias abertas — 472 empresas com dados completos em 2023. Na revisão encontramos e corrigimos dois problemas: oito empresas estavam com valores mil vezes maiores, porque informam em reais e não em milhares, e o 'passivo total' da CVM é igual ao ativo.
>
> [Colab: seções 2 e 3 — distribuição do risco e a conta 2 igual ao ativo em 100%]
>
> Resultado honesto: só com receita e ativo, os modelos acertam menos que o chute em acurácia — uns 47% contra 52,6% — e só ganham do baseline na acurácia balanceada e no F1. A regressão logística encontra 73% das empresas de risco alto.
>
> [Colab: seção 4 — tabela e matrizes de confusão]
>
> No estudo de caso, fora do treino, o modelo errou as quatro varejistas. Se a gente deixa elas no treino, ele 'acerta' as quatro — mas isso é memorização, não previsão.
>
> [Colab: seção 5 — tabela fora x dentro do treino]
>
> E se a gente coloca uma variável que permite reconstruir o patrimônio líquido, a acurácia salta pra 81% — é o vazamento de rótulo na prática.
>
> [Colab: seção 6]
>
> O resultado mais promissor é prever o risco do ano seguinte: com os dados de 2023, o Random Forest prevê o risco de 2024 com 87% de acurácia balanceada, acima de simplesmente repetir a classe do ano anterior, e encontra 90% das empresas que estarão em risco alto."

**Tela:** abram o notebook direto no Google Colab (carrega os dados do GitHub automaticamente):

**https://colab.research.google.com/github/CristianoMorales/Projeto_IA/blob/main/ml/demo_colab.ipynb**

No menu do Colab: `Ambiente de execução` → `Executar tudo` (leva cerca de 1 minuto por causa das repetições da validação cruzada — rodem ANTES de começar a gravar e só rolem pelas células durante o vídeo). Mostrem as seções 2 a 7; a seção 8 (regressão) pode ser citada rapidamente.

---

## 5. Área do GitHub (4:15 – 5:00) — ~45s

**Fala:**
> "Todo o código, os dois datasets, os gráficos e o relatório completo estão no nosso repositório público no GitHub."

**Tela:** abram `https://github.com/CristianoMorales/Projeto_IA` no navegador e mostrem rapidamente:
- a pasta `ml/` (scripts de dataset e modelos);
- a pasta `dataset/` (o dataset da CVM e o dataset manual da N1);
- o `README.md` (que explica a estrutura e a mudança de opção);
- o relatório em `relatorio/Relatorio_Projeto_N2.pdf`.

**Encerramento:**
> "Esse foi o nosso projeto. Obrigado!"

---

## Checklist antes de gravar

- [ ] Abrir o Colab (https://colab.research.google.com/github/CristianoMorales/Projeto_IA/blob/main/ml/demo_colab.ipynb) e rodar tudo ANTES de gravar (cerca de 1 minuto), só pra garantir que carrega sem erro.
- [ ] Ter o relatório em PDF aberto, já na página certa de cada seção mencionada.
- [ ] Ter o GitHub aberto numa aba, já logado/carregado.
- [ ] Cronometrar um ensaio — o vídeo **não pode passar de 5 minutos**.
- [ ] Publicar como **não-listado ou público** no YouTube (não pode ser privado) no canal de UM dos integrantes.
- [ ] Colar o link do vídeo publicado na Seção 8 do relatório (`Relatorio_Projeto_N2.docx` → `relatorio/build_report_n2.js`, variável `s8`) e regenerar o PDF antes da entrega final.
