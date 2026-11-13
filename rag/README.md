# Pipeline RAG (N2) — Análise de risco financeiro via LLM

Pipeline de **Retrieval-Augmented Generation** sobre documentos de RI/imprensa
das 4 varejistas analisadas (Magazine Luiza, Americanas, Via/Grupo Casas
Bahia, Lojas Renner), usando:

- **Retrieval**: TF-IDF + similaridade de cosseno (scikit-learn), sobre o
  corpus em `corpus/*.txt`. Não depende de nenhuma API externa.
- **Generation**: API gratuita do **Google Gemini** (Google AI Studio), que
  recebe os trechos recuperados e gera resumo executivo, extração de
  indicadores e sinalização de risco, citando a fonte.

## Como rodar

> ⚠️ Rode isso no **seu computador**, no terminal normal (cmd/PowerShell ou
> terminal do VS Code), **não** dentro de uma ferramenta de sandbox do
> Claude — a chamada à API do Gemini precisa de internet sem restrição.

1. Instale as dependências (uma vez):
   ```
   pip install -r requirements.txt
   ```
2. Copie `.env.example` (na raiz do projeto) para `.env` e cole sua chave:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```
   (gere a chave grátis em https://aistudio.google.com → "Get API key" —
   nunca compartilhe ou commite esse arquivo, ele já está no `.gitignore`)
3. Rode:
   ```
   cd rag
   python retrieval.py        # valida o retrieval (não precisa de chave)
   python gerar_respostas.py  # chama a API Gemini e salva outputs/respostas_llm.json
   ```

## Arquivos

- `build_corpus.py` — gera `corpus/*.txt` e `fontes_corpus.csv` a partir das
  sínteses factuais originais do grupo (já executado; os `.txt` ficam no
  repositório).
- `retrieval.py` — indexação TF-IDF e busca por similaridade de cosseno.
- `gerar_respostas.py` — chama a API Gemini com os trechos recuperados.
- `corpus/` — 9 documentos de texto (um por empresa/período), com cabeçalho
  de metadados de proveniência (fonte, tipo de fonte).
- `fontes_corpus.csv` — índice de rastreabilidade do corpus.
- `outputs/respostas_llm.json` — gerado ao rodar `gerar_respostas.py`
  (não versionado — cada execução gera de novo).

## Por que TF-IDF em vez de embeddings neurais?

APIs de embeddings neurais (Google, OpenAI) não eram alcançáveis a partir do
ambiente de desenvolvimento usado para construir o projeto (restrição de
rede do sandbox). TF-IDF é uma técnica clássica e legítima de recuperação de
informação (bag-of-words ponderado por IDF + similaridade de cosseno),
adequada para um corpus pequeno e temático como este, e documentada como
escolha metodológica consciente no relatório — não como limitação escondida.
