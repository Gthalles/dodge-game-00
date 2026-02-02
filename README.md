# game-00

Jogo simples em canvas (TypeScript + Vite) para rodar no navegador.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (ex.: `http://localhost:5173`).

## Controles

- Movimento: `WASD` ou setas do teclado
- Objetivo: sobreviver ao máximo desviando dos projeteis

## Milestones implementadas

### Milestone 0 — Bootstrap do projeto
- Vite + TypeScript
- Canvas full-screen
- Loop básico: `update(dt)` + `render()`
- Tela preta com “rodando” e `dt` estável

### Milestone 1 — Player (movimento + câmera “fake”)
- Entidade Player: posição, raio, velocidade
- Input WASD (state-based)
- Normalização do vetor de movimento
- Limites do mapa (colisão simples com bordas)

### Milestone 2 — Mapa simples e HUD
- Mundo maior que a tela (3000x3000)
- Grid no chão para sensação de movimento
- Câmera 2D seguindo o player (world → screen)
- HUD: vida, tempo sobrevivido, contador de projéteis ativos

### Milestone 3 — Projectile (linha reta)
- Entidade Projectile: posição, direção, velocidade, raio, TTL
- Spawn automático em intervalos aleatórios
- Spawn nas bordas do mapa mirando no player

### Milestone 4 — Colisão player × projétil
- Interseção círculo–círculo
- Ao colidir: reduz vida, flash vermelho e leve “shake”
- Game over ao chegar em 0 de vida

## Estrutura do projeto

- `src/main.ts` — lógica do jogo, loop, entidades, input, colisões e HUD
- `src/style.css` — estilos base e canvas full-screen
- `index.html` — entrypoint do Vite

## Notas de implementação

- `dt` é limitado a `0.05` para evitar saltos grandes em quedas de FPS.
- As coordenadas de mundo são convertidas para tela com uma câmera 2D simples.
- O grid é desenhado em coordenadas de mundo para reforçar a sensação de movimento.