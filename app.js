const STORE='forge-prs-v1';
const defaultState={
  user:'Gavin', goal:500, phase:1, week:1, day:1, recovery:{sleep:3,energy:3,stress:2,notes:''},
  maxes:{deadlift:157,squat:129,bench:108,viking:93},
  history:[],
  exercises:{
    deadlift:['Romanian Deadlift','Landmine Row','Pull-ups','Ab Wheel'],
    bench:['Incline DB Press','Weighted Dips','Rolling DB Extension','Lateral Raises'],
    squat:['Pause Squat','Bulgarian Split Squat','Romanian Deadlift','Ab Wheel'],
    viking:['Touch & Go Bench','Chest Supported DB Row','Rear Delt Raise','Hammer Curl']
  }
};
const phases=[
  {name:'Phase 1',desc:'Average intensity / average volume'},
  {name:'Phase 2',desc:'High intensity / lower volume'},
  {name:'Phase 3',desc:'Lower intensity / higher volume'},
  {name:'Peak',desc:'Heavy practice / reduce accessories'}
];
const workouts=[
  {lift:'deadlift',name:'Deadlift Speed',type:'Speed'},
  {lift:'bench',name:'Bench Reps',type:'Reps'},
  {lift:'squat',name:'Squat Power',type:'Power'},
  {lift:'viking',name:'Viking Press + Bench',type:'Press'}
];
const pct={Power:[.75,.8,.85],Reps:[.65,.7,.75],Speed:[.55,.6,.625],Press:[.65,.7,.75]};
let state=load(); let tab='home';
function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function kg(x){return Math.round(x*2)/2}
function total(){return state.maxes.deadlift+state.maxes.squat+state.maxes.bench}
function today(){return workouts[(state.day-1)%4]}
function tm(lift){return kg(state.maxes[lift]*.95)}
function e1rm(w,r){return Math.round(w*(1+r/30))}
function toast(t){let d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function setTab(t){tab=t;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));render()}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
document.getElementById('resetBtn').onclick=()=>{ if(confirm('Reset Forge demo data?')){localStorage.removeItem(STORE);state=load();render();}};
function render(){document.getElementById('greeting').textContent=greet(); const v=document.getElementById('view'); v.innerHTML=views[tab](); bind(); save();}
function greet(){let h=new Date().getHours();return `${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, ${state.user}`}
const views={
 home(){let p=Math.min(100,Math.round(total()/state.goal*100));let w=today();return `<section class="hero"><div class="pill">${phases[state.phase-1].name} · Week ${state.week} · Day ${state.day}</div><div class="big-number">${total()}<span class="unit">kg</span></div><div class="muted">Current powerlifting total · ${p}% of ${state.goal}kg goal</div><div class="progressbar"><div style="width:${p}%"></div></div><button class="btn" id="start">Start ${w.name}</button></section><div class="grid"><div class="card"><h3>Deadlift</h3><div class="metric">${state.maxes.deadlift}kg</div><div class="mini">TM ${tm('deadlift')}kg</div></div><div class="card"><h3>Squat</h3><div class="metric">${state.maxes.squat}kg</div><div class="mini">TM ${tm('squat')}kg</div></div><div class="card"><h3>Bench</h3><div class="metric">${state.maxes.bench}kg</div><div class="mini">TM ${tm('bench')}kg</div></div><div class="card"><h3>Viking</h3><div class="metric">${state.maxes.viking}kg</div><div class="mini">TM ${tm('viking')}kg</div></div></div><div class="section-title">COACH</div><div class="card">${coach()}</div>`},
 workout(){let w=today(), lift=w.lift, work=workSets(w), accessories=state.exercises[lift]||[]; return `<div class="card"><div class="pill">${phases[state.phase-1].name} · ${w.type}</div><div class="session-title">${w.name}</div><div class="muted">Training max: ${tm(lift)}kg</div></div><div class="section-title">WARM-UP</div><div class="card">${warmups(lift).map(s=>setRow(s.w,s.r,false)).join('')}</div><div class="section-title">WORKING SETS</div><div class="card">${work.map((s,i)=>setRow(s.w,s.r,i===work.length-1,true)).join('')}</div><div class="section-title">ACCESSORIES</div>${accessories.map(a=>accessoryCard(a)).join('')}<button class="btn" id="finish">Finish workout</button>`},
 progress(){let h=state.history.slice(-8);let vals=h.length?h.map(x=>x.total):[360,370,378,384,total()];let max=Math.max(...vals,500);return `<section class="hero"><div class="big-number">${total()}<span class="unit">kg</span></div><div class="muted">Target ${state.goal}kg</div><div class="progressbar"><div style="width:${Math.min(100,total()/state.goal*100)}%"></div></div></section><div class="section-title">TOTAL TREND</div><div class="card"><div class="chart">${vals.map(v=>`<div class="bar" style="height:${Math.max(10,v/max*140)}px"></div>`).join('')}</div></div><div class="grid"><div class="card"><h3>Sessions</h3><div class="metric">${state.history.length}</div></div><div class="card"><h3>Best e1RM</h3><div class="metric">${Math.max(...Object.values(state.maxes))}</div></div></div>`},
 library(){let all=[...new Set(Object.values(state.exercises).flat())];return `<div class="section-title">HOME GYM LIBRARY</div>${all.map(x=>`<div class="card exercise"><div><h3>${x}</h3><div class="mini">Purpose: strength, muscle or longevity</div></div><span class="tag">KEEP</span></div>`).join('')}`},
 settings(){return `<div class="card"><h3>Programme position</h3><label class="mini">Phase</label><select id="phase" class="select">${phases.map((p,i)=>`<option value="${i+1}" ${state.phase===i+1?'selected':''}>${p.name}</option>`)}</select><label class="mini">Week</label><select id="week" class="select">${[1,2,3,4,5,6,7,8,9,10,11,12].map(x=>`<option ${state.week===x?'selected':''}>${x}</option>`)}</select><label class="mini">Day</label><select id="day" class="select">${[1,2,3,4].map(x=>`<option ${state.day===x?'selected':''}>${x}</option>`)}</select></div><div class="section-title">RECOVERY</div><div class="card"><label>Sleep</label><input id="sleep" type="range" min="1" max="5" value="${state.recovery.sleep}"><label>Energy</label><input id="energy" type="range" min="1" max="5" value="${state.recovery.energy}"><label>Stress</label><input id="stress" type="range" min="1" max="5" value="${state.recovery.stress}"><textarea id="notes" placeholder="Notes">${state.recovery.notes||''}</textarea></div><button class="btn secondary" id="export">Export data</button>`}
};
function workSets(w){let base=tm(w.lift), arr=pct[w.type]||pct.Power; if(state.phase===4) arr=[.8,.85,.9]; return arr.map((p,i)=>({w:kg(base*p),r:w.type==='Reps'?8:w.type==='Speed'?3:i===2?'3+':3}))}
function warmups(lift){let b=tm(lift);return [20,b*.4,b*.55,b*.7].map((w,i)=>({w:kg(w),r:[5,5,3,2][i]}))}
function setRow(w,r,plus,work=false){return `<div class="set"><button class="check">✓</button><div><b>${w}kg × ${r}</b><div class="mini">${plus?'AMRAP set · stop before form breaks':work?'Working set':'Warm-up'}</div></div>${plus?`<input class="input amrap" type="number" placeholder="reps">`:''}</div>`}
function accessoryCard(a){let last=lastAccessory(a);return `<div class="card"><div class="exercise"><div><h3>${a}</h3><div class="mini">Last: ${last||'No history yet'} · Suggested: ${suggest(last)}</div></div><span class="tag">LOG</span></div><div class="row" style="margin-top:10px"><input class="input acc-w" placeholder="kg"><input class="input acc-r" placeholder="reps"><button class="icon-btn acc-save" data-ex="${a}">✓</button></div></div>`}
function lastAccessory(a){for(let i=state.history.length-1;i>=0;i--){let f=state.history[i].accessories?.find(x=>x.name===a); if(f)return `${f.weight}×${f.reps}`} return ''}
function suggest(last){if(!last)return 'start sensible';let [w,r]=last.split('×').map(Number);return r>=10?`${kg(w+2.5)}kg`:`${w}kg`}
function coach(){let score=+state.recovery.sleep + +state.recovery.energy + (6 - +state.recovery.stress); if(score<=8)return 'Recovery is low. Do the work, but skip AMRAPs and avoid ego lifting.'; if(score>=12)return 'Recovery looks good. Push the final set if bar speed is there.'; return 'Normal day. Follow the plan and leave one rep in reserve.'}
function bind(){document.getElementById('start')?.addEventListener('click',()=>setTab('workout')); document.querySelectorAll('.check').forEach(b=>b.onclick=()=>b.closest('.set').classList.toggle('done'));
 document.getElementById('finish')?.addEventListener('click',finishWorkout);
 ['phase','week','day'].forEach(id=>document.getElementById(id)?.addEventListener('change',e=>{state[id]=+e.target.value;render()}));
 ['sleep','energy','stress','notes'].forEach(id=>document.getElementById(id)?.addEventListener('input',e=>{state.recovery[id]=e.target.value;save()}));
 document.getElementById('export')?.addEventListener('click',()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='forge-data.json';a.click()});
 document.querySelectorAll('.acc-save').forEach(b=>b.onclick=()=>{let c=b.closest('.card'); b.textContent='✓'; b.dataset.saved=JSON.stringify({name:b.dataset.ex,weight:c.querySelector('.acc-w').value,reps:c.querySelector('.acc-r').value}); toast('Accessory saved')});
}
function finishWorkout(){let w=today();let am=document.querySelector('.amrap'); if(am?.value){let ws=workSets(w).at(-1).w, est=e1rm(ws,+am.value); if(est>state.maxes[w.lift]) state.maxes[w.lift]=est;}
 let accessories=[...document.querySelectorAll('.acc-save')].map(b=>b.dataset.saved?JSON.parse(b.dataset.saved):null).filter(Boolean);
 state.history.push({date:new Date().toISOString(),workout:w.name,total:total(),accessories}); state.day=state.day===4?1:state.day+1; if(state.day===1){state.week=Math.min(12,state.week+1); state.phase=Math.min(4,Math.ceil(state.week/3));} save(); toast('Workout saved'); setTab('home');}
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{}); render();
