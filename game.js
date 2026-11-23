import * as T from './vendor/three.module.min.js'
import {RADIUS, REALMS, TYPES, Trial, goal, MAX_LEVEL, STAGE_DURATION, SHIVER_LEVEL, SHIVER_DURATION} from './rules.js?v=10'
import {endings} from './endings.js?v=9'
import {spectators} from './spectators.js?v=10'

const $ = id => document.getElementById(id)
const ui = Object.fromEntries(['world','tutorial','lessonStep','lessonTitle','lessonHint','exitLesson','orbLesson','skipLesson','beginTrial','replayLesson','hud','phase','realm','hp','life','xp','level','experience','stageTime','next','charges','chargeTime','shiverStatus','overlay','start','eyebrow','title','description','ending','endingArt','endingTitle','results','controls','notice','caption','panic','npcTalk','npcName','npcLine','skillIntro','shiverBuff','joystick','stick','flash','sound'].map(id => [id,$(id)]))
const clamp = T.MathUtils.clamp
const tau = Math.PI * 2
const colors = [0xfff2c9, 0x81ffa7, 0x66c8ff]
const coarse = matchMedia('(pointer: coarse)')
const lessonStorageKey = 'unexpected-tribulation-tutorial-v1'
let lessonSeen = false
try { lessonSeen = localStorage.getItem(lessonStorageKey) === 'done' } catch {}
const lessons = [
  ['先動起來', '用 W、A、S、D 走幾步。', '拖動左下角的搖桿，走幾步試試。'],
  ['停下打坐', '放開移動鍵，等白、綠、藍三顆球飛入體內。球入體才有收益。', '放開搖桿，等白、綠、藍三顆球飛入體內。球入體才有收益。'],
  ['用閃身步躲雷', '按空白鍵，朝角色面向閃身。閃身途中免疫雷擊，次數會慢慢補回。', '用手指在搖桿以外的場地滑一下，角色會朝滑動方向閃身。閃身途中免疫雷擊。'],
  ['準備好了，天雷來了！', '注意逐漸縮小的地面雷圈，落雷前跑出警示範圍。'],
]
let lesson = 0
let shownLesson = -1
let lessonTouch = null
const renderer = new T.WebGLRenderer({antialias: !coarse.matches, powerPreference:'high-performance'})
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse.matches ? 1.4 : 1.8))
renderer.outputColorSpace = T.SRGBColorSpace
ui.world.append(renderer.domElement)

const scene = new T.Scene()
scene.background = new T.Color(0x81918e)
scene.fog = new T.FogExp2(0x81918e,.009)
const light = new T.HemisphereLight(0xe0eee3,0x585555,2.2)
scene.add(light)
const sun = new T.DirectionalLight(0xffe0af,2.6)
sun.position.set(-18,35,12)
scene.add(sun)
const camera = new T.PerspectiveCamera(42,1,.1,270)
const target = new T.Vector3()
const projected = new T.Vector3()
const dummy = new T.Object3D()
const floor = new T.Group()
scene.add(floor)

function solid(geometry,color,flatShading=true) {
  return new T.Mesh(geometry,new T.MeshStandardMaterial({color,flatShading,roughness:.92}))
}
function place(parent,mesh,x,y,z) {
  mesh.position.set(x,y,z)
  parent.add(mesh)
  return mesh
}
function flatRing(inner,outer,color,opacity=1) {
  const ring = new T.Mesh(new T.RingGeometry(inner,outer,96),new T.MeshBasicMaterial({
    color, side:T.DoubleSide, transparent:opacity<1,opacity,depthWrite:false,
  }))
  ring.rotation.x = -Math.PI/2
  return ring
}
const island = solid(new T.CylinderGeometry(24,16,12,64,3),0x475d52)
place(floor,island,0,-6.15,0)
place(floor,solid(new T.CylinderGeometry(23.95,24,.32,64),0x607c62),0,-.15,0)
place(floor,solid(new T.CylinderGeometry(19.94,19.94,.025,96),0x526c63),0,.024,0)
place(floor,flatRing(19.88,20.025,0xffd991),0,.065,0)
place(floor,flatRing(19.40,19.48,0xd5b978,.65),0,.063,0)
place(floor,flatRing(18.35,18.41,0xd5b978,.50),0,.061,0)
place(floor,flatRing(3.0,3.08,0xd5b978,.64),0,.062,0)
const barrier = new T.Mesh(new T.CylinderGeometry(RADIUS,RADIUS,.5,96,1,true),
  new T.MeshBasicMaterial({color:0xffd991,side:T.DoubleSide,transparent:true,opacity:.13,depthWrite:false}))
place(floor,barrier,0,.26,0)

let seed=103
function rng() {
  seed=(1664525*seed+1013904223)>>>0
  return seed/4294967296
}

