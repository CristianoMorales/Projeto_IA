# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: treinar_modelos.py
# Sintese do conteudo: Treina e avalia os modelos de Machine Learning da N2
#   (Opcao Framework) sobre o dataset dataset/cvm_dfp_2023_empresas.csv
#   (474 companhias de capital aberto brasileiras, CVM DFP 2023):
#
#   1) CLASSIFICACAO: prediz o risco financeiro (baixo/medio/alto) de uma
#      empresa usando APENAS variaveis de "tamanho" do balanco (receita
#      liquida, ativo total, passivo total) - deliberadamente SEM usar
#      patrimonio liquido, resultado liquido, margem ou alavancagem como
#      features, ja que essas sao usadas para CONSTRUIR o rotulo de risco
#      (ver ml/build_dataset.py); usar essas variaveis como entrada tornaria
#      a tarefa trivial/circular. Modelos: Regressao Logistica (baseline) e
#      Random Forest (nao-linear).
#
#   2) REGRESSAO: prediz o resultado liquido (lucro/prejuizo) a partir das
#      mesmas variaveis de tamanho do balanco. Modelos: Regressao Linear
#      (baseline) e Random Forest Regressor.
#
#   Os modelos de classificacao treinados sao aplicados, como estudo de
#   caso, as 4 varejistas analisadas desde a N1 (Americanas, Magazine
#   Luiza, Via/Grupo Casas Bahia, Lojas Renner), comparando a predicao do
#   modelo com o risco real conhecido de cada uma (ex.: Americanas em
#   recuperacao judicial = risco alto esperado).
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
    classification_report,
    confusion_matrix,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import StratifiedKFold, KFold, cross_val_predict, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ML_DIR = os.path.dirname(__file__)
PROJ_DIR = os.path.dirname(ML_DIR)
DATASET_PATH = os.path.join(PROJ_DIR, "dataset", "cvm_dfp_2023_empresas.csv")
FIG_DIR = os.path.join(ML_DIR, "figuras")
os.makedirs(FIG_DIR, exist_ok=True)

FEATURES = ["receita_liquida", "ativo_total", "passivo_total"]
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
    print("Avaliacao por validacao cruzada estratificada (5 folds), para dar")
    print("uma estimativa mais estavel do desempenho do que um unico split")
    print("(a classe 'alto' tem so 42 de 474 empresas).")
    print("=" * 70)

    X = df[FEATURES].values
    y = df["risco_financeiro"].values
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

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
        print(f"\n--- {nome} (predicoes out-of-fold, 5-fold CV) ---")
        print(f"Acuracia (5-fold CV): {acc:.3f}")
        print(classification_report(y, y_pred, zero_division=0))

        # treina a versao final no dataset inteiro, para uso no estudo de caso
        modelo_final = modelo
        modelo_final.fit(X, y)
        resultados[nome] = {"modelo": modelo_final, "acc_cv": acc, "y_pred_cv": y_pred}

        cm = confusion_matrix(y, y_pred, labels=["baixo", "medio", "alto"])
        disp = ConfusionMatrixDisplay(cm, display_labels=["baixo", "medio", "alto"])
        disp.plot(cmap="Blues", values_format="d")
        disp.ax_.set_title(f"Matriz de Confusao (5-fold CV) - {nome}")
        caminho_fig = os.path.join(FIG_DIR, f"confusao_{nome.lower().replace(' ', '_')}.png")
        disp.figure_.savefig(caminho_fig, dpi=140, bbox_inches="tight")
        print(f"Matriz de confusao salva em: {caminho_fig}")

    # Importancia das variaveis (Random Forest, modelo final treinado no dataset inteiro)
    rf = resultados["Random Forest"]["modelo"]
    importancias = pd.Series(rf.feature_importances_, index=FEATURES).sort_values(ascending=False)
    print("\nImportancia das variaveis (Random Forest):")
    print(importancias.to_string())

    return resultados


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


def estudo_de_caso(df, resultados):
    print("\n" + "=" * 70)
    print("ESTUDO DE CASO: as 4 varejistas analisadas desde a N1")
    print("=" * 70)

    padrao = "|".join(re.escape(a) for a in EMPRESAS_VAREJO)
    casos = df[df["DENOM_CIA"].str.contains(padrao, case=False, na=False)].copy()

    rf_modelo = resultados["Random Forest"]["modelo"]
    casos["risco_previsto_rf"] = rf_modelo.predict(casos[FEATURES].values)

    cols = ["DENOM_CIA", "risco_financeiro", "risco_previsto_rf"]
    print(casos[cols].to_string(index=False))

    acertos = (casos["risco_financeiro"] == casos["risco_previsto_rf"]).sum()
    print(f"\nO modelo (Random Forest, usando so receita/ativo/passivo) acertou "
          f"{acertos} de {len(casos)} classificacoes de risco das 4 varejistas, "
          f"comparado ao rotulo construido a partir do balanco completo.")


def main():
    df = carregar_dataset()
    print(f"Dataset carregado: {len(df)} empresas (apos remover linhas incompletas)")

    resultados_clf = rodar_classificacao(df)
    rodar_regressao(df)
    estudo_de_caso(df, resultados_clf)


if __name__ == "__main__":
    main()
