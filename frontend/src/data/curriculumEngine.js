/**
 * KEYFLOW - 7-Stage Neuromuscular Curriculum Engine
 * ==================================================
 * 4,200 individually addressable lessons (600/stage).
 * Deterministic seeded generation - stable per (stageId, lessonNum).
 */

// Seeded PRNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRNG(stageId, lessonNum) {
  return mulberry32(stageId * 10000 + lessonNum);
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Finger mapping for all keyboard keys
export const FINGER_MAP = {
  a: 'left-pinky', q: 'left-pinky', z: 'left-pinky',
  s: 'left-ring', w: 'left-ring', x: 'left-ring',
  d: 'left-middle', e: 'left-middle', c: 'left-middle',
  f: 'left-index', r: 'left-index', v: 'left-index',
  g: 'left-index', t: 'left-index', b: 'left-index',
  ' ': 'thumb',
  h: 'right-index', y: 'right-index', n: 'right-index',
  j: 'right-index', u: 'right-index', m: 'right-index',
  k: 'right-middle', i: 'right-middle', ',': 'right-middle',
  l: 'right-ring', o: 'right-ring', '.': 'right-ring',
  ';': 'right-pinky', p: 'right-pinky', '/': 'right-pinky',
  "'": 'right-pinky',
};

// Stage 1 data
const S1_LEFT = ['a','s','d','f'];
const S1_RIGHT = ['j','k','l',';'];
const S1_ALL = [...S1_LEFT, ...S1_RIGHT];
const S1_WORDS = [
  'ask','dad','sad','lad','fad','add','all','fall','fill','skill',
  'flask','alfalfa','salads','falls','halls','calls','shall','stall',
  'wall','ball','hall','tall','kill','will','lass','mass','pass','sass',
  'class','glass','fads','lads','adds','asks','balls','walls','dads',
];

function gen1(n, rng) {
  const u = Math.ceil(n / 30);
  if (u === 1) { const k = S1_LEFT[(n-1)%4]; return Array(6).fill(k+k+k).join(' '); }
  if (u === 2) { const k = S1_RIGHT[(n-31)%4]; return Array(6).fill(k+k+k).join(' '); }
  if (u === 3) { const p=['as','sd','df','fd','da','sf','fa','ds','af']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 4) { const p=['jk','kl','l;','jl',';k','kj','lj',';j']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 5) { const pat=Array.from({length:16},(_,i)=>i%2===0?pick(rng,S1_LEFT):pick(rng,S1_RIGHT)).join(''); return pat.match(/.{1,4}/g).join(' '); }
  if (u === 6) { const t=['fds','asd','jkl',';lk','sdj','fkl','asj','dkl']; return Array.from({length:6},()=>pick(rng,t)).join(' '); }
  if (u === 7) { const p=['ff jj','dd kk','ss ll','aa ;;','fj dk','sl a;','fd jk','as l;']; return Array.from({length:5},()=>pick(rng,p)).join(' '); }
  if (u === 8) { const c=['asl','fad','sad','jak','ask','lad','dal','jad','fal','sal']; return Array.from({length:8},()=>pick(rng,c)).join(' '); }
  if (u <= 13) { return Array.from({length:8},()=>pick(rng,S1_WORDS)).join(' '); }
  if (u <= 16) { const pool=shuffle(rng,S1_WORDS).slice(0,12); return Array.from({length:8},(_,i)=>pool[i%pool.length]).join(' '); }
  if (u <= 18) { return shuffle(rng,S1_ALL).join('')+' '+shuffle(rng,S1_ALL).join('')+' '+Array.from({length:6},()=>pick(rng,S1_WORDS)).join(' '); }
  if (u === 19) { return Array.from({length:10},()=>pick(rng,S1_WORDS)).join(' '); }
  return shuffle(rng,S1_WORDS).slice(0,12).join(' ');
}

