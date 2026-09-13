# Sentinela de Risco — Análise de RI do Varejo Brasileiro com IA

Projeto da disciplina **Inteligência Artificial – 7ºK SI Noite** (Prof. Dr. Leandro Zerbinatti), Universidade Presbiteriana Mackenzie.

**Opção do projeto:** API de LLM — análise de balanços e documentos de Relação com Investidores (RI).

## Integrantes

| Nome | RA | E-mail |
|---|---|---|
| Cristiano Morales | 10437953 | 10437953@mackenzista.com.br |
| Caio Carames | 10308718 | 10308718@mackenzista.com.br |
| Leonardo Tonon | 10426930 | 10426930@mackenzista.com.br |

## Estrutura do repositório

```
├── relatorio/
│   ├── Relatorio_Projeto_N1.docx   # Relatório do Projeto (entrega N1)
│   └── Relatorio_Projeto_N1.pdf    # mesma versão, em PDF (visualização rápida no GitHub)
├── dataset/
│   ├── demonstrativos_financeiros_varejo_br.csv       # dataset original
│   ├── demonstrativos_financeiros_varejo_br_prep.csv  # dataset após preparação/limpeza
│   ├── fontes.csv                                     # rastreabilidade de cada dado à sua fonte
│   ├── README.md                                      # descrição detalhada do dataset
│   └── fig_*.png                                      # gráficos gerados na análise exploratória
└── notebooks/
    ├── eda_prep.ipynb   # notebook de análise exploratória e preparação dos dados
    └── eda_prep.py      # versão script (.py) do mesmo conteúdo, para diff/versionamento
```

## Resumo do projeto

O projeto propõe um assistente baseado em LLM para apoiar a leitura e análise de risco financeiro de varejistas brasileiras a partir de documentos de RI e demonstrações financeiras, motivado pelo caso da fraude contábil da Americanas S.A. (2023). Nesta entrega (N1), o grupo construiu um dataset original com dados financeiros reais de 4 varejistas (Magazine Luiza, Americanas, Via/Grupo Casas Bahia e Lojas Renner), realizou a análise exploratória e a preparação dos dados em Python, e discutiu os aspectos éticos do uso de IA nessa aplicação. Detalhes completos no [Relatório do Projeto](relatorio/Relatorio_Projeto_N1.pdf).

## Como reproduzir a análise

```bash
pip install pandas numpy matplotlib jupyter
cd notebooks
jupyter nbconvert --to notebook --execute --inplace eda_prep.ipynb
```
