import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseItemsResponse,parsePreferences,officialUrl,filterMobileItems,civiResponse} from '../packages/shared/mobile.ts';
import {stageBadge} from '../src/lib/item-display.ts';
const item={id:'demo',item_number:'OTT-test',municipality_id:'ottawa',title:'Housing report',description:null,committee:'City Council',stage:'committee',decision_body:'staff',meeting_date:'2026-11-17',source_url:'https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id=test',retrieved_at:'2026-11-13T22:00:00Z',votes:[]};
const now=new Date('2026-11-13T22:00:00Z');
test('mobile API rejects incompatible versions, malformed data and unsafe source links',()=>{
 assert.deepEqual(parseItemsResponse({version:1,items:[item]}),[item]);
 for(const x of [{version:2,items:[item]},{version:1,items:[{...item,source_url:'javascript:alert(1)'}]},{version:1,items:[{...item,votes:[{result:'Carried',groups:null}]}]},{version:1,items:[{...item,retrieved_at:'bad'}]},{version:1,items:[{...item,meeting_date:'2026-02-30'}]}])assert.throws(()=>parseItemsResponse(x));
 assert.equal(officialUrl('https://user:password@example.org'),false);assert.equal(officialUrl('file:///tmp/test'),false);
});
test('stored preferences validate city, topics and timeframe and survive JSON round trip',()=>{
 const p=parsePreferences({city:'guelph',topics:['housing','bad'],timeframe:'past',onboarded:true});
 assert.deepEqual(p,{city:'guelph',topics:['housing'],timeframe:'past',onboarded:true});assert.deepEqual(parsePreferences(JSON.parse(JSON.stringify(p))),p);
 assert.equal(parsePreferences({city:'unknown',timeframe:'bad'}).city,'ottawa');
});
test('mobile search combines city, topic, time and body consistently',()=>{
 const p=parsePreferences({city:'ottawa',topics:['housing']});
 assert.equal(filterMobileItems([item],p,' HOUSING ','staff',now).length,1);
 assert.equal(filterMobileItems([item],p,'zzz','all',now).length,0);
 assert.equal(filterMobileItems([item],{...p,timeframe:'past'},'','all',now).length,0);
 assert.equal(filterMobileItems([item],{...p,city:'guelph'},'','all',now).length,0);
});
test('Civi uses the same stage and participation uncertainty as the website',()=>{
 assert.ok(civiResponse('meaning',item,now).startsWith(stageBadge(item,now).label));
 assert.match(civiResponse('participate',item,now),/unverified/);
 assert.match(civiResponse('impact',item,now),/does not establish personal impacts/);
 assert.match(civiResponse('sources',item,now),/official municipal record/);
 const closed={...item,participation_evidence:{state:'verified_closed',item_specific:true,source_url:item.source_url,source_excerpt:'Closed',verified_at:'2026-11-13T20:00:00Z',deadline:null}};
 assert.match(civiResponse('participate',closed,now),/closed/);
 assert.match(civiResponse('meaning'),/Choose your city/);
});
