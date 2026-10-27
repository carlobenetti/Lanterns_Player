# Bug log

Bugs encontrados durante as mudanças e a regra para não repetir.

## 2026-10-23 — Controles de volta na tela cheia

### Tela cheia sem controles
- **O que quebrou:** na tela cheia não havia como pausar, pular música, buscar na música ou mudar o volume. A barra de baixo do app some no Now playing, e a tela cheia tinha só capa, nome e barras, então não sobrava nenhum controle.
- **Por quê:** o redesenho minimalista tirou os controles de propósito, e o teste chegava a exigir que eles não aparecessem (`expect(Wrapper.controls).not.toBeInTheDocument()`).
- **Correção:** o bloco de barra de tempo + botões + volume virou o componente `PlaybackPanel`, usado nas duas telas. Na tela cheia ele fica embaixo das barras; o botão de sair da tela cheia continua só no canto de cima, para não ter dois botões com o mesmo `data-testid`.
- **Regra:** toda tela que esconde a barra do player precisa oferecer pelo menos tocar/pausar, anterior/próxima, tempo e volume. Minimalismo nunca tira controle de reprodução.

### Barras em repouso por cima da barra de tempo (pego na prévia)
- **O que quebrou:** copiei o `translate-y-[20%]` da tela normal para as barras da tela cheia, e os pontinhos das barras em repouso ficaram em cima da linha da barra de tempo.
- **Correção:** na tela cheia as barras não são deslocadas; o espaço entre elas e o painel vem do `gap-4`.
- **Regra:** deslocamento visual que depende do tamanho do quadro (`translate` em %) não pode ser copiado entre layouts com alturas diferentes; conferir na prévia.

## 2026-10-23 — Tela cheia redesenhada

### Barras ocupando só metade da tela cheia
- **O que quebrou:** na tela cheia as barras ficaram com ~300px de largura, no canto esquerdo.
- **Por quê:** `<canvas>` é um elemento substituído. Com `position: absolute`, `left` + `right` não esticam a largura dele como esticam um `<div>`; ele fica com a largura intrínseca (300px por padrão).
- **Correção:** um `<div>` absoluto define posição e tamanho, e o canvas dentro dele usa `w-full h-full`.
- **Regra:** nunca posicionar `<canvas>` (ou `<img>`, `<video>`) esticando com `left`/`right`/`inset`; envolver num `<div>` e deixar o elemento com `w-full h-full`.

### Planeta lavado (verde-menta) no app real
- **O que quebrou:** no app, o planeta ficava claro demais, com continentes quase brancos.
- **Por quê:** (1) o gradiente da atmosfera começava em 85% do raio, e um gradiente radial pinta a cor do primeiro stop em tudo que fica dentro do raio interno, ou seja, enchia o planeta de verde, mais forte quanto mais grave; (2) os continentes usavam `globalCompositeOperation = 'lighter'`, que soma luz e vira branco sobre fundo verde; (3) no tema claro o `--primary` é bem mais claro. A prévia isolada usava cores fixas escuras e não mostrava isso.
- **Correção:** a atmosfera é recortada (`clip('evenodd')`) para ficar só fora do disco, o oceano ganhou uma base escura fixa e os continentes são pintados normalmente (`source-over`).
- **Regra:** gradiente radial com raio interno > 0 pinta o miolo; recortar se o miolo não deve ser pintado. Evitar `lighter` em cima de fundos que mudam com o tema. Conferir visual nos dois temas.

### Como ver a tela de verdade sem a janela do Tauri
- Com `pnpm dev` rodando (Vite em `localhost:5173`), criar temporariamente `packages/player/preview-*.html` + `.tsx` que importam os CSS (`@nuclearplayer/tailwind-config`, `@nuclearplayer/themes`, `@nuclearplayer/i18n`), populam os stores (fila, tela cheia) e renderizam o componente real. Para simular música, trocar `audioAnalyser.get` por um analisador falso e pôr `useSoundStore` em `playing`. Abrir no Chrome, alternar `data-theme`, e apagar os arquivos no fim.

### Faixa preta embaixo da tela cheia (Windows)
- **O que quebrou:** ao entrar em tela cheia, sobrava uma faixa preta de ~40px embaixo, a altura exata da barra de tarefas do Windows.
- **Por quê (provável):** a janela abre maximizada e sem moldura nativa (title bar própria). No Windows, uma janela sem moldura que vai de maximizada para tela cheia mantém o tamanho de maximizada (tela menos barra de tarefas).
- **Correção:** `fullscreenStore` guarda se a janela estava maximizada, chama `unmaximize()` antes de `setFullscreen(true)` e `maximize()` depois de sair. As permissões `core:window:allow-maximize` e `allow-unmaximize` foram adicionadas em `capabilities/desktop.json`.
- **Regra:** toda mudança de modo de janela (tela cheia, maximizar) precisa considerar o estado anterior da janela e restaurá-lo. Comando de janela novo exige permissão nova em `capabilities/desktop.json`, senão falha só no app real (nos testes a janela é mock).
- **Ainda não verificado no app real:** os testes usam mock da janela; conferir no Windows.

## 2026-10-22 — Barras 20% mais baixas, planeta 25% mais alto

### Risco evitado: barras por cima da barra de tempo
- **O que poderia quebrar:** para descer as barras além do próprio quadro, o canvas foi deslocado com `translate-y-[20%]` e passa a ficar por baixo da barra de tempo. Sem cuidado, ele roubaria os cliques do seek bar.
- **Prevenção:** o canvas ganhou `pointer-events-none` e o bloco do seek bar ganhou `relative`, para ser pintado por cima.
- **Regra:** todo canvas decorativo que se sobrepõe a controles leva `pointer-events-none`, e o controle fica posicionado acima dele.