// Stage 2 data
const S2_LEFT = ['q','w','e','r','t'];
const S2_RIGHT = ['y','u','i','o','p'];
const S2_ALL = [...S2_LEFT,...S2_RIGHT];
const S2_WORDS = [
  'the','tree','true','there','quite','write','water','order','tower','power',
  'sweet','quiet','outer','route','trout','store','spore','sport','forte','quote',
  'query','upper','utter','retro','prior','twist','tweet','steep','steer','retry',
  'tower','trowel','tripe','wrote','swore','tepid','troupe','suite','super','spurt',
  'poetry','purity','pretty','tipsy','witty','purse','rupee','repute','query','prior',
];

function gen2(n, rng) {
  const u = Math.ceil(n / 30);
  if (u === 1) { const k=S2_LEFT[(n-1)%5]; return Array(7).fill(k+k+k).join(' '); }
  if (u === 2) { const k=S2_RIGHT[(n-31)%5]; return Array(7).fill(k+k+k).join(' '); }
  if (u === 3) { const p=['qw','we','er','rt','qe','wr','et','qt','re']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 4) { const p=['yu','ui','io','op','yi','uo','ip','yo','up']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 5) { const c=['rf','uf','ej','ik','ol','qas','pls','wsd','erd']; return Array.from({length:8},()=>pick(rng,c)).join(' '); }
  if (u <= 8) { const pool=[...S2_ALL,...S1_ALL.slice(0,4)]; return Array.from({length:8},()=>Array.from({length:3},()=>pick(rng,pool)).join('')).join(' '); }
  if (u <= 14) { return Array.from({length:7},()=>pick(rng,S2_WORDS)).join(' '); }
  if (u <= 17) { const all=[...S2_WORDS,...S1_WORDS.slice(0,10)]; return Array.from({length:8},()=>pick(rng,all)).join(' '); }
  if (u <= 19) { return shuffle(rng,S2_WORDS).slice(0,10).join(' '); }
  return shuffle(rng,S2_WORDS).slice(0,12).join(' ');
}

// Stage 3 data
const S3_LETTERS = ['z','x','c','v','b','n','m'];
const S3_LEFT = ['z','x','c','v','b'];
const S3_WORDS = [
  'van','cab','mix','man','box','calm','move','comb','zinc','zone','buzz','zoom',
  'bacon','cabin','zebra','bronze','amaze','vanish','vacuum','venom','canyon',
  'blaze','brave','craze','banjo','canoe','maven','novel','vexed','maxim','nexus',
  'vixen','axiom','boxer','vocal','civic','canal','coven','lance','dance','mince',
  'fence','bench','bunch','lunch','hunch','punch','crunch','branch','clench','trench',
];

function gen3(n, rng) {
  const u = Math.ceil(n / 30);
  if (u === 1) { const k=S3_LEFT[(n-1)%5]; return Array(7).fill(k+k+k).join(' '); }
  if (u === 2) { const k=S3_LETTERS[(n-31)%7]; return Array(7).fill(k+k+k).join(' '); }
  if (u === 3) { const p=['zx','xc','cv','vb','zc','xv','zb','cx','bv']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 4) { const p=['nm','mn','nb','vm','cn','xn','mb','nc']; return Array.from({length:8},()=>pick(rng,p)).join(' '); }
  if (u === 5) { const c=['fv','jn','db','km','sc','lm','ax','jb']; return Array.from({length:8},()=>pick(rng,c)).join(' '); }
  if (u <= 8) { const pool=[...S3_LETTERS,...S2_ALL.slice(0,4),...S1_ALL.slice(0,4)]; return Array.from({length:8},()=>Array.from({length:3},()=>pick(rng,pool)).join('')).join(' '); }
  if (u <= 16) { return Array.from({length:7},()=>pick(rng,S3_WORDS)).join(' '); }
  if (u <= 19) { const all=[...S3_WORDS,...S2_WORDS.slice(0,10),...S1_WORDS.slice(0,5)]; return Array.from({length:8},()=>pick(rng,all)).join(' '); }
  return shuffle(rng,S3_WORDS).slice(0,12).join(' ');
}

