// Order matches REALMS in rules.js.
export const endings = [
  ['山門掃地員', '一覺睡飽，回去掃地。師父說，落葉都比我會渡劫。', '掃帚還在，掃地的人已經變成灰了。', '掃帚', '#cd9d62'],
  ['地基保固書', '築基成功！回家先把師父那張跛腳椅墊平。', '地基打得很穩。至於蓋在上面的人，已驗收為粉末。', '磚塔', '#da9c7d'],
  ['金丹特價中', '金丹煉好了。師妹問我能不能鑲在婚戒上。', '金丹沒碎，外面那層道士焦了。師父說烤得正好。', '金丹', '#f4c65a'],
  ['浴池預約券', '元嬰出體！浴池留我個位，嬰兒池也行。', '肉身炸飛了，元嬰還在問浴池有沒有附毛巾。', '浴桶', '#e19a88'],
  ['本廟不找零', '剛化神就有人來上香。先講好，姻緣單不歸我管。', '香客求一個顯靈。天雷說好，當場把神像劈成香灰。', '香爐', '#db816e'],
  ['有洞就是虛', '煉虛有成！師父叫我順便把屋頂那個虛補起來。', '別人煉虛是參悟大道，我煉虛是把自己煉到查無此人。', '虛空', '#a599d2'],
  ['合體待審核', '人劍合一了。劍說房租還是要兩個人平分。', '人劍合一很順利，火葬場說只收一份錢。', '飛劍', '#85b5ad'],
  ['宗門搶人大會', '各大宗門爭先恐後來找我。原來是我把他們的避雷針都用壞了。', '各大宗門果然搶著收我。請自備罈子，一派分一勺。', '聘書', '#d9aa70'],
  ['雷劫請假單', '渡劫期先請一天假。理由寫「與天庭的行程撞雷」。', '假單批下來了。准假期限，永遠。', '假單', '#d0a191'],
  ['散仙工會', '散仙不用打卡。天庭來信說，遲到還是要扣功德。', '終於成了自由散仙。自由地散在整座山頭。', '酒葫蘆', '#f0a566'],
  ['地仙土地公所', '本地仙今日上任。第一件案子是隔壁山頭亂倒天雷。', '有請本地土地公。祂來了，還帶了掃把跟畚斗。', '土地祠', '#b99a6d'],
  ['天仙登機門', '天仙的雲已到站。請問飛升可以帶一件隨身法寶嗎？', '雲是飛上去了，人還在地上冒煙。航空公司拒賠。', '雲車', '#9ed3cc'],
  ['金仙秤重處', '金仙成了。銀樓問我實心還是包金，秤完才能報價。', '客服說純金不怕火煉。金仙本人的部分另計。', '元寶', '#edbc61'],
  ['太乙全銜證', '太乙金仙的名片到了。頭銜太長，我的名字被印在背面。', '遺照放得下人，放不下頭銜。請改用橫式匾額。', '名刺', '#bd9bf1'],
  ['天庭終身會員', '大羅金仙出關！天庭終於發來賀禮，一張避雷針終身保固卡。', '此人已證大羅金仙。此人的避雷針尚未通過驗收。', '雷冠', '#ffe184'],
]