const pattern = new T.CanvasTexture(makePattern())
pattern.colorSpace=T.SRGBColorSpace
pattern.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())
const sigil = new T.Mesh(new T.PlaneGeometry(39,39),new T.MeshBasicMaterial({
  map:pattern,transparent:true,depthWrite:false,opacity:.83,
}))
sigil.rotation.x=-Math.PI/2
place(floor,sigil,0,.074,0)
function makePattern() {
  const canvas=document.createElement('canvas')
  canvas.width=canvas.height=1024
  const c=canvas.getContext('2d')
  c.translate(512,512)
  c.strokeStyle='#e6c987'
  c.fillStyle='#eed49a'
  c.lineWidth=2
  for (const n of [8, 4]) {
    c.beginPath()
    for(let i=0;i<=n;i++){
      const a=tau*i/n+Math.PI/8
      c.lineTo(474*Math.cos(a),474*Math.sin(a))
    }
    c.stroke()
  }
  for(let i=0;i<8;i++){
    c.save()
    c.rotate(tau*i/8)
    c.translate(0,-456)
    for(let j=0;j<3;j++){
      if((i>>j)&1)c.fillRect(-21,j*11,42,4)
      else {
        c.fillRect(-21,j*11,17,4)
        c.fillRect(4,j*11,17,4)
      }
    }
    c.restore()
  }
  c.beginPath()
  c.arc(0,0,53,0,tau)
  c.stroke()
  c.beginPath()
  c.arc(0,0,53,-Math.PI/2,Math.PI/2)
  c.arc(0,26.5,26.5,Math.PI/2,-Math.PI/2,true)
  c.arc(0,-26.5,26.5,Math.PI/2,-Math.PI/2)
  c.fill()
  c.fillStyle='#526c63'
  c.beginPath()
  c.arc(0,26,7,0,tau)
  c.fill()
  c.fillStyle='#eed49a'
  c.beginPath()
  c.arc(0,-26,7,0,tau)
  c.fill()
  return canvas
}
for (let i=0;i<17;i++){
  const a=i*tau/17
  const r=56+rng()*85
  const mountain=solid(new T.ConeGeometry(8+rng()*20,22+rng()*27,5),new T.Color().setHSL(.45,.13,.32+rng()*.14))
  mountain.rotation.z=(rng()-.5)*.25
  place(scene,mountain,Math.cos(a)*r,-21-rng()*19,Math.sin(a)*r)
}
for (let i=0;i<34;i++){
  const a=rng()*tau
  const r=21.1+rng()*2.15
  const stone=solid(new T.DodecahedronGeometry(.35+rng()*.65,0),i%3===0?0x8a9982:0x495d58)
  stone.scale.y=.5+rng()*.5
  stone.rotation.set(rng(),rng()*6,rng())
  place(floor,stone,Math.cos(a)*r,.17,Math.sin(a)*r)
}
for(const [x,z,s] of [[-21,5,1.1],[18,-12,.8],[9,-20,.9],[-18,-12,.67]]){
  const tree = new T.Group()
  const trunk=place(tree,solid(new T.CylinderGeometry(.12,.24,3.3,6),0x534b38),0,1.65,0)
  trunk.rotation.z=.14
  for(let i=0;i<4;i++){
    const foliage=place(tree,solid(new T.IcosahedronGeometry(1,0),i%2?0x365a4c:0x52765e), Math.sin(i*2)*.55,2+i*.42,0)
    foliage.scale.set(1.8-i*.26,.45,1.35-i*.18)
  }
  tree.scale.setScalar(s)
  place(floor,tree,x,0,z)
}

function mistTexture(){
  const canvas=document.createElement('canvas')
  canvas.width=256; canvas.height=128
  const c=canvas.getContext('2d')
  for(let i=0;i<8;i++){
    const x=45+i*23
    const y=50+Math.sin(i*1.8)*17
    const r=35+rng()*20
    const gradient=c.createRadialGradient(x,y,0,x,y,r)
    gradient.addColorStop(0,'rgba(255,255,255,.52)')
    gradient.addColorStop(1,'rgba(255,255,255,0)')
    c.fillStyle=gradient
    c.fillRect(x-r,y-r,r*2,r*2)
  }
  return new T.CanvasTexture(canvas)
}
const mistMap=mistTexture()
const clouds = []
for (let i=0;i<36;i++){
  const storm=i>=20
  const a=i*tau/(storm?16:20)
  const cloud=new T.Sprite(new T.SpriteMaterial({map:mistMap,color:storm?0x34454f:0xe3f4e8,
    transparent:true,opacity:storm?.8:.65,depthWrite:false}))
  cloud.scale.set(22+rng()*25,8+rng()*5,1)
  scene.add(cloud)
  clouds.push({cloud,storm,a,r:storm?25+rng()*37:32+rng()*75,y:storm?13+rng()*15:-6-rng()*10})
}

const avatar = new T.Group()
const puppet = new T.Group()
avatar.add(puppet)
scene.add(avatar)
const shadow = new T.Mesh(new T.CircleGeometry(.78,32),new T.MeshBasicMaterial({
  color:0x162a2d,transparent:true,opacity:.42,depthWrite:false,
}))
shadow.rotation.x=-Math.PI/2
scene.add(shadow)
const robe=place(puppet,solid(new T.CylinderGeometry(.32,.59,1.04,7),0x307773),0,.89,0)
const belt=place(puppet,solid(new T.CylinderGeometry(.415,.46,.15,7),0xe3ba70),0,.79,0)
const face = new T.Group()
puppet.add(face)
place(face,solid(new T.IcosahedronGeometry(.46,1),0xffce97),0,1.66,.02)
const hat=place(face,solid(new T.CylinderGeometry(.29,.43,.27,7),0x233343),0,1.99,0)
const knot=place(face,solid(new T.CylinderGeometry(.07,.15,.13,6),0x263747),0,2.19,-.03)
const feet = [-.22,.22].map(x=>place(puppet,solid(new T.BoxGeometry(.27,.26,.40),0x273843),x,.22,.08))
const sleeves = [-.48,.48].map(x=>{
  const sleeve=place(puppet,solid(new T.CapsuleGeometry(.17,.42,3,7),0x478b82),x,1.01,.05)
  sleeve.rotation.z=Math.sign(x)*.25
  return sleeve
})
const eyes=[]
for(const x of [-.14,.14]){
  eyes.push(place(face,solid(new T.SphereGeometry(.046,6,5),0x2d2b30),x,1.70,.43))
  const eyebrow=place(face,solid(new T.BoxGeometry(.13,.024,.026),0x42322b),x,1.79,.414)
  eyebrow.rotation.z=Math.sign(x)*.16
}
place(face,solid(new T.ConeGeometry(.13,.27,6),0x40444a),0,1.38,.34).rotation.z=Math.PI
const mouth=place(face,solid(new T.SphereGeometry(1,10,8),0x462a2c),0,1.54,.43)
const sweat=place(face,new T.Mesh(new T.IcosahedronGeometry(.10,0),new T.MeshBasicMaterial({color:0xb9ecff})),.45,1.83,.39)
const faceColors=[]
puppet.traverse(obj=>{if(obj.isMesh)faceColors.push([obj.material,obj.material.color.clone()])})
const aura = flatRing(.73,.85,0x8fffd2,.7)
scene.add(aura)
const shiverAura=flatRing(.95,1.12,0x92fbff,.84)
scene.add(shiverAura)

