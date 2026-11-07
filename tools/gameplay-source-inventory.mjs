import ts from '../../pokeclicker/node_modules/typescript/lib/typescript.js';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('.verification',{recursive:true});
const commit=JSON.parse(readFileSync('upstream/provenance.json')).game.commit;
const raw=execFileSync('git',['-C','../pokeclicker','show',`${commit}:docs/scripts/modules.min.js`],{maxBuffer:32*1024*1024,encoding:'utf8'});
const tree=ts.createSourceFile('modules.js',raw,ts.ScriptTarget.Latest,true);const modules=[];
function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(tree)==='eval'&&ts.isStringLiteral(n.arguments[0]))modules.push(n.arguments[0].text);ts.forEachChild(n,visit)}visit(tree);
writeFileSync('.verification/modules-readable.js',modules.join('\n'));
const records=[];for(const mod of modules){const t=ts.createSourceFile('mod.js',mod,ts.ScriptTarget.Latest,true);function walk(n){if(ts.isPropertyAssignment(n)&&['message','title'].includes(n.name.getText(t))){records.push({key:n.name.getText(t),text:ts.isStringLiteralLike(n.initializer)?n.initializer.text:n.initializer.getText(t),static:ts.isStringLiteralLike(n.initializer)});}ts.forEachChild(n,walk)}walk(t)}
writeFileSync('.verification/module-notifications.json',JSON.stringify(records,null,2));console.log(modules.length,records.length);
