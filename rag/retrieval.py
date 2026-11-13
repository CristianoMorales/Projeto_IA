# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: retrieval.py
# Sintese do conteudo: Implementa a etapa de recuperacao (retrieval) do
#   pipeline RAG (Retrieval-Augmented Generation) da N2, usando representacao
#   esparsa TF-IDF (TfidfVectorizer, scikit-learn) e similaridade de cosseno
#   para indexar o corpus de documentos (rag/corpus/*.txt) e recuperar, dada
#   uma pergunta em linguagem natural, os K documentos mais relevantes com
#   seus metadados de fonte (empresa, periodo, fonte, tipo de fonte). Essa
#   abordagem foi escolhida por ser uma tecnica classica e legitima de
#   recuperacao de informacao, que nao depende de APIs de embeddings neurais
#   (indisponiveis no ambiente de desenvolvimento usado, ver README do
#   projeto), mas que ainda assim produz recuperacao semantica razoavel por
#   sobreposicao lexical ponderada por raridade dos termos (IDF).
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao do modulo de retrieval TF-IDF e
#               de um demo de validacao (consultas de exemplo) no __main__.
# =============================================================================

import csv
import os
import unicodedata

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

RAG_DIR = os.path.dirname(__file__)
CORPUS_DIR = os.path.join(RAG_DIR, "corpus")
INDICE_FONTES = os.path.join(RAG_DIR, "fontes_corpus.csv")


def _normalizar(texto: str) -> str:
    """Remove acentos para reduzir variacao lexical (ajuda o TF-IDF em
    PT-BR, onde a mesma palavra aparece com e sem acentuacao em fontes
    diferentes)."""
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def carregar_corpus():
    """Le o indice de fontes e o conteudo (sem o cabecalho de metadados) de
    cada documento do corpus. Retorna uma lista de dicts com doc_id,
    metadados e o texto puro usado para indexacao."""
    with open(INDICE_FONTES, encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))

    documentos = []
    for linha in linhas:
        caminho = os.path.join(RAG_DIR, linha["arquivo"])
        with open(caminho, encoding="utf-8") as f:
            conteudo = f.read()
        # o corpo do texto vem depois do separador "----...----\n\n"
        partes = conteudo.split("-" * 70, 1)
        texto = partes[1].strip() if len(partes) == 2 else conteudo.strip()
        documentos.append(
            {
                "doc_id": linha["doc_id"],
                "empresa": linha["empresa"],
                "periodo": linha["periodo"],
                "fonte": linha["fonte"],
                "tipo_fonte": linha["tipo_fonte"],
                "texto": texto,
            }
        )
    return documentos


class IndiceRetrieval:
    """Indice TF-IDF sobre o corpus, com busca por similaridade de cosseno."""

    def __init__(self, documentos):
        self.documentos = documentos
        self.vectorizer = TfidfVectorizer(
            preprocessor=_normalizar,
            ngram_range=(1, 2),
            min_df=1,
        )
        textos = [d["texto"] for d in documentos]
        self.matriz = self.vectorizer.fit_transform(textos)

    def buscar(self, consulta: str, k: int = 3):
        """Retorna os k documentos mais relevantes para a consulta, cada um
        como dict com score de similaridade + metadados + texto."""
        vetor_consulta = self.vectorizer.transform([consulta])
        scores = cosine_similarity(vetor_consulta, self.matriz).flatten()
        ordenados = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )
        resultados = []
        for i in ordenados[:k]:
            doc = dict(self.documentos[i])
            doc["score"] = round(float(scores[i]), 4)
            resultados.append(doc)
        return resultados


def construir_indice():
    documentos = carregar_corpus()
    return IndiceRetrieval(documentos)


if __name__ == "__main__":
    indice = construir_indice()
    consultas_teste = [
        "Qual foi o resultado da Americanas em 2022 apos a fraude contabil?",
        "A Magazine Luiza teve prejuizo ou lucro em 2023?",
        "Situacao de divida e patrimonio liquido do Grupo Casas Bahia",
        "Lojas Renner teve resultado positivo nos ultimos anos?",
    ]
    for consulta in consultas_teste:
        print("=" * 90)
        print(f"CONSULTA: {consulta}")
        for r in indice.buscar(consulta, k=2):
            print(f"  [{r['score']:.3f}] {r['doc_id']} | {r['empresa']} {r['periodo']} | fonte: {r['fonte']}")