// One reusable spectator rig with two mounts.
const flyer = new T.Group()
flyer.visible=false
scene.add(flyer)
const swordMount = new T.Group()
const craneMount = new T.Group()
flyer.add(swordMount,craneMount)
const blade=place(swordMount,solid(new T.BoxGeometry(.42,.10,2.7),0xa4d9ef),0,0,.12)
blade.rotation.y=.02
const point=place(swordMount,solid(new T.ConeGeometry(.30,.86,4),0xd6f4ff),0,0,1.86)
point.rotation.x=Math.PI/2
point.scale.z=.26
place(swordMount,solid(new T.BoxGeometry(1.1,.16,.20),0xd3ac58),0,0,-1.12)
place(swordMount,solid(new T.BoxGeometry(.20,.16,.6),0x4e645a),0,0,-1.43)

const craneBody=place(craneMount,solid(new T.IcosahedronGeometry(.7,1),0xf0eee4),0,.05,0)
craneBody.scale.set(.83,.58,1.48)
const neck=place(craneMount,solid(new T.CapsuleGeometry(.13,.8,3,8),0xf9f4e5),0,.36,.72)
neck.rotation.x=.52
const craneHead=place(craneMount,solid(new T.IcosahedronGeometry(.22,1),0xf1eee1),0,.78,.98)
place(craneHead,solid(new T.SphereGeometry(.092,8,6),0xd75452),0,.17,.03)
const beak=place(craneMount,solid(new T.ConeGeometry(.105,.52,6),0xd5a54e),0,.74,1.39)
beak.rotation.x=Math.PI/2
const wings=[-1,1].map(side=>{
  const wing=new T.Group()
  place(craneMount,wing,side*.37,.10,0)
  const feather=place(wing,solid(new T.IcosahedronGeometry(1,0),0xf7f0e1),side*.92,0,-.06)
  feather.scale.set(1.25,.18,.64)
  const tip=place(wing,solid(new T.IcosahedronGeometry(1,0),0x263541),side*1.76,0,-.17)
  tip.scale.set(.63,.11,.35)
  return wing
})

const rider=new T.Group()
place(flyer,rider,0,.12,-.15)
const riderRobe=place(rider,solid(new T.CylinderGeometry(.26,.48,.68,7),0x7a627b),0,.47,0)
place(rider,solid(new T.IcosahedronGeometry(.28,1),0xe8b183),0,1.02,.05)
const riderHat=place(rider,solid(new T.ConeGeometry(.44,.34,8),0x263746),0,1.31,.02)
for(const side of [-1,1]){
  const arm=place(rider,solid(new T.CapsuleGeometry(.10,.40,3,6),0xb9a882),side*.31,.57,.08)
  arm.rotation.z=side*.6
}
const riderColors=[0xa6616b,0x789e91,0x8883ae,0x4987a0,0xbaa35e,0xb27f59]
let nextFlyby=0
let flyby=null
let spectatorQueue=[]

function updateFlyby(){
  const active=trial.phase==='trial'||trial.phase==='rest'
  if(!active){
    flyer.visible=false
    ui.npcTalk.hidden=true
    return
  }
  if(!flyby&&now>=nextFlyby){
    if(!spectatorQueue.length){
      spectatorQueue=spectators.map((_,index)=>index)
      for(let i=spectatorQueue.length-1;i>0;i--){
        const j=Math.floor(rng()*(i+1))
        ;[spectatorQueue[i],spectatorQueue[j]]=[spectatorQueue[j],spectatorQueue[i]]
      }
    }
    const index=spectatorQueue.pop()
    const crane=index%2===0
    flyby={start:now,index,direction:rng()>.5?1:-1,z:-9-rng()*5}
    swordMount.visible=!crane
    craneMount.visible=crane
    rider.position.y=crane?.55:.12
    riderRobe.material.color.setHex(riderColors[index%riderColors.length])
    riderHat.scale.setScalar(1+(index%3)*.16)
    ui.npcName.textContent=spectators[index][0]+' · '+(crane?'乘鶴':'御劍')
    ui.npcLine.textContent=spectators[index][1]
  }
  const progress=flyby?(now-flyby.start)/7:1
  if(progress>=1){
    if(flyby){
      flyby=null
      nextFlyby=now+1.3+rng()*2
    }
    flyer.visible=false
    ui.npcTalk.hidden=true
    return
  }
  flyer.visible=true
  flyer.position.set((progress*54-27)*flyby.direction,6+Math.sin(progress*Math.PI)*1.1+.28*Math.sin(now*3),flyby.z)
  flyer.rotation.set(0,flyby.direction*Math.PI/2,.12*Math.sin(now*2.3))
  wings.forEach((wing,i)=>wing.rotation.z=(i===0?-1:1)*(.15+Math.sin(now*9)*.65))
  projected.set(flyer.position.x,flyer.position.y+1.7,flyer.position.z).project(camera)
  const x=(projected.x+1)*innerWidth/2
  const y=(1-projected.y)*innerHeight/2
  ui.npcTalk.hidden=progress<.12||progress>.88||x<0||x>innerWidth||y<0||y>innerHeight
  if(!ui.npcTalk.hidden){
    const margin=Math.min(innerWidth/2,112)
    ui.npcTalk.style.transform='translate('+clamp(x,margin,innerWidth-margin)+'px,'+Math.max(128,y-8)+'px) translate(-50%, -100%)'
  }
}


function instances(geometry, capacity) {
  const mesh = new T.InstancedMesh(geometry,new T.MeshBasicMaterial(),capacity)
  mesh.count=0
  mesh.frustumCulled=false
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage)
  scene.add(mesh)
  return mesh
}
function setInstance(mesh,i,x,y,z,sx,sy,sz,color,rx=0){
  dummy.position.set(x,y,z)
  dummy.rotation.set(rx,0,0)
  dummy.scale.set(sx,sy,sz)
  dummy.updateMatrix()
  mesh.setMatrixAt(i,dummy.matrix)
  mesh.setColorAt(i,color)
}
function commit(mesh,count){
  mesh.count=count
  mesh.instanceMatrix.needsUpdate=true
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true
}
const orbColors=colors.map(c=>new T.Color(c))
const strikeColors=TYPES.map(t=>new T.Color(t.color))
const orbCapacity=300
const orbMeshes=instances(new T.IcosahedronGeometry(1,0),orbCapacity)
const orbHalo=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({
  map:mistMap,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending,
}),orbCapacity)
orbHalo.count=0
orbHalo.frustumCulled=false
orbHalo.instanceMatrix.setUsage(T.DynamicDrawUsage)
scene.add(orbHalo)
const rings=instances(new T.RingGeometry(.94,1,64),80)
const pools=instances(new T.CircleGeometry(1,40),48)
pools.material.transparent=true
pools.material.opacity=.24
pools.material.depthWrite=false
const bolts=instances(new T.CylinderGeometry(.58,1,1,5),240)
const boltColor=new T.Color(0xffffff)
const dashColor=new T.Color(0x70e4ca)
const trails=instances(new T.IcosahedronGeometry(1,0),30)
trails.material.transparent=true
trails.material.opacity=.44
trails.material.depthWrite=false
const strikes=[]
const smoke=[]
const labels=[]

