# Self-contained local LLM service for generate-day-text
# (docs/specs/tagestext.md): the model is baked into the image at build
# time, so `docker compose up` alone gives a ready-to-use service — no
# separate manual `ollama pull` step.

FROM ollama/ollama:latest

ARG MODEL=llama3.2

# Start the server, wait for it to accept connections, pull the model into
# the image's /root/.ollama, then stop the server again — the running
# container just serves what's already on disk.
RUN (ollama serve &) && \
    for i in $(seq 1 30); do ollama list >/dev/null 2>&1 && break; sleep 1; done && \
    ollama pull "${MODEL}" && \
    pkill ollama

ENV OLLAMA_MODEL=${MODEL}
