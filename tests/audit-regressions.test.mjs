import { test } from 'node:test';
import assert from 'node:assert/strict';
import { participationState, participationLabel } from '../src/lib/participation-state.ts';
import { decisionMilestone } from '../src/lib/decision-milestone.ts';
import { itemStatus, stageBadge } from '../src/lib/item-display.ts';
import { CITIES, getCity } from '../src/lib/cities.ts';
import { readCity, writeCity, subscribeCity } from '../src/lib/city-store.ts';
const now = new Date('2026-11-13T20:00:00Z');
const item = { stage:'committee', meeting_date:'2026-11-17', votes:[], source_url:'https://official.example/item/1' };
const evidence = {state:'verified_open',item_specific:true,source_url:item.source_url,source_excerpt:'Comments close at 5pm EST November 13.',verified_at:'2026-11-13T19:00:00Z',deadline:'2026-11-13T17:00:00-05:00'};
test('participation needs item-specific provenance and explicit timezone-aware timing',()=>{
 assert.equal(participationState(item,now),'unknown');
 assert.match(participationLabel(item,now),/Check official/);
 for(const patch of [{source_url:''},{source_excerpt:''},{item_specific:false},{deadline:null},{deadline:'2026-11-13T17:00:00'},{verified_at:'bad'}]) assert.equal(participationState({...item,participation_evidence:{...evidence,...patch}},now),'unknown');
 assert.equal(participationState({...item,participation_evidence:evidence},now),'verified_open');
 assert.equal(participationState({...item,participation_evidence:evidence},new Date('2026-11-13T23:00:00Z')),'verified_closed');
 assert.equal(participationState({...item,stage:'decided',participation_evidence:evidence},now),'unknown');
 assert.equal(participationState({...item,stage:'unknown',participation_evidence:evidence},now),'unknown');
});
test('timelines distinguish recorded motions, amendments, unknowns and implementation',()=>{
 assert.equal(decisionMilestone(item).known,false);
 for(const result of ['Carried (23 to 2)','Carried (12 to 1)','Defeated','Deferred','Received']){
  const vote={motion_kind:'main',motion_text:'Consultation only',result,groups:[],tally:null,source_url:item.source_url,source_date:'2026-09-09'};
  const m=decisionMilestone({...item,votes:[vote]});assert.equal(m.known,true);assert.equal(m.date,vote.source_date);assert.match(m.explanation,/not proof/);
  assert.equal(decisionMilestone({...item,votes:[{...vote,motion_kind:'amendment'}]}).title,'Recorded amendment');
 }
});
test('unknown board results are never labelled decided; known results remain decided',()=>{
 const board={...item,stage:'decided',decision_body:'board',meeting_date:'2026-11-10'};
 assert.equal(itemStatus(board,now),'held');assert.equal(stageBadge(board,now).label,'Discussed at a meeting');
 assert.equal(stageBadge({...board,votes:[{result:'Received',groups:[]}]},now).label,'Decided by a city panel');
});
test('city notifications synchronize subscribers for every city even with storage blocked',()=>{
 const old=globalThis.window;const events=new EventTarget();
 globalThis.window={addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),get localStorage(){throw Error('blocked');}};
 let changes=0;const unsub=subscribeCity(()=>changes++);
 try { for(const city of CITIES){writeCity(city.id);assert.equal(readCity(),city.id);assert.equal(getCity(readCity()).name,city.name);}assert.equal(changes,CITIES.length);unsub();writeCity('ottawa');assert.equal(changes,CITIES.length); }
 finally{globalThis.window=old;}
 assert.equal(getCity(null),null);assert.equal(getCity('corrupt-id'),null);
});

test('unknown vote result is not a verified decision',()=>{
 assert.equal(decisionMilestone({...item,votes:[{motion_kind:'main',source_date:'2026-09-09',source_url:item.source_url,result:'Not published',groups:[]}]}).known,false);
});
test('mail formatter rejects unknown deadlines and preserves city-specific evidence for eight cities',async()=>{
 const { formatDeadlineAlert, sendAlert } = await import('../src/lib/alerts/channel.ts');
 assert.throws(()=>formatDeadlineAlert(item,now),/No verified/);
 for(const city of CITIES){
  const message=formatDeadlineAlert({...item,municipality_id:city.id,title:'<img src=x>',committee:'Council',retrieved_at:evidence.verified_at,participation_evidence:evidence},now);
  assert.ok(message.html.includes(city.name));assert.ok(message.html.includes('&lt;img'));assert.ok(!message.html.includes('<img'));assert.ok(message.body.includes(evidence.deadline));
 }
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='production';
 try {await assert.rejects(sendAlert('never-sent@example.invalid','console',{}),/not available/);} finally {if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;}
});
