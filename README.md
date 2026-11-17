# Sentinela de Risco — Classificação de Risco Financeiro de Empresas Brasileiras com Machine Learning

Projeto da disciplina **Inteligência Artificial – 7ºK SI Noite** (Prof. Dr. Leandro Zerbinatti), Universidade Presbiteriana Mackenzie.

**Opção do projeto:** Framework de Machine Learning (scikit-learn) — classificação e regressão sobre dados de negócio.

> **Nota sobre a evolução do projeto:** na entrega N1, o grupo havia optado pela "Opção API de LLM", propondo um assistente baseado em modelo de linguagem para análise de documentos de RI. Na N2, o grupo migrou para a **Opção Framework**, pelo custo da API e pela possibilidade de avaliar o modelo de forma quantitativa (validação cruzada, baselines e métricas padronizadas). O dataset original do varejo brasileiro (construído na N1) foi reaproveitado como **estudo de caso de validação**, e um dataset muito maior (dados abertos da CVM, DFP 2023 e 2024 — 472 empresas em 2023) foi construído para o treinamento dos modelos de Machine Learning. Essa mudança está documentada em detalhe na seção "Opção do projeto" do relatório.

**Vídeo de apresentação:** https://www.youtube.com/watch?v=PzWHHcvsTgY

## Integrantes

| Nome | RA | E-mail |
|---|---|---|
| Cristiano Morales | 10437953 | 10437953@mackenzista.com.br |
| Caio Carames | 10308718 | 10308718@mackenzista.com.br |
| Leonardo Tonon | 10426930 | 10426930@mackenzista.com.br |
| Ali Ahmad | 10427712 | 10427712@mackenzista.com.br |

## Estrutura do repositório

```
├── relatorio/
│   ├── Relatorio_Projeto_N2.docx   # Relatório do Projeto (entrega N2, 12 itens)
│   └── Relatorio_Projeto_N2.pdf    # mesma versão, em PDF
├── dataset/
│   ├── cvm_dfp_empresas.csv                           # dataset principal da N2: CVM DFP 2023 (472 empresas) e 2024 (464)
│   ├── demonstrativos_financeiros_varejo_br.csv       # dataset original da N1 (4 varejistas, 2020-2024) — usado como estudo de caso
│   ├── demonstrativos_financeiros_varejo_br_prep.csv  # mesmo dataset, após preparação/limpeza (N1)
│   ├── fontes.csv                                     # rastreabilidade do dataset da N1
│   ├── README.md                                      # descrição detalhada de ambos os datasets
│   └── fig_*.png                                      # gráficos da análise exploratória da N1
├── notebooks/
│   ├── eda_prep.ipynb   # EDA e preparação dos dados do varejo (N1)
│   └── eda_prep.py      # versão script (.py) do mesmo conteúdo
└── ml/
    ├── build_dataset.py      # baixa e processa os dados da CVM (DFP 2023 e 2024)
    ├── eda_cvm.py             # visualizações exploratórias do dataset CVM
    ├── treinar_modelos.py     # treina/avalia classificação e regressão (scikit-learn)
    ├── demo_colab.ipynb       # demonstração no Google Colab (usada no vídeo); demo_colab.py = versão script
    ├── projeto_IA.ipynb       # cópia do notebook de demonstração
    ├── figuras/               # gráficos gerados (distribuição de risco, matrizes de confusão etc.)
    ├── resultados/            # métricas (metricas.json) e previsões das varejistas
    └── cvm_raw/               # dados brutos da CVM (baixados automaticamente; NÃO versionados)
```

## Resumo do projeto

O projeto usa Machine Learning (scikit-learn) para **classificar o risco financeiro** e **prever o resultado líquido** de companhias brasileiras de capital aberto a partir de indicadores extraídos de suas demonstrações financeiras, motivado pelo caso da fraude contábil da Americanas S.A. (2023). O dataset principal foi construído a partir dos **dados abertos da CVM** (Demonstrações Financeiras Padronizadas, DFP 2023 e 2024). Como estudo de caso, os modelos são aplicados às 4 varejistas analisadas desde a N1 (Magazine Luiza, Americanas, Via/Grupo Casas Bahia e Lojas Renner), que ficam **fora do treino**.

Principais resultados (validação cruzada de 5 folds repetida 5 vezes, varejistas fora do treino):

| Experimento | Melhor modelo | Baseline |
|---|---|---|
| Risco 2023 a partir de receita e ativo | Acurácia balanceada 50,6% (Reg. Logística) / 44,0% (Random Forest) | 33,3% (sempre "médio"; acurácia simples 52,6%) |
| Estudo de caso: 4 varejistas fora do treino | 0 de 4 (com elas no treino: 4 de 4 — memorização) | — |
| Risco 2024 a partir dos dados de 2023 | Acurácia balanceada 87,4% (Random Forest) | 84,4% (persistência: repetir 2023) |

Detalhes completos no [Relatório do Projeto](relatorio/Relatorio_Projeto_N2.pdf).

## Rodar no Google Colab (sem instalar nada)

[![Abrir no Google Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/CristianoMorales/Projeto_IA/blob/main/ml/demo_colab.ipynb)

1. Clique no botão acima (é preciso estar logado numa conta Google).
2. No menu, **Ambiente de execução → Executar tudo**. Se aparecer o aviso "Este notebook não foi criado pelo Google", clique em **Executar mesmo assim**.
3. Espere cerca de 2 minutos: a primeira célula instala o scikit-learn 1.9.1 (a versão usada no relatório) e as seguintes carregam o dataset direto deste repositório, treinam os modelos e mostram os resultados.

O notebook reproduz os números do relatório: Random Forest com acurácia balanceada de 44,0% no risco de 2023 e de 87,4% na previsão de 2024. Para só ler o notebook já executado, sem rodar nada, abra [`ml/demo_colab.ipynb`](ml/demo_colab.ipynb) aqui no GitHub.

## Rodar no GitHub Codespaces (ambiente pronto, sem instalar nada)

[![Abrir no GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/CristianoMorales/Projeto_IA)

Qualquer integrante pode clicar no botão acima (ou em **Code → Codespaces → Create codespace on main**). A configuração em `.devcontainer/` cria o mesmo ambiente para todos — Python 3.11 com as bibliotecas de `requirements.txt` e Node.js com o pacote `docx` para gerar o relatório. Cada pessoa abre o seu próprio Codespace; o que é compartilhado é o repositório (via commit/push).

## Como reproduzir a análise

```bash
pip install -r requirements.txt

# EDA e preparação do dataset do varejo (N1)
cd notebooks && jupyter nbconvert --to notebook --execute --inplace eda_prep.ipynb && cd ..

# Dataset CVM + modelos de ML (N2) — os zips da CVM (DFP 2023 e 2024) são baixados
# automaticamente de https://dados.cvm.gov.br para ml/cvm_raw/ (não versionados)
python ml/build_dataset.py       # gera dataset/cvm_dfp_empresas.csv
python ml/eda_cvm.py             # gera os gráficos exploratórios
python ml/treinar_modelos.py     # treina e avalia os modelos (figuras em ml/figuras, métricas em ml/resultados)

# Relatório (requer Node.js e o pacote docx: npm install docx)
cd relatorio && node build_report_n2.js
```
