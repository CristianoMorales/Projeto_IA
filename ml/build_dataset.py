# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: build_dataset.py
# Sintese do conteudo: Constroi o dataset original do projeto (Opcao
#   Framework/ML) a partir dos dados brutos e publicos da CVM (Comissao de
#   Valores Mobiliarios) - Demonstracoes Financeiras Padronizadas (DFP) de
#   2023, formato consolidado (DRE, BPP, BPA), referentes a TODAS as
#   companhias de capital aberto brasileiras. Extrai, por empresa: receita
#   liquida, resultado liquido, patrimonio liquido, passivo total e ativo
#   total; calcula indicadores financeiros derivados (margem liquida,
#   alavancagem, ROE, endividamento) e um rotulo de risco financeiro
#   (baixo/medio/alto), usado como alvo de classificacao. O dataset
#   resultante (dataset/cvm_dfp_2023_empresas.csv) e MUITO maior e mais
#   robusto estatisticamente que o dataset manual da N1 (19 linhas, 4
#   empresas), permitindo treinar modelos de classificacao/regressao reais
#   com scikit-learn (ver ml/treinar_modelos.py).
#
#   Fonte dos dados brutos: CVM - Dados Abertos - Demonstracoes Financeiras
#   Padronizadas (DFP), ano-base 2023.
#   Portal: https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp
#   Os arquivos brutos (ml/cvm_raw/*.csv) NAO sao versionados no Git (sao
#   dados publicos volumosos, re-obteniveis no link acima); apenas o
#   dataset processado (muito menor) e versionado.
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
# =============================================================================

import os
import re
import unicodedata

import numpy as np
import pandas as pd

ML_DIR = os.path.dirname(__file__)
RAW_DIR = os.path.join(ML_DIR, "cvm_raw")
DATASET_DIR = os.path.join(os.path.dirname(ML_DIR), "dataset")

ARQ_DRE = os.path.join(RAW_DIR, "dfp_cia_aberta_DRE_con_2023.csv")
ARQ_BPP = os.path.join(RAW_DIR, "dfp_cia_aberta_BPP_con_2023.csv")
ARQ_BPA = os.path.join(RAW_DIR, "dfp_cia_aberta_BPA_con_2023.csv")

SAIDA = os.path.join(DATASET_DIR, "cvm_dfp_2023_empresas.csv")

# Descricoes-alvo (DS_CONTA) para o resultado liquido / patrimonio liquido.
# O CODIGO da conta (CD_CONTA) varia de empresa para empresa (depende da
# profundidade do plano de contas de cada uma), mas a DESCRICAO do "bottom
# line" e padronizada pela CVM - por isso casamos por descricao, nao por
# codigo fixo.
_RESULTADO_PADROES = [
    "lucro/prejuizo consolidado do periodo",
    "lucro ou prejuizo liquido consolidado do periodo",
    "lucro/prejuizo do periodo",
    "resultado liquido do periodo",
]
_PL_PADRAO = "patrimonio liquido consolidado"


