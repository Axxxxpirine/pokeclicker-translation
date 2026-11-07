import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readResources,displayCatalog} from './resources.mjs';
import {createTranslator} from '../src/catalog.mjs';
import {JSDOM} from 'jsdom';
const inventory=JSON.parse(readFileSync('.verification/gameplay-inventory.json','utf8'));
const resources=readResources(), catalog=displayCatalog(resources), translator=createTranslator(catalog);
const en=resources.en.gameplay,fr=resources.fr.gameplay;
assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
assert.equal(catalog.invalid.filter(k=>k.startsWith('gameplay:')).length,0);
assert.equal(catalog.ambiguous.filter(v=>v.keys.some(k=>k.startsWith('gameplay:'))).length,0);
for(const [id,item]of Object.entries(inventory.items))assert.equal(en[`item.${id}.description`],item.description);
for(const kind of ['keyItems','oakItems'])inventory[kind].forEach((item,i)=>assert.equal(en[`${kind}.${i}.description`],item.description));
inventory.achievements.forEach((achievement,i)=>{assert.equal(en[`achievement.${i}.name`],achievement.name);assert.equal(en[`achievement.${i}.description`],achievement.description);});
inventory.berries.forEach(b=>b.description.forEach((text,i)=>assert.equal(en[`berry.${b.name}.${i}`],text)));
const document=new JSDOM('').window.document;
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const [id,text]of Object.entries(en)){
 assert.ok(fr[id]?.trim(),id);
 if(text.includes('{{'))continue;
 if(!/<[a-z/!]|&(?:\w+|#\d+);/i.test(text)){
  if(normalize(text)!==normalize(fr[id]))assert.equal(normalize(translator.translate(text)??''),normalize(fr[id]),id);
 }else{
  const a=document.createElement('template'),b=document.createElement('template');a.innerHTML=text;b.innerHTML=fr[id];
  const texts=node=>[...node.childNodes].flatMap(n=>n.nodeType===3?(n.nodeValue.trim()?[n.nodeValue]:[]):texts(n));
  const aa=texts(a.content),bb=texts(b.content);assert.equal(aa.length,bb.length,id);
  aa.forEach((v,i)=>{if(normalize(v)!==normalize(bb[i])&&normalize(v).length>=3)assert.equal(normalize(translator.translate(v)??''),normalize(bb[i]),`${id} text ${i}`);});
 }
}
const samples=[
 ['✨ You have captured a shiny Bulbasaur! ✨','✨ Vous avez capturé un Bulbizarre chromatique ! ✨'],
 ['Your Bulbasaur evolved into an Ivysaur!','Votre Bulbizarre a évolué en Herbizarre !'],
 ['Your Underground level has increased to 45!','Votre niveau des Souterrains est passé à 45 !'],
 ['You found a Cheri Berry!','Vous avez trouvé une Baie Ceriz !'],
 ['Checkpoint set for stage 50.','Point de contrôle défini à l’étage 50.'],
 ['Your Cell Battery has discharged with the move \'Hydro Cannon\'','Votre Pile s’est déchargée avec la capacité « Hydroblast »'],
];
for(const [a,b]of samples)assert.equal(translator.translate(a),b);
assert.equal(translator.translate('You have captured a user-defined personal name!'),undefined);
console.log(JSON.stringify({entries:Object.keys(en).length,items:Object.keys(inventory.items).length,achievements:inventory.achievements.length,berries:inventory.berries.length,notifications:Object.keys(en).filter(k=>k.startsWith('notification.')).length,invalid:0,ambiguities:0},null,2));