// Stage 4 data
const S4_DIGRAMS = ['th','he','in','er','an','re','ed','on','es','st','en','at','to','nt','ha','nd','ou','ea','ng','as','or','ti','is','et','it','ar','te','se','hi','of'];
const S4_TRIGRAMS = ['the','and','ing','ion','tio','ent','ati','for','her','ter','hat','tha','ere','con','res','ver','all','ant','ate','est','int','ons','men','str'];
const S4_MORPHEMES = ['tion','ment','ness','less','able','ible','ful','ward','ship','hood','ling','ance','ence','ity','ous','ive','ize','ing','est'];
const S4_WORDS = [
  'that','with','there','their','another','nation','station','pattern','action','condition',
  'start','enter','standard','instant','contain','foundation','mention','attention','intention',
  'relation','position','question','function','junction','fraction','traction','section',
  'direction','election','reflection','selection','protection','correction','connection',
  'collection','infection','perfection','affection','detection','rejection','projection',
  'instruction','construction','destruction','obstruction','restriction','transaction',
  'interaction','satisfaction','contraction','distraction','abstraction','attraction',
  'extraction','retraction','subtraction','completion','deception','reception','perception',
  'conception','exception',
];

function gen4(n, rng) {
  const u = Math.ceil(n / 30);
  if (u <= 2) { return shuffle(rng,S4_DIGRAMS).slice(0,8).join(' '); }
  if (u <= 4) { return Array.from({length:8},()=>pick(rng,S4_TRIGRAMS)).join(' '); }
  if (u <= 6) { return Array.from({length:8},()=>pick(rng,S4_MORPHEMES)).join(' '); }
  if (u <= 13) { return Array.from({length:7},()=>pick(rng,S4_WORDS)).join(' '); }
  if (u <= 16) { const pool=[...S4_WORDS,...S3_WORDS.slice(0,10),...S2_WORDS.slice(0,8)]; return Array.from({length:8},()=>pick(rng,pool)).join(' '); }
  if (u <= 19) { return shuffle(rng,S4_WORDS).slice(0,10).join(' '); }
  return shuffle(rng,S4_WORDS).slice(0,12).join(' ');
}

// Stage 5 data
const S5_SHORT = ['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','man','new','now','old','see','two','way','who','boy','did','its','let','put','say','she','too','use','may','big'];
const S5_MEDIUM = ['about','after','again','begin','below','bring','built','carry','cause','close','could','count','cover','cross','drive','early','earth','eight','every','found','front','given','going','great','group','hands','heart','house','large','learn','leave','level','light','local','means','might','money','month','music','never','night','north','often','other','parts','place','plant','point','power','press','price','quite','raise','range','reach','ready','river','round','sense','serve','seven','short','since','small','south','space','speak','speed','stand','start','state','still','stone','story','study','table'];
const S5_LONG = ['another','between','capable','certain','chapter','through','because','against','already','example','explain','further','general','however','hundred','include','instead','journey','kitchen','knowing','learned','library','machine','measure','morning','natural','nothing','outside','perhaps','picture','popular','process','problem','produce','program','protect','provide','purpose','quality','quickly','quietly','reading','realize','receive','regular','release','replace','require','respect','results','science','section','several','similar','society','someone','special','station','student','subject','support','surface','teacher','thought','towards','turning','version','village','weather','whether','writing'];

function gen5(n, rng) {
  const u = Math.ceil(n / 30);
  if (u <= 3) { return Array.from({length:10},()=>pick(rng,S5_SHORT)).join(' '); }
  if (u <= 6) { return Array.from({length:8},()=>pick(rng,S5_MEDIUM)).join(' '); }
  if (u <= 9) { const c=[...Array.from({length:4},()=>pick(rng,S5_SHORT)),...Array.from({length:4},()=>pick(rng,S5_MEDIUM))]; return shuffle(rng,c).join(' '); }
  if (u <= 12) { return Array.from({length:7},()=>pick(rng,S5_LONG)).join(' '); }
  if (u <= 15) { const c=[...Array.from({length:3},()=>pick(rng,S5_SHORT)),...Array.from({length:3},()=>pick(rng,S5_MEDIUM)),...Array.from({length:3},()=>pick(rng,S5_LONG))]; return shuffle(rng,c).join(' '); }
  if (u <= 18) { const pairs=['the great','every night','large group','small point','new place','all people','great power','dark night','long story','short road']; return Array.from({length:5},()=>pick(rng,pairs)).join(' '); }
  if (u === 19) { return shuffle(rng,[...S5_SHORT,...S5_MEDIUM]).slice(0,12).join(' '); }
  return shuffle(rng,[...Array.from({length:4},()=>pick(rng,S5_SHORT)),...Array.from({length:4},()=>pick(rng,S5_MEDIUM)),...Array.from({length:4},()=>pick(rng,S5_LONG))]).join(' ');
}

