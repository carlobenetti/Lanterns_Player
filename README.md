# Lanterns Player

Player de música pessoal para tocar as pastas do computador. Cada pasta vira uma playlist com capa no Dashboard, e há uma tela "Tocando agora" com visualizador de espectro. Visual inspirado no Lanterna Verde.

É um fork do [Nuclear](https://github.com/nukeop/nuclear), reduzido para tocar só arquivos locais: sem plugins, sem busca online e sem integrações.

## Desenvolvimento

Monorepo com pnpm e Turborepo. O app é feito com Tauri (Rust + React).

### Pré-requisitos

- Node.js >= 22
- pnpm
- Rust (stable)
- Dependências do Tauri para o seu sistema ([docs do Tauri](https://v2.tauri.app/start/prerequisites/))

### Começar

```bash
pnpm install
pnpm dev
```

### Comandos úteis

```bash
pnpm dev            # Roda o player em modo de desenvolvimento
pnpm tauri build    # Gera o instalador
pnpm test           # Roda todos os testes
pnpm lint           # Lint de todos os pacotes
pnpm type-check     # Verificação de tipos
pnpm storybook      # Abre o Storybook
```

## Licença

AGPL-3.0, a mesma do Nuclear. Veja [LICENSE](LICENSE).
