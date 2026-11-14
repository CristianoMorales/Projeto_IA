# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: treinar_modelos.py
# Sintese do conteudo: Treina e avalia, com scikit-learn, os modelos de
#   classificacao do risco financeiro (baixo/medio/alto) e de regressao do
#   resultado liquido sobre o dataset da CVM (dataset/cvm_dfp_empresas.csv),
#   com estudo de caso nas 4 varejistas da N1 e um experimento temporal
#   (dados de 2023 prevendo o risco de 2024). Grava figuras em ml/figuras/
#   e metricas em ml/resultados/.
#
#   Protocolo de avaliacao:
#   - As 4 varejistas do estudo de caso ficam FORA do treino (hold-out).
#   - Baselines explicitos: DummyClassifier (classe mais comum), DummyRegressor
#     (media) e, no experimento temporal, a persistencia (repetir o risco do
#     ano anterior).
#   - Metricas para classes desbalanceadas: acuracia balanceada e F1 macro,
#     com validacao cruzada de 5 folds repetida 5 vezes (media).
#   - Entradas do classificador: receita liquida e ativo total. A conta 2
#     ("passivo total") e igual ao ativo e foi retirada; o passivo exigivel
#     (conta 2 - PL) aparece so como diagnostico de vazamento de rotulo.
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#   - Ali Ahmad              | RA 10427712 | 10427712@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao do script de treinamento e
#               avaliacao dos modelos de classificacao e regressao, com
#               estudo de caso aplicado as 4 varejistas da N1.
#   2026-11-13 | Leonardo Tonon | Correcoes: varejistas fora do treino,
#               baselines, acuracia balanceada e F1 macro, retirada da
#               conta 2 (= ativo), diagnostico de vazamento, experimento
#               temporal 2023 -> 2024 e regressao com baseline.
#
# Uso: python ml/treinar_modelos.py
# =============================================================================
from __future__ import annotations

import json
import os
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, confusion_matrix,
                             f1_score, mean_absolute_error, median_absolute_error, r2_score,
                             recall_score)
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
CLASSES = ["baixo", "medio", "alto"]
ROTULOS = ["baixo", "médio", "alto"]  # para exibicao
COR = {"baixo": "#2E7D5B", "medio": "#C98A1B", "alto": "#B3412E"}

ML_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = ML_DIR.parent / "dataset" / "cvm_dfp_empresas.csv"
FIG_DIR = ML_DIR / "figuras"
RES_DIR = ML_DIR / "resultados"
TINTA, TINTA2, GRADE = "#1F2328", "#57606A", "#D0D7DE"


# --------------------------------------------------------------------------
# Rótulo e variáveis
# --------------------------------------------------------------------------
def rotulo_risco(df: pd.DataFrame) -> pd.Series:
    """Heurística do grupo (mantida da primeira versão da N2): alto se PL < 0;
    médio se prejuízo ou alavancagem (passivo total da CVM / PL) > 3; baixo
    nos demais casos. Como a conta 2 = ativo, essa alavancagem é ativo / PL."""
    pl = df["patrimonio_liquido"]
    alav = np.where(pl > 0, df["passivo_total"] / pl.where(pl > 0), np.nan)
    r = np.where(pl < 0, "alto",
                 np.where((df["resultado_liquido"] < 0) | (alav > 3), "medio", "baixo"))
    return pd.Series(r, index=df.index)


def slog(x) -> np.ndarray:
    """Log com sinal: comprime a escala (de empresas pequenas a bancos)."""
    x = np.asarray(x, dtype=float)
    return np.sign(x) * np.log10(1 + np.abs(x))


CONJUNTOS = {
    # nome: (colunas, descrição)
    "original_N2": (["receita_liquida", "ativo_total", "passivo_total"],
                    "receita, ativo e conta 2 (igual ao ativo: variável repetida)"),
    "corrigido": (["receita_liquida", "ativo_total"],
                  "receita e ativo (sem variável repetida, sem vazamento)"),
    "diagnostico_vazamento": (["receita_liquida", "ativo_total", "passivo_exigivel"],
                              "com passivo exigível: ativo − passivo = PL (vazamento)"),
}


def X_de(df: pd.DataFrame, cols: list[str]) -> np.ndarray:
    return np.column_stack([slog(df[c]) for c in cols])