// Stage 6 data
const S6_SHORT = [
  'The quick brown fox jumps over the lazy dog.','She sells seashells by the seashore.',
  'How much wood would a woodchuck chuck?','Pack my box with five dozen liquor jugs.',
  'The five boxing wizards jump quickly.','Sphinx of black quartz, judge my vow.',
  'Two driven jocks help fax my big quiz.','Quick fox jumps near the blue dog.',
  'Waltz, bad nymph, for quick jigs vex.','Bright moons light dark skies tonight.',
  'Every good morning starts with coffee.','She wrote her name on the clean paper.',
  'He reads books every single evening.','They walk fast along the sunny path.',
  'Rain falls softly on the green grass.','The clock ticks slowly in the hall.',
  'Wind blows gently through open doors.','Stars shine brightly in the clear sky.',
  'Children laugh and play all afternoon.','The river flows calm and wide today.',
];
const S6_LONG = [
  'Patience is the companion of wisdom, and silence is the language of strength.',
  'The best way to predict the future is to create it with focused effort.',
  'Success is not final, failure is not fatal, and the courage to continue is what counts.',
  'In the middle of every difficulty lies an opportunity waiting to be discovered.',
  'The only way to do great work is to love what you do with all your heart.',
  'Life is what happens when you are busy making other plans for the future.',
  'In three words I can sum up everything I have learned about life: it goes on.',
  'The future belongs to those who believe in the beauty of their dreams and act.',
  'You must be the change you wish to see in the world around you every day.',
  'It always seems impossible until it is done by someone with vision and courage.',
  'The journey of a thousand miles begins with a single step forward in faith.',
  'Knowledge is power, and sharing it makes the whole world stronger and brighter.',
  'Every moment is a fresh beginning for those willing to embrace new possibilities.',
  'The difference between ordinary and extraordinary is that little bit of extra.',
  'Quality is never an accident; it is always the result of high intention and effort.',
  'Creativity is intelligence having fun with the problems and puzzles of the world.',
  'The mind is everything; what you think, you become in time and practice and will.',
  'The only impossible journey is the one you never begin with courage and hope.',
  'Turn your wounds into wisdom, and your setbacks into stepping stones to success.',
  'Do not watch the clock; do what it does and keep moving forward step by step.',
];
const S6_PARA = [
  'Every morning brings new opportunity. The key is to start with a clear intention, work steadily, and maintain focus throughout the day. Small steps taken consistently lead to remarkable destinations.',
  'Writing with precision requires patience. Each letter must fall exactly where it belongs. The trained typist does not think about fingers; thought flows directly into words without interruption.',
  'Technology shapes the way we communicate and create. From brief messages to long documents, the ability to type swiftly and accurately remains one of the most valuable professional skills.',
  'Practice makes permanent, not merely perfect. Deliberate repetition of correct movements builds the motor pathways that allow skilled performance to emerge naturally under any condition.',
  'The greatest typists achieve a state of flow where awareness of the keyboard disappears entirely. Their fingers respond to intention without conscious direction, arriving at each key before the mind fully forms the word.',
];

function gen6(n, rng) {
  const u = Math.ceil(n / 30);
  if (u <= 6) { return pick(rng,S6_SHORT); }
  if (u <= 9) { const s1=pick(rng,S6_SHORT); const s2=pick(rng,S6_SHORT.filter(s=>s!==s1)); return s1+' '+s2; }
  if (u <= 12) { return pick(rng,S6_LONG); }
  if (u <= 15) { const s1=pick(rng,S6_LONG); const s2=pick(rng,S6_LONG.filter(s=>s!==s1)); return s1+' '+s2; }
  if (u <= 17) { return pick(rng,S6_PARA); }
  if (u <= 19) { return pick(rng,S6_LONG); }
  const s1=pick(rng,S6_LONG); const s2=pick(rng,S6_LONG.filter(s=>s!==s1)); return s1+' '+s2;
}

