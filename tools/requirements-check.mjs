import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { serveRelease } from './game-server.mjs';
import { readResources, displayCatalog } from './resources.mjs';
import { createTranslator } from '../src/catalog.mjs';

// Inspect actual requirements throughout a disposable release, including hidden regions.
const server = await serveRelease(), browser = await chromium.launch({headless:true});
try {
  const page=await browser.newPage();
  await page.route('https://**/locales/**', route=>route.abort());
  await page.goto(server.origin);
  await page.locator('#saveSelector .new-import-buttons label').first().click();
  await page.waitForFunction(()=>Boolean(App.game));
  const data=await page.evaluate(()=>{
    const seen=new WeakSet(), records=[], errors=[];
    function walk(value,path,depth=0) {
      if(!value || typeof value!=='object' || seen.has(value) || depth>16) return;
      seen.add(value);
      if(typeof value.hint==='function') {
        try { const text=value.hint(); if(typeof text==='string' && text.trim()) records.push({text,type:value.constructor.name,path}); }
        catch(error) { errors.push({path,error:String(error)}); }
      }
      for(const key of Object.keys(value)) {
        if(['parent','game','statistics','saveData','party'].includes(key)) continue;
        walk(value[key],path+'.'+key,depth+1);
      }
    }
    for(const [name,root] of Object.entries({TownList,dungeonList,ItemList,Routes:Routes.regionRoutes,pokemonList,TemporaryBattleList,achievements:AchievementHandler.achievementList})) walk(root,name);
    return {records,errors};
  });
  assert.deepEqual(data.errors,[]);
  assert.ok(data.records.length>10000,'the inventory must include requirements from every region');
  const {translate}=createTranslator(displayCatalog(readResources())), dom=new JSDOM(''), document=dom.window.document;
  const missing=[];
  for(const record of data.records) {
    if(translate(record.text)!==undefined) continue;
    const element=document.createElement('div'); element.innerHTML=record.text;
    const walker=document.createTreeWalker(element,dom.window.NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const text=walker.currentNode.nodeValue;
      if(/[A-Za-z]/.test(text) && translate(text)===undefined) missing.push(record);
    }
  }
  dom.window.close();
  assert.deepEqual([...new Map(missing.map(record=>[record.text,record])).values()],[],'all rendered requirement text must be covered');
  console.log(JSON.stringify({release:server.provenance.game.version,requirements:data.records.length,missing:missing.length,errors:data.errors},null,2));
} finally { await browser.close(); await server.close(); }
