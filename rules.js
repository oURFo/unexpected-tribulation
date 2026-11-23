export const RADIUS = 20
export const BODY_RADIUS = 0.45
export const REST = 5
export const STAGE_DURATION = 30
const LIGHTNING_DENSITY = 2.5
const FRUIT_CHANCE = .02
const FRUIT_LIFETIME = 10
const FRUIT_EXPERIENCE = 25
const FRUIT_RADIUS = .5
export const MAX_LEVEL = 15
export const SHIVER_LEVEL = 10
export const SHIVER_DURATION = 2
export const SHIVER_COOLDOWN = 30
const ORBS_PER_BATCH = 12
const START_HP = 70
const LEVEL_HP = 10
const HEAL_HP = 10
const MEDITATION_STAGGER = .65
export const REALMS = [
  ['煉氣期', 3.20, 1.50, 1.50, 1.75],
  ['築基期', 3.00, 1.46, 1.42, 1.70],
  ['金丹期', 2.75, 1.42, 1.34, 1.65],
  ['元嬰期', 2.50, 1.38, 1.26, 1.60],
  ['化神期', 2.25, 1.34, 1.18, 1.55, 6.5, 1.70],
  ['煉虛期', 2.00, 1.30, 1.10, 1.50, 6.1, 1.65],
  ['合體期', 1.72, 1.26, 1.02, 1.45, 5.7, 1.60],
  ['大乘期', 1.44, 1.22, 0.94, 1.40, 5.3, 1.55],
  ['渡劫期', 1.36, 1.18, 0.86, 1.35, 4.9, 1.50],
  ['散仙',   1.28, 1.14, 0.78, 1.30, 4.5, 1.45],
  ['地仙',   1.20, 1.10, 0.72, 1.25, 4.1, 1.40],
  ['天仙',   1.12, 1.06, 0.70, 1.20, 3.7, 1.35],
  ['金仙',   1.04, 1.02, 0.68, 1.15, 3.3, 1.30],
  ['太乙金仙', 0.96, 0.98, 0.66, 1.10, 2.9, 1.25],
  ['大羅金仙', 0.88, 0.94, 0.64, 1.05, 2.5, 1.20],
]
export const TYPES = [
  { radius: 2.2, damage: 32, growth: 3, color: 0xffce58 },
  { radius: 1.8, damage: 24, growth: 2, color: 0xa1e5ff },
  { radius: 2.6, damage: 12, growth: 2, unlockStage: 4, color: 0xff69c6 },
]
export const goal = level => 60 + 35 * (level - 1)