// Stage 7 data
const S7_MIXED = [
  'Quick brown foxes leap over a lazy dog near the old wooden fence.',
  'Zero gravity experiments require extreme precision and careful documentation.',
  'The programming language Python uses indentation to define code structure.',
  'Accurate data entry demands both speed and unwavering attention to detail.',
  'Electronic signals travel through fiber optic cables at the speed of light.',
  'Medical research advances through systematic observation and rigorous testing.',
  'Financial markets respond instantly to economic news from around the globe.',
  'The symphony orchestra performed a magnificent concert for the sold-out hall.',
  'Scientists measure atmospheric pressure using barometric instruments daily.',
  'Quantum computing promises to solve problems beyond classical computation.',
];
const S7_PUNCT = [
  'Note: The following items are required: pen, paper, ruler, and eraser.',
  'The results (shown in Table 3) were statistically significant (p < 0.05).',
  'Items needed: 1) flour, 2) sugar, 3) butter, and 4) eggs in that order.',
  'The deadline is Friday, October 31st; please submit your work before 5:00 p.m.',
  'Key findings: accuracy improved by 34%, speed increased by 22%, errors fell 67%.',
  'Warning: Do not attempt this procedure without proper training and equipment.',
  'The contract specified: payment within 30 days of receipt of goods or services.',
  'Remember: consistent practice, not raw talent, builds lasting skill and confidence.',
  'The report concluded: all parameters fell within acceptable ranges for the trial.',
  'Priority items: safety, accuracy, speed, and then style, in that exact order.',
];
const S7_NUMS = [
  'There are 26 letters in the English alphabet and 10 digits from 0 to 9.',
  'The temperature was 72 degrees at 3:45 p.m. on the 14th of October, 2025.',
  'Order number 48291 includes 3 items at 24.99, 15.50, and 8.75 respectively.',
  'Flight KF2847 departs at 16:30 and arrives at 19:15, covering 1,240 kilometers.',
  'The patient weighed 68.5 kg, was 174 cm tall, and had a blood pressure of 120/80.',
  'The server handles approximately 2,500 requests per second with 99.97% uptime.',
  'The code executed in 0.034 seconds, processing 10,000 records at full capacity.',
  'Population increased from 6,800,000 to 7,200,000, a growth of 5.88% in 3 years.',
  'Mix 2 cups flour, half a cup of sugar, 3 eggs, and 100ml milk at 180 degrees.',
  'Account balance: 12,847.63. Last transaction: 450.00 debit on October 22, 2025.',
];
const S7_ENDURANCE = [
  'True velocity emerges not from frantic effort but from stillness and focus. When fingers move without looking, thought and execution merge into seamless flow. The keyboard disappears. Only intention and output remain.',
  'The skilled typist has trained every movement to occur below conscious awareness. Errors are felt before they are seen. The correction appears automatically, smoothly, without breaking the rhythm of the passage.',
  'Speed without accuracy is noise. Accuracy without speed is inefficiency. The master typist achieves both simultaneously through thousands of hours of deliberate, mindful repetition across diverse content.',
  'Professional typing is a form of athletic performance. Like a pianist or surgeon, the expert typist maintains consistent form under pressure, fatigue, and distraction. Posture, rhythm, and relaxation are inseparable from speed.',
  'Every character in every lesson was placed intentionally to build a specific motor pathway. By the time you reach this passage, your hands have traveled millions of keystrokes toward mastery and effortless flow.',
];

