# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: percent
#   kernelspec:
#     display_name: Python 3
#     name: python3
# ---

# %% [markdown]
# # Projeto de Inteligência Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# ### Universidade Presbiteriana Mackenzie - Faculdade de Computação e Informática
#
# **Sentinela de Risco: Classificação de Risco Financeiro de Empresas Brasileiras com Machine Learning**
#
# Demonstração interativa (Google Colab) do pipeline de Machine Learning da N2.
#
# **Integrantes do grupo:**
# - Cristiano Morales — RA 10437953 — 10437953@mackenzista.com.br
# - Caio Carames — RA 10308718 — 10308718@mackenzista.com.br
# - Leonardo Tonon — RA 10426930 — 10426930@mackenzista.com.br
# - Ali Ahmad — RA 10427712 — 10427712@mackenzista.com.br
#
# **Histórico de atualizações:**
# - 2026-11-14 | Cristiano Morales | Criação do notebook de demonstração para Google Colab, usado na gravação do vídeo da N2.
# - 2026-11-14 | Cristiano Morales | Correção de 3 problemas apontados em revisão interna do grupo: (1) a feature `passivo_total` era, por construção contábil, idêntica a `ativo_total` (vazamento) — trocada por `passivo_circulante`; (2) o estudo de caso das 4 varejistas agora usa um modelo **treinado sem essas 4 empresas** (holdout real), em vez do modelo "final" treinado com elas incluídas; (3) a acurácia bruta agora é comparada explicitamente com o baseline trivial (sempre prever a classe majoritária), e reportamos também acurácia balanceada e F1-macro.
#
# Este notebook carrega o dataset **diretamente do repositório público no GitHub** (não precisa fazer upload de nenhum arquivo) e reproduz, célula a célula, a classificação de risco financeiro e a regressão do resultado líquido treinadas em `ml/treinar_modelos.py`, incluindo o estudo de caso nas 4 varejistas.
#
# ➡️ **Para rodar:** no menu, `Ambiente de execução` → `Executar tudo` (ou `Runtime` → `Run all`).

# %% [markdown]
# ## 1. Carregar o dataset (454 empresas, CVM DFP 2023)

# %%
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

URL_DATASET = "https://raw.githubusercontent.com/CristianoMorales/Projeto_IA/main/dataset/cvm_dfp_2023_empresas.csv"
df = pd.read_csv(URL_DATASET)
print(f"Dataset carregado: {len(df)} empresas, {df.shape[1]} colunas")
df.head(10)

# %% [markdown]
# ## 2. Visão geral: distribuição de risco financeiro

# %%
CORES_RISCO = {"baixo": "#2e7d32", "medio": "#f9a825", "alto": "#c62828"}
contagem = df["risco_financeiro"].value_counts().reindex(["baixo", "medio", "alto"])

fig, ax = plt.subplots(figsize=(7.5, 4.3))
ax.bar(contagem.index, contagem.values, color=[CORES_RISCO[c] for c in contagem.index])
for i, v in enumerate(contagem.values):
    ax.text(i, v + 5, str(v), ha="center")
ax.set_title(f"Distribuição de risco financeiro — {len(df)} companhias abertas (CVM DFP 2023)")
ax.set_ylabel("Número de empresas")
plt.show()

print(contagem.to_string())

# %% [markdown]
# ## 3. Classificação: prever o risco financeiro (baixo / médio / alto)
#
# **Features usadas (deliberadamente):** apenas `receita_liquida`, `ativo_total` e `passivo_circulante` — isto é, variáveis de "tamanho"/estrutura do balanço. Patrimônio líquido, resultado líquido, margem e alavancagem são **excluídos propositalmente**, pois são usados para construir o próprio rótulo de risco (evitar vazamento de rótulo / tarefa circular).
#
# ⚠️ Usamos `passivo_circulante` em vez do antigo `passivo_total` da CVM (código "2"): descobrimos que esse "Passivo Total" já inclui o Patrimônio Líquido como subconta — ou seja, é sempre igual ao `ativo_total` pela identidade contábil Ativo = Passivo + PL. Usá-lo como feature seria vazamento de rótulo disfarçado.

# %%
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = ["receita_liquida", "ativo_total", "passivo_circulante"]
SEED = 42

df_clf = df.dropna(subset=FEATURES + ["risco_financeiro"])
X = df_clf[FEATURES].values
y = df_clf["risco_financeiro"].values
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

contagem_y = pd.Series(y).value_counts()
baseline_majoritario = contagem_y.max() / len(y)
print(f"Baseline trivial (sempre prever '{contagem_y.idxmax()}'): {baseline_majoritario:.1%}")
print(f"Baseline aleatório (3 classes): {1/3:.1%}")

modelos_clf = {
    "Regressão Logística": make_pipeline(
        StandardScaler(), LogisticRegression(max_iter=2000, random_state=SEED, class_weight="balanced")
    ),
    "Random Forest": RandomForestClassifier(n_estimators=300, random_state=SEED, class_weight="balanced"),
}

