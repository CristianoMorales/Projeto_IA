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
#
# Este notebook carrega o dataset **diretamente do repositório público no GitHub** (não precisa fazer upload de nenhum arquivo) e reproduz, célula a célula, a classificação de risco financeiro e a regressão do resultado líquido treinadas em `ml/treinar_modelos.py`, incluindo o estudo de caso nas 4 varejistas.
#
# ➡️ **Para rodar:** no menu, `Ambiente de execução` → `Executar tudo` (ou `Runtime` → `Run all`).

# %% [markdown]
# ## 1. Carregar o dataset (474 empresas, CVM DFP 2023)

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
# **Features usadas (deliberadamente):** apenas `receita_liquida`, `ativo_total` e `passivo_total` — isto é, variáveis de "tamanho" do balanço. Patrimônio líquido, resultado líquido, margem e alavancagem são **excluídos propositalmente**, pois são usados para construir o próprio rótulo de risco (ver Seção 3.4 do relatório — evitar vazamento de rótulo / tarefa circular).

# %%
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import ConfusionMatrixDisplay, accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = ["receita_liquida", "ativo_total", "passivo_total"]
SEED = 42

df_clf = df.dropna(subset=FEATURES + ["risco_financeiro"])
X = df_clf[FEATURES].values
y = df_clf["risco_financeiro"].values
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

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
    print("=" * 70)
    print(f"{nome} — acurácia (5-fold CV): {acc:.1%}")
    print(classification_report(y, y_pred, zero_division=0))

    modelo.fit(X, y)  # versão final, treinada no dataset inteiro
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
# ⚠️ **Leitura com cautela:** o R² da Regressão Linear é inflado por efeito de escala — o dataset mistura empresas de portes extremamente diferentes (de companhias pequenas a grandes bancos), e parte da variância é explicada simplesmente pelo fato de empresas maiores terem lucros/prejuízos proporcionalmente maiores. Ver discussão completa na Seção 6.2 do relatório.

# %% [markdown]
# ## 5. Estudo de caso: as 4 varejistas analisadas desde a N1
#
# Aplicando o modelo de Random Forest (treinado nas 474 empresas) às quatro varejistas do dataset histórico da N1 — comparando a predição automática com o risco real de cada uma.

# %%
import re

EMPRESAS_VAREJO = ["AMERICANAS", "MAGAZINE LUIZA", "VIA S.A", "VIA VAREJO", "CASAS BAHIA", "LOJAS RENNER"]
padrao = "|".join(re.escape(a) for a in EMPRESAS_VAREJO)
casos = df[df["DENOM_CIA"].str.contains(padrao, case=False, na=False)].copy()
casos["risco_previsto_rf"] = modelos_treinados["Random Forest"].predict(casos[FEATURES].values)
casos["acertou"] = np.where(casos["risco_financeiro"] == casos["risco_previsto_rf"], "✅", "❌")

tabela = casos[["DENOM_CIA", "resultado_liquido", "risco_financeiro", "risco_previsto_rf", "acertou"]].rename(
    columns={
        "DENOM_CIA": "Empresa",
        "resultado_liquido": "Resultado líquido (R$ mi)",
        "risco_financeiro": "Risco real",
        "risco_previsto_rf": "Risco previsto (modelo)",
        "acertou": "Acertou?",
    }
)
tabela

# %%
acertos = (casos["risco_financeiro"] == casos["risco_previsto_rf"]).sum()
print(f"O modelo acertou {acertos} de {len(casos)} classificações de risco das 4 varejistas do estudo de caso,")
print("usando apenas receita líquida, ativo total e passivo total — sem olhar diretamente patrimônio líquido ou resultado.")