function gen7(n, rng) {
  const u = Math.ceil(n / 30);
  if (u <= 3) { return pick(rng,S7_MIXED); }
  if (u <= 6) { const d1=pick(rng,S7_MIXED); const d2=pick(rng,S7_MIXED.filter(d=>d!==d1)); return d1+' '+d2; }
  if (u <= 9) { return pick(rng,S7_PUNCT); }
  if (u <= 12) { return pick(rng,S7_NUMS); }
  if (u <= 15) { return pick(rng,S7_PUNCT); }
  if (u <= 18) { return pick(rng,S7_ENDURANCE); }
  if (u === 19) { const d1=pick(rng,S7_MIXED); const d2=pick(rng,S7_PUNCT); return d1+' '+d2; }
  return pick(rng,S7_ENDURANCE);
}

const GENERATORS = [null,gen1,gen2,gen3,gen4,gen5,gen6,gen7];

export const STAGE_META = [
  {stageId:1,title:'Home Row Foundations',subtitle:'Anchor finger placement, muscle relaxation, tactile indexing',objective:'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J.',badge:'Foundation',targetWpm:20,targetAccuracy:90,targetKeys:['A','S','D','F','J','K','L',';','Space'],homeKeys:['F','J'],color:'emerald',totalLessons:600},
  {stageId:2,title:'Top Row Control',subtitle:'Upward diagonal reaches and returning to home-row rest',objective:'Train fingers to stretch upward into the top row cleanly and recover home-row posture without hesitation.',badge:'Top Row',targetWpm:28,targetAccuracy:90,targetKeys:['Q','W','E','R','T','Y','U','I','O','P'],homeKeys:['F','J'],color:'blue',totalLessons:600},
  {stageId:3,title:'Bottom Row Control',subtitle:'Downward curl mechanics, wrist alignment, pinky stabilization',objective:'Conquer the downward finger curl motion across the entire bottom row with balanced speed.',badge:'Bottom Row',targetWpm:34,targetAccuracy:90,targetKeys:['Z','X','C','V','B','N','M',',','.'],homeKeys:['F','J'],color:'violet',totalLessons:600},
  {stageId:4,title:'Common Letter Combinations',subtitle:'High-frequency English digrams, trigrams, and morphemes',objective:'Condition motor memory to fire frequent character sequences as single, fluid neurological strokes.',badge:'Morphemes',targetWpm:42,targetAccuracy:92,targetKeys:['th','he','in','er','an','tion','ment','ness'],homeKeys:['F','J'],color:'amber',totalLessons:600},
  {stageId:5,title:'Word Flow & Cadence',subtitle:'Continuous vocabulary rhythm and smooth multi-word transitions',objective:'Eliminate pause delays between words and establish a steady, uninterrupted metronome cadence.',badge:'Fluency',targetWpm:50,targetAccuracy:93,targetKeys:['Full Alphabet','Continuous Flow'],homeKeys:['F','J'],color:'cyan',totalLessons:600},
  {stageId:6,title:'Sentence Rhythm & Shift Discipline',subtitle:'Opposite-hand Shift keys, punctuation, quotes, and capitalization',objective:'Master two-handed Shift coordination: never press Shift and a letter key using the same hand.',badge:'Punctuation',targetWpm:55,targetAccuracy:94,targetKeys:['Shift','.','?','!',','],homeKeys:['F','J'],color:'rose',totalLessons:600},
  {stageId:7,title:'Precision & Speed Endurance',subtitle:'Comprehensive velocity tests and sustained blind-typing mastery',objective:'Achieve complete neuromuscular flow: sustain 60+ WPM with 95%+ precision across challenging passages.',badge:'Mastery Tier',targetWpm:60,targetAccuracy:95,targetKeys:['Mixed Keys','Numbers','Punctuation','Endurance'],homeKeys:['F','J'],color:'orange',totalLessons:600},
];

