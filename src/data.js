export const SUITS=['♠','♥','♦','♣'];
export const RANKS=['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
export const RANK_VALUE=Object.fromEntries(RANKS.map((r,i)=>[r,i+2]));
export const BOT_NAMES=['Spencer','Zach','Caleb','Mike','Nick','Matt','Tyler','Andrew','Josh'];
export const NPC_ADVICE={
 Tyler:['You only live once. Put some heat on it.','Scared money does not make money.','Sometimes you just have to send it.','All I am saying is... I like my hand.','This pot is getting interesting now.'],
 Nick:['Do not overthink it. Take the clean spot.','I would not chase too long here.','This table is taking forever. Win the pot already.','You can still get away from this hand.','Feels like somebody hit that flop.'],
 Mike:['Position matters more than your cards sometimes.','Do not pay off obvious strength.','Strong hands make money. Marginal hands lose it.','You are probably beat here.','Careful chasing that board.'],
 Matt:['Preflop pressure wins more pots than people think.','Make them pay to see cards.','A small raise now can save a hard decision later.','I hope you brought chips.','Someone has to raise around here.'],
 Caleb:['Folding is free. Bad calls are expensive.','You do not have to win every hand.','Sometimes the best move is just getting out.','This feels like a trap.','You should probably fold that.'],
 Zach:['Bad beat? Good. Now make them regret it.','Momentum matters. Keep firing.','If they keep calling, punish them.','Call me again. See what happens.','I dare you to look me up.'],
 Spencer:['If the price is good, I am seeing another card.','One more call cannot hurt. Probably.','You would be surprised how often bottom pair gets there.','I am not folding for that price.','Maybe this draw gets there.'],
 Andrew:['Pot odds first. Feelings second.','Count your outs before you click.','Do not chase if the math is not there.','The numbers are saying call.','You are not getting the right price.'],
 Josh:['If the story makes sense, the bluff can work.','Pressure is a weapon. Use it carefully.','They cannot call if they believe you already have it.','I have got a jack.','You should fold this one.','You really want to play for all of it?']
};

export const HAND_TIERS = {
 TRASH: 0,
 WEAK: 1,
 MEDIUM: 2,
 STRONG: 3,
 MONSTER: 4
};

export const BOT_PERSONALITIES={
 Tyler:{label:'Loose Cannon',aggression:0.88,bluff:0.36,trap:0.10,looseness:0.78,preflopRaise:0.18,foldMod:-0.10,tiltAllIn:0.08},
 Nick:{label:'Gets Restless',aggression:0.72,bluff:0.28,trap:0.12,looseness:0.62,preflopRaise:0.07,foldMod:0.02,leavePressure:0.018},
 Mike:{label:'Strong-Game Shark',aggression:0.42,bluff:0.10,trap:0.48,looseness:0.28,preflopRaise:0.03,foldMod:0.05,sharkBoost:true},
 Matt:{label:'Preflop Raiser',aggression:0.74,bluff:0.22,trap:0.18,looseness:0.56,preflopRaise:0.22,foldMod:-0.02},
 Caleb:{label:'Cautious Folder',aggression:0.58,bluff:0.14,trap:0.28,looseness:0.34,preflopRaise:0.02,foldMod:0.12},
 Zach:{label:'Tilt Monster',aggression:0.80,bluff:0.32,trap:0.12,looseness:0.70,preflopRaise:0.09,foldMod:-0.05,tiltFactor:true},
 Spencer:{label:'Calling Station',aggression:0.32,bluff:0.08,trap:0.22,looseness:0.88,preflopRaise:-0.04,foldMod:-0.14},
 Andrew:{label:'Math Grinder',aggression:0.46,bluff:0.12,trap:0.30,looseness:0.30,preflopRaise:0.02,foldMod:0.08,potOddsExpert:true},
 Josh:{label:'Bluff Artist',aggression:0.76,bluff:0.48,trap:0.20,looseness:0.58,preflopRaise:0.10,foldMod:-0.02,bluffBoost:true}
};

export const DEFAULT_BOT_PERSONALITY={label:'Balanced',aggression:0.50,bluff:0.20,trap:0.25,looseness:0.50,preflopRaise:0,foldMod:0};

export const TABLE_BOT_SETTINGS={
 'Sandy\'s Straight Flush':{aggressionMod:0.60,bluffMod:0.45,trapMod:1.30,mistakeChance:0.22,preflopJamBB:7,postflopJamBB:9,lightAllInTier:HAND_TIERS.MONSTER,lightAllInWetness:0.18,raiseCapPot:0.5,raiseWeightMod:0.55,callWeightMod:1.25,allInWeightMod:0.18,maxBotRaisesPreflop:1,maxBotRaisesPostflop:1},
 'Meeting House Poker Room':{aggressionMod:0.68,bluffMod:0.52,trapMod:1.18,mistakeChance:0.16,preflopJamBB:8,postflopJamBB:10,lightAllInTier:HAND_TIERS.MONSTER,lightAllInWetness:0.22,raiseCapPot:0.6,raiseWeightMod:0.65,callWeightMod:1.18,allInWeightMod:0.22,maxBotRaisesPreflop:1,maxBotRaisesPostflop:2},
 'Bachelor\'s Bluff':{aggressionMod:0.88,bluffMod:0.82,trapMod:1.00,mistakeChance:0.09,preflopJamBB:12,postflopJamBB:14,lightAllInTier:HAND_TIERS.STRONG,lightAllInWetness:0.38,raiseCapPot:0.9,raiseWeightMod:0.82,callWeightMod:1.08,allInWeightMod:0.45,maxBotRaisesPreflop:2,maxBotRaisesPostflop:2},
 'Harding St High Rollers':{aggressionMod:0.98,bluffMod:0.95,trapMod:0.96,mistakeChance:0.07,preflopJamBB:16,postflopJamBB:18,lightAllInTier:HAND_TIERS.STRONG,lightAllInWetness:0.5,raiseCapPot:1.1,raiseWeightMod:0.95,callWeightMod:1.02,allInWeightMod:0.65,maxBotRaisesPreflop:2,maxBotRaisesPostflop:3},
 'Encore Casino':{aggressionMod:1.08,bluffMod:1.05,trapMod:0.92,mistakeChance:0.04,preflopJamBB:22,postflopJamBB:24,lightAllInTier:HAND_TIERS.MEDIUM,lightAllInWetness:0.68,raiseCapPot:1.45,raiseWeightMod:1.05,callWeightMod:0.96,allInWeightMod:0.85,maxBotRaisesPreflop:3,maxBotRaisesPostflop:3},
 'The Final Table':{aggressionMod:1.18,bluffMod:1.12,trapMod:0.88,mistakeChance:0.025,preflopJamBB:28,postflopJamBB:30,lightAllInTier:HAND_TIERS.MEDIUM,lightAllInWetness:0.8,raiseCapPot:1.8,raiseWeightMod:1.14,callWeightMod:0.92,allInWeightMod:1.0,maxBotRaisesPreflop:4,maxBotRaisesPostflop:4},
 default:{aggressionMod:1,bluffMod:1,trapMod:1,mistakeChance:0.06,preflopJamBB:16,postflopJamBB:18,lightAllInTier:HAND_TIERS.STRONG,lightAllInWetness:0.5,raiseCapPot:1.1,raiseWeightMod:0.95,callWeightMod:1,allInWeightMod:0.65,maxBotRaisesPreflop:2,maxBotRaisesPostflop:3}
};
export const COSMETICS={
 felt:[
  {id:'classic',name:'Classic Green Felt',cost:0,vars:{}},
  {id:'midnight',name:'Midnight Black Felt',cost:250,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,255,255,.08),transparent 55%),radial-gradient(ellipse at center,#20242c 0%,#10131a 65%,#05070a 100%)'}},
  {id:'royal',name:'Royal Red Felt',cost:750,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,255,255,.08),transparent 55%),radial-gradient(ellipse at center,#8b1e2d 0%,#54101a 65%,#24070b 100%)'}},
  {id:'chucharms',name:'Chu Charms',cost:750,vars:{'--table-felt-bg':'radial-gradient(circle at 47% 27%,rgba(255,255,255,.32) 0 8%,transparent 9%),radial-gradient(circle at 35% 58%,rgba(255,246,143,.35) 0 1.4%,transparent 1.7%),radial-gradient(circle at 64% 39%,rgba(255,246,143,.32) 0 1.2%,transparent 1.6%),linear-gradient(180deg,#aebcff 0%,#aab8f7 60%,#9aa8ee 100%)','--table-logo-text':'"CHU\\A CHARMS"','--table-logo-left':'18%','--table-logo-top':'34%','--table-logo-color':'#ffffff','--table-logo-opacity':'.72','--table-logo-size':'30px','--table-logo-spacing':'3px','--table-logo-shadow':'0 4px 0 rgba(141,102,209,.45),0 0 18px rgba(255,255,255,.55)'}},
  {id:'bluenorthface',name:'Blue North Face',cost:750,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(96,165,250,.15),transparent 55%),radial-gradient(ellipse at center,#0b2a55 0%,#071d3f 62%,#031025 100%)','--table-logo-text':'"THE\\A NORTH\\A FACE"','--table-logo-left':'18%','--table-logo-top':'34%','--table-logo-color':'rgba(255,255,255,.9)','--table-logo-opacity':'.55','--table-logo-size':'25px','--table-logo-spacing':'2px','--table-logo-shadow':'0 0 18px rgba(147,197,253,.38)'}},
  {id:'ocean',name:'Ocean Blue Felt',cost:1500,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,255,255,.1),transparent 55%),radial-gradient(ellipse at center,#176b8f 0%,#0b4058 65%,#061c27 100%)'}},
  {id:'emerald',name:'Emerald Elite Felt',cost:3000,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,255,255,.12),transparent 55%),radial-gradient(ellipse at center,#0f9b63 0%,#066344 65%,#022a1d 100%)'}},
  {id:'purple',name:'Royal Purple Felt',cost:6000,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,255,255,.1),transparent 55%),radial-gradient(ellipse at center,#6d28d9 0%,#3b136f 65%,#160528 100%)'}},
  {id:'lava',name:'Lava Inferno Felt',cost:12000,vars:{'--table-felt-bg':'radial-gradient(ellipse at center,rgba(255,180,120,.12),transparent 55%),radial-gradient(ellipse at center,#dc2626 0%,#7f1d1d 65%,#2b0909 100%)'}},
 ],
 chips:[
  {id:'classic',name:'Classic Casino Chips',cost:0,vars:{}},
  {id:'neon',name:'Neon Chips',cost:350,vars:{'--chip-white-bg':'radial-gradient(circle at 35% 35%,#fff 0 14%,#d8fff6 15% 60%,#22d3ee 61% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#fff 0 14%,#ff7ad9 15% 60%,#9d174d 61% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#fff 0 14%,#a78bfa 15% 60%,#4c1d95 61% 100%)'}},
  {id:'royalvelvet',name:'Chu Charms Chips',cost:1200,vars:{'--chip-border-width':'2px','--chip-shadow':'0 2px 7px rgba(122,92,210,.42)','--chip-white-border':'#fff38a','--chip-red-border':'#ff8b8b','--chip-blue-border':'#8aa7ff','--chip-white-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 16%,#fffdf0 17% 48%,#c9b8ff 49% 72%,#8f72d6 73% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#fff7fb 0 16%,#ff8a7a 17% 52%,#ff5f8f 53% 75%,#b44bd8 76% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#f7fbff 0 16%,#5ed0ff 17% 50%,#3978ff 51% 74%,#8f72d6 75% 100%)'}},
  {id:'ice',name:'Ice Crystal Chips',cost:2500,vars:{'--chip-white-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#dbeafe 15% 60%,#60a5fa 61% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#f0abfc 15% 60%,#a21caf 61% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#67e8f9 15% 60%,#155e75 61% 100%)'}},
  {id:'obsidian',name:'Obsidian Pro Chips',cost:7500,vars:{'--chip-white-bg':'radial-gradient(circle at 35% 35%,#f5f5f5 0 14%,#737373 15% 60%,#171717 61% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#fff 0 14%,#ef4444 15% 60%,#450a0a 61% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#fff 0 14%,#38bdf8 15% 60%,#082f49 61% 100%)','--chip-white-border':'#fafafa','--chip-red-border':'#fecaca','--chip-blue-border':'#bae6fd'}},
  {id:'mint',name:'Mint Casino Chips',cost:16000,vars:{'--chip-white-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#bbf7d0 15% 60%,#15803d 61% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#fca5a5 15% 60%,#991b1b 61% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 14%,#86efac 15% 60%,#14532d 61% 100%)'}},
  {id:'medal',name:'Medal Series Chips',cost:50000,vars:{'--chip-border-width':'3px','--chip-white-bg':'radial-gradient(circle at 35% 35%,#fff7ed 0 12%,#d6a27a 13% 35%,#92400e 36% 100%)','--chip-red-bg':'radial-gradient(circle at 35% 35%,#ffffff 0 12%,#d1d5db 13% 35%,#4b5563 36% 100%)','--chip-blue-bg':'radial-gradient(circle at 35% 35%,#fffbe8 0 12%,#fde68a 13% 35%,#ca8a04 36% 100%)','--chip-white-border':'#f5c49d','--chip-red-border':'#f3f4f6','--chip-blue-border':'#fff7cc','--chip-shadow':'0 0 14px rgba(255,215,0,.18),0 3px 8px rgba(0,0,0,.45)'}}
 ],
 cards:[
  {id:'classic',name:'Classic Blue Backs',cost:0,vars:{}},
  {id:'red',name:'Red Diamond Backs',cost:250,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.15),transparent),repeating-linear-gradient(45deg,#8b1e2d,#8b1e2d 5px,#4f0d17 5px,#4f0d17 10px)','--card-back-border':'#ffb4b4'}},
  {id:'black',name:'Black Prestige Backs',cost:750,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.2),transparent),repeating-linear-gradient(45deg,#171717,#171717 5px,#050505 5px,#050505 10px)','--card-back-border':'#d6a84f'}},
  {id:'neon',name:'Neon Purple Backs',cost:1500,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.2),transparent),repeating-linear-gradient(45deg,#7c3aed,#7c3aed 5px,#312e81 5px,#312e81 10px)','--card-back-border':'#c4b5fd'}},
  {id:'gold',name:'Golden Prestige Backs',cost:3500,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.2),transparent),repeating-linear-gradient(45deg,#d4af37,#d4af37 5px,#7c5b10 5px,#7c5b10 10px)','--card-back-border':'#fde68a'}},
  {id:'emerald',name:'Emerald Pattern Backs',cost:6000,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.15),transparent),repeating-linear-gradient(45deg,#10b981,#10b981 5px,#065f46 5px,#065f46 10px)','--card-back-border':'#a7f3d0'}},
  {id:'inferno',name:'Inferno Flame Backs',cost:12000,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.15),transparent),repeating-linear-gradient(45deg,#f97316,#f97316 5px,#7c2d12 5px,#7c2d12 10px)','--card-back-border':'#fdba74'}},
  {id:'diamond',name:'Diamond Elite Backs',cost:30000,vars:{'--card-back-bg':'linear-gradient(135deg,rgba(255,255,255,.25),transparent),repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 5px,#6b7280 5px,#6b7280 10px)','--card-back-border':'#ffffff'}}
 ]
};

export const TABLES=[
 {name:'The Sandy Shuffle',desc:'A low-stakes friendly game where everyone is still learning the ropes.',buyIn:100,sb:1,bb:2,bots:3,skill:'normal',unlock:0,fixedBots:['Zach'],botNames:['Spencer','Zach','Caleb']},
 {name:'Meeting House Late Night Cards',desc:'The regular crowd is starting to take the game seriously.',buyIn:250,sb:2,bb:5,bots:5,skill:'normal',unlock:250,fixedBots:['Mike'],botNames:['Mike','Caleb','Spencer','Nick','Matt','Tyler']},
 {name:'Bachelor\'s Bluff',desc:'Long nights, bigger pots, and aggressive action.',buyIn:500,sb:5,bb:10,bots:5,skill:'strong',unlock:600,fixedBots:['Spencer'],botNames:['Mike','Caleb','Spencer','Nick','Matt','Tyler']},
 {name:'Harding Street Hold\'em',desc:'A private neighborhood high-roller game with serious pressure.',buyIn:1000,sb:10,bb:20,bots:5,skill:'strong',unlock:1200,fixedBots:['Spencer'],botNames:['Mike','Caleb','Spencer','Nick','Matt','Tyler','Zach','Andrew','Josh']},
 {name:'Encore Casino',desc:'Bright lights and dangerous players with deep stacks.',buyIn:2500,sb:25,bb:50,bots:5,skill:'shark',unlock:3000,botNames:['Mike','Caleb','Spencer','Nick','Matt','Tyler','Zach','Andrew','Josh']},
 {name:'The Final Table',desc:'Beat this table and you own the room.',buyIn:5000,sb:50,bb:100,bots:5,skill:'shark',unlock:6000,botNames:['Mike','Caleb','Spencer','Nick','Matt','Tyler','Zach','Andrew','Josh']}
];

export const tableWipeAchievementId=name=>'wipe_'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const TABLE_WIPE_ACHIEVEMENTS=TABLES.map(t=>({id:tableWipeAchievementId(t.name),name:`Wiped ${t.name}`,desc:`Be the last player standing at ${t.name}.`}));
export const ACHIEVEMENTS=[
 {id:'first_bluff',name:'First Bluff',desc:'Win a pot uncontested after raising with a weak hand.'},
 {id:'river_rat',name:'River Rat',desc:'Win a hand at showdown on the river.'},
 {id:'stacked_zach',name:'Stacked Zach',desc:'Bust Zach out of a session.'},
 {id:'won_72',name:'Won With 7-2',desc:'Win a hand while holding 7-2.'},
 {id:'folded_aces',name:'Folded Aces',desc:'Fold pocket aces. Painful, but memorable.'},
 {id:'cleared_mines',name:'Cleared Minesweeper',desc:'Clear the bailout Minesweeper board.'},
 ...TABLE_WIPE_ACHIEVEMENTS,
 {id:'final_table_winner',name:'Final Table Winner',desc:'Beat everyone at The Final Table.'}
];
export const DEFAULT_CAREER_STATS={
 handsPlayed:0,totalNet:0,biggestBankroll:1000,biggestPotWon:0,biggestLoss:0,bestHand:null,
 tablesPlayed:0,tableWipes:0,cashOuts:0,minesweeperWins:0,botsBusted:{},timesBustedBy:{},tablePlays:{},achievements:[],
 profile:{vpipHands:0,pfrHands:0,aggressiveActions:0,passiveActions:0,activityMs:0}
};
export const POWER_UPS=[
 {id:'insurance',name:'One-Time Insurance',cost:225,desc:'If you bust at a table, recover 15% of the buy-in once per session.'},
 {id:'slow_table',name:'Table Pause',cost:75,desc:'Keeps the slower all-in and showdown pacing unlocked as a comfort upgrade.'},
 {id:'muck_peek',name:'Muck Peek Token',cost:175,desc:'Winners at showdown see more mucked cards at shark tables.'},
 {id:'pot_odds',name:'Pot Odds Helper',cost:125,desc:'Adds call-to-win context when you are facing a bet.'},
 {id:'tilt_guard',name:'Tilt Guard',cost:100,desc:'Warns you before all-in spots when you still have chips behind.'},
 {id:'bad_beat',name:'Bad Beat Rebate',cost:250,desc:'Lose with Three of a Kind or better and get a 5% pot rebate, capped at $100.'},
 {id:'mines_toolkit',name:'Minesweeper Toolkit',cost:150,desc:'New Minesweeper boards start with one safe square revealed.'},
 {id:'table_scout',name:'Table Scout',cost:100,desc:'Shows the bots seated at each table before you buy in.'},
 {id:'small_blind_tip',name:'Tip the Small Blind',cost:200,desc:'Unlocks a once-per-hand odds tip that costs the table small blind.'}
];
export const COMPANIONS=[
 {id:'dealer_dog',name:'Dealer Dog',cost:500,perk:'Warns you when a call would risk more than half your stack.'},
 {id:'lucky_chip',name:'Lucky Chip',cost:650,perk:'Every 10 career hands, cashing out grants a small $25 loyalty bonus.'},
 {id:'card_cat',name:'Card Cat',cost:450,perk:'Adds occasional hand-strength flavor on your turn.'},
 {id:'bankroll_buddy',name:'Bankroll Buddy',cost:550,perk:'Raises Minesweeper payouts from $50 to $60.'},
 {id:'quiet_owl',name:'Quiet Owl',cost:500,perk:'Shows pot odds automatically, like the Pot Odds Helper.'},
 {id:'hype_man',name:'Hype Man',cost:350,perk:'Adds extra celebration text after big wins.'}
];
