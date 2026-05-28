import {
  ACHIEVEMENTS,
  BOT_NAMES,
  BOT_PERSONALITIES,
  COMPANIONS,
  COSMETICS,
  DEFAULT_BOT_PERSONALITY,
  DEFAULT_CAREER_STATS,
  HAND_TIERS,
  NPC_ADVICE,
  POWER_UPS,
  RANKS,
  RANK_VALUE,
  SUITS,
  TABLES,
  TABLE_BOT_SETTINGS,
  tableWipeAchievementId
} from './data.js';
import {
  compareHands,
  drawPotential,
  evaluateBest,
  makeDeck,
  preflopStrength
} from './engine/poker.js';
let ownedCosmetics=JSON.parse(localStorage.getItem('pokerOwnedCosmetics_v2')||'{"felt":["classic"],"chips":["classic"],"cards":["classic"]}');
let selectedCosmetics=JSON.parse(localStorage.getItem('pokerSelectedCosmetics_v2')||'{"felt":"classic","chips":"classic","cards":"classic"}');
let bankroll=parseInt(localStorage.getItem('pokerBankroll_v2') || '1000', 10), playerName=localStorage.getItem('pokerPlayerName') || 'You', table=null, players=[], deck=[], community=[], dealerIndex=0,currentIndex=0,street='preflop',pot=0,currentBet=0,minRaise=2,raiseCountThisStreet=0,handNum=1,waitingForNextHand=false,lastActionText='Waiting for action...',actedThisStreet=new Set(),lastRenderedPot=-1,potChipVisual='',lastAdviceHand=-1,currentGameMessage='Choose an action.',adviceTimer=null;
const ALL_IN_INITIAL_DELAY=1300, ALL_IN_CARD_DELAY=1800, ALL_IN_SHOWDOWN_DELAY=2300, SHOWDOWN_REVEAL_DELAY=850;
let ownedPowerUps=JSON.parse(localStorage.getItem('pokerOwnedPowerUps_v1')||'[]');
let activePowerUps=JSON.parse(localStorage.getItem('pokerActivePowerUps_v1')||'null')||[...ownedPowerUps];
let ownedCompanions=JSON.parse(localStorage.getItem('pokerOwnedCompanions_v1')||'[]');
let selectedCompanion=localStorage.getItem('pokerSelectedCompanion_v1')||'';
let mobileMode=localStorage.getItem('pokerMobileMode_v1')==='true';
let careerStats=loadCareerStats(),currentSession=null,lastSessionRecap=null,showSessionRecap=false,lastHandWinners=[],handStartStacks=[],currentHandHeroRaised=false,currentHandHeroPreflopStrength=0,currentHandProfile={vpip:false,pfr:false},mobileBetDrag=null,suppressNextBetClick=false,oddsTipUsedThisHand=false,oddsTipMessage='',tiltGuardWarnedThisHand=false;
careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
const el=id=>document.getElementById(id); const money=n=>'$'+Math.round(n).toLocaleString();
const PASSIVE_BUSINESSES=[
  {id:'snack_table',name:'Basement Snack Table',desc:'Chips, sodas, and late-night candy for the regulars.',cost:150,baseIncome:2,upgradeCost:110,upgradeIncome:1.25},
  {id:'card_protector_shop',name:'Card Protector Shop',desc:'Novelty chips, lucky charms, and table trinkets.',cost:450,baseIncome:6,upgradeCost:320,upgradeIncome:3},
  {id:'poker_stream',name:'Poker Night Stream',desc:'Tiny ad checks from hand recaps and questionable calls.',cost:900,baseIncome:13,upgradeCost:650,upgradeIncome:6},
  {id:'dealer_school',name:'Dealer School',desc:'Train weekend dealers and take a small cut of every class.',cost:1800,baseIncome:28,upgradeCost:1200,upgradeIncome:13},
  {id:'private_room',name:'Private Room Stake',desc:'A reserved table, better chairs, and a steady house fee.',cost:4200,baseIncome:72,upgradeCost:2800,upgradeIncome:34}
];
const DRAKE_START_PRICE=12;
const ROTH_DAILY_RATE=.03;
let passiveIncomeState=normalizePassiveIncomeState(safeJson('pokerPassiveIncome_v1',{}));
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function log(t){const d=document.createElement('div');d.textContent=t;el('log').prepend(d)}
function showMenu(){el('gameScreen').classList.add('hidden');el('menuScreen').classList.remove('hidden');renderMenu()}
function showMenuPage(page){
  ['tablesPage','shopPage','infoPage','passiveIncomePage'].forEach(id=>el(id)?.classList.toggle('hidden', id!==page));
  if(page!=='tablesPage'){showSessionRecap=false;el('sessionRecapPanel')?.classList.add('hidden')}
  el('showTablesBtn')?.classList.toggle('active', page==='tablesPage');
  el('showShopBtn')?.classList.toggle('active', page==='shopPage');
  el('showInfoBtn')?.classList.toggle('active', page==='infoPage');
  el('showPassiveIncomeBtn')?.classList.toggle('active', page==='passiveIncomePage');
  if(page==='shopPage'&&!document.querySelector('#shopPage .submenu-actions button.active'))showSubmenu('shop','powerUpsPanel');
  if(page==='infoPage'&&!document.querySelector('#infoPage .submenu-actions button.active'))showSubmenu('info','botsPanel');
  if(page==='passiveIncomePage'&&!document.querySelector('#passiveIncomePage .submenu-actions button.active'))showSubmenu('passive','minesPanel');
  if(page==='passiveIncomePage')renderPassiveIncome();
}
function showSubmenu(group,targetId){
  document.querySelectorAll(`.submenu-panel[data-subpage="${group}"]`).forEach(panel=>panel.classList.toggle('hidden', panel.id!==targetId));
  document.querySelectorAll(`.submenu-actions[data-submenu="${group}"] button`).forEach(btn=>btn.classList.toggle('active', btn.dataset.subpageTarget===targetId));
  if(targetId==='minesPanel'&&!mineGrid.length)startMinesweeper();
}
function saveBankroll(){localStorage.setItem('pokerBankroll_v2', String(bankroll))}
function saveCosmetics(){localStorage.setItem('pokerOwnedCosmetics_v2',JSON.stringify(ownedCosmetics));localStorage.setItem('pokerSelectedCosmetics_v2',JSON.stringify(selectedCosmetics))}
function applyMobileMode(){document.body.classList.toggle('mobile-mode',mobileMode);const btn=el('toggleMobileModeBtn');if(btn)btn.textContent=mobileMode?'Mobile Mode: ON':'Mobile Mode'}
function saveUnlocks(){localStorage.setItem('pokerOwnedPowerUps_v1',JSON.stringify(ownedPowerUps));localStorage.setItem('pokerActivePowerUps_v1',JSON.stringify(activePowerUps));localStorage.setItem('pokerOwnedCompanions_v1',JSON.stringify(ownedCompanions));localStorage.setItem('pokerSelectedCompanion_v1',selectedCompanion)}
function savePassiveIncome(){localStorage.setItem('pokerPassiveIncome_v1',JSON.stringify(passiveIncomeState))}
function hasPowerUp(id){return activePowerUps.includes(id)||selectedCompanion==='quiet_owl'&&id==='pot_odds'}
function hasCompanion(id){return ownedCompanions.includes(id)}
function minesReward(){return selectedCompanion==='bankroll_buddy'?60:50}
function cloneData(value){return JSON.parse(JSON.stringify(value))}
function safeJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return cloneData(fallback)}}
function normalizePassiveIncomeState(saved){
  const now=Date.now(),state=saved&&typeof saved==='object'?saved:{};
  const drakeCoins=Number(state.drake?.coins)||0;
  const drakePrice=Math.max(.25,Number(state.drake?.price)||DRAKE_START_PRICE);
  const hasDrakeCostBasis=state.drake&&Object.prototype.hasOwnProperty.call(state.drake,'costBasis');
  let roth={unlockedBalance:0,lockedBalance:0,lockedUntil:0,lastUpdated:now};
  if(state.roth&&Object.prototype.hasOwnProperty.call(state.roth,'principal')){
    const principal=Number(state.roth.principal)||0;
    const depositedAt=Object.prototype.hasOwnProperty.call(state.roth,'depositedAt')?Number(state.roth.depositedAt)||0:now;
    const lockedUntil=Number(state.roth.lockedUntil)||0;
    const elapsed=Math.max(0,now-depositedAt);
    const migratedValue=principal*(1+ROTH_DAILY_RATE*Math.min(1,elapsed/(24*60*60*1000)));
    roth=now<lockedUntil?{unlockedBalance:0,lockedBalance:migratedValue,lockedUntil,lastUpdated:now}:{unlockedBalance:migratedValue,lockedBalance:0,lockedUntil:0,lastUpdated:now};
  }else if(state.roth){
    roth={
      unlockedBalance:Math.max(0,Number(state.roth.unlockedBalance)||0),
      lockedBalance:Math.max(0,Number(state.roth.lockedBalance)||0),
      lockedUntil:Number(state.roth.lockedUntil)||0,
      lastUpdated:Number(state.roth.lastUpdated)||now
    };
  }
  return {
    owned:{...(state.owned||{})},
    uncollected:Number(state.uncollected)||0,
    lastUpdated:Number(state.lastUpdated)||now,
    drake:{
      coins:drakeCoins,
      costBasis:Math.max(0,hasDrakeCostBasis?Number(state.drake?.costBasis)||0:drakeCoins*drakePrice),
      price:drakePrice,
      lastUpdated:Number(state.drake?.lastUpdated)||now,
      history:Array.isArray(state.drake?.history)&&state.drake.history.length?state.drake.history.slice(-24):[DRAKE_START_PRICE]
    },
    roth
  };
}
function loadCareerStats(){
  const saved=safeJson('pokerCareerStats_v1',DEFAULT_CAREER_STATS);
  const achievements=(saved.achievements||[]).map(a=>typeof a==='string'?{id:a,unlockedAt:''}:a).filter(a=>a&&a.id);
  return {...cloneData(DEFAULT_CAREER_STATS),...saved,botsBusted:{...(saved.botsBusted||{})},timesBustedBy:{...(saved.timesBustedBy||{})},tablePlays:{...(saved.tablePlays||{})},profile:{...cloneData(DEFAULT_CAREER_STATS.profile),...(saved.profile||{})},achievements};
}
function saveCareerStats(){localStorage.setItem('pokerCareerStats_v1',JSON.stringify(careerStats))}
function achievementRecord(id){return careerStats.achievements.find(a=>(typeof a==='string'?a:a.id)===id)}
function achievementUnlocked(id){return !!achievementRecord(id)}
function formatAchievementDate(record){return record?.unlockedAt?record.unlockedAt:'Unlocked before timestamps'}
function unlockAchievement(id){
  if(achievementUnlocked(id))return false;
  careerStats.achievements.push({id,unlockedAt:new Date().toLocaleString()});
  saveCareerStats();
  const ach=ACHIEVEMENTS.find(a=>a.id===id);
  if(ach)lastActionText=`Achievement unlocked: ${ach.name}`;
  return true;
}
function handNameValue(name){
  const order=['High Card','One Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Royal Flush'];
  return order.indexOf(name||'');
}
function maybeUpdateBestHand(target,evalResult){
  if(!evalResult)return;
  if(!target.bestHand||handNameValue(evalResult.name)>handNameValue(target.bestHand.name)||(handNameValue(evalResult.name)===handNameValue(target.bestHand.name)&&compareHands(evalResult,target.bestHand)>0)){
    target.bestHand={name:evalResult.name,rank:evalResult.rank,values:evalResult.values};
  }
}
function startSession(){
  currentSession={table:table.name,buyIn:table.buyIn,startBankroll:bankroll,startStack:players[0]?.chips||0,handsPlayed:0,biggestPotWon:0,biggestLoss:0,bestHand:null,busts:[],bustedBy:[],achievements:[],handStartStack:players[0]?.chips||0,lastActivityAt:Date.now()};
  careerStats.tablesPlayed++;
  careerStats.tablePlays[table.name]=(careerStats.tablePlays[table.name]||0)+1;
  saveCareerStats();
}
function recordActivityTime(){
  if(!currentSession)return;
  const now=Date.now(),last=currentSession.lastActivityAt||now,delta=Math.max(0,now-last);
  if(delta>0)careerStats.profile.activityMs=(careerStats.profile.activityMs||0)+delta;
  currentSession.lastActivityAt=now;
}
function formatActivity(ms){
  const mins=Math.floor((ms||0)/60000),hours=Math.floor(mins/60),rem=mins%60;
  if(hours>0)return `${hours}h ${rem}m`;
  return `${mins}m`;
}
function profilePercent(value,total){return total>0?Math.round((value/total)*100):0}
const PROFILE_TIPS={
  aggressive:{title:'Aggressive',body:'You prefer bets and raises over calling. Higher aggression means you apply more pressure when you enter pots.'},
  loose:{title:'Loose',body:'You play a wider range of starting hands. A loose profile sees more flops and gets involved more often.'},
  passive:{title:'Passive',body:'You prefer checks and calls over betting or raising. Higher passive play means you let opponents drive more of the action.'},
  tight:{title:'Tight',body:'You fold more often and wait for stronger spots. A tight profile enters fewer pots but usually with better hands.'},
  lag:{title:'LAG',body:'Loose-Aggressive. This style plays many hands and pressures opponents with bets and raises.'},
  fish:{title:'Fish',body:'Loose-Passive. This style plays many hands but mostly calls, which can make it easier for aggressive players to value bet.'},
  rock:{title:'Rock',body:'Tight-Passive. This style waits for strong hands and avoids big confrontations unless the cards are very good.'},
  tag:{title:'TAG',body:'Tight-Aggressive. This style is selective preflop, then applies pressure when it has chosen a hand to play.'},
  vpip:{title:'VPIP',body:'Voluntarily Put Money In Pot. This is how often you call or raise preflop, excluding forced blinds.'},
  activity:{title:'Activity',body:'Your recorded time spent at poker tables. It updates as you play and when you leave a table.'},
  pfr:{title:'PFR',body:'Preflop Raise. This is how often you raise before the flop. A higher PFR usually means you enter pots more aggressively.'},
  afq:{title:'AFq',body:'Aggression Frequency. This compares your bets and raises against your calls and checks. Higher means more aggressive decisions.'}
};
function recordAchievementForSession(id){
  const ach=ACHIEVEMENTS.find(a=>a.id===id);
  if(ach&&currentSession&&!currentSession.achievements.includes(ach.name))currentSession.achievements.push(ach.name);
}
function profileTipText(id){
  const tip=PROFILE_TIPS[id]||PROFILE_TIPS.vpip;
  return `<b>${escapeHtml(tip.title)}</b>${escapeHtml(tip.body)}`;
}
function attachProfileTips(){
  const info=el('profileInfo');
  if(!info)return;
  document.querySelectorAll('#playerProfilePanel [data-profile-tip]').forEach(node=>{
    const show=()=>{info.innerHTML=profileTipText(node.dataset.profileTip)};
    node.addEventListener('click',show);
    node.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();show();}
    });
  });
}
function renderPlayerProfile(){
  const box=el('playerProfileContent');
  if(!box)return;
  const profile=careerStats.profile||DEFAULT_CAREER_STATS.profile;
  const hands=Math.max(0,careerStats.handsPlayed||0);
  const vpip=profilePercent(profile.vpipHands||0,hands);
  const pfr=profilePercent(profile.pfrHands||0,hands);
  const actionTotal=(profile.aggressiveActions||0)+(profile.passiveActions||0);
  const afq=profilePercent(profile.aggressiveActions||0,actionTotal);
  const aggressive=afq,loose=vpip,passive=100-afq,tight=100-vpip;
  const cx=150,cy=150,r=94;
  const pts=[
    [cx,cy-r*aggressive/100],
    [cx+r*loose/100,cy],
    [cx,cy+r*passive/100],
    [cx-r*tight/100,cy]
  ];
  const pointString=pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
  box.innerHTML=`
    <div class="profile-wrap">
      <div class="profile-radar">
        <svg viewBox="0 0 300 300" role="img" aria-label="Player style radar chart">
          <circle class="profile-ring" cx="${cx}" cy="${cy}" r="94"></circle>
          <circle class="profile-ring" cx="${cx}" cy="${cy}" r="62"></circle>
          <circle class="profile-ring" cx="${cx}" cy="${cy}" r="31"></circle>
          <line class="profile-axis" x1="${cx}" y1="42" x2="${cx}" y2="258"></line>
          <line class="profile-axis" x1="42" y1="${cy}" x2="258" y2="${cy}"></line>
          <polygon class="profile-shape" points="${pointString}"></polygon>
          ${pts.map(p=>`<circle class="profile-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"></circle>`).join('')}
          <text class="profile-label profile-tip-label" data-profile-tip="aggressive" role="button" tabindex="0" x="${cx}" y="24" text-anchor="middle">Aggressive</text>
          <text class="profile-label profile-tip-label" data-profile-tip="loose" role="button" tabindex="0" x="280" y="${cy+5}" text-anchor="end">Loose</text>
          <text class="profile-label profile-tip-label" data-profile-tip="passive" role="button" tabindex="0" x="${cx}" y="286" text-anchor="middle">Passive</text>
          <text class="profile-label profile-tip-label" data-profile-tip="tight" role="button" tabindex="0" x="20" y="${cy+5}">Tight</text>
          <text class="profile-style-label profile-tip-label" data-profile-tip="lag" role="button" tabindex="0" x="226" y="72" text-anchor="middle">LAG</text>
          <text class="profile-style-label profile-tip-label" data-profile-tip="fish" role="button" tabindex="0" x="226" y="234" text-anchor="middle">Fish</text>
          <text class="profile-style-label profile-tip-label" data-profile-tip="rock" role="button" tabindex="0" x="74" y="234" text-anchor="middle">Rock</text>
          <text class="profile-style-label profile-tip-label" data-profile-tip="tag" role="button" tabindex="0" x="74" y="72" text-anchor="middle">TAG</text>
        </svg>
      </div>
      <div>
        <div class="profile-stats">
          <div class="pill"><button class="profile-stat-btn" data-profile-tip="vpip"><span>VPIP</span><b>${vpip}%</b></button></div>
          <div class="pill"><button class="profile-stat-btn" data-profile-tip="activity"><span>Activity</span><b>${formatActivity(profile.activityMs||0)}</b></button></div>
          <div class="pill"><button class="profile-stat-btn" data-profile-tip="pfr"><span>PFR</span><b>${pfr}%</b></button></div>
          <div class="pill"><button class="profile-stat-btn" data-profile-tip="afq"><span>AFq</span><b>${afq}%</b></button></div>
        </div>
        <div id="profileInfo" class="profile-info">${profileTipText('vpip')}</div>
        <p class="profile-note"><b>VPIP</b> and <b>PFR</b> are based on completed hands. The chart fills in more naturally as you play more sessions.</p>
      </div>
    </div>`;
  attachProfileTips();
}
function renderProfile(){
  const stats=el('careerStatsGrid'),achBox=el('achievementsGrid');
  if(!stats||!achBox)return;
  const topBusted=Object.entries(careerStats.botsBusted||{}).sort((a,b)=>b[1]-a[1])[0];
  const topBustedBy=Object.entries(careerStats.timesBustedBy||{}).sort((a,b)=>b[1]-a[1])[0];
  const favoriteTable=Object.entries(careerStats.tablePlays||{}).sort((a,b)=>b[1]-a[1])[0];
  stats.innerHTML=[
    ['Hands Played',careerStats.handsPlayed],
    ['Lifetime Net',money(careerStats.totalNet)],
    ['Biggest Bankroll',money(careerStats.biggestBankroll)],
    ['Biggest Pot Won',money(careerStats.biggestPotWon)],
    ['Biggest Loss',money(careerStats.biggestLoss)],
    ['Best Hand',careerStats.bestHand?.name||'None yet'],
    ['Tables Played',careerStats.tablesPlayed],
    ['Table Wipes',careerStats.tableWipes||0],
    ['Favorite Table',favoriteTable?`${favoriteTable[0]} (${favoriteTable[1]})`:'None yet'],
    ['Cash Outs',careerStats.cashOuts],
    ['Minesweeper Wins',careerStats.minesweeperWins],
    ['Most Busted',topBusted?`${topBusted[0]} (${topBusted[1]})`:'Nobody yet'],
    ['Busted By',topBustedBy?`${topBustedBy[0]} (${topBustedBy[1]})`:'Nobody yet']
  ].map(([label,value])=>`<div class="pill"><span>${label}</span><b>${value}</b></div>`).join('');
  achBox.innerHTML=ACHIEVEMENTS.map(a=>{
    const record=achievementRecord(a.id),unlocked=!!record;
    return `<div class="location ${unlocked?'':'locked'}" style="min-height:150px;"><h3>${unlocked?'Unlocked':'Locked'}: ${a.name}</h3><p>${a.desc}</p>${unlocked?`<div class="pill">Unlocked<b>${escapeHtml(formatAchievementDate(record))}</b></div>`:''}</div>`;
  }).join('');
}
function renderSessionRecap(){
  const panel=el('sessionRecapPanel'),grid=el('sessionRecapGrid');
  if(!panel||!grid)return;
  if(!lastSessionRecap){panel.classList.add('hidden');grid.innerHTML='';return;}
  panel.classList.toggle('hidden',!showSessionRecap);
  const bustText=lastSessionRecap.busts.length?lastSessionRecap.busts.join('<br>'):'No bustouts recorded';
  grid.innerHTML=[
    ['Table',lastSessionRecap.table],
    ['Hands Played',lastSessionRecap.handsPlayed],
    ['Net Profit / Loss',money(lastSessionRecap.net)],
    ['Biggest Pot Won',money(lastSessionRecap.biggestPotWon)],
    ['Biggest Loss',money(lastSessionRecap.biggestLoss)],
    ['Best Hand',lastSessionRecap.bestHand?.name||'None yet'],
    ['Who Busted Who',bustText],
    ['Achievements',lastSessionRecap.achievements.length?lastSessionRecap.achievements.join('<br>'):'None this session']
  ].map(([label,value])=>`<div class="location" style="min-height:145px;"><h3>${label}</h3><p>${value}</p></div>`).join('');
}
function renderPowerUps(){
  const grid=el('powerUpsGrid'); if(!grid)return; grid.innerHTML='';
  POWER_UPS.forEach(item=>{
    const owned=ownedPowerUps.includes(item.id), active=activePowerUps.includes(item.id);
    const card=document.createElement('div'); card.className='location'; card.style.minHeight='170px';
    card.innerHTML=`<h3>${item.name}</h3><p>${item.desc}</p><div class="pill">Cost<b>${item.cost?money(item.cost):'Free'}</b></div><button data-power="${item.id}" ${owned||bankroll<item.cost?'disabled':''}>${owned?'Owned':'Buy'}</button>${owned?`<button data-toggle-power="${item.id}" class="${active?'danger-btn':'ok-btn'}" style="margin-top:8px;">${active?'Disable':'Enable'}</button>`:''}`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('button[data-power]').forEach(btn=>btn.onclick=()=>buyPowerUp(btn.dataset.power));
  grid.querySelectorAll('button[data-toggle-power]').forEach(btn=>btn.onclick=()=>togglePowerUp(btn.dataset.togglePower));
}
function renderCompanions(){
  const grid=el('companionsGrid'); if(!grid)return; grid.innerHTML='';
  COMPANIONS.forEach(item=>{
    const owned=ownedCompanions.includes(item.id), selected=selectedCompanion===item.id;
    const card=document.createElement('div'); card.className='location'; card.style.minHeight='175px';
    card.innerHTML=`<h3>${item.name}</h3><p>${item.perk}</p><div class="pill">Cost<b>${item.cost?money(item.cost):'Free'}</b></div><button data-companion="${item.id}" ${(!owned&&bankroll<item.cost)?'disabled':''}>${selected?'Equipped':owned?'Equip':'Buy'}</button>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('button[data-companion]').forEach(btn=>btn.onclick=()=>buyOrEquipCompanion(btn.dataset.companion));
}
function buyPowerUp(id){
  const item=POWER_UPS.find(x=>x.id===id); if(!item||ownedPowerUps.includes(id)||bankroll<item.cost)return;
  bankroll-=item.cost; ownedPowerUps.push(id); if(!activePowerUps.includes(id))activePowerUps.push(id); saveBankroll(); saveUnlocks(); renderMenu();
}
function togglePowerUp(id){
  if(!ownedPowerUps.includes(id))return;
  activePowerUps=activePowerUps.includes(id)?activePowerUps.filter(x=>x!==id):[...activePowerUps,id];
  saveUnlocks(); renderMenu();
}
function buyOrEquipCompanion(id){
  const item=COMPANIONS.find(x=>x.id===id); if(!item)return;
  if(!ownedCompanions.includes(id)){if(bankroll<item.cost)return; bankroll-=item.cost; ownedCompanions.push(id)}
  selectedCompanion=id; saveBankroll(); saveUnlocks(); renderMenu();
}
function applyCosmetics(){
  document.documentElement.style.cssText='';
  ['felt','chips','cards'].forEach(cat=>{
    const item=COSMETICS[cat].find(x=>x.id===selectedCosmetics[cat])||COSMETICS[cat][0];
    Object.entries(item.vars||{}).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  });
}
function renderBots(){
  const grid=el('botsGrid'); if(!grid) return; grid.innerHTML='';
  const descriptions={
    'Loose Cannon':'Aggressive gambler who is willing to torch chips.',
    'Gets Restless':'Becomes more impatient as sessions go on.',
    'Strong-Game Shark':'Levels up significantly at tougher tables.',
    'Preflop Raiser':'Likes building pots before the flop.',
    'Cautious Folder':'Avoids marginal spots and folds often.',
    'Tilt Monster':'Gets reckless after losing chips.',
    'Calling Station':'Calls too frequently and hates folding.',
    'Math Grinder':'Very pot-odds focused and disciplined.',
    'Bluff Artist':'Applies pressure with creative bluffs.'
  };

  Object.entries(BOT_PERSONALITIES).forEach(([name,p])=>{
    const card=document.createElement('div');
    card.className='location';
    const busted=careerStats.botsBusted?.[name]||0;
    const bustedBy=careerStats.timesBustedBy?.[name]||0;
    card.innerHTML=`<h3>${name}</h3><p><b>${p.label}</b></p><p>${descriptions[p.label] || 'Balanced poker player.'}</p><div class="loc-stats"><div class="pill">You Busted Them<b>${busted}</b></div><div class="pill">They Busted You<b>${bustedBy}</b></div></div>`;
    grid.appendChild(card);
  });
}

function renderShop(){
  const grid=el('shopGrid'); if(!grid) return; grid.innerHTML='';
  const labels={felt:'Table Felt Skins',chips:'Chip Skins',cards:'Card Back Designs'};
  Object.entries(COSMETICS).forEach(([cat,items])=>{
    const card=document.createElement('div'); card.className='location';
    let html=`<h3>${labels[cat]}</h3><p>Customize your ${cat==='felt'?'table':cat==='chips'?'chip stacks':'card backs'}.</p>`;
    items.forEach(item=>{
      const owned=(ownedCosmetics[cat]||[]).includes(item.id);
      const selected=selectedCosmetics[cat]===item.id;

      let preview='';

      if(cat==='felt'){
        const bg=item.vars?.['--table-felt-bg'] || 'radial-gradient(ellipse at center,#14764c 0%,#07321f 100%)';
        preview=`<div style="width:72px;height:42px;border-radius:12px;border:2px solid rgba(255,255,255,.18);background:${bg};"></div>`;
      }

      if(cat==='chips'){
        const white=item.vars?.['--chip-white-bg'] || 'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#f1f1f1 15% 60%,#bcbcbc 61% 100%)';
        const red=item.vars?.['--chip-red-bg'] || 'radial-gradient(circle at 35% 35%,#fff 0 14%,#ff6b6b 15% 60%,#a32020 61% 100%)';
        const blue=item.vars?.['--chip-blue-bg'] || 'radial-gradient(circle at 35% 35%,#fff 0 14%,#74b8ff 15% 60%,#1d4f88 61% 100%)';
        preview=`<div style="display:flex;gap:4px;align-items:center;"><span style="width:18px;height:18px;border-radius:50%;background:${white};border:${item.vars?.['--chip-border-width'] || '2px'} solid ${item.vars?.['--chip-white-border'] || 'rgba(255,255,255,.25)'};box-shadow:${item.vars?.['--chip-shadow'] || 'none'};"></span><span style="width:18px;height:18px;border-radius:50%;background:${red};border:${item.vars?.['--chip-border-width'] || '2px'} solid ${item.vars?.['--chip-red-border'] || 'rgba(255,255,255,.25)'};box-shadow:${item.vars?.['--chip-shadow'] || 'none'};"></span><span style="width:18px;height:18px;border-radius:50%;background:${blue};border:${item.vars?.['--chip-border-width'] || '2px'} solid ${item.vars?.['--chip-blue-border'] || 'rgba(255,255,255,.25)'};box-shadow:${item.vars?.['--chip-shadow'] || 'none'};"></span></div>`;
      }

      if(cat==='cards'){
        const bg=item.vars?.['--card-back-bg'] || 'linear-gradient(135deg,rgba(255,255,255,.15),transparent),repeating-linear-gradient(45deg,#183a8c,#183a8c 5px,#10265c 5px,#10265c 10px)';
        const border=item.vars?.['--card-back-border'] || '#98b5ff';
        preview=`<div style="width:34px;height:46px;border-radius:8px;background:${bg};border:2px solid ${border};"></div>`;
      }

      html+=`<div class="pill" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          ${preview}
          <span><b>${item.name}</b><br>${item.cost?money(item.cost):'Free'} ${selected?'· Equipped':''}</span>
        </div>
        <button data-cat="${cat}" data-id="${item.id}" ${(!owned&&bankroll<item.cost)?'disabled':''}>${selected?'Equipped':owned?'Equip':'Buy'}</button>
      </div>`;
    });
    card.innerHTML=html; grid.appendChild(card);
  });
  grid.querySelectorAll('button[data-cat]').forEach(btn=>btn.onclick=()=>buyOrEquip(btn.dataset.cat,btn.dataset.id));
}
function buyOrEquip(cat,id){
  const item=COSMETICS[cat].find(x=>x.id===id); if(!item) return;
  ownedCosmetics[cat]=ownedCosmetics[cat]||[];
  if(!ownedCosmetics[cat].includes(id)){
    if(bankroll<item.cost) return;
    bankroll-=item.cost;
    ownedCosmetics[cat].push(id);
  }
  selectedCosmetics[cat]=id;
  saveBankroll(); saveCosmetics(); applyCosmetics(); renderMenu();
}
function saveBankrollSnapshot(){
  accruePassiveIncome();
  const atTable = table && players.length && !el('gameScreen').classList.contains('hidden');
  const tableStack = atTable ? (players[0]?.chips || 0) : 0;
  if(atTable){recordActivityTime();saveCareerStats();}
  localStorage.setItem('pokerBankroll_v2', String(bankroll + tableStack));
}
function tableBotPool(t,{includeCelebrity=false}={}){
  const playerLower=playerName.toLowerCase();
  const fullPool=[...(t.botNames||[]),...BOT_NAMES].filter(name=>{
    if(name==='Andrew'&&t.skill!=='shark')return false;
    if(name==='Josh'&&!includeCelebrity)return false;
    return true;
  });
  const seen=new Set([playerLower]);
  const pool=[];
  for(const name of fullPool){
    const key=name.toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    pool.push(name);
  }
  return pool;
}
function shuffleList(list){
  const copy=[...list];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function tableBotSeats(t){
  const includeCelebrity=Math.random()<0.05;
  const pool=tableBotPool(t,{includeCelebrity});
  const playerLower=playerName.toLowerCase();
  const fixed=(t.fixedBots||[]).filter(name=>name.toLowerCase()!==playerLower&&pool.includes(name)).slice(0,t.bots);
  const rest=shuffleList(pool.filter(name=>!fixed.includes(name)));
  return [...fixed,...rest].slice(0,t.bots);
}
function scoutBotText(t){
  const pool=tableBotPool(t,{includeCelebrity:false});
  const fixed=(t.fixedBots||[]).filter(name=>name.toLowerCase()!==playerName.toLowerCase()&&pool.includes(name));
  const celebrity=playerName.toLowerCase()==='josh'?'':'; Josh 5% celebrity';
  return `${fixed.length?`Always: ${fixed.join(', ')}. `:''}Pool: ${pool.join(', ')}${celebrity}`;
}
function passiveIncomeRate(){
  return PASSIVE_BUSINESSES.reduce((sum,b)=>{
    const level=passiveIncomeState.owned?.[b.id]||0;
    if(level<=0)return sum;
    return sum+b.baseIncome+(level-1)*b.upgradeIncome;
  },0);
}
function accruePassiveIncome(){
  const now=Date.now(),last=Number(passiveIncomeState.lastUpdated)||now,elapsed=Math.max(0,Math.min(now-last,8*60*60*1000));
  passiveIncomeState.uncollected=(Number(passiveIncomeState.uncollected)||0)+passiveIncomeRate()*(elapsed/60000);
  passiveIncomeState.lastUpdated=now;
  savePassiveIncome();
}
function passiveBusinessCost(b){
  const level=passiveIncomeState.owned?.[b.id]||0;
  return level<=0?b.cost:Math.round(b.upgradeCost*Math.pow(1.45,level-1));
}
function tickDrakeCoin(){
  const drake=passiveIncomeState.drake,now=Date.now(),tickMs=5000;
  let ticks=Math.floor(Math.max(0,now-(Number(drake.lastUpdated)||now))/tickMs);
  if(ticks<=0)return;
  ticks=Math.min(ticks,720);
  for(let i=0;i<ticks;i++){
    const swing=(Math.random()-.48)*.065;
    const hype=Math.random()<.04?(Math.random()-.35)*.22:0;
    drake.price=Math.max(.25,Math.min(500,drake.price*(1+swing+hype)));
    drake.history.push(Number(drake.price.toFixed(2)));
    if(drake.history.length>24)drake.history.shift();
  }
  drake.lastUpdated=now;
  savePassiveIncome();
}
function drakeMood(){
  const h=passiveIncomeState.drake.history||[];
  if(h.length<2)return 'Flat';
  const change=(h[h.length-1]-h[0])/Math.max(.01,h[0]);
  if(change>.08)return 'Pumping';
  if(change<-.08)return 'Dumping';
  return change>=0?'Green':'Choppy';
}
function renderLineChart(svg,values){
  if(!svg)return;
  const points=(values&&values.length?values:[DRAKE_START_PRICE]).map(Number);
  const width=640,height=190,pad=18;
  const min=Math.min(...points),max=Math.max(...points),range=Math.max(.01,max-min);
  const coords=points.map((value,index)=>{
    const x=pad+(points.length===1?.5:index/(points.length-1))*(width-pad*2);
    const y=height-pad-((value-min)/range)*(height-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last=points[points.length-1],first=points[0],lineClass=last>=first?'up':'down';
  const area=`${pad},${height-pad} ${coords.join(' ')} ${width-pad},${height-pad}`;
  svg.innerHTML=`<defs><linearGradient id="drakeChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${lineClass==='up'?'#8fee9f':'#ff8585'}" stop-opacity=".28"/><stop offset="100%" stop-color="${lineClass==='up'?'#8fee9f':'#ff8585'}" stop-opacity="0"/></linearGradient></defs><polyline class="chart-grid" points="${pad},${pad} ${width-pad},${pad} ${width-pad},${height-pad} ${pad},${height-pad} ${pad},${pad}"/><polygon class="chart-area" points="${area}"/><polyline class="chart-line ${lineClass}" points="${coords.join(' ')}"/><circle class="chart-dot ${lineClass}" cx="${coords[coords.length-1].split(',')[0]}" cy="${coords[coords.length-1].split(',')[1]}" r="5"/><text class="chart-label" x="${pad}" y="${pad+3}">$${max.toFixed(2)}</text><text class="chart-label" x="${pad}" y="${height-pad}">$${min.toFixed(2)}</text>`;
}
function updateRothIra(){
  const roth=passiveIncomeState.roth,now=Date.now(),dayMs=24*60*60*1000;
  const last=Number(roth.lastUpdated)||now;
  const elapsed=Math.max(0,Math.min(now-last,30*dayMs));
  if(elapsed>0){
    const growth=Math.pow(1+ROTH_DAILY_RATE,elapsed/dayMs);
    roth.unlockedBalance=(Number(roth.unlockedBalance)||0)*growth;
    roth.lockedBalance=(Number(roth.lockedBalance)||0)*growth;
    roth.lastUpdated=now;
  }
  if((roth.lockedBalance||0)>0&&now>=(roth.lockedUntil||0)){
    roth.unlockedBalance=(Number(roth.unlockedBalance)||0)+(Number(roth.lockedBalance)||0);
    roth.lockedBalance=0;
    roth.lockedUntil=0;
  }
  if((roth.unlockedBalance||0)<.01)roth.unlockedBalance=0;
  if((roth.lockedBalance||0)<.01)roth.lockedBalance=0;
  if(!(roth.lockedBalance||0))roth.lockedUntil=0;
  roth.lastUpdated=now;
}
function rothTotalValue(){
  const roth=passiveIncomeState.roth;
  return (Number(roth.unlockedBalance)||0)+(Number(roth.lockedBalance)||0);
}
function formatDuration(ms){
  if(ms<=0)return 'Ready';
  const total=Math.ceil(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
  if(h>0)return `${h}h ${m}m`;
  if(m>0)return `${m}m ${s}s`;
  return `${s}s`;
}
function renderPassiveIncome(){
  accruePassiveIncome();
  tickDrakeCoin();
  updateRothIra();
  const grid=el('passiveIncomeGrid');
  if(!grid)return;
  const rate=passiveIncomeRate(),ready=Math.floor(passiveIncomeState.uncollected||0);
  el('passiveReadyAmount').textContent=money(ready);
  el('passiveIncomeRate').textContent=`${money(rate)} / min`;
  el('passiveOwnedCount').textContent=Object.values(passiveIncomeState.owned||{}).filter(level=>level>0).length;
  el('collectPassiveIncomeBtn').disabled=ready<=0;
  grid.innerHTML='';
  PASSIVE_BUSINESSES.forEach(b=>{
    const level=passiveIncomeState.owned?.[b.id]||0,cost=passiveBusinessCost(b);
    const income=level>0?b.baseIncome+(level-1)*b.upgradeIncome:0;
    const card=document.createElement('div');
    card.className='location passive-business-card'+(level<=0?' locked':'');
    card.innerHTML=`<h3>${b.name}</h3><p>${b.desc}</p><div class="loc-stats"><div class="pill">Level<b>${level}</b></div><div class="pill">Income<b>${money(income)} / min</b></div><div class="pill">Next Cost<b>${money(cost)}</b></div><div class="pill">Next Adds<b>${money(level<=0?b.baseIncome:b.upgradeIncome)} / min</b></div></div><button data-passive-business="${b.id}" ${bankroll<cost?'disabled':''}>${level<=0?'Start Business':'Upgrade'}</button><div class="unlock-note">${bankroll<cost?'Need '+money(cost)+' in bank':'Ready to invest'}</div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('button[data-passive-business]').forEach(btn=>btn.onclick=()=>buyPassiveBusiness(btn.dataset.passiveBusiness));
  renderDrakeCoin();
  renderRothIra();
  savePassiveIncome();
}
function renderDrakeCoin(){
  const drake=passiveIncomeState.drake;
  if(!el('drakeTickerPrice'))return;
  const value=drake.coins*drake.price;
  const basis=drake.costBasis||0,gain=value-basis,gainPct=basis>0?gain/basis*100:0;
  el('drakeTickerPrice').textContent=`$${drake.price.toFixed(2)}`;
  el('drakeTickerMood').textContent=drakeMood();
  el('drakeCoinOwned').textContent=`${drake.coins.toFixed(4)} DRAKE`;
  el('drakeCoinValue').textContent=money(value);
  const change=el('drakeCoinGain');
  if(change){
    change.textContent=basis>0?`${gain>=0?'+':''}${money(gain)} (${gainPct>=0?'+':''}${gainPct.toFixed(1)}%)`:'No position';
    change.className=`position-change ${basis<=0?'neutral':gain>=0?'gain':'loss'}`;
  }
  renderLineChart(el('drakeLineChart'),drake.history||[drake.price]);
}
function renderRothIra(){
  if(!el('rothLockedBalance'))return;
  const roth=passiveIncomeState.roth,remaining=(roth.lockedUntil||0)-Date.now();
  el('rothLockedBalance').textContent=money(roth.lockedBalance||0);
  el('rothUnlockedBalance').textContent=money(roth.unlockedBalance||0);
  el('rothProjected').textContent=money(rothTotalValue());
  el('rothRate').textContent=`${(ROTH_DAILY_RATE*100).toFixed(2)}%`;
  el('rothUnlockText').textContent=roth.lockedBalance?formatDuration(remaining):'No locked funds';
  el('withdrawRothBtn').disabled=(roth.unlockedBalance||0)<1;
}
function buyPassiveBusiness(id){
  accruePassiveIncome();
  const business=PASSIVE_BUSINESSES.find(b=>b.id===id);
  if(!business)return;
  const cost=passiveBusinessCost(business);
  if(bankroll<cost)return;
  bankroll-=cost;
  passiveIncomeState.owned={...(passiveIncomeState.owned||{}),[id]:(passiveIncomeState.owned?.[id]||0)+1};
  saveBankroll();
  savePassiveIncome();
  renderMenu();
}
function buyDrakeCoin(){
  tickDrakeCoin();
  const amount=Math.floor(parseFloat(el('drakeBuyAmount').value||'0'));
  if(!amount||amount<=0||bankroll<amount)return;
  bankroll-=amount;
  passiveIncomeState.drake.coins+=amount/passiveIncomeState.drake.price;
  passiveIncomeState.drake.costBasis=(passiveIncomeState.drake.costBasis||0)+amount;
  el('drakeBuyAmount').value='';
  saveBankroll();
  savePassiveIncome();
  renderMenu();
}
function sellDrakeCoin(amount=null){
  tickDrakeCoin();
  const drake=passiveIncomeState.drake;
  const coins=amount==null?parseFloat(el('drakeSellAmount').value||'0'):amount;
  if(!coins||coins<=0||drake.coins<=0)return;
  const sold=Math.min(coins,drake.coins);
  const basisSold=drake.coins>0?(drake.costBasis||0)*(sold/drake.coins):0;
  drake.coins-=sold;
  drake.costBasis=Math.max(0,(drake.costBasis||0)-basisSold);
  if(drake.coins<0.000001){drake.coins=0;drake.costBasis=0}
  bankroll+=Math.floor(sold*drake.price);
  el('drakeSellAmount').value='';
  careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
  saveBankroll();
  saveCareerStats();
  savePassiveIncome();
  renderMenu();
}
function depositRoth(){
  const amount=Math.floor(parseFloat(el('rothDepositAmount').value||'0'));
  if(!amount||amount<=0||bankroll<amount)return;
  updateRothIra();
  bankroll-=amount;
  passiveIncomeState.roth.lockedBalance=(passiveIncomeState.roth.lockedBalance||0)+amount;
  passiveIncomeState.roth.lockedUntil=Date.now()+24*60*60*1000;
  passiveIncomeState.roth.lastUpdated=Date.now();
  el('rothDepositAmount').value='';
  saveBankroll();
  savePassiveIncome();
  renderMenu();
}
function withdrawRoth(){
  updateRothIra();
  const roth=passiveIncomeState.roth;
  const payout=Math.floor(roth.unlockedBalance||0);
  if(payout<=0)return;
  bankroll+=payout;
  roth.unlockedBalance=Math.max(0,(roth.unlockedBalance||0)-payout);
  careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
  saveBankroll();
  saveCareerStats();
  savePassiveIncome();
  renderMenu();
}
function collectPassiveIncome(){
  accruePassiveIncome();
  const payout=Math.floor(passiveIncomeState.uncollected||0);
  if(payout<=0)return;
  bankroll+=payout;
  passiveIncomeState.uncollected=(passiveIncomeState.uncollected||0)-payout;
  careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
  saveBankroll();
  saveCareerStats();
  savePassiveIncome();
  renderMenu();
}
function renderMenu(){saveBankroll();applyCosmetics();applyMobileMode();el('menuBankroll').textContent=money(bankroll);el('playerNameInput').value=playerName;el('mineRewardText').textContent=minesReward();el('mineRewardBtnText').textContent=minesReward();renderShop();renderPowerUps();renderCompanions();renderBots();renderProfile();renderPlayerProfile();renderSessionRecap();renderPassiveIncome();const box=el('locations');box.innerHTML='';TABLES.forEach((t,i)=>{const unlocked=bankroll>=t.unlock;const canBuy=bankroll>=t.buyIn;const scout=hasPowerUp('table_scout')?`<div class="pill">Pool<b>${scoutBotText(t)}</b></div>`:'';const d=document.createElement('div');d.className='location '+(!unlocked?'locked':'');d.innerHTML=`<h3>${i+1}. ${t.name}</h3><p>${t.desc}</p><div class="loc-stats"><div class="pill">Buy-In<b>${money(t.buyIn)}</b></div><div class="pill">Blinds<b>${money(t.sb)} / ${money(t.bb)}</b></div><div class="pill">Bots<b>${t.bots}</b></div><div class="pill">Skill<b>${t.skill}</b></div>${scout}</div><button ${!unlocked||!canBuy?'disabled':''}>Play This Table</button><div class="unlock-note">${!unlocked?'Unlock at '+money(t.unlock)+' bankroll':!canBuy?'Need '+money(t.buyIn)+' to buy in':'Available now'}</div>`;d.querySelector('button').onclick=()=>startTable(i);box.appendChild(d)});if(!el('shopPage').classList.contains('hidden'))showMenuPage('shopPage');else if(!el('infoPage').classList.contains('hidden'))showMenuPage('infoPage');else if(!el('passiveIncomePage').classList.contains('hidden'))showMenuPage('passiveIncomePage');else showMenuPage('tablesPage')}
function startTable(i){table=TABLES[i];bankroll-=table.buyIn;saveBankroll();createPlayers();startSession();handNum=1;el('log').innerHTML='';el('menuScreen').classList.add('hidden');el('gameScreen').classList.remove('hidden');el('tableName').textContent=table.name;el('tableSubtitle').textContent=`${money(table.buyIn)} buy-in · blinds ${money(table.sb)} / ${money(table.bb)} · ${table.skill} bots`;resetForHand()}
function createPlayers(){
players=[{name:playerName,human:true,chips:table.buyIn}];
const tableBots=tableBotSeats(table);

for(let i=0;i<table.bots&&i<tableBots.length;i++)players.push({name:tableBots[i],human:false,chips:table.buyIn,personality:BOT_PERSONALITIES[tableBots[i]]||{label:'Balanced'}});players.forEach((p,i)=>Object.assign(p,{id:i,hand:[],bet:0,totalCommitted:0,folded:false,out:false,hasCards:false,allIn:false,lastAction:'',showCards:false,winner:false,winningHandName:'',betChipVisual:''}));dealerIndex=players.length-1;minRaise=table.bb}
function cardHtml(c,h=false){if(h)return'<div class="card back"></div>';const color=c.suit==='♥'||c.suit==='♦'?'red':'black';return`<div class="card ${color}"><div class="rank">${c.rank}</div><div class="suit">${c.suit}</div></div>`}
function chipBreakdown(amount){
  const bb = table?.bb || 2;
  const values = [
    { cls: 'bluechip', value: bb * 25 },
    { cls: 'redchip', value: bb * 5 },
    { cls: '', value: bb }
  ];

  let remaining = Math.max(0, Math.round(amount));
  return values.map(v => {
    const count = Math.floor(remaining / v.value);
    remaining -= count * v.value;
    return { ...v, count };
  }).reverse();
}

function chipColumn(count, cls){
  if(count <= 0) return '';
  const visible = Math.min(4, count);
  let chips = '';
  for(let i = 0; i < visible; i++) chips += `<span class="chip ${cls}"></span>`;
  return `<span class="stack-column" title="${count} chip${count === 1 ? '' : 's'}">${chips}</span>`;
}

function chipsHtml(amount){
  if(!amount || amount <= 0) return '';
  const columns = chipBreakdown(amount)
    .map(x => chipColumn(Math.min(4, x.count), x.cls))
    .join('');
  return `<span class="chip-stack" title="${money(amount)}">${columns}</span>`;
}

function addChipVisual(amount){
  return chipsHtml(amount);
}

function chipFlightClasses(amount){
  const classes=[];
  chipBreakdown(amount).forEach(({cls,count})=>{
    for(let i=0;i<Math.min(5,count);i++)classes.push(cls);
  });
  return classes.slice(0,10);
}

function playerSeatElement(playerId){
  return document.querySelector(`[data-player-id="${playerId}"]`);
}

function visiblePotElement(){
  const potChips=el('potChips');
  if(potChips&&potChips.getBoundingClientRect().width>0)return potChips;
  return el('pot');
}

function rectCenter(rect){
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
}

function animateChipFlight(fromEl,toEl,amount,{reverse=false}={}){
  if(!fromEl||!toEl||!amount||amount<=0||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const fromRect=fromEl.getBoundingClientRect(),toRect=toEl.getBoundingClientRect();
  if((fromRect.width===0&&fromRect.height===0)||(toRect.width===0&&toRect.height===0))return;
  const from=rectCenter(fromRect),to=rectCenter(toRect);
  const classes=chipFlightClasses(amount);
  const start=reverse?to:from,end=reverse?from:to;
  classes.forEach((cls,index)=>{
    const chip=document.createElement('span');
    chip.className=`chip chip-flight ${cls}`;
    chip.style.left=`${start.x-9}px`;
    chip.style.top=`${start.y-9}px`;
    chip.style.setProperty('--chip-delay',`${index*42}ms`);
    const spread=(index-(classes.length-1)/2)*5;
    const arc=reverse?-42-Math.random()*26:42+Math.random()*26;
    chip.style.setProperty('--chip-x',`${end.x-start.x+spread}px`);
    chip.style.setProperty('--chip-y',`${end.y-start.y}px`);
    chip.style.setProperty('--chip-arc',`${arc}px`);
    document.body.appendChild(chip);
    chip.addEventListener('animationend',()=>chip.remove(),{once:true});
  });
}

function animateBetToPot(playerId,amount){
  const from=playerSeatElement(playerId),to=visiblePotElement();
  animateChipFlight(from,to,amount);
}

function animatePotToWinners(winners){
  const potEl=visiblePotElement();
  winners.filter(Boolean).forEach((winner,index)=>{
    setTimeout(()=>animateChipFlight(playerSeatElement(winner.id),potEl,Math.max(table?.bb||1,pot/(winners.length||1)),{reverse:true}),index*120);
  });
}

function stackChipsHtml(amount){
  if(!amount || amount <= 0) return '';
  const columns = chipBreakdown(amount)
    .map(x => chipColumn(x.count, x.cls))
    .join('');
  return `<span class="bank-chip-stack" title="Approx. stack: ${money(amount)}">${columns}</span>`;
}
function nextDealtFrom(start){for(let s=1;s<=players.length;s++){let i=(start+s)%players.length;if(!players[i].out)return i}return 0}
function nextActiveFrom(start){for(let s=1;s<=players.length;s++){let i=(start+s)%players.length,p=players[i];if(!p.out&&!p.folded&&p.hasCards&&p.chips>0)return i}return -1}
function playersInHand(){return players.filter(p=>!p.folded&&!p.out&&p.hasCards)}
function playersWhoCanAct(){return players.filter(p=>!p.folded&&!p.out&&p.hasCards&&p.chips>0)}
function isAllInShowdown(){const live=playersInHand();return live.length>1&&live.every(p=>p.allIn||p.chips<=0)}
function resetForHand(){lastAdviceHand=-1;waitingForNextHand=false;deck=makeDeck();community=[];pot=0;potChipVisual='';lastRenderedPot=-1;currentBet=0;raiseCountThisStreet=0;lastHandWinners=[];oddsTipUsedThisHand=false;oddsTipMessage='';tiltGuardWarnedThisHand=false;currentHandProfile={vpip:false,pfr:false};players.forEach(p=>{p.showCards=false;p.winner=false;p.winningHandName='';});minRaise=table.bb;street='preflop';actedThisStreet=new Set();lastActionText='New hand started';players.forEach(p=>Object.assign(p,{hand:[],bet:0,totalCommitted:0,folded:false,hasCards:!p.out&&p.chips>0,allIn:false,lastAction:'',showCards:false,winner:false,winningHandName:'',betChipVisual:''}));if(players.filter(p=>!p.out&&p.chips>0).length<2){lastActionText='Table finished. Cash out to the menu.';waitingForNextHand=true;render();return}dealerIndex=nextDealtFrom(dealerIndex);handStartStacks=players.map(p=>p.chips);if(currentSession)currentSession.handStartStack=players[0]?.chips||0;currentHandHeroRaised=false;currentHandHeroPreflopStrength=0;for(let r=0;r<2;r++)for(let i=0;i<players.length;i++){let idx=(dealerIndex+1+i)%players.length;if(players[idx].hasCards)players[idx].hand.push(deck.pop())}currentHandHeroPreflopStrength=players[0]?.hand?.length===2?preflopStrength(players[0].hand):0;let sb=nextDealtFrom(dealerIndex),bb=nextDealtFrom(sb);postBlind(sb,table.sb);postBlind(bb,table.bb);currentBet=Math.max(...players.map(p=>p.bet));players[sb].lastAction=`SB ${money(table.sb)}`;players[bb].lastAction=`BB ${money(table.bb)}`;lastActionText=`${players[sb].name} posted SB. ${players[bb].name} posted BB.`;currentIndex=nextActiveFrom(bb);showMessage(actionMessageFor(currentIndex));render();runBotsIfNeeded()}
function postBlind(i,a){const p=players[i],pay=Math.min(a,p.chips);p.chips-=pay;p.bet+=pay;p.totalCommitted+=pay;pot+=pay;p.betChipVisual+=addChipVisual(pay);potChipVisual+=addChipVisual(pay);if(p.chips===0)p.allIn=true}
function actionMessageFor(index){
  const p=players[index];
  if(!p)return 'Action is on nobody.';
  const toCall=Math.max(0,currentBet-p.bet);
  if(p.human){
    if(toCall>0){
      const callText=toCall>=p.chips?`${money(p.chips)} to call all in`:`${money(toCall)} to call`;
      const dog=selectedCompanion==='dealer_dog'&&toCall>p.chips*.5?' Dealer Dog thinks this is a big bite.':'';
      return `${callText}.${dog}`;
    }
    if(selectedCompanion==='card_cat'&&p.hand?.length===2)return `Action is on you. Card Cat says your preflop vibe is ${preflopStrength(p.hand)>.62?'spicy':'manageable'}.`;
    return 'Action is on you.';
  }
  if(toCall>0)return `Action is on ${p.name}: ${money(Math.min(toCall,p.chips))} to call.`;
  return `Action is on ${p.name}.`;
}
function showMessage(t){
  currentGameMessage=String(t).includes('<span')?t:escapeHtml(t);
  if(adviceTimer) return;
  el('message').innerHTML=currentGameMessage;
}
function forceMessage(t){
  el('message').innerHTML=t;
}
function maybeNpcAdvice(force=false){}
function showNpcAdvice(npc){
  if(!npc || npc.human) return;
  const lines=NPC_ADVICE[npc.name] || ['Play the player, not just the cards.','Do not forget position.','Small pots are better than bad big pots.'];
  const advice=lines[Math.floor(Math.random()*lines.length)];

  if(adviceTimer){
    clearTimeout(adviceTimer);
    adviceTimer=null;
  }

  forceMessage(`<b>${escapeHtml(npc.name)}:</b> “${escapeHtml(advice)}”`);
  adviceTimer=setTimeout(()=>{
    adviceTimer=null;
    forceMessage(currentGameMessage);
  },3500);
}
function actionBannerHtml(){
  const h=players[0],toCall=h&&!waitingForNextHand?Math.max(0,currentBet-h.bet):0;
  if(mobileMode&&currentIndex===0&&toCall>0&&!waitingForNextHand)return currentGameMessage;
  return escapeHtml(lastActionText);
}
function renderOddsHelper(){
  const helper=el('oddsHelperLine'),h=players[0],toCall=h&&!waitingForNextHand?Math.max(0,currentBet-h.bet):0;
  if(!helper)return;
  helper.classList.remove('good');
  helper.textContent='';
  if(oddsTipMessage){
    helper.textContent=oddsTipMessage;
    helper.classList.add('good');
    return;
  }
  if(!hasPowerUp('pot_odds')||currentIndex!==0||toCall<=0||waitingForNextHand)return;
  const price=toCall/Math.max(1,pot+toCall);
  helper.textContent=`Pot odds: win ${money(pot+toCall)} if you call.`;
  if(price<=.20)helper.classList.add('good');
}
function render(){let h=players[0];el('bankrollTop').textContent=money(bankroll);el('handNum').textContent=handNum;el('pot').textContent=money(pot);el('topPot').textContent=money(pot);el('heroChips').textContent=money(h?.chips||0);el('totalMoneyTop').textContent=money(bankroll+(h?.chips||0));el('toCall').textContent=money(h&&!waitingForNextHand?Math.max(0,currentBet-h.bet):0);el('actionBanner').innerHTML=actionBannerHtml();
      renderOddsHelper();
      renderPotBreakdown();
      if(lastRenderedPot !== pot){
        el('potChips').innerHTML = potChipVisual || chipsHtml(pot);
        lastRenderedPot = pot;
      }renderPlayers();renderCommunity();renderControls()}
function getPotBreakdown(){
  const maxCommitted=Math.max(0,...players.map(p=>p.totalCommitted||0));
  const allInLevels=[...new Set(players
    .filter(p=>p.totalCommitted>0&&(p.allIn||p.out||p.chips<=0)&&p.totalCommitted<maxCommitted)
    .map(p=>p.totalCommitted))].sort((a,b)=>a-b);
  if(allInLevels.length===0)return [];
  const levels=[...allInLevels,maxCommitted];
  let previous=0;
  return levels.map(level=>{
    const contributors=players.filter(p=>p.totalCommitted>=level);
    const amount=players.reduce((sum,p)=>sum+Math.max(0,Math.min(p.totalCommitted,level)-previous),0);
    const potInfo={amount,contributors:contributors.length,returned:contributors.length===1};
    previous=level;
    return potInfo;
  }).filter(p=>p.amount>0);
}
function renderPotBreakdown(){
  const box=el('potBreakdown');
  if(!box)return;
  const pots=getPotBreakdown().filter(p=>!p.returned);
  if(pots.length<=1){box.innerHTML='';return}
  box.innerHTML=pots.map((p,i)=>`<div class="pill" style="min-width:110px;text-align:center;">${i===0?'Main Pot':'Side Pot '+i}<b>${money(p.amount)}</b></div>`).join('');
}
function renderPlayers(){const c=el('players');c.innerHTML='';players.map((p,i)=>({p,i})).filter(x=>!x.p.human).sort((a,b)=>Number(a.p.out)-Number(b.p.out)||a.i-b.i).forEach(({p,i})=>{const d=document.createElement('div');d.className='seat'+(i===currentIndex&&!waitingForNextHand?' active':'')+(p.winner?' winner':'')+(p.folded?' folded':'')+(p.out?' out':'');d.dataset.playerId=String(p.id);const badges=[];if(i===dealerIndex)badges.push('<span class="badge dealer">D</span>');if(p.allIn)badges.push('<span class="badge allin">ALL IN</span>');if(p.winner)badges.push('<span class="badge winner-badge">WINNER</span>');d.onclick=()=>showNpcAdvice(p);
d.innerHTML=`<div class="seat-header"><span>${escapeHtml(p.name)}<br><small style="opacity:.72;font-weight:600;">${escapeHtml(p.personality?.label || 'Balanced')}</small></span><span>${badges.join(' ')}</span></div><div class="cards">${p.hand.map(x=>cardHtml(x,!waitingForNextHand&&!p.showCards)).join('')}</div><div class="hand-label">${escapeHtml(p.winningHandName || '')}</div><div class="seat-info"><span>Chips: <b>${money(p.chips)}</b>${stackChipsHtml(p.chips)}</span><span>Bet: <b>${money(p.bet)}</b>${p.betChipVisual || chipsHtml(p.bet)}</span><span>Status: <b>${p.out?'Out':p.folded?'Folded':p.allIn?'All In':'In'}</b></span><span>Action: <b style="color:var(--gold)">${escapeHtml(p.lastAction||'—')}</b></span></div>`;c.appendChild(d)});let p=players[0],badges=[];if(dealerIndex===0)badges.push('<span class="badge dealer">D</span>');if(p.allIn)badges.push('<span class="badge allin">ALL IN</span>');if(p.winner)badges.push('<span class="badge winner-badge">WINNER</span>');el('heroArea').innerHTML=`<div class="seat ${currentIndex===0&&!waitingForNextHand?'active':''} ${p.winner?'winner':''} ${p.folded?'folded':''} ${p.out?'out':''}" data-player-id="0"><div class="seat-header"><span>${escapeHtml(p.name)}</span><span>${badges.join(' ')}</span></div><div class="cards">${p.hand.map(x=>cardHtml(x,false)).join('')}</div><div class="hand-label">${escapeHtml(p.winningHandName || '')}</div><div class="seat-info"><span>Chips: <b>${money(p.chips)}</b>${stackChipsHtml(p.chips)}</span><span>Bet: <b>${money(p.bet)}</b>${p.betChipVisual || chipsHtml(p.bet)}</span><span>Status: <b>${p.out?'Out':p.folded?'Folded':p.allIn?'All In':'In'}</b></span><span>Action: <b style="color:var(--gold)">${escapeHtml(p.lastAction||'—')}</b></span></div></div>`}
function renderCommunity(){el('community').innerHTML=community.map(c => cardHtml(c)).join('')||'<span style="opacity:.7">Community cards will appear here.</span>'}
function renderControls(){
let h=players[0],heroTurn=currentIndex===0&&!waitingForNextHand&&h&&!h.folded&&!h.out&&h.chips>0,toCall=Math.max(0,currentBet-(h?.bet||0));
const allInTarget=h?h.bet+h.chips:0;
const minTarget=currentBet===0?table.bb:currentBet+minRaise;
const canRaise=heroTurn&&h&&allInTarget>h.bet&&(!actedThisStreet.has(h.id)||h.bet===currentBet);
const heroBusted=waitingForNextHand&&h&&h.chips<=0;
el('foldBtn').disabled=!heroTurn;
el('checkBtn').disabled=!heroTurn||toCall>0;
el('callBtn').disabled=!heroTurn||toCall===0;
el('betBtn').disabled=!canRaise;
if(!mobileBetDrag)el('betBtn').textContent=mobileMode?'Raise 3x / Drag':'Raise 3x';
el('nextHandBtn').disabled=!waitingForNextHand||heroBusted;
el('leaveTableBtn').disabled=!waitingForNextHand;
el('oddsTipBtn').disabled=!heroTurn||!hasPowerUp('small_blind_tip')||oddsTipUsedThisHand||bankroll<(table?.sb||0);
['raise2xBtn','raise3xBtn','raise5xBtn','allInBtn'].forEach(id=>el(id).disabled=!canRaise);

const maxTarget=allInTarget;
const slider=el('customBetSlider');
const customBtn=el('customBetBtn');
const customAmount=el('customBetAmount');
const canCustomBet=canRaise&&maxTarget>=minTarget;
slider.disabled=!canCustomBet;
customBtn.disabled=!canCustomBet;
slider.min=minTarget;
slider.max=maxTarget;
slider.step=table?.bb||1;
if(!canCustomBet){
  slider.value=0;
  customAmount.textContent='$0';
}else{
  let current=parseInt(slider.value||minTarget,10);
  if(current<minTarget||current>maxTarget) current=minTarget;
  slider.value=current;
  customAmount.textContent=money(current);
}
}
function playerAction(action,raiseTo=0){
if(waitingForNextHand)return;
let p=players[currentIndex];
if(!p||p.folded||p.out||p.chips<=0)return;
let toCall=Math.max(0,currentBet-p.bet);
if(action==='raise'&&actedThisStreet.has(p.id)&&p.bet<currentBet)action='call';
if(action==='check'&&toCall>0)return;
if(p.human){
  if(action==='raise')currentHandHeroRaised=true;
  if(action==='raise')careerStats.profile.aggressiveActions=(careerStats.profile.aggressiveActions||0)+1;
  if(action==='call'||action==='check')careerStats.profile.passiveActions=(careerStats.profile.passiveActions||0)+1;
  if(street==='preflop'&&(action==='call'||action==='raise')&&!currentHandProfile.vpip){
    careerStats.profile.vpipHands=(careerStats.profile.vpipHands||0)+1;
    currentHandProfile.vpip=true;
  }
  if(street==='preflop'&&action==='raise'&&!currentHandProfile.pfr){
    careerStats.profile.pfrHands=(careerStats.profile.pfrHands||0)+1;
    currentHandProfile.pfr=true;
  }
}
if(action==='fold'){
if(p.human&&p.hand.length===2&&p.hand.every(c=>c.rank==='A')){unlockAchievement('folded_aces');recordAchievementForSession('folded_aces')}
p.folded=true;p.lastAction='Folded';lastActionText=`${p.name} folded`;log(`${p.name} folds.`);
}else if(action==='check'){
if(toCall>0)return;p.lastAction='Checked';lastActionText=`${p.name} checked`;log(`${p.name} checks.`);
}else if(action==='call'){
let paid=Math.min(toCall,p.chips);p.chips-=paid;p.bet+=paid;p.totalCommitted+=paid;pot+=paid;p.betChipVisual+=addChipVisual(paid);potChipVisual+=addChipVisual(paid);animateBetToPot(p.id,paid);if(p.chips===0)p.allIn=true;p.lastAction=p.allIn?`Called ${money(paid)} / All In`:`Called ${money(paid)}`;lastActionText=`${p.name} called ${money(paid)}${p.allIn?' and is all in':''}`;log(lastActionText);
}else if(action==='raise'){
let old=currentBet,minimumTarget=currentBet===0?table.bb:currentBet+minRaise,allInTarget=p.bet+p.chips,target=Math.min(Math.max(raiseTo,minimumTarget),allInTarget),needed=target-p.bet,paid=Math.min(needed,p.chips);
if(paid<=0)return;
p.chips-=paid;p.bet+=paid;p.totalCommitted+=paid;pot+=paid;p.betChipVisual+=addChipVisual(paid);potChipVisual+=addChipVisual(paid);animateBetToPot(p.id,paid);
const fullRaise=p.bet>=old+minRaise;
if(p.bet>currentBet){
currentBet=p.bet;
if(fullRaise){
minRaise=Math.max(table.bb,currentBet-old);
raiseCountThisStreet++;
actedThisStreet=new Set([p.id]);
p.lastAction=p.chips===0?`Raised to ${money(p.bet)} / All In`:`Raised to ${money(p.bet)}`;
lastActionText=`${p.name} raised to ${money(p.bet)}${p.chips===0?' and is all in':''}`;
}else{
p.lastAction=`All In for ${money(p.bet)}`;
lastActionText=`${p.name} is all in for ${money(p.bet)}`;
}
log(lastActionText);
}else{
p.lastAction=`All In for ${money(paid)}`;lastActionText=`${p.name} is all in for ${money(paid)}`;log(lastActionText);
}
if(p.chips===0)p.allIn=true;
}
actedThisStreet.add(p.id);
if(playersInHand().length===1){awardUncontested();return}
if(isBettingRoundComplete()){advanceStreet();return}
currentIndex=nextActiveFrom(currentIndex);
if(currentIndex >= 0){
  showMessage(actionMessageFor(currentIndex));
}
render();

runBotsIfNeeded()}
function isBettingRoundComplete(){let e=players.filter(p=>!p.folded&&!p.out&&p.hasCards&&p.chips>0);if(e.length===0)return true;return e.every(p=>p.bet===currentBet&&actedThisStreet.has(p.id))}
function advanceStreet(){
  potChipVisual=chipsHtml(pot);
  lastRenderedPot=-1;
  players.forEach(p=>{p.bet=0;p.betChipVisual=''});
  currentBet=0;
  minRaise=table.bb;
  raiseCountThisStreet=0;
  actedThisStreet=new Set();

  if(isAllInShowdown()){
    runOutBoardAndShowdown();
    return;
  }

  if(street==='preflop'){
    community.push(deck.pop(),deck.pop(),deck.pop());
    street='flop';
    lastActionText='Flop dealt';
  }else if(street==='flop'){
    community.push(deck.pop());
    street='turn';
    lastActionText='Turn dealt';
  }else if(street==='turn'){
    community.push(deck.pop());
    street='river';
    lastActionText='River dealt';
  }else{
    if(isAllInShowdown()){
      lastActionText='Showdown coming...';
      showMessage('All in. Revealing the winner...');
      render();
      setTimeout(showdown, ALL_IN_SHOWDOWN_DELAY);
      return;
    }
    showdown();
    return;
  }

  players.forEach(p=>{if(!p.folded&&p.hasCards)p.lastAction=''});

  if(playersWhoCanAct().length===0){
    runOutBoardAndShowdown();
    return;
  }

  currentIndex=nextActiveFrom(dealerIndex);
  showMessage(`${street.toUpperCase()} betting round. ${actionMessageFor(currentIndex)}`);
  render();
  
  runBotsIfNeeded();
}

function runOutBoardAndShowdown(){
  street='river';
  lastActionText='Everyone is all in — running out the board';
  showMessage('Everyone is all in. Running out the board...');

  function revealNextCard(){
    if(community.length >= 5){
      lastActionText='Showdown coming...';
      showMessage('All cards are out. Revealing the winner...');
      render();
      setTimeout(showdown, ALL_IN_SHOWDOWN_DELAY);
      return;
    }

    community.push(deck.pop());

    if(community.length === 4){
      lastActionText='Turn card revealed';
    } else if(community.length === 5){
      lastActionText='River card revealed';
    }

    render();

    setTimeout(revealNextCard, ALL_IN_CARD_DELAY);
  }

  render();
  setTimeout(revealNextCard, ALL_IN_INITIAL_DELAY);
}
function awardUncontested(){let w=playersInHand()[0];lastHandWinners=[w];if(w.human&&currentHandHeroRaised&&currentHandHeroPreflopStrength<0.48){unlockAchievement('first_bluff');recordAchievementForSession('first_bluff')}animatePotToWinners([w]);w.chips+=pot;w.winner=true;w.winningHandName='Won uncontested';w.lastAction=`Won ${money(pot)}`;lastActionText=w.human?`You win ${money(pot)} uncontested`:`${w.name} wins ${money(pot)} uncontested`;showMessage(lastActionText);endHand()}
function distributeShowdownPots(ranked){
  const byId=new Map(ranked.map(r=>[r.player.id,r]));
  const levels=[...new Set(players.map(p=>p.totalCommitted).filter(v=>v>0))].sort((a,b)=>a-b);
  let previous=0;
  const winnerRecords=[];

  levels.forEach(level=>{
    const amount=players.reduce((sum,p)=>sum+Math.max(0,Math.min(p.totalCommitted,level)-previous),0);
    const contributors=players.filter(p=>p.totalCommitted>=level);
    const eligible=players.filter(p=>!p.folded&&p.hasCards&&p.totalCommitted>=level&&byId.has(p.id));
    previous=level;
    if(amount<=0||eligible.length===0)return;

    if(contributors.length===1){
      const returnedTo=contributors[0];
      returnedTo.chips+=amount;
      returnedTo.lastAction=`Returned ${money(amount)}`;
      return;
    }

    const eligibleRanked=eligible.map(p=>byId.get(p.id)).sort((a,b)=>compareHands(b.eval,a.eval));
    const best=eligibleRanked[0].eval;
    const winners=eligibleRanked.filter(r=>compareHands(r.eval,best)===0).map(r=>r.player);
    const share=Math.floor(amount/winners.length);
    const remainder=amount%winners.length;

    winners.forEach((w,index)=>{
      const payout=share+(index<remainder?1:0);
      w.chips+=payout;
      w.winner=true;
      w.winningHandName=best.name;
      w.lastAction=`Won ${money((parseInt((w.lastAction||'').replace(/\D/g,''),10)||0)+payout)}`;
      winnerRecords.push({player:w,payout,hand:best.name});
    });
  });

  return winnerRecords;
}
function showdown(){
const revealOrder=players.filter(p=>!p.folded&&p.hasCards);
if(revealOrder.length<=1){resolveShowdown();return}
lastActionText='Showdown - revealing cards';
showMessage('Showdown. Revealing cards...');
revealOrder.forEach(p=>{p.showCards=false;p.lastAction=p.lastAction==='Mucked'?'':p.lastAction});
let revealIndex=0;
function revealNext(){
  const p=revealOrder[revealIndex];
  p.showCards=true;
  p.lastAction='Revealed';
  lastActionText=`${p.human?'You reveal':p.name+' reveals'} cards`;
  render();
  revealIndex++;
  if(revealIndex<revealOrder.length)setTimeout(revealNext,SHOWDOWN_REVEAL_DELAY);
  else setTimeout(resolveShowdown,SHOWDOWN_REVEAL_DELAY);
}
render();
setTimeout(revealNext,SHOWDOWN_REVEAL_DELAY);
}
function resolveShowdown(){let ranked=players.filter(p=>!p.folded&&p.hasCards).map(p=>({player:p,eval:evaluateBest([...p.hand,...community])})).sort((a,b)=>compareHands(b.eval,a.eval));let best=ranked[0].eval,winnerRecords=distributeShowdownPots(ranked),winners=[...new Map(winnerRecords.map(r=>[r.player.id,r.player])).values()];
lastHandWinners=winners;
animatePotToWinners(winners);
const hero=players[0],heroWon=winners.includes(hero);
  if(heroWon&&community.length>=5){unlockAchievement('river_rat');recordAchievementForSession('river_rat')}
  if(heroWon&&hero?.hand?.some(c=>c.rank==='7')&&hero.hand.some(c=>c.rank==='2')){unlockAchievement('won_72');recordAchievementForSession('won_72')}
if(!heroWon&&hasPowerUp('bad_beat')&&hero?.hasCards&&!hero.folded&&community.length>=3){
  const heroEval=evaluateBest([...hero.hand,...community]);
  if(heroEval.rank>=3){
    const rebate=Math.min(100,Math.round(pot*.05));
    hero.chips+=rebate;
    hero.lastAction=`Bad Beat Rebate ${money(rebate)}`;
  }
}

players.forEach(p=>{
  if(!p.folded&&p.hasCards){
    const isWinner=winners.includes(p);
    p.showCards=p.human||isWinner||table.skill!=='shark'||hasPowerUp('muck_peek');
    if(!p.showCards)p.lastAction='Mucked';
  }
});

if(winnerRecords.length>1){
const payoutSummary=[...winnerRecords.reduce((map,r)=>{
const existing=map.get(r.player.id)||{player:r.player,payout:0,hand:r.hand};
existing.payout+=r.payout;
map.set(r.player.id,existing);
return map;
},new Map()).values()];
lastActionText=payoutSummary.map(r=>`${r.player.human?'You':r.player.name} ${r.player.human?'win':'wins'} ${money(r.payout)} with ${r.hand}`).join('; ');
}else{
const winner=winners[0],winnerName=winner?.human?'You':winner?.name||'Nobody',verb=winner?.human?'win':'wins';lastActionText=`${winnerName} ${verb} with ${best.name}`;
}
if(selectedCompanion==='hype_man'&&heroWon&&pot>=(table?.buyIn||0)*.5)lastActionText+=' Hype Man is losing his mind.';
showMessage(lastActionText);endHand()}
function recordHandEnd(){
  if(!currentSession||!players[0])return;
  const hero=players[0],start=currentSession.handStartStack||handStartStacks[0]||0,net=hero.chips-start;
  currentSession.handsPlayed++;
  careerStats.handsPlayed++;
  if(net>0){
    currentSession.biggestPotWon=Math.max(currentSession.biggestPotWon,pot);
    careerStats.biggestPotWon=Math.max(careerStats.biggestPotWon,pot);
  }
  if(net<0){
    currentSession.biggestLoss=Math.max(currentSession.biggestLoss,Math.abs(net));
    careerStats.biggestLoss=Math.max(careerStats.biggestLoss,Math.abs(net));
  }
  if(hero.hasCards&&community.length>=3&&!hero.folded){
    const heroEval=evaluateBest([...hero.hand,...community]);
    maybeUpdateBestHand(currentSession,heroEval);
    maybeUpdateBestHand(careerStats,heroEval);
  }
  const winners=lastHandWinners.length?lastHandWinners:players.filter(p=>p.winner);
  players.forEach((p,i)=>{
    const wasAlive=(handStartStacks[i]||0)>0,nowBusted=p.chips<=0;
    if(!p.human&&wasAlive&&nowBusted&&winners.includes(hero)){
      const text=`You busted ${p.name}`;
      currentSession.busts.push(text);
      careerStats.botsBusted[p.name]=(careerStats.botsBusted[p.name]||0)+1;
      if(p.name==='Zach'){unlockAchievement('stacked_zach');recordAchievementForSession('stacked_zach')}
    }
    if(p.human&&wasAlive&&nowBusted){
      const winner=winners.find(w=>!w.human);
      if(winner){
        const text=`${winner.name} busted you`;
        currentSession.busts.push(text);
        currentSession.bustedBy.push(winner.name);
        careerStats.timesBustedBy[winner.name]=(careerStats.timesBustedBy[winner.name]||0)+1;
      }
    }
  });
  const wipedTable=table&&players.filter(p=>!p.human&&p.chips>0).length===0&&hero.chips>0;
  if(wipedTable&&!currentSession.tableWiped){
    currentSession.tableWiped=true;
    careerStats.tableWipes=(careerStats.tableWipes||0)+1;
    const wipeId=tableWipeAchievementId(table.name);
    unlockAchievement(wipeId);
    recordAchievementForSession(wipeId);
  }
  if(table?.name==='The Final Table'&&wipedTable){
    unlockAchievement('final_table_winner');
    recordAchievementForSession('final_table_winner');
  }
  saveCareerStats();
}
function endHand(){
recordHandEnd();
waitingForNextHand=true;
players.forEach(p=>{p.out=p.chips<=0;p.showCards=true});
if(players[0]?.chips<=0){
  if(hasPowerUp('insurance')&&currentSession&&!currentSession.insuranceUsed){
    const rebate=Math.round((table?.buyIn||0)*.15);
    bankroll+=rebate;
    currentSession.insuranceUsed=true;
    saveBankroll();
    showMessage(`Insurance kicked in. ${money(rebate)} was returned to your bank.`);
  }
  lastActionText='You are out of chips - return to the menu.';
  if(!currentSession?.insuranceUsed)showMessage('You ran out of chips. Return to the menu to regroup.');
}
render();
saveBankrollSnapshot()
}
function runBotsIfNeeded(){if(waitingForNextHand)return;if(currentIndex!==0)setTimeout(()=>{let d=botDecision(players[currentIndex]);playerAction(d.action,d.raiseTo||0)},520)}
function getBotPersonality(bot){
  return bot?.personality || BOT_PERSONALITIES[bot?.name] || DEFAULT_BOT_PERSONALITY;
}

function getTableBotSettings(){
  return TABLE_BOT_SETTINGS[table?.name] || TABLE_BOT_SETTINGS.default;
}

function clamp(n,min,max){
  return Math.max(min,Math.min(max,n));
}

function roundToBlind(amount){
  const bb=table?.bb || 1;
  return Math.max(bb,Math.round(amount/bb)*bb);
}

function weightedChoice(weights){
  const entries=Object.entries(weights).filter(([,v])=>v>0);
  const total=entries.reduce((sum,[,v])=>sum+v,0);
  if(total<=0)return 'call';
  let roll=Math.random()*total;
  for(const [action,weight] of entries){
    roll-=weight;
    if(roll<=0)return action;
  }
  return entries[entries.length-1][0];
}

function evaluateBoardTexture(board){
  if(!board || board.length<3){
    return {wetness:0,flushDraw:false,straightDraw:false,paired:false};
  }

  const suits={};
  board.forEach(c=>suits[c.suit]=(suits[c.suit]||0)+1);
  const flushDraw=Object.values(suits).some(count=>count>=3);

  let values=[...new Set(board.map(c=>c.value))].sort((a,b)=>a-b);
  if(values.includes(14))values=[1,...values];

  let straightDraw=false;
  for(let i=0;i<values.length;i++){
    for(let j=i+1;j<values.length;j++){
      if(values[j]-values[i]<=4 && j-i>=2) straightDraw=true;
    }
  }

  const paired=new Set(board.map(c=>c.value)).size<board.length;

  let wetness=0;
  if(flushDraw) wetness+=0.35;
  if(straightDraw) wetness+=0.35;
  if(paired) wetness+=0.18;
  if(board.length>=4) wetness+=0.10;

  return {wetness:clamp(wetness,0,1),flushDraw,straightDraw,paired};
}

function shouldAvoidLightAllIn(bot, profile, board, tableSettings=getTableBotSettings()){
  if(street==='preflop'||profile.tier>=tableSettings.lightAllInTier)return false;
  const cautiousTable=tableSettings.lightAllInTier>=HAND_TIERS.STRONG;
  const cautiousBot=bot.name==='Caleb'||bot.name==='Mike'||bot.name==='Andrew';
  const scaryBoard=board.flushDraw||board.paired||board.wetness>=0.45;
  return board.wetness>=tableSettings.lightAllInWetness||scaryBoard&&(cautiousTable||cautiousBot);
}

function heroIsAllInPressure(){
  const hero=players[0];
  return !!hero&&!hero.folded&&hero.hasCards&&(hero.allIn||hero.chips<=0)&&hero.totalCommitted>0;
}

function botCanPunishHeroJam(profile){
  if(!heroIsAllInPressure())return false;
  if(street==='preflop'||community.length===0)return profile.tier>=HAND_TIERS.STRONG&&profile.strength>=0.72;
  return profile.tier>=HAND_TIERS.STRONG&&profile.strength>=0.62;
}

function classifyHandTier(evalResult, board){
  if(!evalResult)return HAND_TIERS.TRASH;

  if(evalResult.rank>=4)return HAND_TIERS.MONSTER;       // straight or better
  if(evalResult.rank===3)return HAND_TIERS.STRONG;       // trips / set
  if(evalResult.rank===2)return HAND_TIERS.STRONG;       // two pair
  if(evalResult.rank===1){
    const pairValue=evalResult.values[0] || 0;
    const topBoard=Math.max(0,...(board||[]).map(c=>c.value));
    if(pairValue>=topBoard || pairValue>=11)return HAND_TIERS.MEDIUM;
    return HAND_TIERS.WEAK;
  }

  const high=evalResult.values?.[0] || 0;
  if(high>=13)return HAND_TIERS.WEAK;
  return HAND_TIERS.TRASH;
}

function getBotHandProfile(bot){
  if(street==='preflop' || community.length===0){
    const strength=preflopStrength(bot.hand);
    let tier=HAND_TIERS.TRASH;
    if(strength>=0.88)tier=HAND_TIERS.MONSTER;
    else if(strength>=0.72)tier=HAND_TIERS.STRONG;
    else if(strength>=0.56)tier=HAND_TIERS.MEDIUM;
    else if(strength>=0.42)tier=HAND_TIERS.WEAK;
    return {tier,strength,name:'Preflop Hand',eval:null};
  }

  const evalResult=evaluateBest([...bot.hand,...community]);
  const tier=classifyHandTier(evalResult,community);
  const strength=estimateStrength(bot);
  return {tier,strength,name:evalResult.name,eval:evalResult};
}

function calculateBotRaiseTarget(bot, profile, board, aggression, tableSettings=getTableBotSettings()){
  const toCall=Math.max(0,currentBet-bot.bet);
  const stackTarget=bot.bet+bot.chips;
  const potAfterCall=pot+toCall;
  let target;

  if(street==='preflop'){
    if(profile.tier===HAND_TIERS.MONSTER) target=currentBet + table.bb*(5 + aggression*4);
    else if(profile.tier===HAND_TIERS.STRONG) target=currentBet + table.bb*(3.5 + aggression*3);
    else target=currentBet + table.bb*(2.5 + aggression*2);
  }else{
    if(profile.tier===HAND_TIERS.MONSTER){
      target=currentBet + Math.max(minRaise,potAfterCall*(0.55 + aggression*0.45 + board.wetness*0.35));
    }else if(profile.tier===HAND_TIERS.STRONG){
      target=currentBet + Math.max(minRaise,potAfterCall*(0.42 + aggression*0.35 + board.wetness*0.18));
    }else{
      target=currentBet + Math.max(minRaise,potAfterCall*(0.30 + aggression*0.25));
    }
  }

  target=roundToBlind(target);
  target=Math.max(target,currentBet+minRaise);
  if(street!=='preflop'&&profile.tier<HAND_TIERS.MONSTER)target=Math.min(target,currentBet+Math.max(minRaise,potAfterCall*tableSettings.raiseCapPot));
  target=Math.min(target,stackTarget);
  return target;
}

function botDecision(bot){
  const personality=getBotPersonality(bot);
  const tableSettings=getTableBotSettings();
  const profile=getBotHandProfile(bot);
  const board=evaluateBoardTexture(community);

  const toCall=Math.max(0,currentBet-bot.bet);
  const stack=Math.max(1,bot.chips);
  const stackBB=stack/(table?.bb||1);
  const potOdds=toCall/Math.max(1,pot+toCall);
  const pressure=toCall/Math.max(stack,pot+toCall,1);
  const isPreflop=street==='preflop';
  const r=Math.random();

  const handsPlayed=Math.max(0,handNum-1);
  const nickLeavePressure=bot.name==='Nick'?Math.min(0.22,handsPlayed*(personality.leavePressure||0)):0;
  const mikeSharkBoost=bot.name==='Mike'&&personality.sharkBoost&&(table.skill==='strong'||table.skill==='shark')?0.10:0;
  const tiltBoost=personality.tiltFactor && bot.chips<table.buyIn*.55 ? 0.12 : 0;
  const aggression=clamp((personality.aggression+mikeSharkBoost+tiltBoost)*tableSettings.aggressionMod,0.05,1.55);
  const bluff=clamp((personality.bluff+(personality.bluffBoost?0.10:0))*tableSettings.bluffMod,0,0.85);
  const trap=clamp(personality.trap*tableSettings.trapMod,0,0.85);
  const looseness=clamp(personality.looseness-nickLeavePressure,0.03,1.20);
  const shortStack=stackBB<=(isPreflop?tableSettings.preflopJamBB:tableSettings.postflopJamBB);

  let weights={fold:1,call:1,raise:1,allIn:0.1};

  if(toCall===0){
    weights.fold=0;

    if(profile.tier===HAND_TIERS.MONSTER){
      weights.call=20 + trap*45;
      weights.raise=48 + aggression*58 + board.wetness*35;
      weights.allIn=shortStack ? 18 : 2 + aggression*4;

      // Dry-board monsters sometimes trap. Wet-board monsters build/protect the pot.
      if(!isPreflop && board.wetness<0.45 && Math.random()<trap){
        weights.call+=70;
        weights.raise*=0.55;
      }
    }else if(profile.tier===HAND_TIERS.STRONG){
      weights.call=32 + trap*15;
      weights.raise=26 + aggression*42 + board.wetness*18;
      weights.allIn=shortStack ? 10 : aggression*2;
    }else if(profile.tier===HAND_TIERS.MEDIUM){
      weights.call=48 + looseness*25;
      weights.raise=8 + aggression*20 + (isPreflop?(personality.preflopRaise||0)*35:0);
      weights.allIn=shortStack && profile.strength>.68 ? 4 : 0.2;
    }else if(profile.tier===HAND_TIERS.WEAK){
      weights.call=45 + looseness*18;
      weights.raise=Math.random()<bluff ? 10 + aggression*22 : 2;
      weights.allIn=Math.random()<bluff*0.04 ? 1 : 0;
    }else{
      weights.call=62;
      weights.raise=Math.random()<bluff*.55 ? 8 + aggression*16 : 1;
      weights.allIn=0;
    }
  }else{
    if(profile.tier===HAND_TIERS.MONSTER){
      weights.fold=0;
      weights.call=18 + trap*26;
      weights.raise=55 + aggression*55 + board.wetness*35;
      weights.allIn=shortStack ? 24 : 3 + aggression*6;
    }else if(profile.tier===HAND_TIERS.STRONG){
      weights.fold=pressure>.55 ? 10 : 2;
      weights.call=36 + looseness*14;
      weights.raise=25 + aggression*36 + board.wetness*14;
      weights.allIn=shortStack ? 14 : aggression*3;
    }else if(profile.tier===HAND_TIERS.MEDIUM){
      weights.fold=16 + pressure*70 + board.wetness*18 + (personality.foldMod||0)*60;
      weights.call=42 + looseness*26 + (personality.potOddsExpert && potOdds<0.24 ? 16 : 0);
      weights.raise=7 + aggression*16;
      weights.allIn=shortStack && profile.strength>.66 ? 4 : 0.2;
    }else if(profile.tier===HAND_TIERS.WEAK){
      weights.fold=44 + pressure*85 + (personality.foldMod||0)*70;
      weights.call=20 + looseness*24 + (potOdds<0.16 ? 12 : 0);
      weights.raise=Math.random()<bluff ? 12 + aggression*22 : 1;
      weights.allIn=Math.random()<bluff*0.05 ? 1 : 0;
    }else{
      weights.fold=66 + pressure*100 + (personality.foldMod||0)*70;
      weights.call=10 + looseness*14 + (potOdds<0.12 ? 10 : 0);
      weights.raise=Math.random()<bluff*.45 ? 10 + aggression*18 : 0.5;
      weights.allIn=Math.random()<bluff*0.025 ? 1 : 0;
    }
  }

  // Preflop table/personality flavor.
  if(isPreflop){
    weights.raise += Math.max(-8,(personality.preflopRaise||0)*55);
    if(profile.strength<0.40) weights.raise*=0.55;
  }

  // Meeting House and Sandy's intentionally have a few more passive mistakes.
  if(Math.random()<tableSettings.mistakeChance){
    weights.call+=24;
    weights.raise*=0.70;
    if(profile.tier>=HAND_TIERS.STRONG) weights.fold=0;
  }

  // Calling stations hate folding; math players fold bad prices more often.
  if(bot.name==='Spencer') weights.call+=18;
  if(personality.potOddsExpert && toCall>0 && potOdds>profile.strength*.85) weights.fold+=18;

  // Caleb should be cautious with junk, not passive with monsters.
  if(bot.name==='Caleb' && profile.tier===HAND_TIERS.MONSTER){
    weights.raise+=28 + board.wetness*25;
    weights.call*=0.80;
  }

  const punishHeroJam=botCanPunishHeroJam(profile);
  const deepPreflopStack=isPreflop&&stackBB>tableSettings.preflopJamBB&&!punishHeroJam;
  if(deepPreflopStack){
    weights.allIn=0;
    if(profile.tier<=HAND_TIERS.MEDIUM)weights.raise*=0.75;
  }

  if(shouldAvoidLightAllIn(bot,profile,board,tableSettings)&&!punishHeroJam){
    weights.allIn=0;
    if(profile.tier<=HAND_TIERS.WEAK){
      weights.raise*=0.35;
      weights.fold+=18 + board.wetness*35;
      weights.call+=8;
    }
  }

  weights.raise*=tableSettings.raiseWeightMod;
  weights.call*=tableSettings.callWeightMod;
  weights.allIn*=tableSettings.allInWeightMod;

  const maxBotRaises=isPreflop?tableSettings.maxBotRaisesPreflop:tableSettings.maxBotRaisesPostflop;
  if(!heroIsAllInPressure()&&raiseCountThisStreet>=maxBotRaises&&profile.tier<HAND_TIERS.MONSTER){
    weights.raise=0;
    weights.allIn=0;
    weights.call+=30;
  }

  let action=weightedChoice(weights);

  if(action==='fold' && toCall===0) action='call';
  if(action==='call' && toCall===0) return {action:'check'};

  if(action==='allIn'){
    if(deepPreflopStack) action=profile.tier>=HAND_TIERS.STRONG?'raise':toCall>0?'call':'check';
    else if(shouldAvoidLightAllIn(bot,profile,board,tableSettings)&&!punishHeroJam) action=toCall>0?'call':'check';
    else if(profile.tier<=HAND_TIERS.WEAK && Math.random()>bluff) action=toCall>0?'call':'check';
    else return {action:'raise',raiseTo:bot.bet+bot.chips};
  }

  if(action==='raise'){
    const maxBotRaises=isPreflop?tableSettings.maxBotRaisesPreflop:tableSettings.maxBotRaisesPostflop;
    if(!heroIsAllInPressure()&&raiseCountThisStreet>=maxBotRaises&&profile.tier<HAND_TIERS.MONSTER)return {action:toCall>0?'call':'check'};
    if(bot.chips<=toCall+table.bb) return {action:'call'};
    const raiseTo=calculateBotRaiseTarget(bot,profile,board,aggression,tableSettings);
    if((deepPreflopStack||(shouldAvoidLightAllIn(bot,profile,board,tableSettings)&&!punishHeroJam))&&raiseTo>=bot.bet+bot.chips) return {action:toCall>0?'call':'check'};
    if(raiseTo<=currentBet || raiseTo<=bot.bet) return {action:toCall>0?'call':'check'};
    return {action:'raise',raiseTo};
  }

  if(action==='fold')return {action:'fold'};
  return {action:'call'};
}
function estimateStrength(p){if(community.length===0)return preflopStrength(p.hand);let e=evaluateBest([...p.hand,...community]);return Math.min(1,e.rank/8*.76+e.values[0]/14*.16+drawPotential(p.hand,community))}
function calculateHeroWinOdds(){
  let hero=players[0];
  if(!hero||!hero.hasCards||hero.folded||hero.out||hero.hand.length!==2)return'--';
  let opps=players.filter(p=>!p.human&&!p.folded&&!p.out&&p.hasCards);
  if(opps.length===0)return'100%';
  let known=[...hero.hand,...community];
  const hiddenOpps=opps.filter(p=>!(p.showCards&&p.hand.length===2));
  players.forEach(p=>{if(!p.human&&p.showCards&&p.hand.length)known.push(...p.hand)});
  let keys=new Set(known.map(c=>c.rank+c.suit)),base=[];
  for(const s of SUITS)for(const r of RANKS)if(!keys.has(r+s))base.push({rank:r,suit:s,value:RANK_VALUE[r]});
  let sims=community.length>=5&&hiddenOpps.length===0?1:1000,w=0,t=0;
  for(let sim=0;sim<sims;sim++){
    let d=[...base];
    for(let i=d.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}
    let board=[...community];
    while(board.length<5)board.push(d.pop());
    let he=evaluateBest([...hero.hand,...board]),lost=false,tie=false;
    for(const o of opps){
      let oh=o.showCards&&o.hand.length===2?[...o.hand]:[d.pop(),d.pop()];
      let oe=evaluateBest([...oh,...board]),cmp=compareHands(he,oe);
      if(cmp<0){lost=true;break}
      if(cmp===0)tie=true;
    }
    if(!lost&&tie)t++;
    else if(!lost)w++;
  }
  return(((w+t*.5)/sims)*100).toFixed(1)+'%';
}
function quickRaiseTarget(m){let h=players[0],base=table.bb*m,target=currentBet===0?base:Math.max(currentBet+minRaise,currentBet+base);return Math.min(target,h.bet+h.chips)}
function quickRaise(m){playerAction('raise',quickRaiseTarget(m))}
function mobileDragBetAvailable(){
  const h=players[0];
  return mobileMode&&currentIndex===0&&!waitingForNextHand&&h&&!h.folded&&!h.out&&h.chips>0&&!el('betBtn').disabled;
}
function setCustomBetTarget(target){
  const slider=el('customBetSlider'),amount=el('customBetAmount');
  const min=parseInt(slider.min||0,10),max=parseInt(slider.max||0,10),step=parseInt(slider.step||1,10)||1;
  if(!max||max<min)return 0;
  const clamped=Math.max(min,Math.min(max,target));
  const stepped=Math.min(max,min+Math.round((clamped-min)/step)*step);
  slider.value=stepped;
  amount.textContent=money(stepped);
  return stepped;
}
function startMobileBetDrag(event){
  if(!mobileDragBetAvailable())return;
  const startValue=quickRaiseTarget(3);
  mobileBetDrag={startY:event.clientY,startValue,target:startValue,moved:false};
  el('betBtn').classList.add('dragging-bet');
  el('betBtn').setPointerCapture?.(event.pointerId);
}
function moveMobileBetDrag(event){
  if(!mobileBetDrag)return;
  const h=players[0];
  const step=table?.bb||1;
  const delta=Math.max(0,mobileBetDrag.startY-event.clientY);
  const target=mobileBetDrag.startValue+Math.round(delta/12)*step;
  mobileBetDrag.target=Math.min(h?h.bet+h.chips:target,target);
  if(delta>8){
    mobileBetDrag.moved=true;
    el('betBtn').textContent=`Bet ${money(mobileBetDrag.target)}`;
    showMessage(`Release to bet ${money(mobileBetDrag.target)}.`);
  }
}
function finishMobileBetDrag(event){
  if(!mobileBetDrag)return;
  const drag=mobileBetDrag;
  mobileBetDrag=null;
  el('betBtn').classList.remove('dragging-bet');
  el('betBtn').releasePointerCapture?.(event.pointerId);
  if(drag.moved){
    suppressNextBetClick=true;
    playerAction('raise',drag.target);
    setTimeout(()=>{suppressNextBetClick=false},0);
  }
}
function useOddsTip(){
  if(!hasPowerUp('small_blind_tip')||oddsTipUsedThisHand||currentIndex!==0||waitingForNextHand)return;
  const cost=table?.sb||0;
  if(bankroll<cost){showMessage(`You need ${money(cost)} in the bank to tip the small blind.`);return}
  bankroll-=cost;
  oddsTipUsedThisHand=true;
  saveBankroll();
  const odds=calculateHeroWinOdds();
  oddsTipMessage=`SB tip: about ${odds} to win.`;
  showMessage(`The small blind whispers: you are about ${odds} to win this hand.`);
  render();
}
function cashOut(){
  const stack=players[0]?.chips||0;
  if(currentSession){
    recordActivityTime();
    const net=stack-currentSession.startStack;
    if(selectedCompanion==='lucky_chip'&&careerStats.handsPlayed>0&&careerStats.handsPlayed%10===0){bankroll+=25;currentSession.achievements.push('Lucky Chip loyalty bonus +$25')}
    lastSessionRecap={...currentSession,net,busts:[...currentSession.busts],achievements:[...currentSession.achievements],bestHand:currentSession.bestHand};
    showSessionRecap=true;
    careerStats.totalNet+=net;
    careerStats.cashOuts++;
  }
  bankroll+=stack;
  careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
  saveBankroll();
  saveCareerStats();
  currentSession=null;
  players=[];
  showMenu();
}

let mineGrid=[], mineGameOver=false, flagMode=false;
function startMinesweeper(){
  mineGameOver=false;
  mineGrid=[];
  const size=6, mines=6;
  for(let i=0;i<size*size;i++)mineGrid.push({mine:false,revealed:false,flagged:false,count:0});
  let placed=0;
  while(placed<mines){let idx=Math.floor(Math.random()*mineGrid.length);if(!mineGrid[idx].mine){mineGrid[idx].mine=true;placed++}}
  for(let i=0;i<mineGrid.length;i++)mineGrid[i].count=countAdjacentMines(i,size);
  if(hasPowerUp('mines_toolkit')){
    const safe=mineGrid.find(c=>!c.mine);
    if(safe)safe.revealed=true;
  }
  el('mineStatus').textContent=`Clear every safe square to earn ${money(minesReward())}.`;
  renderMinesweeper();
}
function countAdjacentMines(index,size){
  const row=Math.floor(index/size),col=index%size;
  let count=0;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(dr===0&&dc===0)continue;
    const r=row+dr,c=col+dc;
    if(r>=0&&r<size&&c>=0&&c<size&&mineGrid[r*size+c].mine)count++;
  }
  return count;
}
function renderMinesweeper(){
  const board=el('mineBoard');
  board.innerHTML='';
  mineGrid.forEach((cell,i)=>{
    const b=document.createElement('button');
    b.style.width='42px';b.style.height='42px';b.style.padding='0';b.style.borderRadius='9px';b.style.boxShadow='none';
    b.textContent=cell.revealed?(cell.mine?'💣':cell.count||''):(cell.flagged?'🚩':'');
    b.disabled=mineGameOver || cell.revealed;
    b.onclick=()=>{
      if(flagMode){toggleFlag(i);return;}
      revealMineCell(i);
    };
    b.oncontextmenu=(e)=>{
      e.preventDefault();
      toggleFlag(i);
    };
    board.appendChild(b);
  });
}
function toggleFlag(i){
  if(mineGameOver || mineGrid[i].revealed) return;
  mineGrid[i].flagged = !mineGrid[i].flagged;
  renderMinesweeper();
}

function revealMineCell(i){
  if(mineGameOver || mineGrid[i].revealed || mineGrid[i].flagged) return;
  mineGrid[i].revealed=true;
  if(mineGrid[i].mine){
    mineGameOver=true;
    mineGrid.forEach(c=>{if(c.mine)c.revealed=true});
    el('mineStatus').textContent='Boom. No payout — try another board.';
    renderMinesweeper();
    return;
  }
  if(mineGrid[i].count===0)floodReveal(i,6);
  const safeLeft=mineGrid.some(c=>!c.mine&&!c.revealed);
  if(!safeLeft){
    mineGameOver=true;
    const payout=minesReward();
    bankroll+=payout;
    careerStats.minesweeperWins++;
    careerStats.biggestBankroll=Math.max(careerStats.biggestBankroll,bankroll);
    unlockAchievement('cleared_mines');
    saveCareerStats();
    saveBankroll();
    el('mineStatus').textContent=`You cleared it! +${money(payout)} added to your bank.`;
    renderMenu();
  }
  renderMinesweeper();
}
function floodReveal(index,size){
  const row=Math.floor(index/size),col=index%size;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const r=row+dr,c=col+dc,idx=r*size+c;
    if(r<0||r>=size||c<0||c>=size||mineGrid[idx].revealed||mineGrid[idx].mine)continue;
    mineGrid[idx].revealed=true;
    if(mineGrid[idx].count===0)floodReveal(idx,size);
  }
}
el('showTablesBtn').onclick=()=>showMenuPage('tablesPage');
el('showShopBtn').onclick=()=>showMenuPage('shopPage');
el('showInfoBtn').onclick=()=>showMenuPage('infoPage');
el('showPassiveIncomeBtn').onclick=()=>showMenuPage('passiveIncomePage');
document.querySelectorAll('.backToTablesBtn').forEach(btn=>btn.onclick=()=>showMenuPage('tablesPage'));
document.querySelectorAll('.submenu-actions button[data-subpage-target]').forEach(btn=>{
  btn.onclick=()=>showSubmenu(btn.closest('.submenu-actions').dataset.submenu,btn.dataset.subpageTarget);
});

el('toggleMobileModeBtn').onclick=()=>{
  mobileMode=!mobileMode;
  localStorage.setItem('pokerMobileMode_v1',String(mobileMode));
  applyMobileMode();
};

el('closeSessionRecapBtn').onclick=()=>{
  showSessionRecap=false;
  el('sessionRecapPanel').classList.add('hidden');
};
el('collectPassiveIncomeBtn').onclick=collectPassiveIncome;
el('buyDrakeCoinBtn').onclick=buyDrakeCoin;
el('sellDrakeCoinBtn').onclick=()=>sellDrakeCoin();
el('sellAllDrakeCoinBtn').onclick=()=>sellDrakeCoin(passiveIncomeState.drake.coins);
el('depositRothBtn').onclick=depositRoth;
el('withdrawRothBtn').onclick=withdrawRoth;

el('saveNameBtn').onclick=()=>{
  const cleaned=el('playerNameInput').value.trim() || 'You';
  playerName=cleaned;
  localStorage.setItem('pokerPlayerName', playerName);
  renderMenu();
};
el('playerNameInput').addEventListener('change',()=>el('saveNameBtn').click());
el('openMinesBtn').onclick=()=>{showMenuPage('passiveIncomePage');showSubmenu('passive','minesPanel');if(!mineGrid.length)startMinesweeper()};
el('flagModeBtn').onclick=()=>{
  flagMode=!flagMode;
  el('flagModeBtn').textContent=`Flag Mode: ${flagMode ? 'ON' : 'OFF'}`;
  el('flagModeBtn').className=flagMode ? 'danger-btn' : 'ok-btn';
};
el('newMinesBtn').onclick=startMinesweeper;
el('foldBtn').onclick=()=>playerAction('fold');
el('checkBtn').onclick=()=>playerAction('check');el('callBtn').onclick=()=>playerAction('call');el('betBtn').onclick=()=>{if(suppressNextBetClick){suppressNextBetClick=false;return}quickRaise(3)};el('betBtn').addEventListener('pointerdown',startMobileBetDrag);el('betBtn').addEventListener('pointermove',moveMobileBetDrag);el('betBtn').addEventListener('pointerup',finishMobileBetDrag);el('betBtn').addEventListener('pointercancel',finishMobileBetDrag);el('raise2xBtn').onclick=()=>quickRaise(2);el('raise3xBtn').onclick=()=>quickRaise(3);el('raise5xBtn').onclick=()=>quickRaise(5);el('allInBtn').onclick=()=>{let h=players[0];if(hasPowerUp('tilt_guard')&&!tiltGuardWarnedThisHand&&h?.chips>table.bb*10){tiltGuardWarnedThisHand=true;showMessage('Tilt Guard check: click All In again if you really mean it.');return}playerAction('raise',h.bet+h.chips)};
el('oddsTipBtn').onclick=useOddsTip;
el('customBetSlider').oninput=()=>{el('customBetAmount').textContent=money(parseInt(el('customBetSlider').value||0,10))};
el('customBetBtn').onclick=()=>playerAction('raise',parseInt(el('customBetSlider').value||0,10));el('nextHandBtn').onclick=()=>{handNum++;resetForHand()};el('leaveTableBtn').onclick=cashOut;
window.addEventListener('pagehide', saveBankrollSnapshot);
window.addEventListener('beforeunload', saveBankrollSnapshot);
setInterval(()=>{if(!el('passiveIncomePage')?.classList.contains('hidden'))renderPassiveIncome()},10000);
renderMenu();

