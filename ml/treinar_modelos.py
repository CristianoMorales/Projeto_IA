# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: treinar_modelos.py
# Sintese do conteudo: Treina e avalia os modelos de Machine Learning da N2
#   (Opcao Framework) sobre o dataset dataset/cvm_dfp_2023_empresas.csv
#   (454 companhias de capital aberto brasileiras, CVM DFP 2023):
#
#   1) CLASSIFICACAO: prediz o risco financeiro (baixo/medio/alto) de uma
#      empresa usando APENAS variaveis de "tamanho"/estrutura do balanco
#      (receita liquida, ativo total, passivo circulante) - deliberadamente
#      SEM usar patrimonio liquido, resultado liquido, margem ou alavancagem
#      como features, ja que essas sao usadas para CONSTRUIR o rotulo de
#      risco (ver ml/build_dataset.py); usar essas variaveis tornaria a
#      tarefa trivial/circular. Modelos: Regressao Logistica (baseline) e
#      Random Forest (nao-linear). A acuracia bruta e reportada junto com a
#      acuracia balanceada, o F1-macro e o baseline trivial de sempre prever
#      a classe majoritaria - metricas mais honestas para um problema de 3
#      classes desbalanceadas (ver correcao de 14/11/2026 abaixo).
#
#   2) REGRESSAO: prediz o resultado liquido (lucro/prejuizo) a partir das
#      mesmas variaveis. Modelos: Regressao Linear (baseline) e Random
#      Forest Regressor.
#
#   3) ESTUDO DE CASO: os modelos sao RETREINADOS excluindo as 4 varejistas
#      da N1 do conjunto de treino, e so entao aplicados a elas - garantindo
#      um teste de generalizacao de verdade (holdout real), nao uma
#      "validacao" nas mesmas empresas vistas no treino.
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
#   2026-11-14 | Cristiano Morales | Correcao de 3 problemas metodologicos
#               apontados em revisao interna do grupo: (1) a feature
#               "passivo_total" (CD_CONTA "2" da CVM) e, por construcao
#               contabil, sempre igual a "ativo_total" (o "Passivo Total" da
#               CVM ja inclui o Patrimonio Liquido) - trocada por
#               "passivo_circulante", que nao e redutivel algebricamente ao
#               patrimonio liquido junto com o ativo; (2) o estudo de caso
#               testava as 4 varejistas usando um modelo que foi TREINADO
#               com elas incluidas (vazamento treino/teste) - corrigido para
#               um holdout real (modelo re-treinado sem essas 4 empresas);
#               (3) a acuracia bruta (47,7%) e, na verdade, PIOR que o
#               baseline trivial de sempre prever a classe majoritaria
#               (~52%) - isso agora e reportado explicitamente, junto com
#               acuracia balanceada e F1-macro, em vez de ser omitido.
# =============================================================================

import os
import re

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ML_DIR = os.path.dirname(__file__)
PROJ_DIR = os.path.dirname(ML_DIR)
DATASET_PATH = os.path.join(PROJ_DIR, "dataset", "cvm_dfp_2023_empresas.csv")
FIG_DIR = os.path.join(ML_DIR, "figuras")
os.makedirs(FIG_DIR, exist_ok=True)

# Features deliberadamente independentes do rotulo (ver cabecalho). Note que
# "passivo_circulante" sozinho NAO permite reconstruir o patrimonio liquido
# a partir do ativo_total (faltaria o passivo nao circulante), diferente do
# que acontecia com a antiga "passivo_total".
FEATURES = ["receita_liquida", "ativo_total", "passivo_circulante"]
SEED = 42

EMPRESAS_VAREJO = ["AMERICANAS", "MAGAZINE LUIZA", "VIA S.A", "VIA VAREJO", "CASAS BAHIA", "LOJAS RENNER"]


def carregar_dataset():
    df = pd.read_csv(DATASET_PATH)
    df = df.dropna(subset=FEATURES + ["risco_financeiro", "resultado_liquido"])
    return df


