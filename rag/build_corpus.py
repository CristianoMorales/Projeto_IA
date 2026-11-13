# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: build_corpus.py
# Sintese do conteudo: Gera o corpus de documentos de texto (sinteses
#   factuais originais, redigidas pelo grupo a partir de fontes oficiais de
#   RI e imprensa especializada ja referenciadas em dataset/fontes.csv e
#   rag/corpus/fontes_corpus.csv) usado como base de conhecimento do pipeline
#   RAG (Retrieval-Augmented Generation) da N2. Cada documento cobre um
#   periodo/evento de uma das 4 varejistas analisadas (Magazine Luiza,
#   Americanas, Via/Grupo Casas Bahia, Lojas Renner) e carrega metadados de
#   proveniencia (empresa, periodo, fonte, tipo de fonte) no cabecalho do
#   proprio arquivo de texto, para permitir citacao da fonte nas respostas
#   geradas pelo LLM.
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao do script e do corpus inicial
#               (9 documentos) para o pipeline RAG da N2.
# =============================================================================

import csv
import os

CORPUS_DIR = os.path.join(os.path.dirname(__file__), "corpus")
os.makedirs(CORPUS_DIR, exist_ok=True)

# Cada documento e uma sintese factual ORIGINAL (redigida pelo grupo, nao copiada
# verbatim de nenhuma fonte), baseada nos numeros oficiais ja coletados no
# dataset da N1 (dataset/demonstrativos_financeiros_varejo_br.csv) e no contexto
# publico de cada caso, com a fonte primaria citada no proprio cabecalho.
DOCUMENTOS = [
    {
        "id": "americanas_2023_fato_relevante",
        "empresa": "Americanas",
        "periodo": "jan/2023",
        "fonte": "Fato Relevante Americanas S.A. (11/01/2023) + cobertura InfoMoney/Poder360",
        "tipo_fonte": "Fato relevante oficial + imprensa especializada",
        "texto": (
            "Em 11 de janeiro de 2023, a Americanas S.A. (AMER3) divulgou fato "
            "relevante informando a identificacao de inconsistencias contabeis "
            "da ordem de R$ 20 bilhoes, relacionadas principalmente a operacoes "
            "de risco sacado (financiamento a fornecedores) que nao estavam "
            "sendo reconhecidas corretamente no passivo da companhia. O caso "
            "levou a troca imediata da diretoria executiva, a abertura de "
            "investigacoes pela CVM e pela Policia Federal, e culminou no "
            "pedido de recuperacao judicial da empresa em 19 de janeiro de "
            "2023, um dos maiores da historia do varejo brasileiro. Apos a "
            "revisao contabil, o resultado de 2021 - originalmente divulgado "
            "como lucro liquido de R$ 544 milhoes - foi reapresentado como "
            "prejuizo de R$ 6,2 bilhoes. O episodio se tornou referencia em "
            "discussoes sobre governanca corporativa e qualidade de "
            "divulgacao financeira no mercado brasileiro."
        ),
    },
    {
        "id": "americanas_2022_resultado",
        "empresa": "Americanas",
        "periodo": "2022",
        "fonte": "Demonstracoes financeiras 2022 (pos-descoberta da fraude) - cobertura InfoMoney",
        "tipo_fonte": "Imprensa especializada com base em divulgacao oficial",
        "texto": (
            "O exercicio de 2022 da Americanas, apurado e divulgado apos a "
            "descoberta da fraude contabil em janeiro de 2023, registrou receita "
            "liquida de aproximadamente R$ 25,8 bilhoes e prejuizo liquido de "
            "cerca de R$ 12,9 bilhoes. O patrimonio liquido tornou-se negativo "
            "em aproximadamente R$ 26,7 bilhoes, e a divida bruta saltou para "
            "cerca de R$ 37,3 bilhoes, refletindo o reconhecimento das "
            "obrigacoes de risco sacado que antes nao apareciam corretamente "
            "no balanco. Patrimonio liquido negativo e divida liquida muito "
            "superior ao patrimonio sao, neste caso, os sinais de alerta mais "
            "evidentes de risco financeiro severo."
        ),
    },
    {
        "id": "americanas_2023_resultado",
        "empresa": "Americanas",
        "periodo": "2023",
        "fonte": "Americanas tem prejuizo de R$ 2,27 bilhoes em 2023 - Poder360",
        "tipo_fonte": "Imprensa especializada",
        "texto": (
            "Em 2023, ja sob recuperacao judicial, a Americanas reduziu "
            "fortemente sua operacao: a receita liquida caiu para cerca de "
            "R$ 14,9 bilhoes (quase a metade do ano anterior) e o prejuizo "
            "liquido foi de aproximadamente R$ 2,27 bilhoes, bem menor que o "
            "prejuizo de 2022, mas ainda negativo. O patrimonio liquido "
            "seguiu negativo, em torno de R$ 28,8 bilhoes, e a divida bruta "
            "aumentou para cerca de R$ 39,4 bilhoes. O plano de recuperacao "
            "judicial, homologado ao longo de 2023, previa alongamento e "
            "renegociacao de dividas com credores como condicao para a "
            "continuidade da empresa."
        ),
    },
    {
        "id": "americanas_2024_resultado",
        "empresa": "Americanas",
        "periodo": "2024",
        "fonte": "Americanas reverte lucro e registra prejuizo de R$ 586 mi no 4T24 - Safras & Mercado",
        "tipo_fonte": "Imprensa especializada",
        "texto": (
            "Em 2024, a Americanas reportou resultado liquido positivo de "
            "cerca de R$ 8,2 bilhoes no ano cheio, revertendo a sequencia de "
            "prejuizos anuais desde a descoberta da fraude. Esse resultado, "
            "no entanto, foi impulsionado majoritariamente por um ganho "
            "financeiro nao recorrente relacionado a quitacao e renegociacao "
            "de dividas no ambito da recuperacao judicial (deducao contabil "
            "do passivo perdoado), e nao por uma melhora estrutural da "
            "operacao de varejo. A receita liquida do ano ficou em torno de "
            "R$ 14,3 bilhoes, estavel em relacao a 2023. E importante que um "
            "sistema de analise de risco nao confunda esse lucro contabil "
            "pontual com recuperacao operacional sustentavel."
        ),
    },
    {
        "id": "magazineluiza_2022_resultado",
        "empresa": "Magazine Luiza",
        "periodo": "2022",
        "fonte": "Demonstracoes financeiras 2022 - Magazine Luiza RI",
        "tipo_fonte": "Documento oficial de RI",
        "texto": (
            "O Magazine Luiza encerrou 2022 com receita liquida de "
            "aproximadamente R$ 37,3 bilhoes e prejuizo liquido de cerca de "
            "R$ 499 milhoes, o primeiro resultado negativo da companhia em "
            "anos, em um contexto de alta da taxa de juros, maior custo de "
            "capital de giro e desaceleracao do consumo de bens duraveis no "
            "varejo online. O patrimonio liquido permaneceu positivo, em "
            "torno de R$ 10,6 bilhoes, e a divida bruta era de "
            "aproximadamente R$ 7,1 bilhoes - uma situacao de risco bem "
            "menos severa que a das concorrentes Americanas e Via, apesar do "
            "prejuizo no exercicio."
        ),
    },
    {
        "id": "magazineluiza_2023_resultado",
        "empresa": "Magazine Luiza",
        "periodo": "2023",
        "fonte": "Demonstracoes financeiras 31/12/2023 - Magazine Luiza RI",
        "tipo_fonte": "Demonstracao financeira oficial (auditada)",
        "texto": (
            "Em 2023, o Magazine Luiza manteve receita liquida praticamente "
            "estavel, em torno de R$ 36,8 bilhoes, mas o prejuizo liquido do "
            "exercicio se aprofundou para aproximadamente R$ 979 milhoes "
            "segundo as demonstracoes financeiras oficiais da companhia. Por "
            "outro lado, a empresa reduziu sua divida bruta para cerca de "
            "R$ 5,4 bilhoes (de R$ 7,1 bilhoes em 2022), sinalizando um "
            "esforco de desalavancagem mesmo durante o periodo de prejuizo. "
            "O patrimonio liquido seguiu positivo, em torno de R$ 9,6 "
            "bilhoes. Reportagens do final de 2023 e inicio de 2024 sobre o "
            "resultado do 4o trimestre destacaram sinais de melhora "
            "operacional trimestral (reducao de despesas, geracao de caixa "
            "no trimestre), mesmo com o resultado anual acumulado ainda "
            "negativo - uma distincao importante entre tendencia trimestral "
            "e resultado anual que o sistema de analise deve conseguir "
            "diferenciar."
        ),
    },
    {
        "id": "viacasasbahia_2022_resultado",
        "empresa": "Via/Grupo Casas Bahia",
        "periodo": "2022",
        "fonte": "Via Varejo tem prejuizo de R$ 342 milhoes em 2022 - Poder360",
        "tipo_fonte": "Imprensa especializada",
        "texto": (
            "Em 2022, ainda sob a razao social Via S.A., a companhia "
            "registrou prejuizo liquido de aproximadamente R$ 342 milhoes, "
            "em meio a um cenario de alta de juros, maior inadimplencia no "
            "credito ao consumidor e pressao de custos logisticos no varejo "
            "fisico e online. O resultado reforcou o processo de "
            "reestruturacao que a companhia vinha conduzindo, incluindo "
            "revisao de portfolio de lojas e foco em categorias mais "
            "rentaveis, que antecedeu o rebranding para Grupo Casas Bahia "
            "nos anos seguintes."
        ),
    },
    {
        "id": "viacasasbahia_2023_2024_resultado",
        "empresa": "Via/Grupo Casas Bahia",
        "periodo": "2023-2024",
        "fonte": "Destaques dos Resultados - Grupo Casas Bahia RI (Mziq)",
        "tipo_fonte": "Documento oficial de RI",
        "texto": (
            "Entre 2023 e 2024, a companhia - ja em processo de rebranding "
            "para Grupo Casas Bahia (BHIA3) - reduziu receita liquida de "
            "cerca de R$ 28,8 bilhoes para R$ 27,2 bilhoes, mantendo "
            "prejuizo liquido em ambos os anos (aproximadamente R$ 2,6 "
            "bilhoes em 2023 e R$ 1,0 bilhao em 2024, uma reducao "
            "significativa do prejuizo). O patrimonio liquido caiu de cerca "
            "de R$ 3,5 bilhoes para R$ 2,5 bilhoes, e a divida bruta ficou "
            "estavel, em torno de R$ 4,0 bilhoes. Em 2024, a posicao de "
            "divida liquida ajustada tornou-se negativa (cerca de -R$ 360 "
            "milhoes), indicando posicao de caixa superior a divida "
            "financeira bruta considerando ajustes contratuais - um sinal "
            "de melhora na liquidez mesmo com o resultado liquido ainda "
            "negativo. Analises de mercado publicadas ao longo de 2024 e "
            "2026 (incluindo cobertura da Forbes Brasil) descreveram a "
            "companhia como em situacao financeira ainda fragil e sob forte "
            "escrutinio de credores e investidores, apesar da reducao do "
            "prejuizo anual."
        ),
    },
    {
        "id": "lojasrenner_2021_2024_resultado",
        "empresa": "Lojas Renner",
        "periodo": "2021-2024",
        "fonte": "Relatorio Anual 2024 - Lojas Renner RI",
        "tipo_fonte": "Relatorio anual oficial (RI)",
        "texto": (
            "A Lojas Renner (LREN3) e a unica das 4 varejistas analisadas "
            "que manteve lucro liquido positivo em todos os anos do periodo "
            "2021-2023, com receita liquida de varejo crescendo de "
            "aproximadamente R$ 9,6 bilhoes em 2021 para R$ 11,7 bilhoes em "
            "2023, e lucro liquido oscilando entre R$ 976 milhoes e "
            "R$ 1,29 bilhao no periodo. Em 2024, a receita liquida de varejo "
            "alcancou cerca de R$ 12,7 bilhoes. Vale notar que esses valores "
            "de receita se referem apenas a operacao de varejo, nao "
            "incluindo a receita financeira da Realize (braco de credito e "
            "cartoes da Renner), o que deve ser considerado ao comparar "
            "diretamente com concorrentes que consolidam receita financeira "
            "na mesma linha. Reportagens do final de 2024 e inicio de 2025 "
            "sobre o 4o trimestre mencionaram reacoes de mercado mistas "
            "('ruido') a resultados pontuais, mesmo com a trajetoria anual "
            "da empresa permanecendo solida e sem os sinais de risco "
            "financeiro severo observados em Americanas e Via/Casas Bahia."
        ),
    },
]


