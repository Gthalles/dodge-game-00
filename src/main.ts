import './style.css'

type Vec2 = { x: number; y: number }

type Player = {
  pos: Vec2
  vel: Vec2
  radius: number
  speed: number
  hp: number
  maxHp: number
}

type Projectile = {
  pos: Vec2
  dir: Vec2
  speed: number
  radius: number
  ttl: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing #app')
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
if (!ctx) {
  throw new Error('Canvas 2D not supported')
}
app.appendChild(canvas)

const world = {
  width: 3000,
  height: 3000,
}

const player: Player = {
  pos: { x: world.width / 2, y: world.height / 2 },
  vel: { x: 0, y: 0 },
  radius: 16,
  speed: 240,
  hp: 500,
  maxHp: 500,
}

const projectiles: Projectile[] = []

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
}

let lastTime = performance.now()
let fps = 0
let fpsSmoothing = 0
let fpsTimer = 0
let frames = 0

let spawnTimer = 0
let nextSpawn = randRange(0.4, 1.2)

let survived = 0
let flashTimer = 0
let shakeTimer = 0
let gameOver = false

function resize() {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(window.innerWidth * dpr)
  canvas.height = Math.floor(window.innerHeight * dpr)
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

window.addEventListener('resize', resize)
resize()

window.addEventListener('keydown', (event) => {
  if (event.repeat) return
  setKey(event.key, true)
})

window.addEventListener('keyup', (event) => {
  setKey(event.key, false)
})

function setKey(key: string, pressed: boolean) {
  if (key === 'w' || key === 'ArrowUp') input.up = pressed
  if (key === 's' || key === 'ArrowDown') input.down = pressed
  if (key === 'a' || key === 'ArrowLeft') input.left = pressed
  if (key === 'd' || key === 'ArrowRight') input.right = pressed
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalize(v: Vec2) {
  const len = Math.hypot(v.x, v.y)
  if (len === 0) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

function distanceSq(a: Vec2, b: Vec2) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function spawnProjectile() {
  const edge = Math.floor(Math.random() * 4)
  let x = 0
  let y = 0
  if (edge === 0) {
    x = randRange(0, world.width)
    y = 0
  } else if (edge === 1) {
    x = world.width
    y = randRange(0, world.height)
  } else if (edge === 2) {
    x = randRange(0, world.width)
    y = world.height
  } else {
    x = 0
    y = randRange(0, world.height)
  }

  const dir = normalize({ x: player.pos.x - x, y: player.pos.y - y })
  projectiles.push({
    pos: { x, y },
    dir,
    speed: randRange(220, 320),
    radius: 8,
    ttl: 6,
  })
}

function update(dt: number) {
  if (gameOver) return

  const inputDir = {
    x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    y: (input.down ? 1 : 0) - (input.up ? 1 : 0),
  }

  const dir = normalize(inputDir)
  player.vel.x = dir.x * player.speed
  player.vel.y = dir.y * player.speed

  player.pos.x += player.vel.x * dt
  player.pos.y += player.vel.y * dt

  player.pos.x = clamp(player.pos.x, player.radius, world.width - player.radius)
  player.pos.y = clamp(player.pos.y, player.radius, world.height - player.radius)

  spawnTimer += dt
  if (spawnTimer >= nextSpawn) {
    spawnTimer = 0
    nextSpawn = randRange(0.4, 1.2)
    spawnProjectile()
  }

  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i]
    p.pos.x += p.dir.x * p.speed * dt
    p.pos.y += p.dir.y * p.speed * dt
    p.ttl -= dt
    if (p.ttl <= 0) {
      projectiles.splice(i, 1)
      continue
    }

    const r = player.radius + p.radius
    if (distanceSq(player.pos, p.pos) <= r * r) {
      projectiles.splice(i, 1)
      player.hp -= 1
      flashTimer = 0.15
      shakeTimer = 0.2
      if (player.hp <= 0) {
        gameOver = true
      }
    }
  }

  survived += dt
  flashTimer = Math.max(0, flashTimer - dt)
  shakeTimer = Math.max(0, shakeTimer - dt)
}

function render() {
  const w = canvas.width / (window.devicePixelRatio || 1)
  const h = canvas.height / (window.devicePixelRatio || 1)

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, w, h)

  const camera = {
    x: player.pos.x,
    y: player.pos.y,
  }

  let shakeX = 0
  let shakeY = 0
  if (shakeTimer > 0) {
    const magnitude = 4 * (shakeTimer / 0.2)
    shakeX = randRange(-magnitude, magnitude)
    shakeY = randRange(-magnitude, magnitude)
  }

  const screenCenter = { x: w / 2 + shakeX, y: h / 2 + shakeY }
  const worldToScreen = (p: Vec2) => ({
    x: p.x - camera.x + screenCenter.x,
    y: p.y - camera.y + screenCenter.y,
  })

  drawGrid(w, h, camera, screenCenter)

  ctx.save()
  ctx.translate(screenCenter.x - camera.x, screenCenter.y - camera.y)

  ctx.strokeStyle = '#1e1e1e'
  ctx.lineWidth = 4
  ctx.strokeRect(0, 0, world.width, world.height)

  ctx.fillStyle = '#ffcc66'
  ctx.beginPath()
  ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#66aaff'
  for (const p of projectiles) {
    ctx.beginPath()
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  drawHud(w, h)

  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 50, 50, ${flashTimer / 0.15})`
    ctx.fillRect(0, 0, w, h)
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = '48px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', w / 2, h / 2)
    ctx.font = '18px "Trebuchet MS", sans-serif'
    ctx.fillText('Recarregue a página para jogar de novo', w / 2, h / 2 + 32)
  }

  function drawGrid(width: number, height: number, cam: Vec2, center: Vec2) {
    const gridSize = 100
    const startX = Math.floor((cam.x - center.x) / gridSize) * gridSize
    const endX = Math.ceil((cam.x + (width - center.x)) / gridSize) * gridSize
    const startY = Math.floor((cam.y - center.y) / gridSize) * gridSize
    const endY = Math.ceil((cam.y + (height - center.y)) / gridSize) * gridSize

    ctx.strokeStyle = '#121212'
    ctx.lineWidth = 1
    for (let x = startX; x <= endX; x += gridSize) {
      const p1 = worldToScreen({ x, y: startY })
      const p2 = worldToScreen({ x, y: endY })
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }

    for (let y = startY; y <= endY; y += gridSize) {
      const p1 = worldToScreen({ x: startX, y })
      const p2 = worldToScreen({ x: endX, y })
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
  }

  function drawHud(width: number, height: number) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('rodando', 18, 24)
    ctx.fillText(`vida: ${player.hp}/${player.maxHp}`, 18, 46)
    ctx.fillText(`tempo: ${survived.toFixed(1)}s`, 18, 68)
    ctx.fillText(`projéteis: ${projectiles.length}`, 18, 90)
    ctx.fillText(`fps: ${fps.toFixed(0)}`, 18, 112)

    const barWidth = 160
    const barHeight = 10
    const barX = 18
    const barY = height - 28
    const hpRatio = Math.max(0, player.hp / player.maxHp)
    ctx.fillStyle = '#222222'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = '#ff5555'
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight)
    ctx.strokeStyle = '#ffffff'
    ctx.strokeRect(barX, barY, barWidth, barHeight)
  }
}

function loop(now: number) {
  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now

  update(dt)
  render()

  frames += 1
  fpsTimer += dt
  if (fpsTimer >= 0.5) {
    fps = frames / fpsTimer
    fpsTimer = 0
    frames = 0
    fpsSmoothing = fpsSmoothing === 0 ? fps : fpsSmoothing * 0.85 + fps * 0.15
  }
  fps = fpsSmoothing || fps

  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