export function pointInRing(min, max, random = Math.random) {
  const angle = random() * 2 * Math.PI
  const radius = Math.sqrt(min ** 2 + (max ** 2 - min ** 2) * random())
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

export class Trial {
  constructor(random = Math.random) {
    this.random = random
    this.phase = 'title'
    this.stage = 0
    this.level = 1
    this.xp = 0
    this.hp = this.maxHp = START_HP
    this.charges = 3
    this.chargeTime = 0
    this.shiverTime = this.shiverCooldown = 0
    this.awaitingShiverIntro = false
    this.elapsed = this.age = this.hits = this.steps = 0
    this.x = this.z = this.dx = 0
    this.dz = 1
    this.idle = this.dash = this.meditationStagger = 0
    this.meditating = false
    this.events = []
    this.orbs = []
    this.fruit = []
    this.bolts = []
    this.timers = []
  }

  intro(practice = false) {
    this.practiceAfterIntro = practice
    this.phase = 'intro'
    this.remaining = 3
  }

  beginStage() {
    this.phase = 'trial'
    this.age = 0
    this.intervals = TYPES.map((_, i) => (REALMS[this.stage][1 + 2 * i] ?? Infinity) / LIGHTNING_DENSITY)
    this.timers = [...this.intervals]
    if (this.orbs.length === 0) this.refill()
  }

  refill() {
    for (let i = 0; i < ORBS_PER_BATCH; i++) {
      const [x, z] = pointInRing(16, RADIUS, this.random)
      const roll = this.random()
      this.orbs.push({x, z, speed: 0, kind: roll < .72 ? 0 : roll < .97 ? 1 : 2, intake: 0})
    }
  }

  flash(direction) {
    if (!['trial', 'rest', 'practice'].includes(this.phase) || !this.charges || this.dash || this.awaitingShiverIntro) return
    const [x, z] = direction ?? [this.dx, this.dz]
    const length = Math.hypot(x, z)
    if (!length) return
    this.dx = x / length
    this.dz = z / length
    this.charges--
    this.steps++
    this.dash = .25
    this.idle = 0
    this.meditating = false
    this.events.push({type:'dash', x:this.x, z:this.z})
  }

  shiver() {
    if (!['trial','rest'].includes(this.phase) || this.level < SHIVER_LEVEL ||
        this.shiverCooldown || this.awaitingShiverIntro) return
    this.shiverTime = SHIVER_DURATION
    this.shiverCooldown = SHIVER_COOLDOWN
    this.idle = 0
    this.meditating = false
    this.events.push({type:'shiver', x:this.x, z:this.z})
  }

  finish(outcome) {
    this.phase = outcome
    this.fruit.length = 0
    this.shiverTime = 0
    this.bolts.length = 0
    this.meditating = false
    this.events.push({type:this.phase})
  }

  randomWave() {
    const count = this.stage >= 8 ? 4 : this.stage >= 3 ? 3 : 2
    const positions = []
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 12; attempt++) {
        // One nearby bolt keeps a stationary player at risk. The others cover the arena.
        const nearby = i === 0 && attempt < 6
        const [dx, zOffset] = pointInRing(0, nearby ? 4.8 : RADIUS, this.random)
        const x = (nearby ? this.x : 0) + dx
        const z = (nearby ? this.z : 0) + zOffset
        if (Math.hypot(x, z) > RADIUS) continue
        if (positions.some(([px, pz]) => Math.hypot(x - px, z - pz) < 4)) continue
        positions.push([x, z])
        break
      }
      if (positions.length <= i) {
        // Fall back to well-separated points if the random samples all overlap.
        for (let slot = 0; slot < 12; slot++) {
          const angle = slot * Math.PI / 6
          const x = Math.cos(angle) * 15
          const z = Math.sin(angle) * 15
          if (positions.some(([px, pz]) => Math.hypot(x - px, z - pz) < 4)) continue
          positions.push([x, z])
          break
        }
      }
    }
    return positions
  }

  strikes(dt, immune, shivering = false) {
    const row = REALMS[this.stage]
    this.timers.forEach((seconds, i) => {
      this.timers[i] -= dt
      if (seconds > dt) return
      this.timers[i] += this.intervals[i]
      const positions = i === 1 ? this.randomWave() : [[this.x, this.z]]
      for (const [x, z] of positions) {
        this.bolts.push({x,z,kind:i, warning:row[2 + i * 2], age:0, ticks:0})
      }
      this.events.push({type:'warning'})
    })
    for (const bolt of this.bolts) {
      bolt.age += dt
      const active = bolt.age - bolt.warning
      const type = TYPES[bolt.kind]
      const count = bolt.kind === 2 ? 4 : 1
      while (bolt.ticks < count && active >= bolt.ticks * .5) {
        bolt.ticks++
        this.events.push({type:'strike', bolt})
        if (bolt.kind === 1 && this.random() < FRUIT_CHANCE) {
          this.fruit.push({x:bolt.x, z:bolt.z, expiresAt:this.elapsed+FRUIT_LIFETIME})
        }
        if (Math.hypot(this.x-bolt.x,this.z-bolt.z) > type.radius + BODY_RADIUS) continue
        if (shivering) this.events.push({type:'evade', x:this.x, z:this.z})
        if (immune || shivering) continue
        const damage = type.damage + type.growth * (this.stage - (type.unlockStage ?? 0))
        this.hp = Math.max(0, this.hp - damage)
        this.hits++
        this.idle = 0
        this.meditating = false
        this.meditationStagger = MEDITATION_STAGGER
        this.events.push({type:'hurt', damage})
        if (!this.hp) {
          this.finish('dead')
          return
        }
      }
    }
    this.bolts = this.bolts.filter(bolt => bolt.age < bolt.warning + (bolt.kind === 2 ? 2 : .3))
  }

  gainExperience(amount) {
    if (this.level >= MAX_LEVEL) return
    this.xp += amount
    while (this.level < MAX_LEVEL && this.xp >= goal(this.level)) {
      this.xp -= goal(this.level)
      this.level++
      if (this.level === SHIVER_LEVEL) {
        this.awaitingShiverIntro = true
        this.events.push({type:'shiverUnlocked', x:this.x, z:this.z})
      }
      this.maxHp += LEVEL_HP
      this.hp += LEVEL_HP
    }
    if (this.level === MAX_LEVEL) this.xp = 0
  }

  collectFruit() {
    for (let i = this.fruit.length - 1; i >= 0; i--) {
      const fruit = this.fruit[i]
      if (fruit.expiresAt <= this.elapsed + 1e-7) {
        this.fruit.splice(i,1)
      } else if (Math.hypot(this.x-fruit.x,this.z-fruit.z) <= BODY_RADIUS + FRUIT_RADIUS) {
        this.fruit.splice(i,1)
        this.gainExperience(FRUIT_EXPERIENCE)
        this.events.push({type:'fruit', x:fruit.x, z:fruit.z, xp:FRUIT_EXPERIENCE})
      }
    }
  }

  collect(dt) {
    if (!this.meditating) {
      for (const orb of this.orbs) {
        orb.speed = 0
        orb.intake = 0
      }
      return
    }
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i]
      const x = this.x - orb.x
      const z = this.z - orb.z
      const distance = Math.hypot(x,z)
      if (distance <= .8 || orb.intake > 0) {
        orb.intake += dt
        orb.x += x * Math.min(1, dt * 16)
        orb.z += z * Math.min(1, dt * 16)
        if (orb.intake < .12 || distance > .12) continue
        this.orbs.splice(i,1)
        if (orb.kind === 1) this.hp = Math.min(this.maxHp, this.hp + HEAL_HP)
        else if (orb.kind === 2 && this.charges < 3) {
          this.charges++
          if (this.charges === 3) this.chargeTime = 0
        }
        else this.gainExperience(orb.kind === 0 ? 10 : 5)
        this.events.push({type:'collect', kind:orb.kind})
        continue
      }
      orb.speed = Math.min(8.5, orb.speed + 2.4 * dt)
      const fraction = Math.min(1, dt * orb.speed / distance)
      orb.x += x * fraction
      orb.z += z * fraction
    }
    if (this.phase !== 'practice' && !this.orbs.some(orb => Math.hypot(orb.x,orb.z) >= 14 && Math.hypot(orb.x,orb.z) <= RADIUS)) {
      this.refill()
    }
  }

  update(dt, mx=0, mz=0) {
    if (this.awaitingShiverIntro) return
    if (this.phase === 'intro') {
      const previous = this.remaining
      this.remaining -= dt
      if (previous > 1.75 && this.remaining <= 1.75) this.events.push({type:'wake'})
      if (this.remaining <= 0) {
        if (this.practiceAfterIntro) this.phase = 'practice'
        else this.beginStage()
      }
      return
    }
    const practice = this.phase === 'practice'
    if (!practice && !['trial','rest'].includes(this.phase)) return
    if (!practice) this.elapsed += dt
    const moving = Math.hypot(mx,mz)
    const immune = this.dash > 0
    const shivering = this.shiverTime > 1e-7
    this.shiverCooldown = Math.max(0, this.shiverCooldown - dt)
    if (this.shiverCooldown < 1e-7) this.shiverCooldown = 0
    if (this.charges < 3) {
      this.chargeTime += dt
      if (this.chargeTime >= 10) {
        this.charges++
        this.chargeTime -= 10
      }
    } else this.chargeTime = 0

    const slowed = this.bolts.some(b => b.kind === 2 && b.age >= b.warning &&
      Math.hypot(this.x-b.x,this.z-b.z) <= TYPES[2].radius + BODY_RADIUS)
    if (immune) {
      const step = Math.min(dt, this.dash) * 20
      this.x += this.dx * step
      this.z += this.dz * step
      this.dash = Math.max(0, this.dash - dt)
    } else if (moving > 0) {
      this.dx = mx / moving
      this.dz = mz / moving
      const speed = Math.min(10, 6 + .15 * (this.level - 1)) * (slowed ? .5 : 1)
      this.x += this.dx * speed * Math.min(1,moving) * dt
      this.z += this.dz * speed * Math.min(1,moving) * dt
    }
    const distanceFromCenter = Math.hypot(this.x,this.z)
    if (practice && distanceFromCenter > RADIUS - BODY_RADIUS) {
      const scale = (RADIUS - BODY_RADIUS) / distanceFromCenter
      this.x *= scale
      this.z *= scale
    } else if (distanceFromCenter > RADIUS + BODY_RADIUS) {
      this.finish('escaped')
      return
    }
    this.meditationStagger = Math.max(0, this.meditationStagger - dt)
    this.idle = moving || immune || shivering || this.meditationStagger ? 0 : this.idle + dt
    this.meditating = this.idle >= .3
    if (this.phase === 'trial') this.strikes(dt, immune, shivering)
    this.shiverTime = Math.max(0, this.shiverTime - dt)
    if (this.phase === 'dead') return
    if (!practice) this.collectFruit()
    this.collect(dt)
    if (practice || this.awaitingShiverIntro) return
    if (this.phase === 'rest') {
      this.remaining -= dt
      if (this.remaining <= 1e-7) {
        this.stage++
        if (this.stage === REALMS.length - 1) this.finish('victory')
        else this.beginStage()
      }
    } else {
      this.age += dt
      if (this.age + 1e-7 >= STAGE_DURATION) {
        this.bolts.length = 0
        this.phase = 'rest'
        this.remaining = REST
        this.events.push({type:'breakthrough'})
      }
    }
  }
}