def slug_header(doc):
    linhas = [
        f"[DOC_ID] {doc['id']}",
        f"[EMPRESA] {doc['empresa']}",
        f"[PERIODO] {doc['periodo']}",
        f"[FONTE] {doc['fonte']}",
        f"[TIPO_FONTE] {doc['tipo_fonte']}",
        "[OBS] Texto de sintese original, redigido pelo grupo a partir da fonte "
        "citada acima; nao e copia literal de nenhum documento ou materia.",
        "-" * 70,
        "",
    ]
    return "\n".join(linhas)


def main():
    index_rows = []
    for doc in DOCUMENTOS:
        path = os.path.join(CORPUS_DIR, f"{doc['id']}.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write(slug_header(doc))
            f.write(doc["texto"].strip() + "\n")
        index_rows.append(
            {
                "doc_id": doc["id"],
                "empresa": doc["empresa"],
                "periodo": doc["periodo"],
                "fonte": doc["fonte"],
                "tipo_fonte": doc["tipo_fonte"],
                "arquivo": f"corpus/{doc['id']}.txt",
            }
        )
        print(f"Gerado: {path}")

    index_path = os.path.join(os.path.dirname(__file__), "fontes_corpus.csv")
    with open(index_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["doc_id", "empresa", "periodo", "fonte", "tipo_fonte", "arquivo"]
        )
        writer.writeheader()
        writer.writerows(index_rows)
    print(f"Indice de fontes gerado: {index_path}")
    print(f"Total de documentos no corpus: {len(DOCUMENTOS)}")


if __name__ == "__main__":
    main()
