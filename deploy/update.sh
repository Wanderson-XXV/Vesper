#!/usr/bin/env bash
set -Eeuo pipefail

# Atualiza uma instalação existente sem tocar no .env nem no volume do PostgreSQL.
# Execute na VPS atual com: bash /opt/apps/vesper/deploy/update.sh

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(CDPATH= cd -- "$script_dir/.." && pwd)"
compose=(docker compose --env-file "$repo_dir/deploy/.env" -f "$repo_dir/deploy/docker-compose.yml")

if [[ ! -f "$repo_dir/deploy/.env" ]]; then
  echo "Arquivo ausente: $repo_dir/deploy/.env" >&2
  echo "Crie-o a partir de .env.example antes do primeiro deploy." >&2
  exit 1
fi

if [[ "$(git -C "$repo_dir" symbolic-ref --short HEAD)" != "main" ]]; then
  echo "A instalação de produção precisa estar na branch main." >&2
  exit 1
fi

git -C "$repo_dir" fetch --prune origin main
git -C "$repo_dir" pull --ff-only origin main

"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --remove-orphans
"${compose[@]}" ps

# Verifica o app por dentro da rede Compose. Isso confirma aplicação e PostgreSQL,
# sem depender de DNS, TLS ou de expor credenciais no log do deploy.
"${compose[@]}" exec -T app node --input-type=module -e '
  const response = await fetch("http://127.0.0.1:5173/api/health");
  const body = await response.text();
  process.stdout.write(`${body}\n`);
  if (!response.ok) process.exit(1);
'

echo "Deploy concluído em $repo_dir"
