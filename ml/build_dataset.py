# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: build_dataset.py
# Sintese do conteudo: Constroi o dataset do projeto (Opcao Framework/ML) a
#   partir dos dados brutos e publicos da CVM - Demonstracoes Financeiras
#   Padronizadas (DFP) de 2023 e 2024, formato consolidado (DRE, BPA, BPP),
#   de TODAS as companhias abertas brasileiras. Extrai, por empresa e ano:
#   receita liquida, resultado liquido, ativo total, total da conta 2 do
#   passivo, patrimonio liquido e passivo exigivel (conta 2 - PL); calcula
#   indicadores derivados e o rotulo de risco financeiro (baixo/medio/alto).
#   Saida: dataset/cvm_dfp_empresas.csv (usado por ml/treinar_modelos.py).
#
#   Cuidados que o script trata explicitamente:
#   - ESCALA_MOEDA: a maioria das empresas informa em MIL, mas algumas
#     informam em UNIDADE (reais). Sem essa conversao, essas empresas ficam
#     1.000x maiores (ex.: Vivara com "lucro" de R$ 369 bilhoes).
#   - VERSAO: usa apenas a versao mais recente de cada documento.
#   - Conta 2 ("Passivo Total"): na CVM ela INCLUI o patrimonio liquido e e
#     igual ao ativo total. Por isso nao e variavel independente do ativo;
#     o passivo sem o PL e o "passivo exigivel", calculado aqui.
#
#   Fonte: CVM - Dados Abertos - DFP. Portal:
#   https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp
#   Os zips brutos (ml/cvm_raw/) sao baixados automaticamente e NAO sao
#   versionados no Git; apenas o dataset processado e versionado.
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#   - Ali Ahmad              | RA 10427712 | 10427712@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao do script de extracao e
#               processamento do dataset CVM DFP 2023 para a N2 (pivot da
#               "Opcao API de LLM" para "Opcao Framework" de ML).
#   2026-11-13 | Leonardo Tonon | Correcoes: conversao por ESCALA_MOEDA
#               (8 empresas estavam 1.000x maiores), versao mais recente
#               de cada DFP, passivo exigivel (conta 2 = ativo total),
#               anos 2023 e 2024, setor do cadastro CVM, marcacao das 4
#               varejistas e download automatico dos dados brutos.
# =============================================================================

import os
import re
import unicodedata
import zipfile

import numpy as np
import pandas as pd

ML_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(ML_DIR, "cvm_raw")
DATASET_DIR = os.path.join(os.path.dirname(ML_DIR), "dataset")
SAIDA = os.path.join(DATASET_DIR, "cvm_dfp_empresas.csv")

ANOS = [2023, 2024]
URL_DFP = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_{ano}.zip"
URL_CAD = "https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv"

VAREJISTAS = {
    "Magazine Luiza": r"^MAGAZINE LUIZA",
    "Americanas": r"^(?:AMERICANAS S\.?A|LOJAS AMERICANAS)",
    "Grupo Casas Bahia": r"^(?:VIA S\.?A|VIA VAREJO|GRUPO CASAS BAHIA)",
    "Lojas Renner": r"^LOJAS RENNER",
}
SETORES_FINANCEIROS = ("BANCO", "INTERMEDIACAO FINANCEIRA", "SEGURADORA", "ARRENDAMENTO",
                       "SECURITIZACAO", "CREDITO", "PREVIDENCIA", "BOLSA")


def _normalizar(texto) -> str:
    nfkd = unicodedata.normalize("NFKD", str(texto))
    sem_acento = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip().upper()


def _baixar(url: str, destino: str) -> str:
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        return destino
    import requests
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    print(f"Baixando {url} ...")
    with requests.get(url, stream=True, timeout=180) as r:
        r.raise_for_status()
        with open(destino + ".part", "wb") as f:
            for bloco in r.iter_content(chunk_size=1 << 20):
                f.write(bloco)
    os.replace(destino + ".part", destino)
    return destino