def modelos_clf():
    return {
        "Baseline (classe mais comum)": DummyClassifier(strategy="most_frequent"),
        "Regressão Logística": make_pipeline(
            StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=2000)),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, class_weight="balanced", random_state=SEED, n_jobs=-1),
    }


def metricas(y, p) -> dict:
    rec = recall_score(y, p, labels=CLASSES, average=None, zero_division=0)
    return {
        "acuracia": round(accuracy_score(y, p), 4),
        "acuracia_balanceada": round(balanced_accuracy_score(y, p), 4),
        "f1_macro": round(f1_score(y, p, labels=CLASSES, average="macro", zero_division=0), 4),
        "recall_por_classe": {c: round(float(v), 4) for c, v in zip(CLASSES, rec)},
    }


REPETICOES = 5  # validacao cruzada repetida com 5 embaralhamentos diferentes


def media_metricas(lista: list[dict]) -> dict:
    """Media das metricas de varias repeticoes (+ desvio-padrao da acuracia
    balanceada), para que o resultado nao dependa de um unico sorteio dos folds."""
    m = {k: round(float(np.mean([d[k] for d in lista])), 4)
         for k in ("acuracia", "acuracia_balanceada", "f1_macro")}
    m["acuracia_balanceada_dp"] = round(float(np.std([d["acuracia_balanceada"] for d in lista])), 4)
    m["recall_por_classe"] = {c: round(float(np.mean([d["recall_por_classe"][c] for d in lista])), 4)
                              for c in CLASSES}
    return m


def avaliar_cv(X, y, modelos) -> tuple[dict, dict]:
    """5-fold estratificado, repetido REPETICOES vezes. Retorna as metricas
    medias e as predicoes out-of-fold da primeira repeticao (para as matrizes)."""
    res, preds = {}, {}
    for nome, m in modelos.items():
        lista = []
        for r in range(REPETICOES):
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED + r)
            p = cross_val_predict(m, X, y, cv=cv)
            lista.append(metricas(y, p))
            if r == 0:
                preds[nome] = p
        res[nome] = media_metricas(lista)
    return res, preds


