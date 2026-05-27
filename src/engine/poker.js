import { RANKS, RANK_VALUE, SUITS } from '../data.js';

export function makeDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,value:RANK_VALUE[r]});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}


export function preflopStrength(h){let[a,b]=h,hi=Math.max(a.value,b.value),lo=Math.min(a.value,b.value),s=hi/14*.45+lo/14*.25;if(a.value===b.value)s+=.32;if(a.suit===b.suit)s+=.06;if(Math.abs(a.value-b.value)===1)s+=.05;if(hi>=13&&lo>=10)s+=.09;return Math.min(1,s)}


export function drawPotential(h,b){let cards=[...h,...b],suits={};cards.forEach(c=>suits[c.suit]=(suits[c.suit]||0)+1);let f=Object.values(suits).some(n=>n===4)?.09:0,vals=[...new Set(cards.map(c=>c.value))].sort((a,b)=>a-b);if(vals.includes(14))vals.unshift(1);let st=0;for(let i=0;i<vals.length;i++){let w=vals.slice(i,i+4);if(w.length===4&&w[3]-w[0]<=4)st=.07}return f+st}


export function combinations(a,k){let r=[];(function bt(s,c){if(c.length===k)return r.push([...c]);for(let i=s;i<a.length;i++){c.push(a[i]);bt(i+1,c);c.pop()}})(0,[]);return r}


export function evaluateBest(cards){let best=null;for(const combo of combinations(cards,5)){let e=evaluateFive(combo);if(!best||compareHands(e,best)>0)best=e}return best}


export function evaluateFive(cards){let vals=cards.map(c=>c.value).sort((a,b)=>b-a),counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);let groups=Object.entries(counts).map(([v,c])=>({value:+v,count:c})).sort((a,b)=>b.count-a.count||b.value-a.value),flush=cards.every(c=>c.suit===cards[0].suit),sh=getStraightHigh(vals);if(flush&&sh)return{rank:8,values:[sh],name:sh===14?'Royal Flush':'Straight Flush'};if(groups[0].count===4)return{rank:7,values:[groups[0].value,groups[1].value],name:'Four of a Kind'};if(groups[0].count===3&&groups[1].count===2)return{rank:6,values:[groups[0].value,groups[1].value],name:'Full House'};if(flush)return{rank:5,values:vals,name:'Flush'};if(sh)return{rank:4,values:[sh],name:'Straight'};if(groups[0].count===3)return{rank:3,values:[groups[0].value,...groups.slice(1).map(g=>g.value).sort((a,b)=>b-a)],name:'Three of a Kind'};if(groups[0].count===2&&groups[1].count===2){let ps=groups.filter(g=>g.count===2).map(g=>g.value).sort((a,b)=>b-a),k=groups.find(g=>g.count===1).value;return{rank:2,values:[...ps,k],name:'Two Pair'}}if(groups[0].count===2)return{rank:1,values:[groups[0].value,...groups.slice(1).map(g=>g.value).sort((a,b)=>b-a)],name:'One Pair'};return{rank:0,values:vals,name:'High Card'}}


export function getStraightHigh(vals){let v=[...new Set(vals)].sort((a,b)=>b-a);if(v.includes(14))v.push(1);for(let i=0;i<=v.length-5;i++){let s=v.slice(i,i+5);if(s[0]-s[4]===4)return s[0]}return null}


export function compareHands(a,b){if(a.rank!==b.rank)return a.rank-b.rank;for(let i=0;i<Math.max(a.values.length,b.values.length);i++){let av=a.values[i]||0,bv=b.values[i]||0;if(av!==bv)return av-bv}return 0}