let trial=new Trial()
let now=0
let scorch=0
let flare=0
let stormAmount=.18
let shake=0
let endTimer=0
let nextTrail=0
let collectedAt=0
let hudKey=''
let noticeKey=''
let soundOn=true
let soundContext
let nextGather=0
let lastWarning=-1
let lastChime=-1
let lastThunder=-1
let lastEvade=-Infinity
let lastTap=null
let chatterUntil=0
let nextChatter=0
let lastLine=-1
const keys=new Set()
let movePointer=null
const touchMoves=new Map()
const joystick={x:0,y:0}
const chargeNodes=Array.from({length:3},()=>{
  const node=document.createElement('span')
  node.className='charge'
  node.innerHTML='<i>ϟ</i>'
  ui.charges.append(node)
  return node
})

function sound(type,variant=0){
  if(!soundOn||!soundContext||soundContext.state!=='running')return
  const ctx=soundContext
  const start=ctx.currentTime
  if(['strike','wake','hurt','dash','warning'].includes(type)){
    const duration={strike:.6,wake:1.15,hurt:.25,dash:.24,warning:.1}[type]
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate)
    const samples=buffer.getChannelData(0)
    for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1
    const noise=ctx.createBufferSource()
    const filter=ctx.createBiquadFilter()
    const volume=ctx.createGain()
    noise.buffer=buffer
    filter.type=type==='dash'||type==='warning'?'bandpass':'lowpass'
    filter.frequency.setValueAtTime(type==='dash'?1800:type==='warning'?2800:950,start)
    filter.frequency.exponentialRampToValueAtTime(type==='dash'?350:type==='warning'?1500:80,start+duration)
    volume.gain.setValueAtTime(type==='warning'?.035:type==='dash'?.22:.38,start)
    volume.gain.exponentialRampToValueAtTime(.001,start+duration)
    noise.connect(filter).connect(volume).connect(ctx.destination)
    noise.start(start)
    return
  }
  const notes=type==='breakthrough'?[392,523,659,784,1046]:type==='gather'?[146]:[523,659,880].slice(variant,variant+1)
  notes.forEach((frequency,i)=>{
    const time=start+i*.12
    const duration=type==='breakthrough'?.62:type==='gather'?.32:.17
    const osc=ctx.createOscillator()
    const volume=ctx.createGain()
    osc.type=type==='gather'?'sine':'triangle'
    osc.frequency.value=frequency
    volume.gain.setValueAtTime(.001,time)
    volume.gain.exponentialRampToValueAtTime(type==='gather'?.026:.10,time+.03)
    volume.gain.exponentialRampToValueAtTime(.001,time+duration)
    osc.connect(volume).connect(ctx.destination)
    osc.start(time)
    osc.stop(time+duration)
  })
}

const panicLines = [
  '啊啊啊啊！', '我還穿著睡褲！', '師父！你有繳電費嗎？',
  '鞋！我的鞋！算了跑！', '先說好，我沒報名！', '我只是翻了個身啊！',
  '天道大哥，能改期嗎？', '別追了，我沒有糖！', '啊這邊也有！',
  '我還沒刷牙！', '道友，借我躲一下！', '誰把避雷針拔了？',
]

function yelp(variant) {
  if (!soundOn || soundContext?.state !== 'running') return
  const ctx=soundContext
  const start=ctx.currentTime
  const duration=.29+(variant%3)*.025
  const voice=ctx.createOscillator()
  const vibrato=ctx.createOscillator()
  const wobble=ctx.createGain()
  const resonance=ctx.createBiquadFilter()
  const volume=ctx.createGain()
  const pitch=290+(variant%5)*26
  voice.type='sawtooth'
  voice.frequency.setValueAtTime(pitch,start)
  voice.frequency.exponentialRampToValueAtTime(pitch*1.65,start+.065)
  voice.frequency.exponentialRampToValueAtTime(pitch*.76,start+duration)
  vibrato.frequency.value=21
  wobble.gain.value=24
  vibrato.connect(wobble).connect(voice.frequency)
  resonance.type='bandpass'
  resonance.frequency.value=960+(variant%3)*160
  resonance.Q.value=1.2
  volume.gain.setValueAtTime(.001,start)
  volume.gain.exponentialRampToValueAtTime(.16,start+.055)
  volume.gain.exponentialRampToValueAtTime(.001,start+duration)
  voice.connect(resonance).connect(volume).connect(ctx.destination)
  voice.start(start)
  vibrato.start(start)
  voice.stop(start+duration)
  vibrato.stop(start+duration)
}

function panic(line) {
  if (line===undefined) {
    line=(lastLine+1+Math.floor(rng()*(panicLines.length-1)))%panicLines.length
  }
  lastLine=line
  ui.panic.textContent=panicLines[line]
  chatterUntil=now+1.28
  nextChatter=now+2.6+rng()*1.7
  yelp(line)
}

function setNotice(main,detail=''){
  const key=main+'|'+detail
  if(key===noticeKey)return
  noticeKey=key
  ui.notice.replaceChildren()
  if(!main)return
  ui.notice.append(document.createTextNode(main))
  const sub=document.createElement('span')
  sub.textContent=detail
  ui.notice.append(sub)
}

function label(x,z,text,style='',duration=1){
  const element=document.createElement('div')
  element.className=style?'float '+style:'float'
  element.textContent=text
  $('game').append(element)
  labels.push({element,x,z,time:now,duration})
}

