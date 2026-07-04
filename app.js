const $=s=>document.querySelector(s);
const round2_5=n=>Math.round(n/2.5)*2.5;
const e1rm=(w,r)=> r>1 ? Math.round((w*(1+r/30))*10)/10 : w;
const storeKey='forge_campbell_prs_v1';
const defaults={
  name:'Gavin', goal:500, currentDay:1,
  maxes:{deadlift:157,squat:129,bench:108,viking:93},
  prefs:{
    benchVar:['Paused Bench','Close-Grip Bench'], chest:['Flat DB Press','Incline DB Press','Weighted Dips'],
    deadVar:['Romanian Deadlift','Deficit Deadlift'], back:['Landmine Row','Barbell Row','Pull-ups'],
    squatVar:['Pause Squat','Tempo Squat','Beltless Squat'], shoulder:['Rear Delt Raise','Lateral Raise','Band Pull-Aparts']
  },
  logs:{}, recovery:[], prs:[]
};
let state=load(); let view='home';
function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch(e){return defaults}}
function save(){localStorage.setItem(storeKey,JSON.stringify(state))}
const phaseNames=['Phase 1','Phase 2','Phase 3','Peak'];
const phaseDesc=['Average intensity / average volume','High intensity / low volume','Low intensity / high volume','Peaking using true maxes'];
const liftMaxKey={Deadlift:'deadlift',Squat:'squat',Bench:'bench','Viking Press':'viking'};
const rotation=[
  [{lift:'Deadlift',type:'Speed'},{lift:'Bench',type:'Reps'},{lift:'Squat',type:'Power'},{lift:'Viking Press',type:'Speed'}],
  [{lift:'Deadlift',type:'Reps'},{lift:'Bench',type:'Power'},{lift:'Squat',type:'Speed'},{lift:'Viking Press',type:'Reps'}],
  [{lift:'Deadlift',type:'Power'},{lift:'Bench',type:'Speed'},{lift:'Squat',type:'Reps'},{lift:'Viking Press',type:'Power'}]
];
const pct={
  'Phase 1':{Power:[.85,3,3],Reps:[.80,4,6],Speed:[.625,8,3]},
  'Phase 2':{Power:[.90,3,2],Reps:[.825,3,5],Speed:[.70,6,3]},
  'Phase 3':{Power:[.80,3,5],Reps:[.775,5,8],Speed:[.625,8,3]},
  'Peak':{Power:[.90,3,1],Reps:[.80,3,3],Speed:[.70,5,2]}
};
const banks={
  benchVar:['Paused Bench','Close-Grip Bench','Larsen Press','Floor Press'],
  chest:['Flat DB Press','Incline DB Press','Weighted Dips','Push-Ups'],
  deadVar:['Romanian Deadlift','Deficit Deadlift','Block Pull','Good Morning'],
  back:['Landmine Row','Barbell Row','Pull-ups','Chest Supported DB Row','Meadows Row'],
  squatVar:['Pause Squat','Tempo Squat','Beltless Squat','Front Squat'],
  shoulder:['Rear Delt Raise','Lateral Raise','Band Pull-Aparts','DB Shoulder Press']
};
function programmeInfo(day=state.currentDay){const p=Math.min(3,Math.floor((day-1)/12)); const week=Math.floor((day-1)/4)+1; const block=(week-1)%3; const d=(day-1)%4; return {phase:phaseNames[p],phaseIndex:p,week,block,dayInWeek:d+1,workout:rotation[block][d]};}
function total(){return state.maxes.deadlift+state.maxes.squat+state.maxes.bench}
function tm(lift,phase){let m=state.maxes[liftMaxKey[lift]]; return phase==='Peak'?m:round2_5(m*.95)}
function mainSets(w){const {lift,type}=w.workout, ph=w.phase; const [p,sets,reps]=pct[ph][type]; const weight=round2_5(tm(lift,ph)*p); return Array.from({length:sets},(_,i)=>({name:`Set ${i+1}`,weight,reps: i===sets-1 && type==='Power' ? reps+'+' : reps}));}
function warmups(weight){return [[20,5],[round2_5(weight*.4),5],[round2_5(weight*.6),3],[round2_5(weight*.75),2],[round2_5(weight*.88),1]].filter((x,i,a)=>x[0]<weight && (i===0||x[0]!==a[i-1]?.[0]));}
function accessories(w){const L=w.workout.lift, b=w.block; const pick=(arr,i)=>arr[i%arr.length];
 if(L==='Bench') return [pick(state.prefs.benchVar,b),pick(state.prefs.chest,b),pick(state.prefs.chest,b+1)].filter(Boolean);
 if(L==='Deadlift') return [pick(state.prefs.deadVar,b),pick(state.prefs.back,b),pick(state.prefs.back,b+1)].filter(Boolean);
 if(L==='Squat') return [pick(state.prefs.squatVar,b),'Romanian Deadlift',pick(state.prefs.back,b)].filter(Boolean);
 return ['Bench Press - second day',pick(state.prefs.shoulder,b),pick(state.prefs.back,b),'Weighted Dips'].filter(Boolean);
}
function logKey(day=state.currentDay){return 'd'+day}
function getLog(day=state.currentDay){return state.logs[logKey(day)] ||= {sets:{},accessories:{},notes:''}}
function nav(){return `<div class="nav"><div class="navin">${[['home','🏠','Home'],['workout','🏋️','Workout'],['builder','🧱','Builder'],['progress','📈','Progress'],['settings','⚙️','Settings']].map(t=>`<button class="tab ${view===t[0]?'active':''}" onclick="go('${t[0]}')"><b>${t[1]}</b>${t[2]}</button>`).join('')}</div></div>`}
window.go=v=>{view=v; render()};
function render(){const app=$('#app'); app.innerHTML=`<div class="shell"><div class="top"><div class="brand">FORGE</div><div class="pill">Campbell PRS</div></div>${views[view]()}${nav()}</div>`;}
const views={
home(){const info=programmeInfo(); const pctGoal=Math.min(100,Math.round(total()/state.goal*100)); return `<div class="hero"><div class="muted">Good ${new Date().getHours()<12?'morning':'evening'}, ${state.name}</div><h1>${info.workout.lift}</h1><div class="row"><h2 class="gold">${info.workout.type} Day</h2><span class="tag">${info.phase} · Week ${info.week}</span></div><button class="btn" onclick="go('workout')">Start workout</button></div><div class="grid"><div class="card"><div class="muted">Current total</div><div class="big">${total()}</div><div class="muted">kg</div></div><div class="card"><div class="muted">Target</div><div class="big">${state.goal}</div><div class="muted">kg</div></div></div><div class="card"><div class="row"><b>Progress to 500kg</b><b>${pctGoal}%</b></div><div class="bar"><div class="fill" style="width:${pctGoal}%"></div></div></div><div class="card"><h3>Programme position</h3><p class="muted">${info.phase}: ${phaseDesc[info.phaseIndex]}</p><div class="grid"><button class="btn secondary" onclick="moveDay(-1)">Previous day</button><button class="btn secondary" onclick="moveDay(1)">Next day</button></div></div>`},
workout(){const info=programmeInfo(); const sets=mainSets(info); const work=sets[0].weight; const log=getLog(); const done=(k)=>log.sets[k]?.done; return `<div class="hero"><div class="row"><span class="tag">${info.phase} · Week ${info.week} · Day ${info.dayInWeek}</span><span class="tag">${info.workout.type}</span></div><h1>${info.workout.lift}</h1><p class="muted">Training max: ${tm(info.workout.lift,info.phase)}kg</p></div><div class="section-title">Warm-up</div>${warmups(work).map((s,i)=>setRow('w'+i,s[0],s[1],done('w'+i))).join('')}<div class="section-title">Campbell PRS working sets</div>${sets.map((s,i)=>setRow('m'+i,s.weight,s.reps,done('m'+i),i===sets.length-1)).join('')}<div class="section-title">Exercise bank loaded for this day</div>${accessories(info).map((a,i)=>accRow(a,i,log.accessories[i]||{})).join('')}<div class="card"><label>Session notes</label><textarea id="notes" onchange="saveNotes(this.value)">${log.notes||''}</textarea></div><button class="btn" onclick="finishWorkout()">Finish and move to next day</button>`},
builder(){return `<div class="hero"><h1>Programme Builder</h1><p class="muted">Campbell PRS stays fixed. You only choose the exercise banks that replace cable/machine work and suit your home gym.</p></div>${bankEditor('benchVar','Bench variations')}${bankEditor('chest','Chest assistance')}${bankEditor('deadVar','Deadlift variations')}${bankEditor('back','Back / rows')}${bankEditor('squatVar','Squat variations')}${bankEditor('shoulder','Shoulder health')}<button class="btn" onclick="save(); render()">Save banks</button>`},
progress(){return `<div class="hero"><h1>${total()}kg</h1><p class="muted">Current powerlifting total. Goal ${state.goal}kg.</p></div><div class="grid">${Object.entries(state.maxes).map(([k,v])=>`<div class="card"><div class="muted">${cap(k)}</div><h2>${v}kg</h2><label>Update 1RM</label><input type="number" value="${v}" onchange="state.maxes.${k}=Number(this.value);save();render()"></div>`).join('')}</div><div class="card"><h3>Recent PRs</h3>${state.prs.length?state.prs.slice(-6).reverse().map(p=>`<div class="row"><span>${p.lift}</span><b class="green">${p.value}kg</b></div>`).join(''):'<p class="muted">No PRs logged yet.</p>'}</div><button class="btn secondary" onclick="exportData()">Export data</button>`},
settings(){return `<div class="hero"><h1>Settings</h1><p class="muted">Set your target and reset/import data.</p></div><div class="card"><label>Name</label><input value="${state.name}" onchange="state.name=this.value;save()"><label>Total goal</label><input type="number" value="${state.goal}" onchange="state.goal=Number(this.value);save();render()"><label>Current programme day 1-48</label><input type="number" min="1" max="48" value="${state.currentDay}" onchange="state.currentDay=Math.max(1,Math.min(48,Number(this.value)));save();render()"></div><div class="card"><h3>Cache fix</h3><p class="muted">If GitHub Pages shows an old version, open your URL with ?v=campbell1 and delete/re-add the Home Screen app.</p></div><button class="btn ghost danger" onclick="resetApp()">Reset app data</button>`}
};
function setRow(k,w,r,d,last=false){return `<div class="set ${d?'done':''}" onclick="toggleSet('${k}',${w},'${r}')"><div><b>${w}kg × ${r}</b>${last?'<div class="mini gold">Last set can be AMRAP if sensible</div>':''}</div><span class="tag">${d?'Done':'Tap'}</span><span>${d?'✅':'○'}</span></div>`}
function accRow(name,i,val){return `<div class="card"><div class="row"><h3>${name}</h3><span class="tag">Accessory</span></div><div class="grid"><div><label>Weight</label><input type="number" value="${val.w||''}" onchange="saveAcc(${i},'w',this.value)"></div><div><label>Reps total</label><input type="number" value="${val.r||''}" onchange="saveAcc(${i},'r',this.value)"></div></div><label>Notes</label><input value="${val.n||''}" onchange="saveAcc(${i},'n',this.value)"></div>`}
function bankEditor(key,title){return `<div class="card"><h3>${title}</h3><div class="checkgrid">${banks[key].map(x=>`<label class="choice"><input type="checkbox" ${state.prefs[key]?.includes(x)?'checked':''} onchange="togglePref('${key}','${x}',this.checked)"><span>${x}</span></label>`).join('')}</div></div>`}
window.togglePref=(k,x,on)=>{state.prefs[k] ||= []; state.prefs[k]=on?[...new Set([...state.prefs[k],x])]:state.prefs[k].filter(v=>v!==x); save();};
window.toggleSet=(k,w,r)=>{const log=getLog(); log.sets[k]=log.sets[k]||{}; log.sets[k].done=!log.sets[k].done; log.sets[k].w=w; log.sets[k].r=r; save(); render();};
window.saveAcc=(i,k,v)=>{const log=getLog(); log.accessories[i]=log.accessories[i]||{}; log.accessories[i][k]=v; save();};
window.saveNotes=v=>{getLog().notes=v; save();};
window.finishWorkout=()=>{state.currentDay=Math.min(48,state.currentDay+1); save(); go('home')};
window.moveDay=n=>{state.currentDay=Math.max(1,Math.min(48,state.currentDay+n)); save(); render()};
window.exportData=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='forge-campbell-prs-data.json'; a.click();};
window.resetApp=()=>{if(confirm('Reset Forge data?')){localStorage.removeItem(storeKey); state=load(); render();}};
function cap(s){return s==='viking'?'Viking Press':s[0].toUpperCase()+s.slice(1)}
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render();
