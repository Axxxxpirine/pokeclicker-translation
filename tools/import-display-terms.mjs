import {serveRelease} from './game-server.mjs';
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './resources.mjs';
const server=await serveRelease(), browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage(); await page.goto(server.origin); await page.locator('#saveSelector .new-import-buttons label').first().click();
 const terms=await page.evaluate(()=>{
  const desc=(cls,data)=>Object.assign(Object.create(cls.prototype),{amount:123456,...data}).defaultDescription;
  return {
   questGym:Object.keys(GymList).filter(key=>GymList[key].parent).map(gymTown=>desc(DefeatGymQuest,{gymTown}).replace(/^Defeat /, '').replace(/ 123,456 times\.$/, '')),
   questDungeon:Object.keys(dungeonList).filter(key=>TownList[key]).map(dungeon=>desc(DefeatDungeonQuest,{dungeon,region:TownList[dungeon].region}).replace(/^Defeat the /, '').replace(/ 123,456 times\.$/, '')),
   questRoute:Routes.regionRoutes.map(r=>Routes.getName(r.number,r.region,false,true)),
   questRegion:[...new Set([...Object.values(SubRegions.list).flat().map(r=>r.name), ...Object.keys(GameConstants.Region).filter(k=>isNaN(k)&&k!=='none').map(k=>GameConstants.camelCaseToString(k))])],
   questBall:Object.keys(GameConstants.Pokeball).filter(k=>isNaN(k)&&ItemList[k]).map(k=>ItemList[k].displayName+'s'),
   questBerry:Object.keys(BerryType).filter(k=>isNaN(k)&&k!=='None'),
   questOak:Object.keys(OakItemType).filter(k=>isNaN(k)).map(k=>GameConstants.humanifyString(k)),
   questType:Object.keys(PokemonType).filter(k=>isNaN(k)&&k!=='None'),
  };
 });
 for(const [k,v]of Object.entries(terms)) terms[k]=[...new Set(v)].sort();
 writeFileSync(resolve(root, 'upstream/display-terms.json'),JSON.stringify({gameCommit:server.provenance.game.commit,domains:terms},null,2)+'\n');console.log(Object.fromEntries(Object.entries(terms).map(([k,v])=>[k,{count:v.length,sample:v.slice(0,4)}])));
} finally {await browser.close();await server.close()}