def _normalizar(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", str(texto))
    sem_acento = "".join(c for c in nfkd if not unicodedata.combining(c))
    return sem_acento.lower().strip()


def _extrair_conta(df, padroes, nome_coluna):
    """Filtra linhas cujo DS_CONTA normalizado bate com algum dos padroes,
    para o exercicio atual (ORDEM_EXERC == 'ÚLTIMO'), e retorna um DataFrame
    indexado por CNPJ_CIA com uma unica coluna (nome_coluna)."""
    df = df.copy()
    df["_ds_norm"] = df["DS_CONTA"].map(_normalizar)
    if isinstance(padroes, str):
        padroes = [padroes]
    mascara = df["_ds_norm"].isin(padroes) & (df["ORDEM_EXERC"] == "ÚLTIMO")
    filtrado = df[mascara].drop_duplicates(subset=["CNPJ_CIA"], keep="first")
    resultado = filtrado.set_index("CNPJ_CIA")["VL_CONTA"].rename(nome_coluna)
    return resultado


def carregar():
    dre = pd.read_csv(ARQ_DRE, sep=";", encoding="latin1")
    bpp = pd.read_csv(ARQ_BPP, sep=";", encoding="latin1")
    bpa = pd.read_csv(ARQ_BPA, sep=";", encoding="latin1")

    # Receita: primeira linha operacional da DRE (CD_CONTA "3.01"), exercicio atual
    receita = dre[(dre["CD_CONTA"] == "3.01") & (dre["ORDEM_EXERC"] == "ÚLTIMO")]
    receita = receita.drop_duplicates(subset=["CNPJ_CIA"], keep="first")
    receita = receita.set_index("CNPJ_CIA")["VL_CONTA"].rename("receita_liquida")

    resultado = _extrair_conta(dre, _RESULTADO_PADROES, "resultado_liquido")

    # IMPORTANTE (correcao pos-revisao do grupo, 14/11/2026): o codigo "2" da
    # BPP e rotulado "Passivo Total" na CVM, mas na estrutura de contas da
    # CVM esse codigo JA INCLUI o Patrimonio Liquido como subconta (2.01
    # Passivo Circulante + 2.02 Passivo Nao Circulante + 2.03 Patrimonio
    # Liquido = 2 Passivo Total) - ou seja, "Passivo Total" (codigo 2) e,
    # por construcao contabil, SEMPRE IGUAL ao Ativo Total (identidade
    # Ativo = Passivo+PL). Usar o codigo "2" como variavel de entrada do
    # modelo e um erro: ele duplica a coluna ativo_total (confirmado
    # empiricamente: diferenca = 0,0 em todas as 474 empresas). A correcao
    # extrai separadamente o Passivo Circulante (2.01) e o Passivo Nao
    # Circulante (2.02) - as obrigacoes com terceiros, excluindo o PL -
    # casando pela DESCRICAO da conta (nao pelo codigo), pois a descricao de
    # 2.01/2.02 varia por tipo de instituicao (ex.: bancos/seguradoras usam
    # rotulos diferentes de "Passivo Circulante").
    passivo_circ = _extrair_conta(bpp, "passivo circulante", "passivo_circulante")
    passivo_nao_circ = _extrair_conta(bpp, "passivo nao circulante", "passivo_nao_circulante")

    patrimonio = _extrair_conta(bpp, _PL_PADRAO, "patrimonio_liquido")

    # Ativo total: CD_CONTA == "1" (fixo e estavel em todas as empresas)
    ativo = bpa[(bpa["CD_CONTA"] == "1") & (bpa["ORDEM_EXERC"] == "ÚLTIMO")]
    ativo = ativo.drop_duplicates(subset=["CNPJ_CIA"], keep="first")
    ativo = ativo.set_index("CNPJ_CIA")["VL_CONTA"].rename("ativo_total")

    # Nomes das empresas (para leitura humana do dataset final)
    nomes = dre[["CNPJ_CIA", "DENOM_CIA", "CD_CVM"]].drop_duplicates(subset=["CNPJ_CIA"])
    nomes = nomes.set_index("CNPJ_CIA")

    base = nomes.join([receita, resultado, passivo_circ, passivo_nao_circ, patrimonio, ativo], how="inner")
    return base.reset_index()


def calcular_indicadores(df):
    df = df.copy()
    # Unidade dos valores e "MIL" (milhares de reais) na maior parte dos
    # arquivos DFP; convertendo para milhoes para ficar no mesmo padrao do
    # dataset manual da N1.
    for col in ["receita_liquida", "resultado_liquido", "passivo_circulante",
                "passivo_nao_circulante", "patrimonio_liquido", "ativo_total"]:
        df[col] = df[col] / 1000.0  # mil -> milhoes

    # Passivo exigivel total (obrigacoes com terceiros, EXCLUINDO patrimonio
    # liquido) - usado so para calcular alavancagem/endividamento/rotulo de
    # risco, nunca como feature de entrada do modelo (ver ml/treinar_modelos.py:
    # usar ativo_total junto com este valor permitiria reconstruir o
    # patrimonio liquido por subtracao, o que seria vazamento de rotulo).
    df["passivo_exigivel_total"] = df["passivo_circulante"] + df["passivo_nao_circulante"]

    df["margem_liquida_pct"] = np.where(
        df["receita_liquida"] != 0,
        100 * df["resultado_liquido"] / df["receita_liquida"],
        np.nan,
    )
    df["alavancagem"] = np.where(
        df["patrimonio_liquido"] > 0,
        df["passivo_exigivel_total"] / df["patrimonio_liquido"],
        np.nan,
    )
    df["roe_pct"] = np.where(
        df["patrimonio_liquido"] > 0,
        100 * df["resultado_liquido"] / df["patrimonio_liquido"],
        np.nan,
    )
    df["endividamento_ativo_pct"] = np.where(
        df["ativo_total"] != 0,
        100 * df["passivo_exigivel_total"] / df["ativo_total"],
        np.nan,
    )
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


def main():
    os.makedirs(DATASET_DIR, exist_ok=True)
    print("Carregando e cruzando DRE + BPP + BPA (pode levar alguns segundos)...")
    base = carregar()
    print(f"Empresas com os 3 demonstrativos completos: {len(base)}")

    df = calcular_indicadores(base)
    df = df.sort_values("DENOM_CIA").reset_index(drop=True)
    df.to_csv(SAIDA, index=False, encoding="utf-8")
    print(f"Dataset salvo em: {SAIDA}")
    print(f"Total de empresas: {len(df)}")
    print("Distribuicao de risco_financeiro:")
    print(df["risco_financeiro"].value_counts())

    print("\n--- Validacao cruzada: varejistas do estudo de caso (N1) ---")
    alvo = ["AMERICANAS", "MAGAZINE LUIZA", "VIA S.A", "VIA VAREJO", "CASAS BAHIA", "LOJAS RENNER"]
    padrao = "|".join(re.escape(a) for a in alvo)
    encontrados = df[df["DENOM_CIA"].str.contains(padrao, case=False, na=False)]
    cols = ["DENOM_CIA", "receita_liquida", "resultado_liquido", "patrimonio_liquido",
            "passivo_circulante", "passivo_exigivel_total", "margem_liquida_pct", "alavancagem", "risco_financeiro"]
    with pd.option_context("display.float_format", lambda x: f"{x:,.1f}"):
        print(encontrados[cols].to_string(index=False))


if __name__ == "__main__":
    main()
