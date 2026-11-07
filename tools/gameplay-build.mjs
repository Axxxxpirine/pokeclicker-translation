// Build-time expansion of the exact, finite gameplay vocabulary from the pinned release.
// Run gameplay-inventory.mjs first. No live game state is read or changed by this builder.
import {readFileSync,writeFileSync} from 'node:fs';
import notifications from './gameplay-notifications.mjs';
import {readResources,displayCatalog,root} from './resources.mjs';
import {resolve} from 'node:path';
const data=JSON.parse(readFileSync('.verification/gameplay-inventory.json','utf8'));
const resources=readResources(); delete resources.en.gameplay;delete resources.fr.gameplay;
const catalog=displayCatalog(resources), known=new Map(catalog.entries.filter(e=>!e.en.includes('{{')).map(e=>[e.en,e.fr]));
for(const values of Object.values(catalog.domains))for(const [a,b]of Object.entries(values))if(a!==b)known.set(a,b);
const out={en:{},fr:{}};const missing=[];
function add(key,en,fr){if(!fr){missing.push({key,en});return}out.en[key]=en;out.fr[key]=fr;}
const pairs=s=>Object.fromEntries(s.trim().split('\n').map(l=>l.split('|')));
const words=pairs(`Dungeon Tokens|Jetons de donjon
Farm Points|Points de ferme
Diamonds|Diamants
Great Balls|Super Balls
Ultra Balls|Hyper Balls
Master Balls|Master Balls
Poké Balls|Poké Balls
Pokédollars|Pokédollars
Vitamins|Vitamines
Mega Stones|Méga-Gemmes
Vitamin|Vitamine
Mega Stone|Méga-Gemme
Ultra Ball|Hyper Ball
Great Ball|Super Ball
Master Ball|Master Ball
Poké Ball|Poké Ball
Normal|Normal
Fire|Feu
Water|Eau
Electric|Électrik
Grass|Plante
Ice|Glace
Fighting|Combat
Poison|Poison
Ground|Sol
Flying|Vol
Psychic|Psy
Bug|Insecte
Rock|Roche
Ghost|Spectre
Dragon|Dragon
Dark|Ténèbres
Steel|Acier
Fairy|Fée
Unova|Unys
Sevii Islands|Îles Sevii
Magikarp Jump|Magicarpe Jump`);
const nameCache=new Map();
const nameEntries=[...known,...Object.entries(words)].filter(([k])=>k.length>=3&&k.length<75&&!/[.!?<>]/.test(k)).sort((a,b)=>b[0].length-a[0].length);
const nameLookup=new Map(nameEntries);
const namePattern=new RegExp('(?<![A-Za-z])('+nameEntries.map(([k])=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![A-Za-z])','g');
function name(s){
 if(nameCache.has(s))return nameCache.get(s);let m;
 if(m=s.match(/^(.+) in (Kanto|Johto|Hoenn|Sinnoh|Unova|Kalos|Alola|Galar|Sevii Islands|Magikarp Jump|Orre)$/))return `${name(m[1])} (${name(m[2])})`;
 if(m=s.match(/^(.*?)'s (.*?) Gym$/))return `l’arène de ${name(m[1])} à ${name(m[2])}`;
 if(m=s.match(/^(.*?)'s Grand Trial$/))return `la Grande Épreuve de ${name(m[1])}`;
 if(s==='Elite League')return 'Ligue Élite';
 if(m=s.match(/^(.+) Gym$/))return `l’arène de ${name(m[1])}`;
 if(m=s.match(/^Challenge (.+)$/))return `Défi ${name(m[1])}`;
 if(known.has(s))return known.get(s).replace(/^Challenge /,'Défi ');if(words[s])return words[s];
 const result=s.replace(namePattern,v=>nameLookup.get(v));nameCache.set(s,result);return result;}
const item=pairs(`A television set that is tuned to a program with useful tips for novice TRAINERS.|Une télévision diffusant une émission pleine de conseils utiles aux Dresseurs débutants.
A case for holding Pokédollars.|Une boîte pour ranger les Pokédollars.
A small bag that can hold many different types of Poké Balls.|Un petit sac pouvant contenir de nombreux types de Poké Balls.
A very convenient map that can be viewed anytime. It even shows you your present location in the region.|Une carte très pratique consultable à tout moment. Elle indique même votre position actuelle dans la région.
The best fishing rod for catching wild water Pokémon.|La meilleure canne pour attraper les Pokémon aquatiques sauvages.
A device that allows users to see and track Achievements. Completing Achievements gives useful bonuses.|Un appareil permettant de consulter et de suivre les succès. Les accomplir accorde des bonus utiles.
A mysterious Egg obtained from Mr. Pokémon. This allows you to use the Pokémon Day Care to help improve your Pokémon Attack. Some baby Pokémon can only be found through breeding, too!|Un Œuf mystérieux obtenu auprès de M. Pokémon. Il vous permet d’utiliser la Pension pour améliorer l’attaque de vos Pokémon. Certains bébés Pokémon ne peuvent être obtenus que par reproduction !
This ticket grants access to the Safari Zone right outside Fuchsia City.|Ce ticket donne accès au Parc Safari situé près de Parmanie.
This is a tool for watering Berries to allow you to operate the farm.|Un outil pour arroser les Baies et vous occuper de la ferme.
A case specifically designed for holding gems.|Une boîte spécialement conçue pour ranger les gemmes.
A splicer that fuses certain Pokémon.|Un appareil permettant de fusionner certains Pokémon.
Reins that people presented to the king. They enhance Calyrex’s power over bountiful harvests and unite Calyrex with its beloved steeds.|Des rênes offertes au roi par ses sujets. Elles renforcent le pouvoir de Sylveroy sur les récoltes et l’unissent à ses fidèles destriers.
A virus sample collected from your starter Pokémon. Infect more Pokémon in the hatchery, and use the new Pokérus Poké Ball option to focus catching Contagious pokemon for a damage boost.|Un échantillon de virus prélevé sur votre Pokémon de départ. Contaminez d’autres Pokémon à la Pension et utilisez le filtre Pokérus des Poké Balls pour cibler les Pokémon contagieux et améliorer leurs dégâts.
Gives a bonus to your catchrate|Améliore votre taux de capture
Gain more Pokédollars from battling|Augmente les Pokédollars gagnés au combat
Clicks do more damage|Augmente les dégâts des clics
Gain more exp from battling|Augmente l’expérience gagnée au combat
Makes your berries grow faster|Accélère la croissance de vos Baies
Encounter shinies more often|Augmente la fréquence des rencontres avec des chromatiques
Hatch eggs faster|Accélère l’éclosion des Œufs
Increase the rate of charging the battery|Accélère la recharge de la batterie
Increases the chance of berry mutations|Augmente les chances de mutation des Baies
Increases the duration of Mulch|Augmente la durée des fertilisants
Increases the number of tiles the Bomb tool can target|Augmente le nombre de cases que la bombe peut cibler
Chance to multiply mining rewards|Chance de multiplier les récompenses d’excavation
+50% Bonus to Pokémon attack for 30 seconds|+50 % d’attaque des Pokémon pendant 30 secondes
+50% Bonus to click attack for 30 seconds|+50 % d’attaque par clic pendant 30 secondes
+50% Bonus to experience gained for 30 seconds|+50 % d’expérience gagnée pendant 30 secondes
+50% Bonus to Dungeon Tokens gained for 30 seconds|+50 % de jetons de donjon gagnés pendant 30 secondes
+50% Bonus to Pokédollars gained for 30 seconds|+50 % de Pokédollars gagnés pendant 30 secondes
Increases chance for Pokémon to drop rare hold items and chance to multiply loot from dungeon chests, for 30 seconds.|Augmente les chances que les Pokémon lâchent des objets tenus rares et que le butin des coffres de donjon soit multiplié, pendant 30 secondes.
Restores Expert Energy in the Underground.|Restaure l’énergie des experts des Souterrains.
This ticket grants access to all dungeons in the Kanto region and beyond.<br/><strong>Tip:</strong> You gain Dungeon Tokens by capturing Pokémon.|Ce ticket donne accès à tous les donjons de Kanto et des régions suivantes.<br/><strong>Astuce :</strong> Vous gagnez des jetons de donjon en capturant des Pokémon.
A bag filled with convenient tools for exploring. It provides access to the Underground.|Un sac rempli d’outils pratiques pour l’exploration. Il donne accès aux Souterrains.
This calendar will keep you up to date on the latest events and let you start events early.|Ce calendrier vous informe des événements et vous permet de les commencer en avance.
Purchase to unlock this Oak Item|Achetez cet objet pour débloquer cet objet du Professeur Chen
Pokémon Attack|Attaque des Pokémon
Click Attack|Attaque par clic
Battle Timers and Flow Gained|Durée des combats et flux gagné
Egg Steps|Pas d’éclosion
Shiny Chance|Chance de chromatique
EV Yield|Gain d’EV
Increases Berry growth rate.|Accélère la croissance des Baies.
Increases Berry harvest rate and replant chances.|Augmente le rendement des Baies et les chances de replantation.
Increases Berry mutation rate.|Augmente les chances de mutation des Baies.
A weaker combination of Boost, Rich and Surprise mulch.|Une combinaison moins puissante des Fertilisants Boost, Fertile et Surprise.
Stops Berry growth and auras. Mutations will still occur while berries are frozen.|Arrête la croissance et les auras des Baies. Les mutations restent possibles lorsque les Baies sont gelées.
Helps attract rarer species. Gooed Pokémon are more likely to be caught.|Aide à attirer des espèces plus rares. Les Pokémon englués sont plus faciles à capturer.
A ball for catching Pokémon.|Une Ball permettant de capturer des Pokémon.
Removes Berry Plants in the Farm.|Retire les plants de Baies de la ferme.
Removes Mulch from a plot in the Farm.|Retire le fertilisant d’une parcelle de la ferme.
Unobtainable item for future uses|Objet indisponible, réservé à un usage futur
An egg. Can be hatched in the Day Care.|Un Œuf que vous pouvez faire éclore à la Pension.
A Meteorite the Game Corner owner gave you for find his daughter|Une Météorite offerte par le propriétaire du Casino pour avoir retrouvé sa fille
A Bell that can summon the Legendary Pokémon Lugia|Une cloche capable d’invoquer le Pokémon légendaire Lugia
A Bell that can summon the Legendary Pokémon Ho-oh|Une cloche capable d’invoquer le Pokémon légendaire Ho-Oh
A Strange Pokéball that Professor Ivy gave you|Une étrange Poké Ball offerte par le Professeur Flora
A limited edition ticket for a cruise to the Southern Island.|Un billet en édition limitée pour une croisière vers l’Île du Sud.
A Ruby found in Ruby Path|Un Rubis trouvé dans la Voie du Rubis
A Sapphire you've recovered from Scientist Gideon|Un Saphir récupéré auprès du Scientifique Gédéon
A Purple Crystal that Butler gave you at Mt. Chimney Crater|Un cristal violet offert par Butler au cratère du Mont Chimnée
A Shard of a Meteorite|Un fragment de Météorite
An Aipom dropped this while running away, I wonder what it is?|Un Capumain a laissé tomber cet objet en s’enfuyant. Qu’est-ce que cela peut être ?
The energy core of the Diamond domain|Le cœur énergétique du Domaine du Diamant
One of the materials Dr. Splash asked you for his laboratory|Un des matériaux demandés par le Dr Splash pour son laboratoire
One of the pushing Pokémons Dr. Splash asked you for his laboratory|Un des Pokémon pousseurs demandés par le Dr Splash pour son laboratoire
A magical bottle used to bind Hoopa|Une bouteille magique utilisée pour sceller Hoopa
A symbol that denotes your pilgramige on the Island Challenge of Alola. Stronger Trials await you with this in your bag!|Un symbole de votre participation au Tour des Îles d’Alola. Des épreuves plus difficiles vous attendent avec cet objet dans votre sac !
A Mushroom that contains the power of Dynamax forms|Un champignon contenant la puissance du Dynamax
Carrot that the King of Bountiful Harvest's beloved steed likes to eat. It grew in a gloomy field.|Une carotte dont raffole le fidèle destrier du Seigneur des récoltes. Elle a poussé dans un champ sombre.
Carrot that the King of Bountiful Harvest's beloved steed likes to eat. It grew in a field covered in snow.|Une carotte dont raffole le fidèle destrier du Seigneur des récoltes. Elle a poussé dans un champ enneigé.
Attracts Gigantamax Pokémon to the Max Lair|Attire les Pokémon Gigamax dans le Grand Antre Dynamax
A permit granting access to the exclusive Berry Shop in Cerulean City.|Un permis donnant accès à la boutique de Baies exclusive d’Azuria.
Increases Pokémon attack bonus.<br/><i>(attack gained per breeding cycle)</i><br/>Increases steps required when hatching by 20|Augmente le bonus d’attaque des Pokémon.<br/><i>(attaque gagnée à chaque cycle de reproduction)</i><br/>Augmente de 20 le nombre de pas nécessaires à l’éclosion
Increases Pokémon attack bonus %.<br/><i>(attack gained per breeding cycle)</i><br/>Increases steps required when hatching by 20|Augmente le pourcentage de bonus d’attaque des Pokémon.<br/><i>(attaque gagnée à chaque cycle de reproduction)</i><br/>Augmente de 20 le nombre de pas nécessaires à l’éclosion
Reduces steps required when hatching|Réduit le nombre de pas nécessaires à l’éclosion
Raises the level of a Pokémon and permanently increases its attack|Augmente le niveau d’un Pokémon et améliore définitivement son attaque
Strengthen your Magikarp|Renforce votre Magicarpe
A lovely Christmas present you opened.|Un joli cadeau de Noël que vous avez ouvert.
A gold coin used by pirates.|Une pièce d’or utilisée par les pirates.
A proof you've bought the most expensive Pirate Goods today.|Une preuve d’achat de la marchandise pirate la plus chère aujourd’hui.
An evolution item. See your Item Bag for more information.|Un objet d’évolution. Consultez votre Sac pour plus d’informations.
Stops the holder from evolving due to level or a stone being used. Also prevents new baby Pokémon from hatching.|Empêche le porteur d’évoluer par montée de niveau ou avec une pierre. Empêche également l’éclosion de nouveaux bébés Pokémon.
A held item that lowers the attack of the Pokémon by 50% and raises its click attack contribution by 100%.|Un objet tenu qui réduit l’attaque du Pokémon de 50 % et augmente sa contribution à l’attaque par clic de 100 %.
A held item that raises the attack of the Pokémon by 100% and lowers its click attack contribution by 50%.|Un objet tenu qui augmente l’attaque du Pokémon de 100 % et réduit sa contribution à l’attaque par clic de 50 %.
A held item that raises the attack of the Pokémon by 40% in the Battle Frontier.|Un objet tenu qui augmente l’attaque du Pokémon de 40 % dans la Zone de Combat.`);
function itemDescription(s){let m;if(known.has(s))return known.get(s);if(item[s])return item[s];
if(m=s.match(/^Add (.+) to your party\.$/))return `Ajoute ${name(m[1])} à votre équipe.`;
if(m=s.match(/^A Mega Stone for (.+)\.$/))return `Une Méga-Gemme pour ${name(m[1])}.`;
if(m=s.match(/^Obtain a (.+)<br\/><i>\(No Oak Item challenge runs only\)<\/i>$/))return `Obtenez une Baie ${name(m[1])}<br/><i>(Uniquement pour le défi sans objets du Professeur Chen)</i>`;
if(m=s.match(/^Allows (.+)-type Pokémon to use Z-Moves for the next battle\. They then need to rest a bit\.$/))return `Permet aux Pokémon de type ${name(m[1])} d’utiliser des capacités Z au prochain combat. Ils doivent ensuite se reposer un peu.`;
if(m=s.match(/^A held item that raises the attack of an? (.+)-type Pokémon by (\d+)%\.$/))return `Un objet tenu qui augmente l’attaque d’un Pokémon de type ${name(m[1])} de ${m[2]} %.`;
if(m=s.match(/^A held item that raises the attack of (.+) by (\d+)%\.$/))return `Un objet tenu qui augmente l’attaque de ${name(m[1]).replace('the Pokémon','ce Pokémon').replace(' or ',' ou ').replace('Pirate Pokémon','Pokémon pirates').replace('Paradox Pokémon','Pokémon Paradoxe')} de ${m[2]} %.`;
if(m=s.match(/^A held item that earns the holding (Shadow or Purified )?Pokémon (\d+)% bonus Experience Points\.$/))return `Un objet tenu qui augmente de ${m[2]} % l’expérience gagnée par le Pokémon ${m[1]?'Obscur ou Purifié ':''}qui le porte.`;
if(m=s.match(/^A held item that increases EV gains for the holding Pokémon by (\d+)%\.$/))return `Un objet tenu qui augmente de ${m[1]} % les EV gagnés par le Pokémon qui le porte.`;
if(m=s.match(/^(.+) dug out from the Underground\.$/))return `${name(m[1])} trouvé dans les Souterrains.`;
if(m=s.match(/^One of the Petals you need for Mina's trial given by (.+)$/))return `Un des pétales nécessaires à l’épreuve d’Oléa, offert par ${name(m[1])}`;
if(m=s.match(/^One of Silvally's memories, obtained from (.+) in (.+)$/))return `Une des ROM de Silvalli, obtenue auprès de ${name(m[1])} à ${name(m[2])}`;
if(m=s.match(/^One of Silvally's memories, obtained from (.+) on (.+)$/))return `Une des ROM de Silvalli, obtenue auprès de ${name(m[1])} à ${name(m[2])}`;
if(s.startsWith('Cost: '))return s.replace('Cost: ','Coût : ').replace('/hour','/heure').replace('/hatch','/éclosion').replace('Work Speed:','Vitesse de travail :').replace('Max Energy:','Énergie maximale :').replace('Step Efficiency:','Efficacité des pas :').replace('Attack Efficiency:','Efficacité d’attaque :').replace('Efficiency:','Efficacité :');
return known.get(s);}
for(const kind of ['keyItems','oakItems'])data[kind].forEach((v,i)=>add(`${kind}.${i}.description`,v.description,itemDescription(v.description)));
for(const [id,v]of Object.entries(data.items))add(`item.${id}.description`,v.description,itemDescription(v.description));
const berryFR=`Cette Baie rouge vif est très épicée et possède une saveur intense. Ses fleurs sont délicates et jolies.
La peau épaisse et la chair de cette Baie sont très dures et sèches en bouche. Elle est néanmoins entièrement comestible.
L’intérieur creux de cette Baie laisse peu de chair à manger. Celle-ci est toutefois très sucrée et délicieuse.
Si ses feuilles deviennent plus longues et plus frisées que la moyenne, cette Baie aura un goût plutôt amer.
La peau de cette Baie est dure, mais sa chair est très juteuse. Elle se distingue par son acidité vivifiante.
Elle met plus de temps à pousser que les Baies comme la Ceriz. Les plus petites sont les meilleures.
Les dons de la nature se réunissent dans cette Baie. Elle offre un merveilleux mélange de saveurs qui se répandent en bouche.
La Baie Sitrus appartient à la même famille que la Baie Oran. Elle est plus grosse et son goût est plus doux.
Plus cette Baie absorbe l’énergie du soleil, plus ses couleurs deviennent vives.
Les grains rouges qui entourent cette Baie sont légèrement épicés. Leur cœur possède une saveur sèche.
Malgré sa couleur bleue, cette petite Baie à la peau délicate colore la bouche en noir lorsqu’on la mange.
Amère avec une pointe de douceur, la Baie Nanab est la septième Baie à avoir été découverte au monde.
Le mélange prononcé d’amertume et d’acidité de cette Baie semble faciliter la digestion. Sa fleur est blanche et magnifique.
On raconte qu’une fois sa peau acide retirée, cette Baie épicée peut être écrasée pour fabriquer un remède.
Cette Baie a une forme étrange, comme si quelqu’un en avait croqué un morceau. Elle regorge de substances épicées.
On raconte que cette Baie a développé des bosses pour que les Pokémon puissent la saisir et la disperser plus loin.
Cette Baie se courbe progressivement en grandissant. Plus elle est courbée, plus elle est sucrée et savoureuse.
Cette Baie devient amère près de sa tige. La petite fleur dont elle est issue absorbe peu de soleil.
Cette Baie est très grosse et acide. Sa pulpe juteuse renforce son acidité.
Cette Baie mûrit lentement, car elle accumule progressivement des nutriments bénéfiques à la santé des Pokémon.|Cette Baie multiplie les effets des plants de Baies voisins.
Lorsqu’on pèle l’épaisse peau de cette Baie douce et épicée, de nombreux morceaux de fruit s’en échappent.
Cette Baie se mange telle quelle ou se fait bouillir pour obtenir un extrait qui relève les plats.
Même dans les régions très humides où la pluie est constante, ce plant de Baie pousse vigoureusement.
Cette Baie assez rare évoque le luxe. Elle est donc très appréciée comme cadeau.
Une seule bouchée de cette Baie très tendre emplit la bouche de sa saveur douce et acidulée.
Cette Baie est grosse et épicée. Consommée pendant la saison froide, elle réchauffe le corps de l’intérieur.
Sa saveur sèche est très prononcée. Il faut en manger plus d’une ou deux pour apprécier toute sa finesse.
La saveur raffinée et la douceur de rêve de cette Baie en font la favorite des Pokémon du monde entier.
Malgré son amertume, il faut la manger avec sa peau. Les poils qui la recouvrent nettoient l’estomac de l’intérieur.
Cette Baie est assez acide dans son ensemble, particulièrement au niveau de son extrémité pointue.
La Baie Kiwan est si épicée que même les Pokémon qui ne sont pas de type Feu essaient de cracher des flammes après en avoir mangé une.
Cette Baie a dérivé depuis une mer lointaine. Elle est désormais cultivée à Sinnoh.|Elle a tendance à s’étendre aux parcelles voisines.
Un cadeau de la nature extrêmement sucré. Cette Baie est immense : certains spécimens dépassent 50 cm.
Cette Baie est terriblement amère. Une seule bouchée suffit à faire disparaître instantanément le hoquet.
Cette Baie brillante et colorée paraît délicieuse. Elle est pourtant horriblement acide.
Cette Baie endémique de l’Île Pinkan est incroyablement sucrée.|Son pigment rose vif et son abondance sur l’Île Pinkan expliquent pourquoi tous les Pokémon de l’île sont roses !
On raconte que cette Baie poussait autrefois en abondance sous les tropiques. Sa saveur est intensément brûlante et épicée.|Elle a tendance à envahir les plants voisins.
La chair de cette Baie est parsemée d’innombrables petites bulles d’air qui la font flotter.|Cette Baie favorise la fructification des plants de Baies voisins.
L’énergie de la foudre est absorbée par le plant, donnant des Baies grosses et riches.|Cette énergie stimule aussi la croissance des Baies voisines.
Cette Baie a une odeur et une saveur végétales peu agréables. Elle est riche en fibres bénéfiques à la santé.|Elle a tendance à s’étendre aux parcelles voisines, mais attire les Pokémon qui tiennent des objets.
Cette Baie rafraîchissante équilibre saveur sèche et acidité. Elle est meilleure fraîche.|Cette Baie ralentit le dépérissement des Baies voisines.
Cette Baie contient une substance qui produit de la chaleur. Elle peut même réchauffer un cœur glacé.|Cultiver ces Baies accélère le développement des Œufs.
Cette Baie est d’un vert éclatant à l’extérieur. Sa chair noire possède une saveur sèche.|Elle a tendance à envahir les plants voisins.|Sa nature toxique augmente les chances de mutation à proximité.
Sa pulpe très sucrée offre une légère note ferme et parfumée.|Ce plant assouplit le sol environnant, ce qui augmente les chances de replantation.
On raconte que cette nouvelle Baie est issue du croisement de deux Baies réunies par des vents venus de loin.
Cette Baie semble ressentir les émotions humaines, car elle se gonfle lorsqu’une personne approche.|Cette réaction affecte également les plants voisins et provoque des mutations supplémentaires.
La fleur pousse au bout de cette Baie. Ses pétales filiformes déployés attirent les Pokémon Insecte.|Les Pokémon Insecte attirés réduisent la quantité de Baies récoltables sur les plants voisins.
Sa saveur très sèche en fait un ingrédient apprécié pour les conserves. On peut aussi la manger crue pour son goût intense.|Ce plant durcit le sol environnant, ce qui réduit les chances de replantation.
Réputée posséder un pouvoir particulier depuis l’Antiquité, cette Baie est parfois séchée pour servir de porte-bonheur.|Cette Baie accélère le flétrissement des Baies voisines.
En faisant réduire une quantité suffisante de cette Baie, son amertume disparaît. Elle donne une bonne confiture.|Cette Baie consomme beaucoup d’énergie pour pousser, mais elle est peu exigeante. Elle aide les autres plants en retirant les toxines du sol.
De minuscules crochets poussent à la surface de cette Baie. Ils s’accrochent aux Pokémon qui la transportent au loin.|Elle a tendance à envahir les plants voisins.|Elle empêche également les Baies Sédra de muter.
Cette Baie très dure a un goût prononcé. On s’en servait autrefois pour fabriquer des remèdes.|Ce plant très robuste résiste aux mutations et réduit également les chances de mutation autour de lui.
On peut évider et sécher cette Baie pour en faire un sifflet. Souffler dans son trou produit un son indescriptible.
Cette Baie douce, légèrement amère, dégage un parfum sucré persistant. Elle est souvent séchée pour préparer du thé.|Le parfum de ce plant de Baie attire les Pokémon sauvages.
Cette Baie pousse autour de la taille de certains Blizzi.
Cette Baie a une saveur très sèche. Elle donne un goût sucré aux aliments consommés en même temps.|Le parfum de ce plant de Baie repousse les Pokémon sauvages.
Sous la peau coriace de la Baie Chérim se cache une chair douce, sucrée et crémeuse.|Cela incite les Pokémon à s’entraîner davantage.
Les petites drupes qui composent cette Baie éclatent en rythme lorsqu’on la manipule brusquement.|Le bruit de ces Baies attire des Pokémon sauvages rares.
Autrefois, on détachait les morceaux de cette Baie en forme de toupie pour en faire des jouets.|Ces Baies rendent les efforts de capture plus profitables.
Cette Baie reste toxique jusqu’à sa pleine maturité. Une fois mûre, elle offre un goût complexe, épicé et sucré.
Cette Baie ressemble à la Baie Durin, mais ses pointes sont moins marquées. Elle est délicieuse une fois rôtie.
Cette Baie est entourée de mystère. On raconte qu’elle renferme la puissance de la mer.
Cette Baie est entourée de mystère. On raconte qu’elle renferme la puissance de la terre.
Cette Baie est entourée de mystère. On raconte qu’elle renferme la puissance du ciel.
Cette Baie est entourée de mystère. On raconte qu’elle renferme la puissance de tous les êtres vivants.|Ce pouvoir revitalise les autres Baies et les empêche de flétrir.
Cette Baie est extrêmement mystérieuse. On ignore comment l’utiliser et ce qui se produirait si on le faisait.
On dit que cette Baie est légendaire. La tenir apporterait une grande joie.
Cette Baie passe pour un mirage. On raconte que sa puissance était telle qu’il a fallu l’abandonner au bout du monde.
Une Baie totalement énigmatique. Elle semble posséder la puissance des étoiles qui illuminent le ciel nocturne.
Une Baie véritablement mythique, originaire des rudes terres du Nord. Elle aurait été créée par un Pokémon qui aurait façonné le monde.`.split('\n').map(s=>s.split('|'));
if(berryFR.length!==data.berries.length)throw Error('Berry count mismatch');
data.berries.forEach((b,i)=>{if(b.description.length!==berryFR[i].length)throw Error('Berry structure '+b.name);b.description.forEach((s,j)=>add(`berry.${b.name}.${j}`,s,berryFR[i][j]));});
const earlyTitles=`Mes cent premiers
Je devrais acheter une Boutique Pokémon
Une petite fortune
Un salaire annuel
Pff, pas besoin d’un bon de commande vélo
Un milliard de Pokécentimes
Prêt pour la retraite
Je devrais aller dans l’espace…
L’heure du donjon
Collecteur de jetons
Habitué des donjons
Maître des donjons
Légende des donjons
Mythe des donjons
Dieu des donjons
Maître de la ferme
Légende de la ferme
Mythe de la ferme
Premiers pas
Mieux que Sacha dans la saison 1
Merveilleux ! Vous aimez collectionner ?
Dépasser Sacha
De quoi ouvrir un zoo
Le PC va être plein
Je préfère briller
Ces Pokémon doivent être malades
Pourquoi je fais ça ?
Pourquoi je continue ?!
Bon, encore quelques-uns
Où sont passés tous les chromatiques ?
Ah, j’en ai retrouvé
Nage droit devant toi… Oh, un chromatique !
Je ne sais pas si je supporterai la prochaine fournée
Il va falloir des lunettes de soleil
C’était quoi, les probabilités déjà ?
Les non-chromatiques deviennent rares
Première équipe
Remplir le PC
Une armée de Pokémon
Collectionneur de Pokémon
Un Pokémon pour vous, un pour vous… pour tout le monde !
La route sera longue
Autoroute vers Bourg Palette
Surentraîné
Le gâteau est un mensonge, mais l’entraînement est bien réel
Il en reste encore ?
Dresseur débutant
En progrès
Une force implacable
FUS RO DAH
Bon, j’ai déjà assez d’attaque…
Le bouton d’attaque d’argent !
Ces fichus Pokémon errants… Il faut tout battre en un coup
Vous n’auriez pas appuyé sur F12 ?
Gauche-gauche-droite-droite-A-B-A-B… Un million !
Je peux enfin battre Dianthéa ?
Personne ne peut me défier !
Quelques clics plus tard
Pro du clic
Ultra-cliqueur
Il vous faut déjà une nouvelle souris ?
Pourquoi mon Voltorbe est à l’envers ?
Le début d’une collection
Faire des réserves
Stock au complet
Encore quelques-unes pour le bunker
Un bunker rempli de Poké Balls !
Oh, une bleue !
J’ai trouvé des Voltorbe chromatiques ! Ah, non…
Les chromatiques ne s’enfuiront plus si facilement !
Les Poké Balls ordinaires ne sont plus ce qu’elles étaient
Un super investissement
La plus grande des collections
Ils en ont fait une encore meilleure ?
Voyons jusqu’où peut monter le taux de capture
De quoi attraper ces insaisissables Pokémon errants…
Elles ne marchent pas sur les Ultra-Chimères ? Publicité mensongère !
Impossible de revenir aux modestes Super Balls
Juste pour qu’aucun Pokémon rare ne s’enfuie
L’outil de capture ultime
Les légendaires détestent ce type
Plus aucun Pokémon ne peut m’échapper !
Vous pouvez faire ça pour moi ?
Encore un service
TOUJOURS OUI !
J’adore les pièces vertes
Je veux être prêt pour la prochaine région
Oh, un nouvel emplacement de quête !
Je deviens doué pour les quêtes !
Qu’est-ce que j’y gagne en montant de niveau ?
Maître des quêtes
C’est comme ça que ça marche ?
J’ai déjà les mains pleines
Le Professeur Chen est le meilleur !
Presque prêt à tout
Prêt à tout !
Crèche Pokémon
Beaucoup de course à pied
Marathonien
Usine à Œufs
Lapin de Pâques officiel
Que faites-vous de toutes ces coquilles ?
La Pension, c’est chez moi
Une aide précieuse à la Pension
Pourquoi doivent-ils travailler par roulement ?
Mes fidèles assistants
Et si on essayait d’autres assistants ?
Sam veut seulement aider
À quand votre propre reproduction ?
Mon nouveau loisir salissant
Jardinier amateur
Horticulture
Qui a planté ça ici ?
Fermier en formation
Apprenti fermier
Maître fermier
Un coup de main à la ferme
Bâtir un empire agricole
Ai-je vraiment besoin de tant d’aide ?
Ça brille
Ça brille dix fois plus !
Si ça vous plaît, passez-lui la bague au doigt
Continuez les échanges !
Prenez un peu le soleil !
J’ai déjà la main verte ?
Ma pelle commence à se fissurer
Pourquoi pas une pelle en diamant ?
Ce n’est décidément pas Minecraft
Que peut-il bien y avoir là-dessous…
La Terre, c’est comme les oignons
Ça prend une éternitéééé
Dig Dug n’a rien à m’apprendre
Mes deux mains sont vertes ! Ce n’est pas normal
Eh bien, c’est facile
Vers l’infini et au-delà
Juste une dernière chose
Choisissez-en un
Une honnête journée de travail
Vous avez un préféré ?
Je les aime tous autant
Tous les jours, je burine
Impossible à toucher
BOUM !
Œil de lynx
Bon, je vais le faire moi-même
Essayons ça
Compléments avant l’entraînement
Une armoire à pharmacie bien remplie
Je ne peux plus porter toutes ces vitamines !
Nutriments essentiels
Des achats en gros pour de gros muscles
Réserve de vitamines
Poisson, œufs, noix et fromage
Cette poudre existe en plusieurs parfums ?
Une véritable montagne de muscles
Combattant novice
Combattant compétent
Machine de combat inarrêtable
Légende vivante
Où trouvent-ils ces Dresseurs ?
Continuez le combat
Un combat difficile
Ne baissez pas les bras
Il me faut plus de Points de Combat
Cette fois, je peux le faire !
Roi de la colline
J’espère que ce n’est pas dangereux
On peut s’en débarrasser ?
C’est la saison de la grippe
Où est l’infirmière Joëlle ?
Contaminer le monde entier
Les soigner un par un
Habitué du Centre Pokémon
Médecin en formation
Je devrais ouvrir mon propre Centre Pokémon
À l’ombre des géants
Des Pokémon bien obscurs ! Vous voulez les vendre ?
Maintenant, allez les purifier !
Sans l’ombre d’un doute
Équipe de nettoyage
Presque assez propre pour briller
Prêtre en formation
Main de lumière
Qui a laissé tomber ça ici ?
Moins cher que de l’acheter
Le Cherch’Objet peut aller se rhabiller !
Ce n’est pas une Poké Ball !
Vous êtes vraiment méchant !
Pourquoi êtes-vous comme ça ?
J’espère qu’il aime les Baies
De quoi sont faits les « appâts » ?
Restez dîner
Il faut faire vos pas !
Encore un tour
Marathonien 2
Où est Scarabrute ?
À la poursuite de Leveinard
Amateur d’animations de capture
Continuez à lancer des Balls
Lanceur stratège
Maître du Safari
Les chromatiques coûtent plus cher ?
Quelle jolie pierre !
Allez, allez, Méga Force !
Vous auriez d’autres Méga-Gemmes ?`.split('\n');
if(earlyTitles.length!==205)throw Error('Early title count '+earlyTitles.length);
const titles=pairs(`Alphabet Soup for Ruin Maniac|Soupe alphabet pour le Ruinemaniac
"I am the Alpha and the Omega"|« Je suis l’Alpha et l’Oméga »
Moomoo Milk Served Right|Un Lait Meumeu bien servi
Gotta Taste 'Em All!|Goûtez-les tous !
Yoshida's Coffees Enjoyer|Amateur des cafés de Yoshida
All These Flavors And You Choose To Be Cheesy|Tant de saveurs, et vous en faites tout un fromage
Way Too Many Bosses|Beaucoup trop de boss
Really Big Sparkle|Un éclat gigantesque
Do You Even Splash?|Vous savez faire Trempette ?
Twenty Thousands Karps Under the Seas|Vingt mille Magicarpe sous les mers
On The Nice List|Sur la liste des enfants sages
The Pirate King|Le roi des pirates
The Kids Yearn for the Mines|Les enfants rêvent de la mine
Take Out The Trash|Sortez les poubelles
Rats!|Des rats !
Karpal Tunnel|Canal carpien
You Can Stop Now|Vous pouvez arrêter maintenant
You are my best friend|Tu es mon meilleur ami
Smell Ya Later!|À la revoyure !
Aren't Dungeons Fun?|C’est amusant, les donjons, non ?
Super Spreader|Super-contaminateur
Error: Pokémon storage full|Erreur : stockage Pokémon plein
Ready For The Next Region|Prêt pour la prochaine région
Touch Grass|Allez prendre l’air
Park Ranger|Garde du parc
How did we get here?|Comment en est-on arrivé là ?
Ready for every encounter|Prêt à toute rencontre
I can do this all day|Je peux faire ça toute la journée
All I see is rock|Je ne vois que de la roche
Have you tried lemongrass?|Vous avez essayé la citronnelle ?
There is no bottle|Il n’y a pas de bouteille
One-person band|Homme-orchestre
A cat named Cat|Un chat nommé Chat
Picky Quester|Aventurier difficile
Lucky Loot|Butin chanceux
Wandering Wallets|Portefeuilles ambulants
Ultimate Baker|Pâtissier ultime
One column to rule them all|Une colonne pour les gouverner toutes
Window Shopping|Lèche-vitrine
A Glimmer of Luck|Une lueur de chance`);
const role=pairs(`Traveler|Voyageur
Explorer|Explorateur
Conqueror|Conquérant
Regular|Habitué
Ruler|Souverain
Owner|Propriétaire
Expert|Expert
Hermit|Ermite
Dweller|Résident
Trainer|Dresseur
Ace|As
Master|Maître
Doctor|Médecin`);
const titleGroups=pairs(`Clone|Clones
Spooky|Halloween
Partner|Partenaires
Christmas|Noël
Pattern|Motifs
Rumor|Rumeurs
Egghunt|Chasse aux Œufs
Blossom|Floraison
Party|Fête
Pirate|Pirates`);
function achievementTitle(a,i){if(i<205)return earlyTitles[i];if(titles[a.name])return titles[a.name];
 const m=a.name.match(/^(.*?)( Shiny)? (Traveler|Explorer|Conqueror|Regular|Ruler|Owner|Expert|Hermit|Dweller|Trainer|Ace|Master|Doctor)$/);
 if(m)return `${role[m[3]]}${m[2]?' chromatique':''} — ${titleGroups[m[1]]??name(m[1])}`;
 return known.get(a.name);}
const descriptions=pairs(`Capture your first Pokémon.|Capturez votre premier Pokémon.
Capture your first Shiny Pokémon.|Capturez votre premier Pokémon chromatique.
Capture your first Shadow Pokémon|Capturez votre premier Pokémon Obscur
Purify your first Shadow Pokémon|Purifiez votre premier Pokémon Obscur
Complete your first quest.|Terminez votre première quête.
Hatch your first egg.|Faites éclore votre premier Œuf.
Dig up an item in the Underground for the first time.|Déterrez votre premier objet dans les Souterrains.
Dig deeper into the Underground for the first time.|Creusez plus profondément dans les Souterrains pour la première fois.
Catch a Shiny Pokémon in a Safari Zone|Capturez un Pokémon chromatique dans une Zone Safari
Collect Christmas Presents up to the maximum once|Atteignez une fois le nombre maximal de cadeaux de Noël
Collect one Pirate Receipt|Obtenez un Reçu Pirate
Fully mine an Underground layer.|Excavez entièrement une couche des Souterrains.
Capture a total of 1,000 wild Trubbish and Garbodor.|Capturez un total de 1 000 Miamiasme et Miasmax sauvages.
Defeated Youngster Joey.|Battez le Gamin Joey.
Reach 1,000,000 attack with Magikarp.|Atteignez 1 000 000 d’attaque avec Magicarpe.
Acquire 1,000 Wishing Pieces.|Obtenez 1 000 Morceaux Vœu.
Have a total of 100 Light Balls.|Possédez un total de 100 Balles Lumière.
Defeat Champion Blue 123,456 times.|Battez le Maître Blue 123 456 fois.
Clear any dungeon 10,000 times.|Terminez un même donjon 10 000 fois.
Reach a 2x EV bonus with any Pokémon.|Atteignez un bonus d’EV de 2× avec un Pokémon.
Reach a 3x EV bonus with any Pokémon.|Atteignez un bonus d’EV de 3× avec un Pokémon.
Have the game open for an entire year.|Gardez le jeu ouvert pendant une année entière.
Reach the max Safari level.|Atteignez le niveau maximal du Safari.
Have 9 Special Events active simultaneously.|Activez 9 événements spéciaux en même temps.
Have at least 20 Pokéball Filters at one time.|Possédez au moins 20 filtres de Poké Balls simultanément.
Get at least 1 Underground Helper to level 100.|Amenez au moins un assistant des Souterrains au niveau 100.
Defeat 1,000,000 pure Bug-type Pokémon.|Battez 1 000 000 de Pokémon de type Insecte pur.
Catch 111 Hoopa.|Capturez 111 Hoopa.
Have all 6 Flutes active for 60 minutes.|Maintenez les 6 Flûtes actives pendant 60 minutes.
Give a Pokémon a very unoriginal nickname.|Donnez à un Pokémon un surnom très peu original.
Refresh the Quest List without completing any quests.|Actualisez la liste des quêtes sans en terminer aucune.
Obtain Mythic-tier loot from a debuffed dungeon. Loot that ignores debuff does not count.|Obtenez un butin de rareté mythique dans un donjon soumis à un malus. Le butin qui ignore le malus ne compte pas.
Earn 1,000,000,000 Dungeon Tokens from catching Farm Wanderers.|Gagnez 1 000 000 000 de jetons de donjon en capturant des Pokémon visiteurs de la ferme.
Have all Battle Café flavors resistant to Pokérus.|Rendez toutes les saveurs du Café de Combat résistantes au Pokérus.
Have all movable UI modules in one column.|Placez tous les modules déplaçables de l’interface dans une seule colonne.
Encounter 1,000 shiny Trainer Pokémon.|Rencontrez 1 000 Pokémon chromatiques de Dresseurs.
Catch a shiny Pokémon in a Safari Zone with your last ball.|Capturez un Pokémon chromatique dans une Zone Safari avec votre dernière Ball.`);
const hints=pairs(`Thorough miner|Mineur minutieux
Clean up the streets|Nettoyez les rues
Take on the ultimate challenge|Relevez le défi ultime
The Strongest Fish|Le poisson le plus fort
You wish|Faites un vœu
Red is my favorite color|Le rouge est ma couleur préférée
Blue is my favorite color|Le bleu est ma couleur préférée
Shrink me baby one more time|Rétrécis-moi encore une fois
Some Effort required|Un peu d’effort requis
Too much Effort|Trop d’effort
Breed more|Faites plus de reproduction
You'll get it eventually|Vous finirez par l’obtenir
The most eggciting grind|Une progression pleine d’Œufs
Fully booked|Complet
Ready for every encounter.|Prêt à toute rencontre.
A million paycheck|Une paie d’un million
You are my favorite for sure|C’est sûr, tu es mon préféré
Pest control|Lutte contre les nuisibles
You said a ton, right?|Vous aviez dit une tonne, non ?
6-4-60|6-4-60
Breakfast at Tiffany's|Diamants sur canapé
I don't want to do any of these|Je ne veux en faire aucune
Debuffed? I didn't notice.|Un malus ? Je n’ai rien remarqué.
Money does not grow on trees|L’argent ne pousse pas sur les arbres
The cake is not a lie|Le gâteau n’est pas un mensonge
There can be only one|Il ne peut en rester qu’un
Glowing with envy|Briller d’envie
One ball left, one chance to make it shine|Une dernière Ball, une chance de briller`);
const events=pairs(`'Mewtwo strikes back!'|« Mewtwo contre-attaque ! »
Halloween|Halloween
'Let's GO!'|« Let's GO! »
Christmas|Noël
Vivillon|Prismillon
'Hoopa Day'|« Journée de Hoopa »
Easter|Pâques
'Golden Week'|« Golden Week »
'Flying Pikachu'|« Pikachu volant »
'A Pirate's Life'|« Une vie de pirate »`);
function achievementDescription(s){let m;if(descriptions[s])return descriptions[s];
if(m=s.match(/^Hint: (.+)$/))return hints[m[1]]&&`Indice : ${hints[m[1]]}`;
if(m=s.match(/^(Capture|Purify) (all )?([\d,]+) (unique )?(Shadow |Shiny )?Pokémon([.!]?)$/))return `${m[1]==='Capture'?'Capturez':'Purifiez'} ${m[2]?'les ':''}${m[3]} Pokémon${m[5]==='Shadow '?' Obscurs':m[5]==='Shiny '?' chromatiques':''}${m[4]?' différents':''}${m[6]}`;
if(m=s.match(/^Defeat ([\d,]+) Pokémon(?: on (.+))?\.$/))return `Battez ${m[1]} Pokémon${m[2]?' sur '+name(m[2]):''}.`;
if(m=s.match(/^Defeat\s+(.+) ([\d,]+) times\.$/))return `Battez ${name(m[1])} ${m[2]} fois.`;
if(m=s.match(/^Clear (.+) ([\d,]+) times\.$/))return `Terminez ${name(m[1])} ${m[2]} fois.`;
if(m=s.match(/^Have ([\d,]+) Attack\.$/))return `Atteignez ${m[1]} d’attaque.`;
if(m=s.match(/^Click Attack ([\d,]+) times\.$/))return `Attaquez par clic ${m[1]} fois.`;
if(m=s.match(/^(Obtain|Purchase) (all )?([\d,]+) (.+)\.$/))return `${m[1]==='Obtain'?'Obtenez':'Achetez'} ${m[2]?'les ':''}${m[3]} ${name(m[4])}.`;
if(m=s.match(/^(Obtain|Purchase) your first (.+)\.$/))return `${m[1]==='Obtain'?'Obtenez':'Achetez'} votre ${['Vitamin','Mega Stone','Master Ball','Ultra Ball','Great Ball','Poké Ball'].includes(m[2])?'première':'premier'} ${name(m[2])}.`;
if(m=s.match(/^Complete ([\d,]+) quests\.$/))return `Terminez ${m[1]} quêtes.`;
if(m=s.match(/^Reach (Quest|Safari|Underground) Level ([\d,]+)\.$/))return `Atteignez le niveau ${m[2]} ${({Quest:'de quête',Safari:'du Safari',Underground:'des Souterrains'})[m[1]]}.`;
if(m=s.match(/^Level (all )?([\d,]+) Oak Items? to the maximum level\.$/))return `Amenez ${m[1]?'les ':''}${m[2]} objet${m[2]==='1'?'':'s'} du Professeur Chen au niveau maximal.`;
if(m=s.match(/^Hatch ([\d,]+) eggs\.$/))return `Faites éclore ${m[1]} Œufs.`;
if(m=s.match(/^Unlock (all )?([\d,]+) (Hatchery Helpers|Farm Hands|Berries|Plots in the Farm)\.$/))return `Débloquez ${m[1]?'les ':''}${m[2]} ${{'Hatchery Helpers':'assistants de la Pension','Farm Hands':'ouvriers agricoles',Berries:'Baies','Plots in the Farm':'parcelles de la ferme'}[m[3]]}.`;
if(m=s.match(/^Get ([\d,]+) Hatchery Helpers to (\d+)% bonus efficiency\.$/))return `Amenez ${m[1]} assistants de la Pension à ${m[2]} % de bonus d’efficacité.`;
if(m=s.match(/^Get (all|at least) ([\d,]+) Underground Experts? to level (\d+)\.$/))return `Amenez ${m[1]==='all'?'les':'au moins'} ${m[2]} expert${m[2]==='1'?'':'s'} des Souterrains au niveau ${m[3]}.`;
if(m=s.match(/^Dig up ([\d,]+) items in the Underground\.$/))return `Déterrez ${m[1]} objets dans les Souterrains.`;
if(m=s.match(/^Dig deeper into the Underground ([\d,]+) times\.$/))return `Creusez plus profondément dans les Souterrains ${m[1]} fois.`;
if(m=s.match(/^Use the (Chisel|Hammer|Bomb|Survey) Tool ([\d,]+) times\.$/))return `Utilisez ${({Chisel:'le burin',Hammer:'le marteau',Bomb:'la bombe',Survey:'la sonde'})[m[1]]} ${m[2]} fois.`;
if(m=s.match(/^Use any tool ([\d,]+) times\.$/))return `Utilisez des outils ${m[1]} fois.`;
if(m=s.match(/^Complete stage ([\d,]+) in the Battle Frontier\.$/))return `Terminez l’étage ${m[1]} de la Zone de Combat.`;
if(m=s.match(/^Complete ([\d,]+) total stages in the Battle Frontier\.$/))return `Terminez un total de ${m[1]} étages dans la Zone de Combat.`;
if(m=s.match(/^Infect ([\d,]+) Pokémon with Pokérus\.$/))return `Contaminez ${m[1]} Pokémon avec le Pokérus.`;
if(m=s.match(/^Have ([\d,]+) Pokémon Resistant to Pokérus\.$/))return `Obtenez ${m[1]} Pokémon résistants au Pokérus.`;
if(m=s.match(/^Pick up ([\d,]+) Items in a Safari Zone$/))return `Ramassez ${m[1]} objets dans une Zone Safari`;
if(m=s.match(/^Throw ([\d,]+) (Rocks|Bait) in a Safari Zone$/))return `Lancez ${m[1]} ${m[2]==='Rocks'?'cailloux':'appâts'} dans une Zone Safari`;
if(m=s.match(/^Walk ([\d,]+) Steps in a Safari Zone$/))return `Faites ${m[1]} pas dans une Zone Safari`;
if(m=s.match(/^Catch ([\d,]+) Pokémon in a Safari Zone$/))return `Capturez ${m[1]} Pokémon dans une Zone Safari`;
if(m=s.match(/^Catch ([\d,]+) unique (Shiny )?Pokémon native to the (.+?)( region)?\.$/))return `Capturez ${m[1]} Pokémon${m[2]?' chromatiques':''} différents originaires de ${name(m[3])}.`;
if(m=s.match(/^Catch (all|[\d,]+) (unique )?(Shiny )?(Gigantamax Pokémon|Battle Café flavors|Magikarp forms|Unown forms)\.$/))return `Capturez ${m[1]==='all'?'tous les':m[1]} ${{'Gigantamax Pokémon':'Pokémon Gigamax','Battle Café flavors':'parfums du Café de Combat','Magikarp forms':'motifs de Magicarpe','Unown forms':'formes de Zarbi'}[m[4]]}${m[3]?' chromatiques':''}${m[2]?' différents':''}.`;
if(m=s.match(/^Complete the (.+?)( Shiny)? Pokédex([.!]?)$/))return `Complétez le Pokédex${m[2]?' chromatique':''} de ${events[m[1]]??name(m[1])}${m[3]}`;
if(m=s.match(/^Have all (.+) Pokémon resistant to Pokérus$/))return `Rendez tous les Pokémon de ${events[m[1]]??name(m[1])} résistants au Pokérus`;
return known.get(s);}
data.achievements.forEach((a,i)=>{add(`achievement.${i}.name`,a.name,achievementTitle(a,i));add(`achievement.${i}.description`,a.description,achievementDescription(a.description));});
data.secret.forEach((a,i)=>{add(`secret.${i}.description`,a._description,achievementDescription(a._description));add(`secret.${i}.hint`,a._hint,hints[a._hint]);});
const weatherFR=['Le temps est clair et agréable.','Les nuages remplissent le ciel.','Le temps est pluvieux et humide.','Une pluie abondante s’accompagne d’orages.','Il fait froid et il neige.','Il fait froid et il grêle.','Un blizzard hurlant souffle.','Le soleil brille intensément.','Une tempête de sable fait rage.','Le brouillard est épais…','Des vents puissants et mystérieux soufflent.'];
data.weather.forEach((w,i)=>{add(`weather.${i}.description`,w.description,weatherFR[i]);add(`weather.${i}.tooltip`,w.tooltip,w.tooltip.split('<br>').map((s,j)=>j?name(s):weatherFR[i]).join('<br>'));});
const moves=pairs(`Eruption|Éruption
Hydro Cannon|Hydroblast
Dragon Breath|Dracosouffle
Leaf Tornado|Phytomixeur
Overdrive|Overdrive
10,000,000 Volt Thunderbolt|Giga-Tonnerre
Draco Meteor|Draco-Météore
Heart Stamp|Crèvecœur
Pokéball|Poké Ball
Surf|Surf
Explosion|Explosion
Fleur Cannon|Canon Floral
Hyper Beam|Ultralaser`);
for(const [en,fr]of Object.entries(moves)){add(`battery.${en}`,en,known.get(en)??fr);add(`battery.${en}.notification`,`Your Cell Battery has discharged with the move '${en}'`,`Votre Pile s’est déchargée avec la capacité « ${fr} »`);}
for(const helper of ['Steve and Alex','Gemma','Sharlene','Jones','Darwin']){const fr=helper==='Steve and Alex'?'Steve et Alex':helper;add(`helper.${helper}.dig`,`${helper} dug deeper...`,`${fr} a creusé plus profondément…`);for(const article of ['a','an'])for(const suffix of ['.',', but the item was destroyed in the process.'])add(`helper.${helper}.${article}.${suffix}`,`${helper} found ${article} {{itemName}}${suffix}`,`${fr} a trouvé {{itemName}}${suffix==='.'?'.':', mais l’objet a été détruit pendant l’extraction.'}`);}
notifications.forEach(([en,fr],i)=>add(`notification.${i}`,en,known.get(en)??fr));
writeFileSync(resolve(root,'locales/en/gameplay.json'),JSON.stringify(out.en,null,2)+'\n');
writeFileSync(resolve(root,'locales/fr/gameplay.json'),JSON.stringify(out.fr,null,2)+'\n');
writeFileSync('.verification/gameplay-missing.json',JSON.stringify(missing,null,2));
console.log({entries:Object.keys(out.en).length,missing:missing.length});