### Planeta e estrelas desalinhados
- **O que poderia quebrar:** subir só o planeta tiraria ele do ponto de onde saem as estrelas.
- **Prevenção:** o ponto de fuga das estrelas e a nebulosa usam o mesmo centro (`VANISHING_POINT_RATIO`). O espalhamento vertical das estrelas continua usando metade da altura (`spreadY`), para não ficarem mais raras embaixo.
- **Regra:** planeta, nebulosa e estrelas compartilham um único centro.

## 2026-10-22 — Continentes reais e barras mais baixas

### Filtro de linhas que deixou pedaços de funções antigas
- **O que quebrou:** ao trocar o ruído pelos contornos reais, removi o código antigo filtrando linhas que começavam com `const`. As primeiras linhas das funções antigas (`const smoothstep = (...) => {` etc.) passaram no filtro e ficaram soltas no arquivo.
- **Correção:** apaguei as linhas que sobraram antes de rodar o lint.
- **Regra:** para remover um bloco de código, cortar por posição (do início do bloco até um marcador conhecido), nunca filtrando por prefixo de linha. Ler o topo do arquivo logo depois.

### Continentes do outro lado confundindo o contorno
- **O que quebrou:** com contornos de verdade, o reflexo dos continentes do lado de trás (`FAR_SIDE_LAND_ALPHA = 0.16`) se misturava com os da frente e borrava a forma.
- **Correção:** 0.16 → 0.09.
- **Regra:** o reflexo do outro lado é só um detalhe de vidro e nunca pode competir com os continentes da frente.

## 2026-10-22 — Planeta de vidro, mais distante

### Arco de luz que parecia uma linha solta
- **O que quebrou:** o contorno ciano desenhado só em meia-volta do lado esquerdo do planeta parecia uma linha azul flutuando, não um reflexo.
- **Correção:** o arco saiu. O brilho da borda agora é um gradiente radial dentro do disco, igual em toda a volta (efeito de vidro).
- **Regra:** nada de traço fino parcial para simular luz; brilho de borda vem de gradiente preso ao disco.

### Vidro claro demais (pego na prévia)
- **O que quebrou:** a primeira versão de vidro tinha a borda brilhante forte e larga (`GLASS_EDGE_ALPHA = 0.5`, começando em 55% do raio), e o brilho dos continentes se espalhava. O planeta ficou todo verde-claro e os continentes sumiram de novo.
- **Correção:** a borda ficou mais fina e fraca (0.3, começando em 75%), o corpo mais transparente e o brilho dos continentes menor.
- **Regra:** o contraste continente × oceano é o que importa nesse planeta. Depois de mexer em qualquer camada, conferir na prévia se os continentes ainda se destacam.

## 2026-10-22 — Planeta esmeralda no fundo do Now playing

### Continentes sumindo no oceano (pego na prévia, antes de entregar)
- **O que quebrou:** na primeira versão, oceano e continentes eram os dois verdes, e a aura da atmosfera (que começa dentro do disco) esverdeava ainda mais o oceano. O planeta ficou parecendo uma bola verde lisa.
- **Correção:** o oceano ganhou uma camada escura com um leve tom ciano por cima; a terra ficou em verde cheio (`LAND_ALPHA = 1`).
- **Regra:** efeito visual de canvas não aparece nos testes (o `getContext` é falso no jsdom). Antes de entregar, conferir numa prévia isolada: empacotar o módulo com o esbuild do `node_modules`, servir em `127.0.0.1` e olhar no Chrome.

### Sentido da rotação (pego na revisão)
- **O que quebrou:** somar a rotação à longitude fazia o relevo andar para a esquerda, ao contrário da Terra.
- **Correção:** a amostra usa `longitude - rotation`, e o relevo anda da esquerda para a direita.
- **Regra:** em mapas de textura animados, conferir o sentido pensando onde uma feição fixa da textura aparece na tela quando o tempo avança.

## 2026-10-22 — Botão Atualizar em All music + quadrado atrás das barras

### Quadrado levemente visível atrás das barras do Now playing
- **O que quebrou:** um retângulo de brilho verde aparecia atrás das barras, com borda reta contrastando com o fundo de estrelas.
- **Por quê:** o `SpectrumVisualizer` desenhava uma "aura" (gradiente radial) dentro do próprio canvas. O raio crescia com o grave até passar das bordas do canvas, e o gradiente era cortado reto no limite dele.
- **Correção:** a aura saiu do canvas das barras; o brilho que pulsa com o grave ficou só na nebulosa do `StarfieldBackground`, que cobre a tela inteira (`NEBULA_ENERGY_ALPHA` 0.22 → 0.4).
- **Regra:** efeitos de brilho/fundo vão no canvas de tela cheia. Um canvas menor só desenha o que fica inteiro dentro dele; se um gradiente pode chegar à borda, ele precisa terminar transparente antes dela.

### Suíte de testes inteira falhando por sobrecarga (falso alarme)
- **O que quebrou:** `pnpm --filter @nuclearplayer/player test -- src/views/Dashboard` ignorou o caminho, rodou os 36 arquivos com 36 processos de uma vez e 138 testes falharam por lentidão. Um snapshot espúrio (`displays the playlist name 1`) foi gravado em `PlaylistDetail.test.tsx.snap`.
- **Correção:** o snapshot foi revertido com `git checkout`; a suíte rodou limpa com `npx vitest --run --maxWorkers=4` (333/333).
- **Regra:** para um arquivo só, rodar `npx vitest --run <arquivo>` dentro de `packages/player`. Para a suíte toda no Windows, usar `--maxWorkers=4`. Depois de rodar testes, olhar `git status` em busca de `.snap` alterado sem querer.