const UNIT_LABELS = {
  1:['Left Pinky & Ring Singles','Left Middle & Index Singles','Right Index Singles','Right Ring & Pinky Singles','Left-Hand Pairs','Right-Hand Pairs','Cross-Hand Alternation','Home Row Triplets','Repeated Key Control','Short Combinations','Common Letter Groups','Home Row Words I','Home Row Words II','Mixed Home Patterns I','Mixed Home Patterns II','Variety Expansion I','Variety Expansion II','Full Home Row Drill I','Full Home Row Drill II','Stage 1 Assessment'],
  2:['Top-Left Keys Intro','Top-Right Keys Intro','Left Top Pairs','Right Top Pairs','Home-to-Top Transitions','Top-Row Triplets','Mixed Row Patterns I','Mixed Row Patterns II','Top-Row Words I','Top-Row Words II','Top-Row Words III','Home+Top Vocabulary I','Home+Top Vocabulary II','Fluency Drills I','Fluency Drills II','Extended Combinations I','Extended Combinations II','Mixed Row Fluency I','Mixed Row Fluency II','Stage 2 Assessment'],
  3:['Bottom-Left Keys Intro','Bottom-Right Keys Intro','Bottom-Left Pairs','Bottom-Right Pairs','Home-to-Bottom Transitions','Three-Row Combinations I','Three-Row Combinations II','Three-Row Patterns I','Bottom-Row Words I','Bottom-Row Words II','Bottom-Row Words III','All-Row Vocabulary I','All-Row Vocabulary II','Control Drills I','Control Drills II','Mixed All-Row I','Mixed All-Row II','Full Keyboard Fluency I','Full Keyboard Fluency II','Stage 3 Assessment'],
  4:['Digram Patterns I','Digram Patterns II','Trigram Patterns I','Trigram Patterns II','Morpheme Recognition I','Morpheme Recognition II','Word Fragment Drills I','Word Fragment Drills II','-tion Words I','-tion Words II','-ment & -ness Words I','-ment & -ness Words II','High-Frequency Patterns I','High-Frequency Patterns II','Long Morpheme Words I','Long Morpheme Words II','Mixed Combination Drills I','Mixed Combination Drills II','Combination Fluency','Stage 4 Assessment'],
  5:['Common Short Words I','Common Short Words II','Common Short Words III','Medium Words I','Medium Words II','Medium Words III','Mixed Word Lengths I','Mixed Word Lengths II','Mixed Word Lengths III','Longer Words I','Longer Words II','Longer Words III','Mixed Difficulty I','Mixed Difficulty II','Mixed Difficulty III','Word Groups I','Word Groups II','Speed Rhythm I','Speed Rhythm II','Stage 5 Assessment'],
  6:['Simple Short Sentences I','Simple Short Sentences II','Simple Short Sentences III','Short Sentences Punctuation I','Short Sentences Punctuation II','Short Sentences Punctuation III','Two-Sentence Patterns I','Two-Sentence Patterns II','Two-Sentence Patterns III','Longer Sentences I','Longer Sentences II','Longer Sentences III','Complex Sentences I','Complex Sentences II','Complex Sentences III','Paragraph Typing I','Paragraph Typing II','Sentence Rhythm Drills I','Sentence Rhythm Drills II','Stage 6 Assessment'],
  7:['Mixed Key Challenges I','Mixed Key Challenges II','Mixed Key Challenges III','Two-Sentence Drills I','Two-Sentence Drills II','Two-Sentence Drills III','Punctuation-Heavy I','Punctuation-Heavy II','Punctuation-Heavy III','Number Integration I','Number Integration II','Number Integration III','Mixed Numbers & Symbols I','Mixed Numbers & Symbols II','Mixed Numbers & Symbols III','Endurance Passages I','Endurance Passages II','Endurance Passages III','Comprehensive Challenge','Stage 7 Mastery Assessment'],
};

const GUIDANCE = {
  1:'Keep wrists elevated and relaxed. Return index fingers immediately to F and J bumps after each keystroke.',
  2:'Reach upward diagonally with the designated finger while keeping other fingers near home-row rest positions.',
  3:'Curl fingers cleanly downward from the middle knuckles rather than dropping your wrists toward the desk.',
  4:'Group common letters in your mind. Type "the" and "tion" as smooth, single rhythmic bursts rather than isolated letters.',
  5:'Focus on rhythm over raw speed. A steady, unhurried cadence is consistently faster than bursts followed by pauses.',
  6:'When capitalizing with the right hand, hold left Shift. When capitalizing with the left hand, hold right Shift.',
  7:'Breathe steadily. Let your eyes anticipate words two or three tokens ahead of where your fingers are striking.',
};