export function drawEnding(canvas, stage, died) {
  const c = canvas.getContext('2d')
  const [title, , , motif, accent] = endings[stage]
  canvas.setAttribute('aria-label', title + '插圖，畫著修士與' + motif)
  c.clearRect(0,0,720,210)
  const sky = c.createLinearGradient(0,0,720,210)
  sky.addColorStop(0,died?'#392b35':'#243739')
  sky.addColorStop(1,'#10252b')
  c.fillStyle=sky
  c.fillRect(0,0,720,210)

  function path(points, color, close=true, width=0) {
    c.beginPath()
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y))
    if(close)c.closePath()
    if(width){
      c.lineWidth=width
      c.strokeStyle=color
      c.stroke()
    }else{
      c.fillStyle=color
      c.fill()
    }
  }
  function circle(x,y,r,color){
    c.beginPath()
    c.arc(x,y,r,0,Math.PI*2)
    c.fillStyle=color
    c.fill()
  }
  function rect(x,y,w,h,color){
    c.fillStyle=color
    c.fillRect(x,y,w,h)
  }

  circle(523,100,76,accent+'38')
  circle(523,100,59,accent+'2b')
  for(let i=0;i<3;i++){
    const shift=i*21
    path([[0,161+shift],[78,115+shift],[144,138+shift],[223,68+shift],[307,145+shift],
      [391,113+shift],[481,152+shift],[621,96+shift],[720,155+shift],[720,210],[0,210]],
      ['#3c5557','#29474a','#21363b'][i])
  }
  for(let i=0;i<6;i++){
    const x=368+i*51, y=32+(i*29)%143
    path([[x,y-4],[x+4,y],[x,y+4],[x-4,y]],accent+'8c')
  }
  if(died){
    path([[200,10],[175,50],[195,46],[178,81],[227,32],[204,38],[221,10]],'#ffe29b')
    for(let i=0;i<5;i++)circle(118-i*9,100-i*14,7+i*2,'#aa94a362')
  }

  const robe=died?'#453c47':'#478e80'
  const face=died?'#584853':'#e9ad7d'
  c.save()
  c.translate(120,175)
  path([[-41,4],[-29,-46],[25,-46],[52,4]],robe)
  path([[-13,-52],[25,-52],[8,-21]],'#edc991')
  circle(0,-73,33,face)
  path([[-37,-88],[-22,-121],[27,-121],[39,-88]],'#233642')
  rect(-42,-91,84,8,accent)
  circle(-10,-74,3.5,'#241e28')
  circle(13,-75,3.5,'#241e28')
  path([[-2,-64],[6,-60],[14,-65]],'#241e28',false,2.5)
  if(!died){
    circle(-20,-66,5,'#f29284')
    path([[26,-104],[42,-109],[39,-94]],accent)
  }
  c.restore()

  c.save()
  c.translate(523,112)
  const gold='#ffe1a0'
  const paper='#f0d7a3'
  const ink='#273843'
  switch(stage){
    case 0:
      path([[-41,44],[36,-59]],gold,false,9)
      path([[-48,12],[-20,34],[-24,69],[-72,39]],accent)
      path([[-49,24],[-33,37],[-48,59]],ink,false,3)
      break
    case 1:
      for(let y=0;y<3;y++)for(let x=0;x<3-y;x++)
        rect(-54+y*18+x*37,26-y*23,33,18,y%2?gold:accent)
      break
    case 2:
      circle(0,0,41,accent)
      circle(-6,-9,29,gold)
      circle(3,2,21,'#f8cb68')
      circle(-12,-16,8,'#fff3c9')
      break
    case 3:
      path([[-57,0],[55,0],[42,47],[-45,47]],accent)
      rect(-60,-5,120,11,paper)
      circle(5,-25,22,paper)
      circle(0,-23,3,ink)
      circle(14,-23,3,ink)
      path([[-33,-9],[-43,-24],[-38,-40],[-41,-50]],'#fff9dd',false,4)
      break
    case 4:
      path([[-49,-5],[46,-5],[30,39],[-28,39]],accent)
      rect(-52,-9,103,10,gold)
      for(let i=-1;i<=1;i++){
        path([[i*20,-8],[i*25,-48]],gold,false,4)
        circle(i*25,-51,4,'#ff8064')
      }
      break
    case 5:
      circle(0,1,48,accent)
      circle(0,1,36,ink)
      circle(-11,9,22,'#171626')
      path([[8,-31],[30,-9],[42,-32]],paper,false,3)
      break
    case 6:
      path([[-26,36],[33,-58],[44,-45],[0,35]],'#e2f9ed')
      path([[-33,17],[2,42]],gold,false,9)
      path([[-16,33],[-34,56]],accent,false,8)
      break
    case 7:
      for(let i=-1;i<=1;i++){
        c.save()
        c.translate(i*32,Math.abs(i)*9)
        c.rotate(i*.21)
        rect(-17,-39,34,77,paper)
        rect(-20,-43,40,6,accent)
        rect(-20,34,40,6,accent)
        rect(-7,12,14,12,'#a54949')
        c.restore()
      }
      break
    case 8:
      rect(-40,-44,80,86,paper)
      for(let i=0;i<3;i++)rect(-22,-23+i*17,42-i*7,4,ink)
      rect(11,12,18,16,'#ab5054')
      break
    case 9:
      circle(0,15,34,accent)
      circle(-3,-28,22,gold)
      rect(-11,-57,17,14,paper)
      path([[-22,-11],[26,-11]],ink,false,5)
      break
    case 10:
      rect(-43,-6,86,47,accent)
      path([[-63,-2],[0,-53],[63,-2]],gold)
      rect(-13,9,26,32,ink)
      break
    case 11:
      rect(-52,-9,103,20,accent)
      path([[-42,-9],[-23,-40],[26,-40],[44,-9]],paper)
      for(let i=-2;i<=2;i++)circle(i*24,20+Math.abs(i)*2,20,'#d6f2e9')
      break
    case 12:
      path([[-59,-13],[-24,10],[-32,-26],[31,-26],[25,11],[59,-13],[42,30],[-42,30]],accent)
      path([[-32,-26],[31,-26],[23,-11],[-25,-11]],gold)
      break
    case 13:
      rect(-57,-34,114,69,paper)
      rect(-48,-25,96,51,accent)
      rect(-43,-20,86,41,ink)
      for(let i=-2;i<=2;i++)path([[i*14,-9],[i*14+6,0],[i*14,9],[i*14-6,0]],gold)
      break
    default:
      path([[-52,-21],[-29,1],[-15,-40],[0,-12],[16,-40],[28,1],[52,-21],[39,38],[-39,38]],accent)
      rect(-40,15,80,9,gold)
      path([[2,-25],[-12,-1],[2,-2],[-3,13],[15,-9],[3,-7]],'#fff7d8')
  }
  c.restore()
}