def rodar_classificacao(df):
    print("\n" + "=" * 70)
    print("CLASSIFICACAO: risco_financeiro (baixo / medio / alto)")
    print("Features usadas (deliberadamente SEM patrimonio/resultado/margem):")
    print(" ", FEATURES)
    print("Avaliacao por validacao cruzada estratificada (5 folds).")
    print("=" * 70)

    X = df[FEATURES].values
    y = df["risco_financeiro"].values
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    contagem = pd.Series(y).value_counts()
    baseline_majoritario = contagem.max() / len(y)
    print(f"\nBaseline trivial (sempre prever a classe majoritaria, '{contagem.idxmax()}'): "
          f"{baseline_majoritario:.1%} de acuracia")
    print(f"Baseline aleatorio (3 classes, uniforme): {1/3:.1%}")

    modelos = {
        "Regressao Logistica": make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=2000, random_state=SEED, class_weight="balanced"),
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, random_state=SEED, class_weight="balanced"
        ),
    }

    resultados = {}
    for nome, modelo in modelos.items():
        y_pred = cross_val_predict(modelo, X, y, cv=cv)
        acc = accuracy_score(y, y_pred)
        bal_acc = balanced_accuracy_score(y, y_pred)
        f1_macro = f1_score(y, y_pred, average="macro", zero_division=0)
        print(f"\n--- {nome} (predicoes out-of-fold, 5-fold CV) ---")
        print(f"Acuracia bruta:      {acc:.1%}  "
              f"{'(ABAIXO do baseline majoritario!)' if acc < baseline_majoritario else ''}")
        print(f"Acuracia balanceada: {bal_acc:.1%}  (media do recall por classe)")
        print(f"F1-macro:            {f1_macro:.3f}")
        print(classification_report(y, y_pred, zero_division=0))

        modelo.fit(X, y)  # versao final, treinada no dataset inteiro (uso geral/producao)
        resultados[nome] = {
            "modelo": modelo, "acc": acc, "bal_acc": bal_acc, "f1_macro": f1_macro, "y_pred_cv": y_pred,
        }

        cm = confusion_matrix(y, y_pred, labels=["baixo", "medio", "alto"])
        disp = ConfusionMatrixDisplay(cm, display_labels=["baixo", "medio", "alto"])
        disp.plot(cmap="Blues", values_format="d")
        disp.ax_.set_title(f"Matriz de Confusao (5-fold CV) - {nome}")
        caminho_fig = os.path.join(FIG_DIR, f"confusao_{nome.lower().replace(' ', '_')}.png")
        disp.figure_.savefig(caminho_fig, dpi=140, bbox_inches="tight")
        print(f"Matriz de confusao salva em: {caminho_fig}")

    rf = resultados["Random Forest"]["modelo"]
    importancias = pd.Series(rf.feature_importances_, index=FEATURES).sort_values(ascending=False)
    print("\nImportancia das variaveis (Random Forest, modelo final):")
    print(importancias.to_string())

    return resultados, baseline_majoritario


def rodar_regressao(df):
    print("\n" + "=" * 70)
    print("REGRESSAO: resultado_liquido (R$ milhoes)")
    print("Features usadas:", FEATURES)
    print("Avaliacao por validacao cruzada (5-fold), predicoes out-of-fold.")
    print("=" * 70)

    X = df[FEATURES].values
    y = df["resultado_liquido"].values
    cv = KFold(n_splits=5, shuffle=True, random_state=SEED)

    modelos = {
        "Regressao Linear": make_pipeline(StandardScaler(), LinearRegression()),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=300, random_state=SEED),
    }

    for nome, modelo in modelos.items():
        y_pred = cross_val_predict(modelo, X, y, cv=cv)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        print(f"\n--- {nome} (5-fold CV) ---")
        print(f"MAE  (erro medio absoluto): R$ {mae:,.1f} milhoes")
        print(f"R^2  (variancia explicada): {r2:.3f}")


def estudo_de_caso(df):
    print("\n" + "=" * 70)
    print("ESTUDO DE CASO: as 4 varejistas analisadas desde a N1")
    print("HOLDOUT REAL: o modelo abaixo e treinado SEM essas 4 empresas,")
    print("e so depois aplicado a elas (nao e a mesma 'versao final' usada acima).")
    print("=" * 70)

    padrao = "|".join(re.escape(a) for a in EMPRESAS_VAREJO)
    e_varejo_do_caso = df["DENOM_CIA"].str.contains(padrao, case=False, na=False)
    casos = df[e_varejo_do_caso].copy()
    df_treino_holdout = df[~e_varejo_do_caso]

    modelo_holdout = RandomForestClassifier(n_estimators=300, random_state=SEED, class_weight="balanced")
    modelo_holdout.fit(df_treino_holdout[FEATURES].values, df_treino_holdout["risco_financeiro"].values)

    casos["risco_previsto_rf"] = modelo_holdout.predict(casos[FEATURES].values)

    cols = ["DENOM_CIA", "risco_financeiro", "risco_previsto_rf"]
    print(casos[cols].to_string(index=False))

    acertos = (casos["risco_financeiro"] == casos["risco_previsto_rf"]).sum()
    print(f"\nO modelo (Random Forest, treinado em {len(df_treino_holdout)} empresas SEM "
          f"as 4 varejistas) acertou {acertos} de {len(casos)} classificacoes de risco "
          f"das 4 varejistas, usando so receita/ativo/passivo circulante.")


def main():
    df = carregar_dataset()
    print(f"Dataset carregado: {len(df)} empresas (apos remover linhas incompletas)")

    rodar_classificacao(df)
    rodar_regressao(df)
    estudo_de_caso(df)


if __name__ == "__main__":
    main()
