# Sentinela de Risco — Classificação de Risco Financeiro de Empresas Brasileiras com Machine Learning

Projeto da disciplina **Inteligência Artificial – 7ºK SI Noite** (Prof. Dr. Leandro Zerbinatti), Universidade Presbiteriana Mackenzie.

**Opção do projeto:** Framework de Machine Learning (scikit-learn) — classificação e regressão sobre dados de negócio.

> **Nota sobre a evolução do projeto:** na entrega N1, o grupo havia optado pela "Opção API de LLM", propondo um assistente baseado em modelo de linguagem para análise de documentos de RI. Na N2, o grupo decidiu migrar para a **Opção Framework**, por indisponibilidade prática de uma API de LLM gratuita adequada ao prazo do projeto. O dataset original do varejo brasileiro (construído na N1) foi reaproveitado como **estudo de caso de validação**, e um dataset muito maior (474 empresas, dados abertos da CVM) foi construído para o treinamento dos modelos de Machine Learning. Essa mudança está documentada em detalhe na seção "Opção do projeto" do relatório.

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
│   ├── cvm_dfp_2023_empresas.csv                      # dataset principal da N2: 474 empresas (CVM DFP 2023)
│   ├── demonstrativos_financeiros_varejo_br.csv       # dataset original da N1 (4 varejistas, 2020-2024) — usado como estudo de caso
│   ├── demonstrativos_financeiros_varejo_br_prep.csv  # mesmo dataset, após preparação/limpeza (N1)
│   ├── fontes.csv                                     # rastreabilidade do dataset da N1
│   ├── README.md                                      # descrição detalhada de ambos os datasets
│   └── fig_*.png                                      # gráficos da análise exploratória da N1
├── notebooks/
│   ├── eda_prep.ipynb   # EDA e preparação dos dados do varejo (N1)
│   └── eda_prep.py      # versão script (.py) do mesmo conteúdo
└── ml/
    ├── build_dataset.py      # extrai e processa o dataset CVM DFP 2023 (474 empresas)
    ├── eda_cvm.py             # visualizações exploratórias do dataset CVM
    ├── treinar_modelos.py     # treina/avalia classificação e regressão (scikit-learn)
    ├── figuras/               # gráficos gerados (distribuição de risco, matrizes de confusão etc.)
    └── cvm_raw/               # dados brutos da CVM (NÃO versionado — ver abaixo)
```

## Resumo do projeto

O projeto usa Machine Learning (scikit-learn) para **classificar o risco financeiro** e **prever o resultado líquido** de companhias brasileiras de capital aberto a partir de indicadores extraídos de suas demonstrações financeiras (Receita Líquida, Ativo Total, Passivo Total), motivado pelo caso da fraude contábil da Americanas S.A. (2023). O dataset principal foi construído a partir dos **dados abertos da CVM** (Demonstrações Financeiras Padronizadas, DFP 2023), cobrindo 474 companhias. Como estudo de caso, os modelos treinados são aplicados às 4 varejistas analisadas desde a N1 (Magazine Luiza, Americanas, Via/Grupo Casas Bahia e Lojas Renner), cujo dataset histórico (2020–2024) também integra o repositório. Detalhes completos no [Relatório do Projeto](relatorio/Relatorio_Projeto_N2.pdf).

## Como reproduzir a análise

```bash
pip install pandas numpy matplotlib scikit-learn jupyter

# EDA e preparação do dataset do varejo (N1)
cd notebooks && jupyter nbconvert --to notebook --execute --inplace eda_prep.ipynb && cd ..

# Dataset CVM + modelos de ML (N2) — requer baixar os arquivos brutos da CVM
# (DFP 2023, formato consolidado: DRE, BPP, BPA) em https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp
# e colocá-los em ml/cvm_raw/ (não versionados por serem dados públicos volumosos)
cd ml
python build_dataset.py       # gera dataset/cvm_dfp_2023_empresas.csv
python eda_cvm.py             # gera os gráficos exploratórios
python treinar_modelos.py     # treina e avalia os modelos de classificação/regressão
```