modelos_treinados = {}
for nome, modelo in modelos_clf.items():
    y_pred = cross_val_predict(modelo, X, y, cv=cv)
    acc = accuracy_score(y, y_pred)
    bal_acc = balanced_accuracy_score(y, y_pred)
    f1_macro = f1_score(y, y_pred, average="macro", zero_division=0)
    print("=" * 70)
    print(f"{nome} — (5-fold CV, predições out-of-fold)")
    print(f"  Acurácia bruta:      {acc:.1%}  "
          f"{'(ABAIXO do baseline majoritário!)' if acc < baseline_majoritario else '(acima do baseline majoritário)'}")
    print(f"  Acurácia balanceada: {bal_acc:.1%}")
    print(f"  F1-macro:            {f1_macro:.3f}")
    print(classification_report(y, y_pred, zero_division=0))

    modelo.fit(X, y)  # versão "geral", treinada no dataset inteiro
    modelos_treinados[nome] = modelo

    cm = confusion_matrix(y, y_pred, labels=["baixo", "medio", "alto"])
    disp = ConfusionMatrixDisplay(cm, display_labels=["baixo", "medio", "alto"])
    disp.plot(cmap="Blues", values_format="d")
    disp.ax_.set_title(f"Matriz de Confusão (5-fold CV) — {nome}")
    plt.show()

# %% [markdown]
# ### Importância das variáveis (Random Forest)

# %%
rf = modelos_treinados["Random Forest"]
importancias = pd.Series(rf.feature_importances_, index=FEATURES).sort_values(ascending=False)
importancias_pct = (importancias * 100).round(1).astype(str) + "%"
importancias_pct

# %% [markdown]
# ## 4. Regressão: prever o resultado líquido (R$ milhões)

# %%
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold

df_reg = df.dropna(subset=FEATURES + ["resultado_liquido"])
Xr = df_reg[FEATURES].values
yr = df_reg["resultado_liquido"].values
cv_reg = KFold(n_splits=5, shuffle=True, random_state=SEED)

modelos_reg = {
    "Regressão Linear": make_pipeline(StandardScaler(), LinearRegression()),
    "Random Forest Regressor": RandomForestRegressor(n_estimators=300, random_state=SEED),
}

resultados_reg = []
for nome, modelo in modelos_reg.items():
    y_pred = cross_val_predict(modelo, Xr, yr, cv=cv_reg)
    mae = mean_absolute_error(yr, y_pred)
    r2 = r2_score(yr, y_pred)
    resultados_reg.append({"Modelo": nome, "MAE (R$ milhões)": round(mae, 1), "R²": round(r2, 3)})

pd.DataFrame(resultados_reg)

# %% [markdown]
# ⚠️ **Leitura com cautela:** o dataset mistura empresas de portes extremamente diferentes (de companhias pequenas a grandes bancos), e parte da variância explicada vem simplesmente do efeito de escala — empresas maiores têm lucros/prejuízos proporcionalmente maiores. Ver discussão completa no relatório (Seção 6).

# %% [markdown]
# ## 5. Estudo de caso: as 4 varejistas analisadas desde a N1
#
# **Holdout real:** para este teste, o modelo de Random Forest é **retreinado excluindo as 4 varejistas** do conjunto de treino, e só então aplicado a elas — ao contrário da versão "geral" da Seção 3 (treinada com todo o dataset, incluindo essas 4 empresas). Isso evita reportar como "validação" um resultado em que o modelo já viu as respostas durante o treino.

# %%
import re

EMPRESAS_VAREJO = ["AMERICANAS", "MAGAZINE LUIZA", "VIA S.A", "VIA VAREJO", "CASAS BAHIA", "LOJAS RENNER"]
padrao = "|".join(re.escape(a) for a in EMPRESAS_VAREJO)
e_varejo = df["DENOM_CIA"].str.contains(padrao, case=False, na=False)
casos = df[e_varejo].copy()
df_treino_holdout = df[~e_varejo].dropna(subset=FEATURES + ["risco_financeiro"])

modelo_holdout = RandomForestClassifier(n_estimators=300, random_state=SEED, class_weight="balanced")
modelo_holdout.fit(df_treino_holdout[FEATURES].values, df_treino_holdout["risco_financeiro"].values)

casos["risco_previsto_rf"] = modelo_holdout.predict(casos[FEATURES].values)
casos["acertou"] = np.where(casos["risco_financeiro"] == casos["risco_previsto_rf"], "✅", "❌")

tabela = casos[["DENOM_CIA", "resultado_liquido", "risco_financeiro", "risco_previsto_rf", "acertou"]].rename(
    columns={
        "DENOM_CIA": "Empresa",
        "resultado_liquido": "Resultado líquido (R$ mi)",
        "risco_financeiro": "Risco real",
        "risco_previsto_rf": "Risco previsto (holdout real)",
        "acertou": "Acertou?",
    }
)
tabela

# %%
acertos = (casos["risco_financeiro"] == casos["risco_previsto_rf"]).sum()
print(f"Com holdout real (modelo treinado em {len(df_treino_holdout)} empresas, SEM as 4 varejistas),")
print(f"o modelo acertou {acertos} de {len(casos)} classificações de risco das 4 varejistas do estudo de caso.")
print("\nEsse resultado, com uma amostra de apenas 4 empresas, é naturalmente instável (alta variância) —")
print("por isso o indicador mais confiável do desempenho do modelo é a validação cruzada de 5 folds da Seção 3")
print("(acurácia balanceada e F1-macro), não um único teste pontual em 4 casos. Ver discussão no relatório (Seção 6).")
