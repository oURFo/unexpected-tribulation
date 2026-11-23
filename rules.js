export const RADIUS = 20
export const BODY_RADIUS = 0.45
export const REST = 5
export const REALMS = [
  ['煉氣期', 3.5, 1.8, 2.5, 2.0],
  ['築基期', 3.3, 1.7, 2.3, 1.9],
  ['金丹期', 3.1, 1.6, 2.1, 1.8],
  ['元嬰期', 2.9, 1.5, 1.9, 1.7],
  ['化神期', 2.7, 1.4, 1.8, 1.6, 8.0, 1.8],
  ['煉虛期', 2.5, 1.35, 1.6, 1.5, 7.5, 1.7],
  ['合體期', 2.3, 1.3, 1.5, 1.45, 7.0, 1.6],
  ['大乘期', 2.1, 1.25, 1.3, 1.4, 6.5, 1.55],
  ['渡劫期', 1.9, 1.2, 1.2, 1.35, 6.0, 1.5],
  ['散仙', 1.75, 1.15, 1.1, 1.3, 5.5, 1.45],
  ['地仙', 1.6, 1.1, 1.0, 1.25, 5.0, 1.4],
  ['天仙', 1.45, 1.05, 0.9, 1.2, 4.5, 1.35],
  ['金仙', 1.3, 1.0, 0.8, 1.15, 4.0, 1.3],
  ['太乙金仙', 1.15, 0.95, 0.7, 1.1, 3.5, 1.25],
  ['大羅金仙', 1.0, 0.9, 0.6, 1.05, 3.0, 1.2],
]
export const TYPES = [
  { radius: 2.2, damage: 25, color: 0xffce58 },
  { radius: 1.8, damage: 20, color: 0xa1e5ff },
  { radius: 2.6, damage: 12, color: 0xff69c6 },
]
export const goal = stage => 60 + 20 * stage
const minimumTrial = REALMS.map(row => row[5] ? row[5] + row[6] + .1 : 6)

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
    this.xp = 0
    this.hp = this.maxHp = 100
    this.charges = 3
    this.chargeTime = 0
    this.elapsed = this.age = this.hits = this.steps = 0
    this.x = this.z = this.dx = 0
    this.dz = 1
    this.idle = this.dash = 0
    this.meditating = false
    this.events = []
    this.orbs = []
    this.bolts = []
    this.timers = []
  }

  intro() {
    this.phase = 'intro'
    this.remaining = 3
  }

  beginStage() {
    this.phase = 'trial'
    this.age = 0
    this.timers = TYPES.map((_, i) => REALMS[this.stage][1 + 2 * i] ?? Infinity)
    if (this.orbs.length === 0) this.refill()
  }

  refill() {
    for (let i = 0; i < 25; i++) {
      const [x, z] = pointInRing(16, RADIUS, this.random)
      const roll = this.random()
      this.orbs.push({x, z, speed: 0, kind: roll < .72 ? 0 : roll < .97 ? 1 : 2, intake: 0})
    }
  }

  flash(direction) {
    if (!['trial', 'rest'].includes(this.phase) || !this.charges || this.dash) return
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

  finish(escaped) {
    this.phase = escaped ? 'escaped' : 'dead'
    this.bolts.length = 0
    this.meditating = false
    this.events.push({type:this.phase})
  }

  strikes(dt, immune) {
    const row = REALMS[this.stage]
    this.timers.forEach((seconds, i) => {
      this.timers[i] -= dt
      if (seconds > dt) return
      this.timers[i] += row[1 + i * 2]
      const [x,z] = i === 1 ? pointInRing(0, RADIUS, this.random) : [this.x,this.z]
      this.bolts.push({x,z,kind:i, warning:row[2 + i * 2], age:0, ticks:0})
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
        if (immune || Math.hypot(this.x-bolt.x,this.z-bolt.z) > type.radius + BODY_RADIUS) continue
        this.hp = Math.max(0, this.hp - type.damage)
        this.hits++
        this.events.push({type:'hurt'})
        if (!this.hp) {
          this.finish(false)
          return
        }
      }
    }
    this.bolts = this.bolts.filter(bolt => bolt.age < bolt.warning + (bolt.kind === 2 ? 2 : .3))
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
        if (orb.kind === 1) this.hp = Math.min(this.maxHp, this.hp + 15)
        else if (orb.kind === 2 && this.charges < 3) {
          this.charges++
          if (this.charges === 3) this.chargeTime = 0
        }
        else if (!this.completed) this.xp += orb.kind === 0 ? 10 : 5
        this.events.push({type:'collect', kind:orb.kind})
        continue
      }
      orb.speed = Math.min(6, orb.speed + dt)
      const fraction = Math.min(1, dt * orb.speed / distance)
      orb.x += x * fraction
      orb.z += z * fraction
    }
    if (!this.orbs.some(orb => Math.hypot(orb.x,orb.z) >= 14 && Math.hypot(orb.x,orb.z) <= RADIUS)) {
      this.refill()
    }
  }

  update(dt, mx=0, mz=0) {
    if (this.phase === 'intro') {
      const previous = this.remaining
      this.remaining -= dt
      if (previous > 1.75 && this.remaining <= 1.75) this.events.push({type:'wake'})
      if (this.remaining <= 0) this.beginStage()
      return
    }
    if (!['trial','rest'].includes(this.phase)) return
    this.elapsed += dt
    const moving = Math.hypot(mx,mz)
    const immune = this.dash > 0
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
      const speed = Math.min(10, 6 + .15 * this.stage) * (slowed ? .5 : 1)
      this.x += this.dx * speed * Math.min(1,moving) * dt
      this.z += this.dz * speed * Math.min(1,moving) * dt
    }
    if (Math.hypot(this.x,this.z) > RADIUS + BODY_RADIUS) {
      this.finish(true)
      return
    }
    this.idle = moving || immune ? 0 : this.idle + dt
    this.meditating = this.idle >= .3
    if (this.phase === 'trial') this.strikes(dt, immune)
    if (this.phase === 'dead') return
    this.collect(dt)
    if (this.phase === 'rest') {
      this.remaining -= dt
      if (this.remaining <= 0) {
        if (this.stage < REALMS.length - 1) {
          this.stage++
          this.maxHp += 15
          this.hp += 15
        }
        this.beginStage()
      }
    } else {
      this.age += dt
      if (!this.completed && this.age >= minimumTrial[this.stage] && this.xp >= goal(this.stage)) {
        this.xp -= goal(this.stage)
        this.completed = this.stage === REALMS.length - 1
        this.bolts.length = 0
        this.phase = 'rest'
        this.remaining = REST
        this.events.push({type:'breakthrough'})
      }
    }
  }
}
