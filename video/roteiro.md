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
  2026-11-14 | Cristiano Morales | Atualizacao dos numeros apos correcao de
              3 problemas metodologicos (revisao interna do grupo): dataset
              454 empresas (era 474), acuracia do Random Forest 58,6% com
              comparacao explicita ao baseline (era so "47,7%"), e estudo
              de caso com holdout real (1 de 4 acertos, era "4 de 4" com
              vazamento treino/teste).
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
> A pergunta que guiou o projeto foi: será que dá pra usar só alguns números simples do balanço de uma empresa — receita, ativo total e passivo circulante — para prever automaticamente se ela está em risco financeiro, sem precisar ler relatórios inteiros?"

**Tela:** gráfico `fig_americanas_restatement.png` (dataset/) e/ou a Seção 2 do relatório (Descrição do Problema).

---

## 3. Uso de IA e fundamentos da disciplina (1:30 – 2:45) — ~75s

**Fala:**
> "A gente originalmente ia usar um modelo de linguagem (LLM) pra ler documentos de RI, mas a API gratuita que conseguimos não funcionou dentro do prazo — então migramos para a 'Opção Framework', usando Machine Learning clássico com a biblioteca scikit-learn. Isso está documentado com transparência no relatório, na seção 1.4.
>
> Usamos os conceitos da disciplina de: aprendizado supervisionado, com dois tipos de tarefa — classificação, pra prever a categoria de risco (baixo, médio ou alto), e regressão, pra prever o resultado líquido da empresa. Treinamos dois algoritmos de classificação (Regressão Logística e Random Forest) e dois de regressão (Regressão Linear e Random Forest Regressor), e avaliamos todos com validação cruzada, que é uma técnica pra garantir que os resultados não dependam de sorte na divisão dos dados.
>
> Uma decisão importante foi: para evitar uma previsão 'óbvia demais', a gente NÃO deixou o modelo ver o patrimônio líquido ou o resultado líquido como entrada — porque é justamente a partir deles que a gente define o rótulo de risco. Isso seria uma espécie de trapaça estatística, chamada de vazamento de rótulo."

**Tela:** Seção 5 (Metodologia) do relatório, destacando a lista de features usadas.

---

## 4. Solução proposta e demonstração do artefato (2:45 – 4:15) — ~90s

**Fala:**
> "Construímos o dataset principal a partir dos dados abertos da CVM — processamos as demonstrações financeiras de 2023 de quase 900 empresas abertas brasileiras e conseguimos extrair dados completos de 454 delas. Isso é bem maior que o dataset manual que tínhamos na primeira entrega, com só 19 linhas.
>
> [Mostrem a tela rodando `python treinar_modelos.py` no terminal, ou os gráficos já gerados]
>
> O modelo de Random Forest classificou corretamente 58,6% das empresas em validação cruzada — acima do baseline de sempre prever a classe mais comum, que seria 55,1%. É uma melhora real, mas modesta: o problema é genuinamente difícil.
>
> E aqui vale contar algo que aconteceu nos bastidores: numa primeira versão, testamos o modelo nas quatro varejistas que estudamos desde a primeira entrega usando o MESMO modelo treinado com elas incluídas no treino — e ele acertou as 4 de 4. Só que, numa revisão interna do grupo, percebemos que isso não é um teste válido: o modelo já tinha "visto a resposta" dessas empresas durante o treino. Corrigimos isso treinando um modelo separado, sem essas 4 empresas, e só então aplicando a elas — um teste de verdade. O resultado caiu para 1 acerto em 4, incluindo um erro na própria Americanas, que o modelo classificou como risco médio em vez de alto.
>
> [Mostrem a Figura 2 do relatório — o gráfico com as 4 varejistas destacadas]
>
> Achamos importante mostrar essa correção no vídeo, porque ela ilustra bem uma lição central de Machine Learning: testar um modelo nos mesmos dados que ele viu no treino dá uma falsa sensação de que ele funciona bem. E, com só 4 empresas na amostra, um resultado de 1 em 4 também tem bastante variância — o indicador mais confiável continua sendo a validação cruzada nas 454 empresas.
>
> Também testamos regressão pra prever o resultado líquido, e aprendemos outra lição importante: depois da correção, o modelo de Regressão Linear teve desempenho pior do que simplesmente chutar a média (R² negativo); já o Random Forest teve R² de 0,31 — melhor, mas longe de perfeito. Isso reforça que três variáveis de tamanho do balanço não bastam para prever com precisão o resultado líquido de empresas tão diferentes quanto bancos e varejistas. A gente discute essa limitação com honestidade no relatório, em vez de esconder."

**Tela:** abram o notebook direto no Google Colab (não precisa instalar nada, carrega os dados do GitHub de vocês automaticamente):

**https://colab.research.google.com/github/CristianoMorales/Projeto_IA/blob/main/ml/demo_colab.ipynb**

No menu do Colab: `Ambiente de execução` → `Executar tudo`. Esperem rodar (uns 20-30s) e vão mostrando as células: o gráfico de distribuição de risco, a matriz de confusão, a importância das variáveis, a tabela de regressão, e principalmente a **tabela final da Seção 5** do notebook — a comparação das 4 varejistas com holdout real, mostrando a coluna "Acertou?" com 1 ✅ e 3 ❌ (expliquem rapidamente, como no roteiro acima, por que esse resultado corrigido é mais confiável do que um "4 de 4" obtido testando o modelo nas mesmas empresas usadas no treino).

---

## 5. Área do GitHub (4:15 – 5:00) — ~45s

**Fala:**
> "Todo o código, os dois datasets, os gráficos e o relatório completo estão no nosso repositório público no GitHub."

**Tela:** abram `https://github.com/CristianoMorales/Projeto_IA` no navegador e mostrem rapidamente:
- a pasta `ml/` (scripts de dataset e modelos);
- a pasta `dataset/` (os dois datasets);
- o `README.md` (que explica a estrutura e a mudança de opção);
- o relatório em `relatorio/Relatorio_Projeto_N2.pdf`.

**Encerramento:**
> "Esse foi o nosso projeto. Obrigado!"

---

## Checklist antes de gravar

- [ ] Abrir o Colab (https://colab.research.google.com/github/CristianoMorales/Projeto_IA/blob/main/ml/demo_colab.ipynb) uma vez ANTES de gravar e rodar tudo, só pra garantir que carrega sem erro e saber quanto tempo demora.
- [ ] Ter o relatório em PDF aberto, já na página certa de cada seção mencionada.
- [ ] Ter o GitHub aberto numa aba, já logado/carregado.
- [ ] Cronometrar um ensaio — o vídeo **não pode passar de 5 minutos**.
- [ ] Publicar como **não-listado ou público** no YouTube (não pode ser privado) no canal de UM dos integrantes.
- [ ] Colar o link do vídeo publicado na Seção 8 do relatório (`Relatorio_Projeto_N2.docx` → `relatorio/build_report_n2.js`, variável `s8`) e regenerar o PDF antes da entrega final.