export function getLesson(stageId, lessonNum) {
  if (stageId < 1 || stageId > 7) throw new Error('Invalid stageId: '+stageId);
  if (lessonNum < 1 || lessonNum > 600) throw new Error('Invalid lessonNum: '+lessonNum);
  const rng = seededRNG(stageId, lessonNum);
  const stage = STAGE_META[stageId - 1];
  const unit = Math.ceil(lessonNum / 30);
  const unitIndex = unit - 1;
  const isAssessment = unit === 20;
  const isMilestone = lessonNum % 100 === 0;
  const unitLabel = UNIT_LABELS[stageId]?.[unitIndex] ?? ('Unit '+unit);
  const exerciseText = GENERATORS[stageId](lessonNum, rng);
  let difficulty = 'beginner';
  if (lessonNum > 480) difficulty = 'expert';
  else if (lessonNum > 360) difficulty = 'advanced';
  else if (lessonNum > 180) difficulty = 'intermediate';
  const pf = lessonNum / 600;
  const targetWpm = Math.round(stage.targetWpm * (0.7 + 0.3 * pf));
  const targetAccuracy = Math.min(98, Math.round(stage.targetAccuracy * (0.9 + 0.1 * pf)));
  const estimatedSeconds = Math.max(30, Math.round((exerciseText.length / (targetWpm * 5)) * 60 * 1.2));
  return {
    id: 'stage-'+stageId+'-lesson-'+String(lessonNum).padStart(3,'0'),
    stageId, lessonNum, stageTitle: stage.title,
    title: unitLabel+' - Lesson '+lessonNum,
    unitLabel, unit, lessonInUnit: lessonNum - (unit-1)*30,
    objective: stage.objective, badge: stage.badge,
    targetKeys: stage.targetKeys, homeKeys: stage.homeKeys,
    exerciseText, difficulty, targetWpm, targetAccuracy,
    estimatedSeconds, isAssessment, isMilestone,
    guidance: GUIDANCE[stageId] ?? 'Maintain correct posture and return to home row after every keystroke.',
    fingerMap: FINGER_MAP,
  };
}

export function getLessonMeta(stageId, lessonNum) {
  const stage = STAGE_META[stageId - 1];
  const unit = Math.ceil(lessonNum / 30);
  const unitLabel = UNIT_LABELS[stageId]?.[unit-1] ?? ('Unit '+unit);
  return {
    id: 'stage-'+stageId+'-lesson-'+String(lessonNum).padStart(3,'0'),
    stageId, lessonNum,
    title: unitLabel+' - Lesson '+lessonNum,
    unitLabel, unit,
    isAssessment: unit === 20,
    isMilestone: lessonNum % 100 === 0,
    badge: stage.badge, targetWpm: stage.targetWpm, targetAccuracy: stage.targetAccuracy,
  };
}

export function getStageUnits(stageId) {
  return (UNIT_LABELS[stageId] ?? []).map((label, i) => ({
    unitNumber: i+1, unitLabel: label,
    startLesson: i*30+1, endLesson: (i+1)*30,
    isAssessment: i === 19, lessonsCount: 30,
  }));
}

export function getFirstLesson(stageId) { return getLesson(stageId, 1); }

export function getNextLessonId(stageId, lessonNum) {
  if (lessonNum < 600) return { stageId, lessonNum: lessonNum+1 };
  if (stageId < 7) return { stageId: stageId+1, lessonNum: 1 };
  return null;
}

export function validateCurriculum() {
  const errors = [];
  let count = 0;
  for (let s = 1; s <= 7; s++) {
    const seen = new Set();
    for (let l = 1; l <= 600; l++) {
      try {
        const lesson = getLesson(s, l);
        if (!lesson.id) errors.push('Missing ID: s'+s+' l'+l);
        if (seen.has(lesson.id)) errors.push('Duplicate ID: '+lesson.id);
        seen.add(lesson.id);
        if (!lesson.exerciseText || lesson.exerciseText.trim().length < 5) errors.push('Empty exercise: '+lesson.id);
        count++;
      } catch(e) { errors.push('Error s'+s+' l'+l+': '+e.message); }
    }
  }
  return { valid: errors.length === 0, count, errors };
}