function consumeEvents(){
  for(const event of trial.events){
    if(event.type==='wake'){
      flare=.8
      shake=.8
      sound('wake')
      panic(0)
      nextChatter=now+1.9
    } else if(event.type==='warning'&&now-lastWarning>.15){
      sound('warning')
      lastWarning=now
    } else if(event.type==='strike'){
      strikes.push({bolt:event.bolt,time:now,seed:rng()*20})
      flare=Math.max(flare,event.bolt.kind===2?.13:.22)
      if(now-lastThunder>.11){
        sound('strike')
        lastThunder=now
      }
    } else if(event.type==='hurt'){
      scorch=.62
      shake=.3
      sound('hurt')
      label(trial.x,trial.z,'⚡ −'+event.damage+' 氣血')
    } else if(event.type==='shiverUnlocked'){
      clearInput()
      ui.skillIntro.showModal()
      sound('breakthrough')
    } else if(event.type==='shiver'){
      label(event.x,event.z,'狗熊哆嗦毛！','skill-float',SHIVER_DURATION)
      yelp(2)
    } else if(event.type==='evade'&&now-lastEvade>.18){
      label(event.x,event.z,'閃躲','evade-float')
      lastEvade=now
    } else if(event.type==='dash'){
      label(event.x,event.z,'閃身步')
      sound('dash')
    } else if(event.type==='collect'&&now-lastChime>.045){
      collectedAt=now
      sound('collect',event.kind)
      lastChime=now
    } else if(event.type==='breakthrough'){
      strikes.length=0
      sound('breakthrough')
    } else if(event.type==='victory'){
      strikes.length=0
      clearInput()
      chatterUntil=0
      setNotice('')
      sound('breakthrough')
      summary()
    } else if(event.type==='dead'||event.type==='escaped'){
      strikes.length=0
      clearInput()
      chatterUntil=0
      endTimer=1.5
      if(event.type==='dead')scorch=2
    }
  }
  trial.events.length=0
}

function start(forceLesson=false){
  soundContext ??= window.AudioContext ? new AudioContext() : null
  soundContext?.resume().catch(()=>{})
  trial=new Trial()
  trial.intro(forceLesson || !lessonSeen)
  lesson=0
  shownLesson=-1
  clearInput()
  smoke.length=strikes.length=0
  labels.splice(0).forEach(label=>label.element.remove())
  flare=scorch=endTimer=0
  collectedAt=nextGather=nextTrail=nextChatter=chatterUntil=0
  lastLine=-1
  lastEvade=-Infinity
  ui.panic.hidden=true
  ui.npcTalk.hidden=true
  ui.shiverBuff.hidden=true
  flyby=null
  nextFlyby=now+4
  spectatorQueue=[]
  stormAmount=.18
  ui.overlay.hidden=true
  ui.ending.hidden=true
  ui.overlay.classList.remove('has-ending')
  ui.hud.hidden=true
  ui.joystick.hidden=true
  ui.start.blur()
  hudKey=''
}

function endLesson() {
  if (trial.phase !== 'practice') return
  lessonSeen=true
  try { localStorage.setItem(lessonStorageKey,'done') } catch {}
  clearInput()
  chatterUntil=0
  trial=new Trial()
  trial.beginStage()
  ui.tutorial.hidden=true
}

function useFlash(direction) {
  if (trial.phase === 'practice' && lesson < 2) return
  trial.flash(direction)
}

function updateLesson() {
  if (lesson===0 && Math.hypot(trial.x,trial.z)>=1.2) {
    lesson=1
    trial.orbs=[0,1,2].map(kind=>{
      const angle=(kind-1)*1.35+Math.atan2(trial.dz,trial.dx)
      return {x:trial.x+1.7*Math.cos(angle),z:trial.z+1.7*Math.sin(angle),kind,speed:0,intake:0}
    })
  }
  if (lesson===1 && trial.orbs.length===0) lesson=2
  if (lesson===2 && trial.steps>0 && !trial.dash) lesson=3
  if (shownLesson===lesson && lessonTouch===coarse.matches) return
  shownLesson=lesson
  lessonTouch=coarse.matches
  const [title, desktopHint, touchHint=desktopHint]=lessons[lesson]
  ui.lessonStep.textContent=lesson<3?'渡劫練習 '+(lesson+1)+' / 3':'練習完成'
  ui.lessonTitle.textContent=title
  ui.orbLesson.hidden=lesson===0
  ui.exitLesson.hidden=lesson!==3
  ui.lessonHint.textContent=lessonTouch?touchHint:desktopHint
  ui.skipLesson.hidden=lesson===3
  ui.beginTrial.hidden=lesson!==3
}

function summary(){
  const died=trial.phase==='dead'
  const won=trial.phase==='victory'
  ui.hud.hidden=true
  ui.joystick.hidden=true
  ui.overlay.hidden=false
  ui.eyebrow.textContent=won?'渡劫成功':died?'渡劫失敗':'渡劫中止'
  ui.title.textContent=won?'證道大羅金仙':died?'灰飛煙滅':'留得青山在'
  const [endingTitle, escapedLine, deathLine, motif, artwork] = endings[trial.stage]
  ui.endingTitle.textContent=endingTitle
  ui.description.textContent=died?deathLine:escapedLine
  ui.endingArt.alt=endingTitle+'插圖，畫著修士與'+motif
  ui.endingArt.src='./art/'+artwork+'.webp'
  ui.ending.hidden=false
  ui.overlay.classList.add('has-ending')
  ui.overlay.scrollTop=0
  const seconds=Math.floor(trial.elapsed)
  const time=Math.floor(seconds/60)+' 分 '+seconds%60+' 秒'
  const rows=[['修仙境界',REALMS[trial.stage][0]],['最終等級','Lv.'+trial.level],
    ['撐過時間',time],['被雷劈中',trial.hits+' 次'],['成功閃身步',trial.steps+' 次']]
  ui.results.replaceChildren(...rows.map(([name,value])=>{
    const div=document.createElement('div')
    const bold=document.createElement('b')
    bold.textContent=value
    div.append(name,bold)
    return div
  }))
  ui.start.textContent='再渡一次'
  ui.replayLesson.hidden=false
  ui.start.focus()
}

