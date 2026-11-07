import {serveRelease} from './game-server.mjs';
import {chromium} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('.verification',{recursive:true});
const server=await serveRelease(), browser=await chromium.launch({headless:true});
try {
const page=await browser.newPage();await page.goto(server.origin);await page.locator('#saveSelector .new-import-buttons label').first().click();await page.waitForFunction(()=>typeof App !== 'undefined' && App.game?.keyItems);
const data=await page.evaluate(()=>({
keyItems:App.game.keyItems.itemList.map(v=>({name:v.displayName,description:v.description})),
oakItems:App.game.oakItems.itemList.map(v=>({name:v.displayName,description:v.description})),
items:Object.fromEntries(Object.entries(ItemList).map(([k,v])=>[k,{name:v.displayName,description:v.description}])),
berries:BerryList.map(b=>({name:BerryType[b.type],description:b.description})),
achievements:AchievementHandler.achievementList.map(a=>({name:a.name,description:a.description,hint:a.hint})),
weather: Object.values(Weather.weatherConditions).map(w=>({description:w.description,tooltip:w.tooltip})),
secret: AchievementHandler.achievementList.slice(-28).map(a=>Object.fromEntries(Object.entries(a).filter(([k,v])=>typeof v==='string'))),
}));
writeFileSync('.verification/gameplay-inventory.json',JSON.stringify(data,null,2));console.log(Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Array.isArray(v)?v.length:Object.keys(v).length])));
}finally{await browser.close();await server.close()}