# --------------------------------------------------------------------------
# Gráficos
# --------------------------------------------------------------------------
def estilo(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(GRADE)
    ax.tick_params(colors=TINTA2, labelsize=9)


def fig_matriz(y, p, caminho, titulo):
    cm = confusion_matrix(y, p, labels=CLASSES)
    fig, ax = plt.subplots(figsize=(5.2, 4.4), dpi=150)
    ax.imshow(cm, cmap="Blues")
    for i in range(3):
        for j in range(3):
            v = cm[i, j]
            ax.text(j, i, str(v), ha="center", va="center", fontsize=12,
                    color="white" if v > cm.max() * 0.55 else TINTA)
    ax.set_xticks(range(3), ROTULOS)
    ax.set_yticks(range(3), ROTULOS)
    ax.set_xlabel("Previsto", color=TINTA2)
    ax.set_ylabel("Real", color=TINTA2)
    ax.set_title(titulo, fontsize=10, color=TINTA, loc="left")
    ax.tick_params(colors=TINTA2)
    fig.tight_layout()
    fig.savefig(caminho)
    plt.close(fig)


def fig_comparacao(blocos: dict[str, dict], caminho, titulo):
    """Barras horizontais de acurácia balanceada; baseline em cinza."""
    linhas = []
    for bloco, res in blocos.items():
        for modelo, m in res.items():
            linhas.append((f"{bloco} · {modelo}", m["acuracia_balanceada"], modelo))
    fig, ax = plt.subplots(figsize=(8, 0.42 * len(linhas) + 1.2), dpi=150)
    ys = np.arange(len(linhas))[::-1]
    for y, (rot, v, modelo) in zip(ys, linhas):
        cor = "#8C959F" if modelo.startswith("Baseline") or modelo.startswith("Persist") else "#2F6FB0"
        ax.barh(y, v, height=0.62, color=cor)
        ax.text(v + 0.01, y, f"{v:.1%}", va="center", fontsize=8.5, color=TINTA)
    ax.set_yticks(ys, [l[0] for l in linhas], fontsize=8.5)
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
    ax.set_title(titulo, fontsize=10, color=TINTA, loc="left")
    estilo(ax)
    fig.tight_layout()
    fig.savefig(caminho)
    plt.close(fig)


def fig_distribuicao(y: pd.Series, caminho, titulo):
    cont = y.value_counts().reindex(CLASSES).fillna(0).astype(int)
    fig, ax = plt.subplots(figsize=(5.5, 3.4), dpi=150)
    ax.bar(ROTULOS, cont.values, color=[COR[c] for c in CLASSES], width=0.6)
    for i, v in enumerate(cont.values):
        ax.text(i, v, f"{v} ({v / cont.sum():.0%})", ha="center", va="bottom", fontsize=9, color=TINTA)
    ax.set_ylim(0, cont.max() * 1.15)
    ax.set_ylabel("Empresas", color=TINTA2)
    ax.set_title(titulo, fontsize=10, color=TINTA, loc="left")
    estilo(ax)
    fig.tight_layout()
    fig.savefig(caminho)
    plt.close(fig)


# --------------------------------------------------------------------------
# Principal
# --------------------------------------------------------------------------
def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    RES_DIR.mkdir(parents=True, exist_ok=True)
    out = FIG_DIR

    df = pd.read_csv(DATASET_PATH)
    df["risco"] = rotulo_risco(df)
    # o rotulo recalculado tem de ser identico ao gravado no dataset
    assert (df["risco"] == df["risco_financeiro"]).all(), "rotulo divergente do dataset"
    resultado: dict = {}

    # ===================== A) Classificação — 2023 =====================
    d23 = df[df["ano"] == 2023].copy()
    vare = d23["varejista"].notna()
    treino = d23[~vare]
    teste_var = d23[vare]
    y = treino["risco"].values
    dist = d23["risco"].value_counts().reindex(CLASSES).fillna(0).astype(int).to_dict()
    resultado["dataset_2023"] = {
        "empresas": int(len(d23)), "treino_sem_varejistas": int(len(treino)),
        "distribuicao_risco": dist,
        "classe_mais_comum": max(dist, key=dist.get),
        "acuracia_chute_classe_mais_comum": round(max(dist.values()) / sum(dist.values()), 4),
        "conta2_igual_ativo_pct": round(float(((d23["passivo_total"] - d23["ativo_total"]).abs() <= 0.1).mean()), 4),
    }
    fig_distribuicao(d23["risco"], out / "distribuicao_risco.png",
                     f"Distribuição do risco — DFP 2023 ({len(d23)} empresas)")

    blocos_A, preds_A = {}, {}
    for nome, (cols, desc) in CONJUNTOS.items():
        res, preds = avaliar_cv(X_de(treino, cols), y, modelos_clf())
        blocos_A[nome] = res
        preds_A[nome] = preds
    resultado["A_classificacao_cv5"] = {
        nome: {"variaveis": CONJUNTOS[nome][1], "modelos": blocos_A[nome]} for nome in CONJUNTOS}

    # Importância das variáveis (RF) — mostra o efeito da variável repetida
    imp = {}
    for nome in ("original_N2", "corrigido"):
        cols = CONJUNTOS[nome][0]
        rf = RandomForestClassifier(n_estimators=300, class_weight="balanced",
                                    random_state=SEED, n_jobs=-1).fit(X_de(treino, cols), y)
        imp[nome] = {c: round(float(v), 4) for c, v in zip(cols, rf.feature_importances_)}
    resultado["importancia_rf"] = imp

    # Subconjunto sem instituições financeiras (viés setorial, Seção 3.3)
    nf = treino[~treino["financeira"].fillna(False).astype(bool)]
    if len(nf) >= 50 and nf["risco"].nunique() == 3:
        res_nf, _ = avaliar_cv(X_de(nf, CONJUNTOS["corrigido"][0]), nf["risco"].values, modelos_clf())
        resultado["A_sem_financeiras_cv5"] = {"empresas": int(len(nf)), "modelos": res_nf}

    fig_matriz(y, preds_A["corrigido"]["Random Forest"], out / "confusao_random_forest.png",
               "Random Forest — receita e ativo (5-fold CV, sem varejistas)")
    fig_matriz(y, preds_A["corrigido"]["Regressão Logística"], out / "confusao_regressao_logistica.png",
               "Regressão Logística balanceada — receita e ativo (5-fold CV)")

    # Estudo de caso: varejistas FORA do treino x protocolo antigo (dentro do treino)
    cols = CONJUNTOS["corrigido"][0]
    rf_fora = RandomForestClassifier(n_estimators=300, class_weight="balanced",
                                     random_state=SEED, n_jobs=-1).fit(X_de(treino, cols), y)
    cols_old = CONJUNTOS["original_N2"][0]
    rf_dentro = RandomForestClassifier(n_estimators=300, class_weight="balanced",
                                       random_state=SEED, n_jobs=-1).fit(X_de(d23, cols_old), d23["risco"])
    tab = teste_var[["varejista", "receita_liquida", "resultado_liquido", "patrimonio_liquido",
                     "ativo_total", "passivo_exigivel", "risco"]].copy()
    tab = tab.rename(columns={"risco": "risco_real"})
    tab["previsto_fora_do_treino"] = rf_fora.predict(X_de(teste_var, cols))
    tab["previsto_dentro_do_treino_protocolo_antigo"] = rf_dentro.predict(X_de(teste_var, cols_old))
    tab.to_csv(RES_DIR / "varejistas_2023.csv", index=False)
    resultado["estudo_de_caso_2023"] = {
        "acertos_fora_do_treino": int((tab["previsto_fora_do_treino"] == tab["risco_real"]).sum()),
        "acertos_dentro_do_treino": int((tab["previsto_dentro_do_treino_protocolo_antigo"] == tab["risco_real"]).sum()),
        "n": int(len(tab)),
        "tabela": tab.round(1).to_dict(orient="records"),
    }

    # ===================== B) Temporal — 2023 -> risco 2024 =====================
    d24 = df[df["ano"] == 2024][["CNPJ_CIA", "risco"]].rename(columns={"risco": "risco_2024"})
    t = d23.merge(d24, on="CNPJ_CIA", how="inner")
    if len(t) >= 50:
        rec = t["receita_liquida"].where(t["receita_liquida"] > 0)
        feats = pd.DataFrame({
            "receita": slog(t["receita_liquida"]),
            "ativo": slog(t["ativo_total"]),
            "margem": (t["resultado_liquido"] / rec).clip(-1, 1).fillna(-1),
            "pl_sobre_ativo": (t["patrimonio_liquido"] / t["ativo_total"]).clip(-1, 1),
            "prejuizo": (t["resultado_liquido"] < 0).astype(int),
        })
        vt = t["varejista"].notna().values
        Xt, yt = feats.values[~vt], t["risco_2024"].values[~vt]
        res_t, preds_t = avaliar_cv(Xt, yt, modelos_clf())
        pers = metricas(yt, t["risco"].values[~vt])
        pers["acuracia_balanceada_dp"] = 0.0
        res_t["Persistência (repete o risco de 2023)"] = pers
        rf_t = RandomForestClassifier(n_estimators=300, class_weight="balanced",
                                      random_state=SEED, n_jobs=-1).fit(Xt, yt)
        tv = t[vt][["varejista", "risco", "risco_2024"]].rename(
            columns={"risco": "risco_2023", "risco_2024": "risco_real_2024"})
        tv["previsto_2024_fora_do_treino"] = rf_t.predict(feats.values[vt])
        tv.to_csv(RES_DIR / "varejistas_temporal_2024.csv", index=False)
        resultado["B_temporal_2023_para_2024"] = {
            "empresas_nos_dois_anos": int(len(t)), "treino_sem_varejistas": int((~vt).sum()),
            "variaveis": list(feats.columns),
            "mudaram_de_classe_pct": round(float((t["risco"] != t["risco_2024"]).mean()), 4),
            "modelos": res_t,
            "varejistas": tv.to_dict(orient="records"),
        }
        fig_matriz(yt, preds_t["Random Forest"], out / "confusao_random_forest_temporal.png",
                   "Random Forest — dados de 2023 prevendo o risco de 2024 (5-fold CV)")
        blocos_fig = {"2023 (receita, ativo)": blocos_A["corrigido"],
                      "2023→2024": res_t}
    else:
        blocos_fig = {"2023 (receita, ativo)": blocos_A["corrigido"]}

    fig_comparacao(blocos_fig, out / "comparacao_modelos.png",
                   "Acurácia balanceada (5-fold CV, média de 5 repetições) — cinza = baselines")

    # ===================== C) Regressão do resultado líquido (2023) =====================
    Xr = treino[["receita_liquida", "ativo_total"]].values
    yr = treino["resultado_liquido"].values
    reg = {
        "Baseline (média)": DummyRegressor(strategy="mean"),
        "Regressão Linear": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=300, random_state=SEED, n_jobs=-1),
    }
    res_r = {}
    for nome, m in reg.items():
        r2s, maes, meds = [], [], []
        for r in range(REPETICOES):
            kf = KFold(n_splits=5, shuffle=True, random_state=SEED + r)
            p = cross_val_predict(m, Xr, yr, cv=kf)
            r2s.append(r2_score(yr, p)); maes.append(mean_absolute_error(yr, p))
            meds.append(median_absolute_error(yr, p))
        res_r[nome] = {"r2": round(float(np.mean(r2s)), 4),
                       "r2_min": round(float(np.min(r2s)), 4), "r2_max": round(float(np.max(r2s)), 4),
                       "mae_milhoes": round(float(np.mean(maes)), 1),
                       "mediana_erro_abs_milhoes": round(float(np.mean(meds)), 1)}
    resultado["C_regressao_resultado_cv5"] = {
        "variaveis": ["receita_liquida", "ativo_total"], "modelos": res_r,
        "mediana_abs_resultado_milhoes": round(float(np.median(np.abs(yr))), 1)}

    (RES_DIR / "metricas.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")

    # ===================== Resumo no terminal =====================
    r = resultado
    print(f"\nEmpresas 2023: {r['dataset_2023']['empresas']}  |  distribuição: {r['dataset_2023']['distribuicao_risco']}")
    print(f"Chute 'sempre {r['dataset_2023']['classe_mais_comum']}': {r['dataset_2023']['acuracia_chute_classe_mais_comum']:.1%}")
    print(f"Conta 2 = ativo em {r['dataset_2023']['conta2_igual_ativo_pct']:.1%} das empresas")
    for nome, bloco in r["A_classificacao_cv5"].items():
        print(f"\n[A] {nome}: {bloco['variaveis']}")
        for mod, m in bloco["modelos"].items():
            print(f"   {mod:32s} acc {m['acuracia']:.1%}  bal {m['acuracia_balanceada']:.1%} (dp {m['acuracia_balanceada_dp']:.1%})  F1m {m['f1_macro']:.3f}  recall {m['recall_por_classe']}")
    print(f"\nImportâncias RF: {r['importancia_rf']}")
    if "A_sem_financeiras_cv5" in r:
        print(f"\n[A] sem financeiras ({r['A_sem_financeiras_cv5']['empresas']} empresas):")
        for mod, m in r["A_sem_financeiras_cv5"]["modelos"].items():
            print(f"   {mod:32s} acc {m['acuracia']:.1%}  bal {m['acuracia_balanceada']:.1%}  F1m {m['f1_macro']:.3f}")
    e = r["estudo_de_caso_2023"]
    print(f"\nVarejistas 2023: {e['acertos_fora_do_treino']}/{e['n']} fora do treino  x  {e['acertos_dentro_do_treino']}/{e['n']} dentro do treino (protocolo antigo)")
    print(pd.DataFrame(e["tabela"])[["varejista", "risco_real", "previsto_fora_do_treino",
                                     "previsto_dentro_do_treino_protocolo_antigo"]].to_string(index=False))
    if "B_temporal_2023_para_2024" in r:
        b = r["B_temporal_2023_para_2024"]
        print(f"\n[B] 2023 -> 2024: {b['empresas_nos_dois_anos']} empresas; {b['mudaram_de_classe_pct']:.1%} mudaram de classe")
        for mod, m in b["modelos"].items():
            print(f"   {mod:40s} acc {m['acuracia']:.1%}  bal {m['acuracia_balanceada']:.1%} (dp {m['acuracia_balanceada_dp']:.1%})  F1m {m['f1_macro']:.3f}  recall alto {m['recall_por_classe']['alto']:.1%}")
        print(pd.DataFrame(b["varejistas"]).to_string(index=False))
    print("\n[C] Regressão do resultado líquido:")
    for mod, m in r["C_regressao_resultado_cv5"]["modelos"].items():
        print(f"   {mod:26s} R² {m['r2']:.3f} [{m['r2_min']:.2f}; {m['r2_max']:.2f}]  MAE {m['mae_milhoes']:,.1f}  mediana do erro {m['mediana_erro_abs_milhoes']:,.1f}")
    print(f"\nFiguras em {FIG_DIR}/ e metricas em {RES_DIR}/")


if __name__ == "__main__":
    main()