def _ler_demonstracao(zf: zipfile.ZipFile, parte: str) -> pd.DataFrame:
    """Le um CSV do zip DFP, mantendo so o exercicio atual e a versao mais
    recente, e converte VL_CONTA para R$ milhoes conforme ESCALA_MOEDA."""
    nome = next(n for n in zf.namelist() if parte.lower() in n.lower())
    with zf.open(nome) as f:
        df = pd.read_csv(f, sep=";", encoding="latin1", dtype=str)
    df.columns = [c.strip().upper() for c in df.columns]
    df["VL_CONTA"] = pd.to_numeric(df["VL_CONTA"], errors="coerce")
    df["VERSAO"] = pd.to_numeric(df["VERSAO"], errors="coerce").fillna(1).astype(int)
    df = df[df["ORDEM_EXERC"].map(_normalizar) == "ULTIMO"]
    df = df[df["VERSAO"] == df.groupby("CNPJ_CIA")["VERSAO"].transform("max")].copy()
    fator = df["ESCALA_MOEDA"].map(_normalizar).map({"MIL": 1e-3, "UNIDADE": 1e-6}).fillna(1e-3)
    df["VALOR_MI"] = df["VL_CONTA"] * fator
    df["DS_NORM"] = df["DS_CONTA"].map(_normalizar)
    df["NIVEL"] = df["CD_CONTA"].str.count(r"\.")
    return df


def _por_codigo(df, codigo, nome):
    return df[df["CD_CONTA"] == codigo].groupby("CNPJ_CIA")["VALOR_MI"].first().rename(nome)


def _por_descricao(df, nivel, condicao, nome):
    sub = df[(df["NIVEL"] == nivel) & df["DS_NORM"].map(condicao)]
    return sub.groupby("CNPJ_CIA")["VALOR_MI"].first().rename(nome)


def montar_ano(ano: int) -> pd.DataFrame:
    caminho = _baixar(URL_DFP.format(ano=ano), os.path.join(RAW_DIR, f"dfp_cia_aberta_{ano}.zip"))
    with zipfile.ZipFile(caminho) as zf:
        dre = _ler_demonstracao(zf, "_DRE_con_")
        bpa = _ler_demonstracao(zf, "_BPA_con_")
        bpp = _ler_demonstracao(zf, "_BPP_con_")

    receita = _por_codigo(dre, "3.01", "receita_liquida")
    # O codigo do resultado e do PL varia entre planos de contas (ex.: bancos),
    # por isso a busca e pela descricao padronizada, com o codigo como reserva.
    resultado = _por_descricao(
        dre, 1, lambda d: "CONSOLIDADO DO PERIODO" in d and ("LUCRO" in d or "PREJUIZO" in d),
        "resultado_liquido").combine_first(_por_codigo(dre, "3.11", "resultado_liquido"))
    ativo = _por_codigo(bpa, "1", "ativo_total")
    passivo = _por_codigo(bpp, "2", "passivo_total")
    pl = _por_descricao(bpp, 1, lambda d: d.startswith("PATRIMONIO LIQUIDO"),
                        "patrimonio_liquido").combine_first(_por_codigo(bpp, "2.03", "patrimonio_liquido"))

    nomes = dre.groupby("CNPJ_CIA")[["DENOM_CIA", "CD_CVM"]].first()
    base = pd.concat([nomes, receita, resultado, ativo, passivo, pl], axis=1)
    base.index.name = "CNPJ_CIA"
    base = base.reset_index()
    base["ano"] = ano
    return base