function hud(){
  const {phase,stage,level,xp,hp,maxHp,charges,chargeTime,remaining,age,shiverTime,shiverCooldown}=trial
  const active=phase==='trial'||phase==='rest'
  const practice=phase==='practice'
  ui.tutorial.hidden=!practice
  if(practice)updateLesson()
  const ending=(phase==='dead'||phase==='escaped')&&ui.overlay.hidden
  ui.hud.hidden=!(active||ending)
  ui.joystick.hidden=!((active||practice)&&coarse.matches)
  const name=REALMS[stage][0]
  const next=REALMS[stage+1]?.[0]
  const upcoming=next??'大羅金仙'
  if(phase==='intro'){
    if(remaining>1.75)setNotice('呼……','山頂小睡，醒了再修仙。')
    else setNotice('沒預料到我今天渡劫！','大陣已開 · 躲開地上的雷圈')
  } else if(phase==='rest'){
    if(remaining>2)setNotice(name,'渡劫完成 · 休整 '+Math.ceil(remaining)+' 秒')
    else setNotice(upcoming+'將至',(stage===3?'解鎖連續雷 · ':'烏雲聚集 · ')+Math.ceil(remaining)+' 秒')
  } else if(ending){
    setNotice(phase==='dead'?'灰飛煙滅':'留得青山在')
  } else setNotice('')
  ui.shiverStatus.hidden=!active||level<SHIVER_LEVEL
  if(!ui.shiverStatus.hidden){
    const input=coarse.matches?'雙擊場地':'C'
    const status=shiverTime>1e-7?'閃躲 '+shiverTime.toFixed(1)+' 秒':shiverCooldown>0?'冷卻 '+Math.ceil(shiverCooldown)+' 秒':'就緒'
    ui.shiverStatus.textContent='狗熊哆嗦毛 · '+input+' · '+status
  }
  ui.caption.textContent=!(active||practice)?'':shiverTime>1e-7?'狗熊哆嗦毛！':trial.meditating?'打坐聚靈中':trial.dash>0?'閃身免疫雷擊':trial.meditationStagger>0?'打坐被雷擊中斷':''
  if(!active&&!ending)return
  const seconds = Math.max(0,Math.ceil(STAGE_DURATION-age-1e-7))
  const restSeconds = Math.ceil(remaining ?? 0)
  const key=[phase,stage,level,xp,hp,charges,seconds,restSeconds,Math.floor(chargeTime*10)].join('|')
  if(key===hudKey)return
  hudKey=key
  ui.phase.textContent=phase==='rest'?'已完成':'當前境界'
  ui.realm.textContent=name
  const clock = [Math.floor(seconds/60),seconds%60].map(value=>String(value).padStart(2,'0')).join(':')
  ui.stageTime.textContent=phase==='rest'?'休整 '+restSeconds+' 秒':'剩餘 '+clock
  ui.hp.textContent=hp+' / '+maxHp
  ui.life.max=maxHp
  ui.life.value=hp
  const maxLevel=level===MAX_LEVEL
  ui.level.textContent='Lv.'+level
  ui.xp.max=goal(level)
  ui.xp.value=maxLevel?goal(level):xp
  ui.experience.textContent=maxLevel?'已滿級':xp+' / '+goal(level)+' EXP'
  ui.next.textContent=next
    ? (phase==='rest'?'即將開始 · ':'下一階 · ')+next+(stage===3?' · 解鎖連續雷':'')
    : '最高境界'
  chargeNodes.forEach((node,i)=>{
    node.classList.toggle('empty',i>=charges)
    node.style.setProperty('--fill',(i<charges?100:i===charges?chargeTime*10:0)+'%')
  })
  ui.chargeTime.textContent=charges===3?'已充滿':Math.ceil(10-chargeTime)+' 秒充能'
}

