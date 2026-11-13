# =============================================================================
# Projeto de Inteligencia Artificial - 7K SI Noite - Prof. Dr. Leandro Zerbinatti
# Universidade Presbiteriana Mackenzie - Faculdade de Computacao e Informatica
#
# Titulo do arquivo: gerar_respostas.py
# Sintese do conteudo: Etapa de geracao (generation) do pipeline RAG da N2.
#   Para cada empresa analisada, recupera os documentos mais relevantes do
#   corpus (rag/retrieval.py, TF-IDF) e envia um prompt ao modelo de linguagem
#   Gemini (Google AI Studio, API gratuita) pedindo: (1) um resumo executivo
#   da situacao financeira, (2) a extracao estruturada dos indicadores
#   citados no(s) documento(s)-fonte, e (3) uma sinalizacao de risco
#   (baixo/medio/alto) com a justificativa e a citacao do documento-fonte
#   usado. As respostas sao salvas em rag/outputs/respostas_llm.json para
#   serem usadas na validacao (rag/validar_resultados.py) e no relatorio.
#
#   OBS: este script faz chamadas de rede reais a generativelanguage.
#   googleapis.com. Ele nao pode ser executado dentro do ambiente de nuvem
#   usado para desenvolver o projeto (bloqueado por politica de rede) -
#   deve ser executado no computador de um dos integrantes do grupo, com uma
#   chave de API valida no arquivo .env (nunca commitado, ver .gitignore).
#
# Integrantes do grupo:
#   - Cristiano Morales      | RA 10437953 | 10437953@mackenzista.com.br
#   - Caio Carames           | RA 10308718 | 10308718@mackenzista.com.br
#   - Leonardo Tonon         | RA 10426930 | 10426930@mackenzista.com.br
#
# Historico de atualizacoes:
#   2026-11-13 | Cristiano Morales | Criacao do script de geracao via API
#               Gemini, integrado ao retrieval TF-IDF (rag/retrieval.py).
# =============================================================================

import json
import os
import sys
import time

from retrieval import construir_indice

RAG_DIR = os.path.dirname(__file__)
OUTPUTS_DIR = os.path.join(RAG_DIR, "outputs")
ENV_PATH = os.path.join(os.path.dirname(RAG_DIR), ".env")

MODELO = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

EMPRESAS = [
    "Magazine Luiza",
    "Americanas",
    "Via/Grupo Casas Bahia",
    "Lojas Renner",
]

PROMPT_SISTEMA = (
    "Voce e um analista de risco financeiro. Use APENAS as informacoes dos "
    "trechos de contexto fornecidos abaixo (nao use conhecimento externo "
    "nem invente numeros). Responda em portugues, em formato JSON valido, "
    "com exatamente estas chaves: "
    '"resumo_executivo" (string, ate 4 frases), '
    '"indicadores" (objeto com as chaves "resultado_liquido", '
    '"patrimonio_liquido", "divida_bruta", cada uma como string incluindo '
    "unidade e periodo, ou \"nao informado no contexto\" se nao houver), "
    '"sinal_risco" (uma de: "baixo", "medio", "alto"), '
    '"justificativa_risco" (string, ate 3 frases), '
    '"fontes_citadas" (lista de doc_id dos trechos de contexto usados).'
)


def _carregar_env():
    """Le pares KEY=VALUE do arquivo .env (sem dependencia externa) e injeta
    em os.environ, sem sobrescrever variaveis ja definidas no ambiente."""
    if not os.path.exists(ENV_PATH):
        return
    with open(ENV_PATH, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            chave, valor = linha.split("=", 1)
            chave, valor = chave.strip(), valor.strip().strip('"').strip("'")
            os.environ.setdefault(chave, valor)


def _montar_prompt(empresa, trechos):
    contexto = "\n\n".join(
        f"[doc_id: {t['doc_id']} | fonte: {t['fonte']}]\n{t['texto']}"
        for t in trechos
    )
    return (
        f"{PROMPT_SISTEMA}\n\n"
        f"EMPRESA ANALISADA: {empresa}\n\n"
        f"CONTEXTO RECUPERADO:\n{contexto}\n\n"
        "Responda apenas com o JSON, sem texto antes ou depois."
    )


def _chamar_gemini(client, prompt, tentativas=3):
    from google.genai import types

    for tentativa in range(1, tentativas + 1):
        try:
            resposta = client.models.generate_content(
                model=MODELO,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )
            return resposta.text
        except Exception as exc:  # noqa: BLE001
            print(f"  tentativa {tentativa}/{tentativas} falhou: {exc}")
            if tentativa == tentativas:
                raise
            time.sleep(2 * tentativa)


def main():
    _carregar_env()
    chave = os.environ.get("GEMINI_API_KEY")
    if not chave:
        print(
            "ERRO: variavel GEMINI_API_KEY nao encontrada.\n"
            "Crie um arquivo .env na raiz do projeto (projeto-ia-varejo/.env) "
            "com a linha:\n  GEMINI_API_KEY=sua_chave_aqui\n"
            "A chave e gerada gratuitamente em https://aistudio.google.com "
            "(botao 'Get API key')."
        )
        sys.exit(1)

    try:
        from google import genai
    except ImportError:
        print(
            "ERRO: pacote 'google-genai' nao instalado.\n"
            "Rode: pip install google-genai"
        )
        sys.exit(1)

    client = genai.Client(api_key=chave)
    indice = construir_indice()
    os.makedirs(OUTPUTS_DIR, exist_ok=True)

    resultados = {}
    for empresa in EMPRESAS:
        print(f"Processando: {empresa}")
        trechos = indice.buscar(empresa, k=3)
        prompt = _montar_prompt(empresa, trechos)
        try:
            texto_resposta = _chamar_gemini(client, prompt)
        except Exception as exc:  # noqa: BLE001
            print(f"  ERRO ao processar '{empresa}', pulando para a proxima: {exc}")
            resultados[empresa] = {"erro": str(exc)}
            continue
        try:
            resposta_json = json.loads(texto_resposta)
        except json.JSONDecodeError:
            print(f"  AVISO: resposta do modelo nao era JSON valido, salvando bruta.")
            resposta_json = {"_raw": texto_resposta}
        resultados[empresa] = {
            "resposta": resposta_json,
            "trechos_recuperados": [
                {"doc_id": t["doc_id"], "score": t["score"], "fonte": t["fonte"]}
                for t in trechos
            ],
        }

    saida = os.path.join(OUTPUTS_DIR, "respostas_llm.json")
    with open(saida, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    print(f"\nResultados salvos em: {saida}")


if __name__ == "__main__":
    main()
