# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: eda_cvm.py
# Sintese do conteudo: Analise exploratoria complementar (N2) do dataset
#   dataset/cvm_dfp_2023_empresas.csv (454 empresas, CVM DFP 2023): gera
#   visualizacoes da distribuicao de risco financeiro, da relacao entre
#   tamanho do ativo e resultado liquido (destacando as 4 varejistas do
#   estudo de caso) e da alavancagem por categoria de risco.
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#   - Ali Ahmad              | RA 10427712 | 10427712@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao das visualizacoes de apoio ao
#               relatorio da N2 (dataset CVM ampliado).
#   2026-11-14 | Cristiano Morales | Dataset corrigido (ver ml/build_dataset.py,
#               correcao do bug passivo_total==ativo_total): 474 -> 454
#               empresas. Como este script le os totais/contagens direto do
#               CSV (nao usa valores fixos), as figuras ja refletem os novos
#               numeros automaticamente; so o rotulo do eixo da alavancagem
#               foi ajustado para "passivo exigivel total".
# =============================================================================

import os
import re

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ML_DIR = os.path.dirname(__file__)
PROJ_DIR = os.path.dirname(ML_DIR)
DATASET_PATH = os.path.join(PROJ_DIR, "dataset", "cvm_dfp_2023_empresas.csv")
FIG_DIR = os.path.join(ML_DIR, "figuras")
os.makedirs(FIG_DIR, exist_ok=True)

CORES_RISCO = {"baixo": "#2e7d32", "medio": "#f9a825", "alto": "#c62828"}
EMPRESAS_VAREJO = ["AMERICANAS", "MAGAZINE LUIZA", "VIA S.A", "VIA VAREJO", "CASAS BAHIA", "LOJAS RENNER"]


def main():
    df = pd.read_csv(DATASET_PATH)

    # 1) Distribuicao das categorias de risco
    fig, ax = plt.subplots(figsize=(7.5, 4.3))
    contagem = df["risco_financeiro"].value_counts().reindex(["baixo", "medio", "alto"])
    ax.bar(contagem.index, contagem.values, color=[CORES_RISCO[c] for c in contagem.index])
    for i, v in enumerate(contagem.values):
        ax.text(i, v + 5, str(v), ha="center")
    ax.set_title(f"Distribuição de risco financeiro — {len(df)} companhias abertas (CVM DFP 2023)", fontsize=12)
    ax.set_ylabel("Número de empresas")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "distribuicao_risco.png"), dpi=140)
    plt.close(fig)

    # 2) Dispersao: ativo total (log) x resultado liquido, colorido por risco,
    #    destacando as 4 varejistas do estudo de caso (painel completo +
    #    painel com zoom na regiao onde as varejistas estao concentradas,
    #    ja que bancos muito maiores dominam a escala do grafico completo)
    padrao = "|".join(re.escape(a) for a in EMPRESAS_VAREJO)
    varejo = df[df["DENOM_CIA"].str.contains(padrao, case=False, na=False)].copy()
    varejo["log_ativo"] = np.log10(varejo["ativo_total"].clip(lower=1))
    df["log_ativo"] = np.log10(df["ativo_total"].clip(lower=1))

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    for categoria, cor in CORES_RISCO.items():
        sub = df[df["risco_financeiro"] == categoria]
        for ax in (ax1, ax2):
            ax.scatter(sub["log_ativo"], sub["resultado_liquido"], s=18, alpha=0.55,
                       color=cor, label=f"risco {categoria}")
    for ax in (ax1, ax2):
        ax.scatter(varejo["log_ativo"], varejo["resultado_liquido"], s=140,
                   facecolors="none", edgecolors="black", linewidths=1.8,
                   label="varejistas (estudo de caso)")
        ax.axhline(0, color="gray", linewidth=0.8, linestyle="--")

    ax1.set_xlabel("log10(ativo total, R$ milhões)")
    ax1.set_ylabel("Resultado líquido (R$ milhões)")
    ax1.set_title(f"Todas as {len(df)} empresas")
    ax1.legend(fontsize=7, loc="upper left")

    margem = 0.35
    ax2.set_xlim(varejo["log_ativo"].min() - margem, varejo["log_ativo"].max() + margem)
    ax2.set_ylim(varejo["resultado_liquido"].min() * 1.6, varejo["resultado_liquido"].max() * 1.8 + 500)
    nomes_curtos = {
        "AMERICANAS S.A. - EM RECUPERAÇÃO JUDICIAL": "Americanas",
        "GRUPO CASAS BAHIA S.A.": "Casas Bahia",
        "LOJAS RENNER S.A.": "Lojas Renner",
        "MAGAZINE LUIZA S.A.": "Magazine Luiza",
    }
    offsets = {"Americanas": (8, -14), "Casas Bahia": (8, 10), "Lojas Renner": (-10, 10), "Magazine Luiza": (8, -4)}
    for _, linha in varejo.iterrows():
        nome = nomes_curtos.get(linha["DENOM_CIA"], linha["DENOM_CIA"].title())
        dx, dy = offsets.get(nome, (8, 6))
        ax2.annotate(nome, (linha["log_ativo"], linha["resultado_liquido"]),
                     textcoords="offset points", xytext=(dx, dy), fontsize=8.5)
    ax2.set_xlabel("log10(ativo total, R$ milhões)")
    ax2.set_title("Zoom: as 4 varejistas do estudo de caso")

    fig.suptitle("Ativo total x Resultado líquido, por categoria de risco")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "dispersao_ativo_resultado.png"), dpi=140)
    plt.close(fig)

    # 3) Alavancagem por categoria de risco (boxplot)
    fig, ax = plt.subplots(figsize=(6, 4))
    dados = [
        df.loc[(df["risco_financeiro"] == c) & df["alavancagem"].notna(), "alavancagem"].clip(upper=20)
        for c in ["baixo", "medio", "alto"]
    ]
    bp = ax.boxplot(dados, tick_labels=["baixo", "medio", "alto"], patch_artist=True)
    for patch, cor in zip(bp["boxes"], CORES_RISCO.values()):
        patch.set_facecolor(cor)
        patch.set_alpha(0.5)
    if len(dados[2]) == 0:
        ax.text(3, ax.get_ylim()[1] * 0.5, "N/A\n(patrimônio líquido\nnegativo)",
                ha="center", va="center", fontsize=8.5, color="#c62828")
    ax.set_ylabel("Alavancagem (passivo exigível total / PL), truncada em 20x")
    ax.set_title("Alavancagem por categoria de risco")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "alavancagem_por_risco.png"), dpi=140)
    plt.close(fig)

    print("Figuras geradas em:", FIG_DIR)
    for f in sorted(os.listdir(FIG_DIR)):
        print(" -", f)


if __name__ == "__main__":
    main()