const darkSky = new T.Color(0x4f626c)
const clearSky = new T.Color(0xb1bc9d)
function draw(dt, moveAmount){
  const {x,z,phase,remaining}=trial
  const asleep = phase==='title'||(phase==='intro'&&remaining>1.75)
  const excited = phase==='intro'&&!asleep
  const restSky = phase==='rest'?clamp(1-remaining/2,0,1)*.9+.08:1
  const stormTarget = phase==='trial'?1:phase==='rest'?restSky:excited?1:.18
  stormAmount=T.MathUtils.damp(stormAmount,stormTarget,2.8,dt)
  scene.background.copy(clearSky).lerp(darkSky,stormAmount)
  scene.fog.color.copy(scene.background)
  sun.intensity=2.9-stormAmount*1.45
  light.intensity=2.15-stormAmount*.3
  clouds.forEach(({cloud,storm,a,r,y})=>{
    const angle=a+now*(storm?.032:.013)
    const distance=r+(storm?(1-stormAmount)*40:0)
    cloud.position.set(Math.cos(angle)*distance,y,Math.sin(angle)*distance)
    if(storm)cloud.material.opacity=.75*stormAmount
  })
  flare=Math.max(0,flare-dt*1.8)
  scorch=Math.max(0,scorch-dt)
  shake=Math.max(0,shake-dt*2.1)
  ui.flash.style.opacity=Math.min(.64,flare)
  const alive=phase!=='dead'
  const ending=phase==='dead'||phase==='escaped'
  const escape=phase==='escaped'?Math.max(0,1.5-endTimer):0
  avatar.position.set(x+trial.dx*escape*1.15,asleep?.46:trial.meditating?.16+.09*Math.sin(now*4):0,z+trial.dz*escape*1.15)
  const shivering=trial.shiverTime>1e-7
  const running = (phase==='trial'||phase==='rest'||phase==='practice') && moveAmount>.08 && !trial.dash
  const flailing = running || (phase==='escaped'&&endTimer>0)
  const stride = now*22
  const startled = excited || flailing || shivering
  avatar.rotation.y=Math.atan2(trial.dx,trial.dz)
  puppet.rotation.set(asleep?-1.45:excited?-.18:flailing?.23:0,0,flailing?.18*Math.sin(stride*.68):0)
  puppet.position.y=excited?Math.max(0,.65*Math.sin((1.75-remaining)*6)):flailing?.15*Math.abs(Math.sin(stride)):0
  face.rotation.y=flailing?.35*Math.sin(stride*.34):0
  face.rotation.z=flailing?.13*Math.cos(stride*.9):0
  hat.rotation.z=knot.rotation.z=flailing?.23*Math.sin(stride-.8):0
  knot.position.x=flailing?-.2*hat.rotation.z:0
  mouth.scale.set(.09,startled?.12:.026,.04)
  eyes.forEach(eye=>eye.scale.set(1,asleep?.25:startled?1.48:1,1))
  sweat.visible=startled
  sweat.position.y=1.83+.13*Math.sin(stride)
  if(running&&phase==='trial'&&now>=nextChatter)panic()
  puppet.scale.setScalar(1.14*(alive?1:clamp(endTimer/.85,0,1)))
  avatar.visible=alive||endTimer>0
  faceColors.forEach(([material,color])=>material.color.copy(color).multiplyScalar(scorch>0?.19:1))
  feet.forEach((foot,i)=>{
    const swing=Math.sin(stride+i*Math.PI)
    foot.position.z=trial.meditating?.30:.08+(flailing?.38*swing:0)
    foot.position.y=trial.meditating?.40:.22+(flailing?.38*Math.max(swing,0):0)
    foot.rotation.y=(i===0?1:-1)*(trial.meditating?.8:flailing?.29:0)
    foot.rotation.x=flailing?.6*swing:0
  })
  sleeves.forEach((s,i)=>{
    const side=i===0?-1:1
    s.rotation.x=trial.meditating?-.9:flailing?-.55+.76*Math.sin(stride*.82+i*2.8):0
    s.rotation.z=side*(startled?1.04+.42*Math.sin(stride+i*1.5):.25)
  })
  if(shivering){
    const shake=Math.sin(now*56)
    const shimmy=Math.cos(now*47)
    puppet.position.y=.08+.14*Math.abs(shake)
    puppet.rotation.set(-.16+.11*shimmy,shake*.27,shimmy*.26)
    face.rotation.z=shake*.24
    hat.rotation.z=shimmy*.32
    sleeves.forEach((s,i)=>{
      s.rotation.x=-.7+shake*.52
      s.rotation.z=(i===0?-1:1)*(1.1+.56*shimmy)
    })
    feet.forEach((foot,i)=>foot.rotation.y=(i===0?1:-1)*(.35+.14*shake))
  }
  shiverAura.visible=shivering
  shiverAura.position.set(x,.13,z)
  shiverAura.scale.setScalar(1.12+.22*Math.sin(now*22))
  robe.position.y=trial.meditating?.72:.89
  belt.position.y=trial.meditating?.64:.79
  shadow.visible=avatar.visible
  shadow.position.set(avatar.position.x,.083,avatar.position.z)
  aura.visible=trial.meditating
  aura.position.set(x,.095,z)
  aura.scale.setScalar(1+.13*Math.sin(now*7)+Math.max(0,.28-(now-collectedAt)))
  if(trial.meditating&&now>nextGather){
    sound('gather')
    nextGather=now+.55
  }
  if(now>nextTrail&&(trial.dash>0||scorch>0&&avatar.visible||ending&&endTimer>0)){
    nextTrail=now+.043
    smoke.push({x:avatar.position.x+(rng()-.5)*.35,z:avatar.position.z+(rng()-.5)*.35,time:now,dash:trial.dash>0})
  }
  while(smoke.length&&now-smoke[0].time>.75)smoke.shift()
  smoke.forEach((p,i)=>{
    const t=now-p.time
    const scale=(1-t/.75)*.42
    setInstance(trails,i,p.x,.7+t*2,p.z,scale,scale*1.5,scale,p.dash?dashColor:darkSky)
  })
  commit(trails,smoke.length)
  let n=0
  for(const orb of trial.orbs){
    if(n>=orbCapacity)break
    const y=orb.intake>0?.8+orb.intake*4:.58+.18*Math.sin(now*4+orb.x)
    const size=orb.intake>0?.10:.145
    setInstance(orbMeshes,n,orb.x,y,orb.z,size,size,size,orbColors[orb.kind])
    dummy.position.set(orb.x,y,orb.z)
    dummy.quaternion.copy(camera.quaternion)
    dummy.scale.setScalar(size*7)
    dummy.updateMatrix()
    orbHalo.setMatrixAt(n,dummy.matrix)
    orbHalo.setColorAt(n,orbColors[orb.kind])
    n++
  }
  commit(orbMeshes,n)
  commit(orbHalo,n)
  let warningCount=0
  let poolCount=0
  for(const b of trial.bolts){
    const r=TYPES[b.kind].radius
    if(b.age<b.warning){
      const outer=r+(1-b.age/b.warning)*2.4
      setInstance(rings,warningCount++,b.x,.102,b.z,r,r,1,strikeColors[b.kind],-Math.PI/2)
      setInstance(rings,warningCount++,b.x,.109,b.z,outer,outer,1,strikeColors[b.kind],-Math.PI/2)
    }
    if(b.age<b.warning||b.kind===2)setInstance(pools,poolCount++,b.x,.097,b.z,r,r,1,strikeColors[b.kind],-Math.PI/2)
  }
  commit(rings,warningCount)
  commit(pools,poolCount)
  let beamCount=0
  while(strikes.length&&now-strikes[0].time>.24)strikes.shift()
  for(const {bolt,time,seed} of strikes){
    let previous=new T.Vector3(bolt.x,.16,bolt.z)
    const amount=Math.max(.1,1-(now-time)/.24)
    for(let j=1;j<=8;j++){
      const end=new T.Vector3(bolt.x+Math.sin(j*5+seed)*(.53+j*.14),.16+j*2.1,
        bolt.z+Math.cos(j*3+seed)*(.32+j*.1))
      const direction=end.clone().sub(previous)
      dummy.position.copy(end).add(previous).multiplyScalar(.5)
      dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize())
      dummy.scale.set(.17*amount,direction.length()+.12,.17*amount)
      dummy.updateMatrix()
      bolts.setMatrixAt(beamCount,dummy.matrix)
      bolts.setColorAt(beamCount,j%3===0?strikeColors[bolt.kind]:boltColor)
      beamCount++
      previous=end
    }
  }
  commit(bolts,beamCount)
  target.set(x*.16,0,z*.16)
  const offset=overview*(phase==='title'?1.07:1)
  camera.position.set(target.x+shake*Math.sin(now*93)*.6,offset*.81,target.z+offset*.64)
  camera.lookAt(target)
  camera.updateMatrixWorld()
  updateFlyby()
  ui.shiverBuff.hidden=!shivering
  if(shivering){
    projected.set(avatar.position.x,2.95+puppet.position.y,avatar.position.z).project(camera)
    ui.shiverBuff.style.transform='translate('+((projected.x+1)*innerWidth/2)+'px,'+((1-projected.y)*innerHeight/2)+'px) translate(-50%, -100%)'
  }
  ui.panic.hidden=now>=chatterUntil
  if(!ui.panic.hidden){
    projected.set(avatar.position.x,3.5+puppet.position.y,avatar.position.z).project(camera)
    const screenX=clamp((projected.x+1)*innerWidth/2,96,innerWidth-96)
    const screenY=Math.max(116,(1-projected.y)*innerHeight/2)
    ui.panic.style.transform='translate('+screenX+'px,'+screenY+'px) translate(-50%, -100%)'
    ui.panic.style.opacity=Math.min(1,(chatterUntil-now)*5)
  }
  for(let i=labels.length-1;i>=0;i--){
    const label=labels[i]
    const age=now-label.time
    if(age>=label.duration){
      label.element.remove()
      labels.splice(i,1)
      continue
    }
    projected.set(label.x,2.25+age*1.65/label.duration,label.z).project(camera)
    label.element.style.transform='translate('+((projected.x+1)*innerWidth/2)+'px,'+((1-projected.y)*innerHeight/2)+'px) translateX(-50%)'
    label.element.style.opacity=Math.min(1,(label.duration-age)*2)
  }
  renderer.render(scene,camera)
}