def anexar_setor_e_varejistas(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    try:
        cad = pd.read_csv(_baixar(URL_CAD, os.path.join(RAW_DIR, "cad_cia_aberta.csv")),
                          sep=";", encoding="latin1", dtype=str)
        cad.columns = [c.strip().upper() for c in cad.columns]
        setor = cad.dropna(subset=["SETOR_ATIV"]).groupby("CNPJ_CIA")["SETOR_ATIV"].first()
        df["setor"] = df["CNPJ_CIA"].map(setor)
    except Exception as e:  # o cadastro e opcional
        print(f"[aviso] cadastro da CVM nao carregado: {e}")
        df["setor"] = None
    df["financeira"] = df["setor"].fillna("").map(_normalizar).map(
        lambda s: any(k in s for k in SETORES_FINANCEIROS))

    # Marca as 4 varejistas da N1 (a de maior receita, se houver mais de uma)
    df["varejista"] = None
    dn = df["DENOM_CIA"].map(_normalizar)
    for nome, padrao in VAREJISTAS.items():
        for ano in df["ano"].unique():
            m = dn.str.contains(padrao, regex=True, na=False) & (df["ano"] == ano)
            if m.any():
                df.loc[df.loc[m, "receita_liquida"].idxmax(), "varejista"] = nome
    return df


def calcular_indicadores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["passivo_exigivel"] = df["passivo_total"] - df["patrimonio_liquido"]
    df["margem_liquida_pct"] = np.where(
        df["receita_liquida"] != 0, 100 * df["resultado_liquido"] / df["receita_liquida"], np.nan)
    # Alavancagem como definida na primeira versao: conta 2 / PL (= ativo / PL)
    df["alavancagem"] = np.where(
        df["patrimonio_liquido"] > 0, df["passivo_total"] / df["patrimonio_liquido"], np.nan)
    df["roe_pct"] = np.where(
        df["patrimonio_liquido"] > 0, 100 * df["resultado_liquido"] / df["patrimonio_liquido"], np.nan)
    # Endividamento sobre o ativo: passivo exigivel / ativo (com a conta 2,
    # este indicador daria sempre 100%)
    df["endividamento_ativo_pct"] = np.where(
        df["ativo_total"] != 0, 100 * df["passivo_exigivel"] / df["ativo_total"], np.nan)
    df["patrimonio_liquido_negativo"] = (df["patrimonio_liquido"] < 0).astype(int)

    def classificar_risco(linha):
        if linha["patrimonio_liquido"] < 0:
            return "alto"
        if linha["resultado_liquido"] < 0 or (
            not np.isnan(linha["alavancagem"]) and linha["alavancagem"] > 3
        ):
            return "medio"
        return "baixo"

    df["risco_financeiro"] = df.apply(classificar_risco, axis=1)
    return df


COLUNAS = ["CNPJ_CIA", "DENOM_CIA", "CD_CVM", "ano", "setor", "financeira", "varejista",
           "receita_liquida", "resultado_liquido", "ativo_total", "passivo_total",
           "patrimonio_liquido", "passivo_exigivel", "margem_liquida_pct", "alavancagem",
           "roe_pct", "endividamento_ativo_pct", "patrimonio_liquido_negativo", "risco_financeiro"]


def finalizar(base: pd.DataFrame) -> pd.DataFrame:
    """Remove linhas incompletas, calcula indicadores e ordena as colunas."""
    obrig = ["receita_liquida", "resultado_liquido", "ativo_total", "passivo_total", "patrimonio_liquido"]
    df = base.dropna(subset=obrig)
    df = df[df["ativo_total"] > 0]
    df = calcular_indicadores(df)
    return df[COLUNAS].sort_values(["ano", "DENOM_CIA"]).reset_index(drop=True)


def main():
    os.makedirs(DATASET_DIR, exist_ok=True)
    base = pd.concat([montar_ano(a) for a in ANOS], ignore_index=True)
    base = anexar_setor_e_varejistas(base)
    df = finalizar(base)
    df.to_csv(SAIDA, index=False, encoding="utf-8")

    print(f"\nDataset salvo em: {SAIDA}")
    print(df.groupby("ano").size().rename("empresas").to_string())
    d23 = df[df["ano"] == 2023]
    print("\nDistribuicao de risco_financeiro (2023):")
    print(d23["risco_financeiro"].value_counts().to_string())
    igual = (d23["passivo_total"] - d23["ativo_total"]).abs() <= 0.1
    print(f"\nConta 2 ('Passivo Total') = Ativo Total em {igual.mean():.1%} das empresas")

    print("\n--- Varejistas do estudo de caso (R$ milhoes) ---")
    cols = ["ano", "varejista", "receita_liquida", "resultado_liquido", "patrimonio_liquido",
            "ativo_total", "risco_financeiro"]
    with pd.option_context("display.float_format", lambda x: f"{x:,.1f}"):
        print(df[df["varejista"].notna()][cols].sort_values(["varejista", "ano"]).to_string(index=False))


if __name__ == "__main__":
    main()