const up=new T.Vector3(0,1,0)
let overview=62
function resize(){
  camera.aspect=innerWidth/innerHeight
  overview=60*Math.max(1, .97/camera.aspect)
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth,innerHeight)
}
addEventListener('resize',resize)
resize()
function clearInput(){
  keys.clear()
  movePointer=null
  touchMoves.clear()
  lastTap=null
  joystick.x=joystick.y=0
  ui.stick.style.transform=''
}

addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return
  if(event.code==='Space'&&ui.overlay.hidden&&!(event.target instanceof HTMLButtonElement)){
    event.preventDefault()
    if(!event.repeat)useFlash()
  }
  if(event.code==='KeyC'&&!event.repeat)trial.shiver()
  if(['KeyW','KeyA','KeyS','KeyD'].includes(event.code))keys.add(event.code)
})
addEventListener('keyup',event=>keys.delete(event.code))
addEventListener('blur',clearInput)
document.addEventListener('visibilitychange',clearInput)
function moveStick(event){
  const box=ui.joystick.getBoundingClientRect()
  const r=box.width*.39
  const x=event.clientX-box.left-box.width/2
  const y=event.clientY-box.top-box.height/2
  const length=Math.max(r,Math.hypot(x,y))
  joystick.x=Math.abs(x)<4?0:x/length
  joystick.y=Math.abs(y)<4?0:y/length
  ui.stick.style.transform='translate('+(joystick.x*r)+'px,'+(joystick.y*r)+'px)'
}
ui.joystick.addEventListener('pointerdown',event=>{
  if(movePointer!==null)return
  movePointer=event.pointerId
  ui.joystick.setPointerCapture(movePointer)
  moveStick(event)
})
ui.joystick.addEventListener('pointermove',event=>{
  if(event.pointerId===movePointer)moveStick(event)
})
for(const name of ['pointerup','pointercancel','lostpointercapture']){
  ui.joystick.addEventListener(name,event=>{
    if(event.pointerId!==movePointer)return
    movePointer=null
    joystick.x=joystick.y=0
    ui.stick.style.transform=''
  })
  if(name!=='pointerup')ui.world.addEventListener(name,event=>touchMoves.delete(event.pointerId))
}
ui.world.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||!ui.overlay.hidden)return
  ui.world.setPointerCapture(event.pointerId)
  if(touchMoves.size)lastTap=null
  touchMoves.set(event.pointerId,{x:event.clientX,y:event.clientY,time:event.timeStamp})
})
ui.world.addEventListener('pointermove',event=>{
  const origin=touchMoves.get(event.pointerId)
  if(!origin)return
  const x=event.clientX-origin.x,y=event.clientY-origin.y
  if(Math.hypot(x,y)<25)return
  touchMoves.delete(event.pointerId)
  lastTap=null
  useFlash([x,y/.8])
})
ui.world.addEventListener('pointerup',event=>{
  const origin=touchMoves.get(event.pointerId)
  touchMoves.delete(event.pointerId)
  if(!origin)return
  const tap={x:event.clientX,y:event.clientY,time:event.timeStamp}
  if(touchMoves.size || tap.time-origin.time>250 || Math.hypot(tap.x-origin.x,tap.y-origin.y)>17){
    lastTap=null
    return
  }
  if(lastTap && tap.time-lastTap.time<=320 && Math.hypot(tap.x-lastTap.x,tap.y-lastTap.y)<=42){
    lastTap=null
    trial.shiver()
    return
  }
  lastTap=tap
})
ui.sound.addEventListener('click',()=>{
  soundOn=!soundOn
  ui.sound.textContent=soundOn?'音效開':'音效關'
  ui.sound.setAttribute('aria-pressed',String(soundOn))
})
ui.start.addEventListener('click',()=>start())
ui.replayLesson.addEventListener('click',()=>start(true))
ui.skipLesson.addEventListener('click',endLesson)
ui.beginTrial.addEventListener('click',endLesson)
ui.skillIntro.addEventListener('close',()=>{
  clearInput()
  trial.awaitingShiverIntro=false
})
ui.replayLesson.hidden=!lessonSeen
ui.start.disabled=false
ui.start.textContent='叫我起床'

let lastFrame=performance.now()
let accumulator=0
const frameStep=1/120
renderer.setAnimationLoop(time=>{
  const dt=clamp((time-lastFrame)/1000,0,.05)
  lastFrame=time
  if(document.hidden||ui.skillIntro.open){
    accumulator=0
    return
  }
  now+=dt
  if(endTimer>0){
    endTimer=Math.max(0,endTimer-dt)
    if(!endTimer)summary()
  }
  const dx=Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+joystick.x
  const dz=Number(keys.has('KeyS'))-Number(keys.has('KeyW'))+joystick.y
  accumulator+=dt
  while(accumulator>=frameStep){
    trial.update(frameStep,dx,dz)
    accumulator-=frameStep
    if(trial.awaitingShiverIntro){
      accumulator=0
      break
    }
  }
  consumeEvents()
  hud()
  draw(dt,Math.hypot(dx,dz))
})
