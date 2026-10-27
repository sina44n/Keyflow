/**
 * KEYFLOW Arcade — Masterpiece Vocabulary & Anti-Repetition Engine
 * ===============================================================
 * Curated dictionary database containing 3,300+ unique, valid English words
 * and tactical arcade phrases categorized across 17 thematic domains.
 *
 * Provides:
 * 1. Categorized vocabulary pools for touch-typing and arcade drills
 * 2. Difficulty-aware pool mapping per game and intensity tier
 * 3. Anti-repetition engine (Fisher-Yates shuffled decks, recent history buffers,
 *    boundary-refill deduplication, on-screen target filtering, deterministic testing support)
 * 4. Runtime vocabulary verification and integrity checks
 */

export const ARCADE_VOCABULARY = {
  beginnerShort: [
    'ace', 'act', 'add', 'age', 'aim', 'air', 'all', 'and', 'ant', 'any',
    'ape', 'apt', 'arc', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'bad',
    'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'beg', 'bet', 'bid',
    'big', 'bin', 'bit', 'boa', 'bob', 'bog', 'bow', 'box', 'boy', 'bra',
    'bud', 'bug', 'bus', 'but', 'buy', 'bye', 'cab', 'can', 'cap', 'car',
    'cat', 'caw', 'cob', 'cod', 'cog', 'con', 'cop', 'cot', 'cow', 'cry',
    'cub', 'cud', 'cue', 'cup', 'cut', 'dab', 'dad', 'dam', 'dan', 'day',
    'den', 'dew', 'did', 'die', 'dig', 'dim', 'din', 'dip', 'doe', 'dog',
    'dot', 'dry', 'dub', 'due', 'dug', 'dun', 'duo', 'dye', 'ear', 'eat',
    'ebb', 'eel', 'egg', 'ego', 'elf', 'elk', 'elm', 'end', 'era', 'eve',
    'eye', 'fad', 'fan', 'far', 'fat', 'fed', 'fee', 'few', 'fig', 'fin',
    'fir', 'fit', 'fix', 'fly', 'foe', 'fog', 'for', 'fox', 'fry', 'fun',
    'fur', 'gag', 'gap', 'gas', 'gel', 'gem', 'get', 'gin', 'glow', 'gnu',
    'gob', 'god', 'got', 'gum', 'gun', 'gut', 'guy', 'gym', 'had', 'ham',
    'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hew', 'hex', 'hid', 'him',
    'hip', 'his', 'hit', 'hoe', 'hog', 'hop', 'hot', 'how', 'hub', 'hue',
    'hug', 'hum', 'hut', 'ice', 'icy', 'ill', 'imp', 'ink', 'inn', 'ion',
    'ire', 'irk', 'ivy', 'jab', 'jag', 'jam', 'jar', 'jaw', 'jay', 'jet',
    'jig', 'job', 'jog', 'jot', 'joy', 'jug', 'jut', 'keg', 'key', 'kid',
    'kin', 'kit', 'lab', 'lad', 'lag', 'lap', 'law', 'lay', 'led', 'leg',
    'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low', 'mad', 'man',
    'map', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mop', 'mud',
    'mug', 'nab', 'nag', 'nap', 'net', 'new', 'nib', 'nil', 'nip', 'nod',
    'nor', 'not', 'now', 'nun', 'nut', 'oak', 'oar', 'oat', 'odd', 'ode',
    'off', 'oft', 'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our', 'out',
    'owl', 'own', 'pad', 'pal', 'pan', 'par', 'pat', 'paw', 'pay', 'pea',
    'peg', 'pen', 'per', 'pet', 'pew', 'pie', 'pig', 'pin', 'pip', 'pit',
    'ply', 'pod', 'pop', 'pot', 'pro', 'pry', 'pub', 'pug', 'pun', 'pup',
    'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'rib', 'rid',
    'rig', 'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rug',
    'run', 'rut', 'rye', 'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea',
    'see', 'set', 'sew', 'she', 'shy', 'sin', 'sip', 'sir', 'sit', 'six',
    'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'sow', 'soy', 'spa', 'spy',
    'sub', 'sue', 'sum', 'sun', 'tab', 'tag', 'tan', 'tap', 'tar', 'tax',
    'tea', 'ten', 'the', 'thy', 'tie', 'tin', 'tip', 'toe', 'ton', 'top',
    'tow', 'toy', 'try', 'tub', 'tug', 'two', 'urn', 'use', 'van', 'vat',
    'vet', 'via', 'vie', 'vow', 'wag', 'war', 'was', 'wax', 'way', 'web',
    'wed', 'wee', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'won',
    'woo', 'yak', 'yam', 'yap', 'yaw', 'yea', 'yen', 'yes', 'yet', 'yew',
    'yip', 'you', 'zap', 'zed', 'zen', 'zig', 'zip', 'zoo',
  ],

  commonEveryday: [
    'about', 'above', 'across', 'action', 'active', 'actor', 'actual', 'adapt',
    'admit', 'adopt', 'advance', 'advice', 'affect', 'afford', 'after', 'again',
    'against', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alike', 'alive',
    'allow', 'almost', 'alone', 'along', 'aloud', 'already', 'also', 'alter',
    'always', 'amaze', 'among', 'amount', 'anchor', 'angel', 'anger', 'angle',
    'animal', 'annual', 'another', 'answer', 'antic', 'apart', 'appeal', 'appear',
    'apple', 'apply', 'apron', 'arcade', 'arena', 'argue', 'arise', 'armor',
    'around', 'arouse', 'arrange', 'arrest', 'arrive', 'arrow', 'artist', 'asleep',
    'aspect', 'assure', 'attack', 'attain', 'attend', 'august', 'author', 'avenue',
    'avenge', 'average', 'avoid', 'awake', 'award', 'aware', 'balance', 'ballot',
    'banner', 'barber', 'barely', 'barrel', 'basket', 'battle', 'beacon', 'beauty',
    'become', 'before', 'behave', 'behind', 'belief', 'belong', 'beside', 'better',
    'beyond', 'binary', 'bitter', 'blanket', 'blender', 'blessing', 'border', 'borrow',
    'bottle', 'bounce', 'branch', 'breeze', 'bridge', 'bright', 'broken', 'brother',
    'bucket', 'budget', 'builder', 'bundle', 'burden', 'butter', 'button', 'cabin',
    'cactus', 'camera', 'campus', 'candle', 'cannon', 'canyon', 'carpet', 'carrier',
    'castle', 'casual', 'catchy', 'cattle', 'cavern', 'cement', 'center', 'cereal',
    'chance', 'change', 'channel', 'chapter', 'charge', 'chaser', 'cheese', 'cherry',
    'chest', 'choice', 'choose', 'chorus', 'circle', 'circus', 'citizen', 'civic',
    'clarity', 'classic', 'cleaner', 'client', 'climate', 'climax', 'clinic', 'closet',
    'cloudy', 'clover', 'cluster', 'coastal', 'coffee', 'coffin', 'collar', 'collect',
    'colony', 'column', 'combat', 'comedy', 'comfort', 'comic', 'command', 'common',
    'compact', 'company', 'compare', 'compass', 'compete', 'complex', 'comply', 'compose',
    'concept', 'concern', 'concert', 'conduct', 'confirm', 'connect', 'consent', 'consist',
    'contact', 'contain', 'content', 'contest', 'context', 'control', 'convert', 'convey',
    'cooking', 'cooling', 'copper', 'corner', 'correct', 'corridor', 'costume', 'cottage',
    'cotton', 'council', 'counsel', 'counter', 'country', 'couple', 'courage', 'course',
    'cousin', 'cradle', 'crafty', 'crater', 'crayon', 'creator', 'credit', 'cricket',
    'crisis', 'critic', 'crowded', 'crucial', 'cruise', 'crystal', 'culture', 'cupboard',
    'curious', 'curtain', 'cushion', 'custom', 'cylinder', 'dagger', 'damage', 'dancer',
    'danger', 'daring', 'darken', 'dealer', 'debate', 'decade', 'decide', 'declare',
    'decline', 'decor', 'decrease', 'defeat', 'defend', 'defense', 'define', 'degree',
    'delay', 'delight', 'deliver', 'demand', 'denial', 'density', 'depend', 'deposit',
    'deputy', 'derive', 'descend', 'desert', 'deserve', 'design', 'desire', 'despair',
    'detail', 'detect', 'develop', 'device', 'devote', 'diamond', 'differ', 'digest',
    'digital', 'dignity', 'dinner', 'direct', 'disable', 'disaster', 'disclose', 'discount',
    'discover', 'discuss', 'disease', 'dismiss', 'display', 'dispute', 'distant', 'distort',
    'district', 'disturb', 'diverse', 'divide', 'divine', 'divorce', 'doctor', 'dolphin',
    'domain', 'dominant', 'donate', 'doorway', 'double', 'dragon', 'drainage', 'drastic',
    'drawer', 'dreamer', 'dressing', 'drifted', 'driving', 'drizzle', 'droplet', 'drummer',
    'durable', 'dynamic', 'eagerly', 'earnest', 'earnings', 'earthy', 'eastern', 'eclipse',
    'economy', 'edition', 'educate', 'effective', 'effort', 'elastic', 'elderly', 'elegant',
    'element', 'elevator', 'eligible', 'embrace', 'emerge', 'emotion', 'empathy', 'emperor',
    'emphasis', 'empire', 'employ', 'empower', 'empty', 'enable', 'enact', 'enclose',
    'encounter', 'encourage', 'endless', 'endorse', 'endure', 'energy', 'enforce', 'engage',
    'engine', 'enhance', 'enjoy', 'enormous', 'enough', 'enrich', 'enroll', 'ensure',
    'enter', 'entire', 'entity', 'entrance', 'envelope', 'episode', 'equality', 'equation',
    'equip', 'equity', 'errand', 'escape', 'escort', 'essay', 'essence', 'estate',
    'estimate', 'eternal', 'ethics', 'evaluate', 'evening', 'evident', 'evolve', 'exact',
    'example', 'exceed', 'excel', 'except', 'exchange', 'excite', 'exclude', 'excuse',
    'execute', 'exempt', 'exert', 'exhaust', 'exhibit', 'exile', 'expand', 'expect',
    'expense', 'expert', 'explain', 'explode', 'explore', 'export', 'expose', 'express',
    'extend', 'extent', 'external', 'extreme', 'fabric', 'factor', 'factory', 'faculty',
    'failure', 'faithful', 'familiar', 'famous', 'fantasy', 'farmer', 'fashion', 'fatal',
    'fatigue', 'faulty', 'favor', 'feature', 'federal', 'feedback', 'fellow', 'female',
    'fertile', 'festival', 'fiction', 'fidelity', 'fierce', 'figure', 'filter', 'finance',
    'finding', 'finish', 'fiscal', 'flavor', 'fleece', 'flexible', 'flight', 'floating',
    'flock', 'flower', 'flutter', 'flying', 'folder', 'follow', 'fondly', 'foolish',
    'footage', 'forbid', 'forecast', 'foreign', 'forest', 'forever', 'forgive', 'format',
    'former', 'formula', 'fortune', 'forward', 'foster', 'founder', 'fraction', 'fragment',
    'fragile', 'framework', 'freedom', 'frequent', 'friction', 'friend', 'frontier', 'frozen',
  ],

  mediumWords: [
    'absorb', 'accent', 'accept', 'access', 'accord', 'across', 'acting', 'action',
    'active', 'actual', 'acumen', 'adjust', 'admire', 'advent', 'aerobic', 'affair',
    'affect', 'affirm', 'afford', 'agency', 'agenda', 'agile', 'allege', 'allied',
    'allure', 'almond', 'alpine', 'alpaca', 'altar', 'amateur', 'ambush', 'amplify',
    'amulet', 'analyst', 'anchor', 'anecdote', 'animal', 'animate', 'ankle', 'annex',
    'annual', 'anomaly', 'anthem', 'antique', 'anybody', 'anyway', 'apology', 'appeal',
    'appear', 'append', 'applaud', 'arcade', 'archery', 'archive', 'ardent', 'argent',
    'arguing', 'arising', 'armory', 'arousal', 'arrange', 'array', 'arrival', 'arrow',
    'artery', 'artisan', 'artwork', 'ascend', 'ascribe', 'ashamed', 'aspect', 'aspire',
    'assault', 'assemble', 'assert', 'assess', 'assign', 'assist', 'assort', 'assume',
    'assure', 'astride', 'asylum', 'athlete', 'atomic', 'attach', 'attain', 'attempt',
    'attend', 'attire', 'attract', 'auction', 'audible', 'augment', 'august', 'austere',
    'authentic', 'author', 'autism', 'avatar', 'avenge', 'avenue', 'average', 'aversion',
    'aviator', 'avocado', 'awakening', 'awesome', 'awkward', 'azimuth', 'baboon', 'backdrop',
    'backlog', 'backup', 'badger', 'baffle', 'baggage', 'bailout', 'balance', 'balcony',
    'ballad', 'ballast', 'bamboo', 'bandage', 'bandit', 'banish', 'banking', 'banner',
    'banquet', 'baptize', 'barber', 'barefoot', 'bargain', 'baritone', 'barking', 'baroque',
    'barracks', 'barrel', 'barrier', 'barter', 'baseball', 'baseline', 'basement', 'basic',
    'bastion', 'baton', 'battery', 'battalion', 'bazaar', 'beacon', 'beaded', 'beagle',
    'beaming', 'bearable', 'bearing', 'beatific', 'beautify', 'beaver', 'bedrock', 'beetle',
    'beggar', 'behold', 'belated', 'beloved', 'bending', 'benefactor', 'benefit', 'beret',
    'beseech', 'bestow', 'beverage', 'bewilder', 'bifocal', 'bilateral', 'billion', 'binding',
    'biography', 'biology', 'bipedal', 'bizarre', 'blackout', 'blanket', 'blazing', 'blemish',
    'blessing', 'blister', 'blizzard', 'blockade', 'blossom', 'boasting', 'bodyguard', 'boisterous',
    'boldness', 'bolster', 'bombard', 'bondage', 'bonfire', 'bonanza', 'bookcase', 'booklet',
    'boomerang', 'border', 'botany', 'boulder', 'boulevard', 'bouncing', 'boundary', 'bounty',
    'bouquet', 'bourbon', 'boutique', 'bowling', 'boycott', 'bracelet', 'bracket', 'bravery',
    'breaker', 'breakout', 'breathe', 'breeding', 'brevity', 'brewery', 'bribery', 'brigade',
    'brimstone', 'briskly', 'bristle', 'brittle', 'broadband', 'broadcast', 'brochure', 'brocade',
    'brother', 'buckle', 'buffalo', 'buffet', 'buffoon', 'buoyant', 'bureau', 'burglar',
    'burrito', 'business', 'bustle', 'butcher', 'buttress', 'bygone', 'bypass', 'cabaret',
  ],

  longAdvanced: [
    'aberration', 'abomination', 'abstinence', 'acceleration', 'accommodate', 'accomplish',
    'accumulation', 'acknowledgment', 'acquaintance', 'acquisition', 'administration', 'admonition',
    'adventurous', 'affectionate', 'affirmation', 'agricultural', 'alienation', 'allegation',
    'alliteration', 'alternation', 'ambassador', 'ambidextrous', 'ameliorate', 'amplification',
    'anachronism', 'annihilation', 'anticipation', 'apprehension', 'appropriation', 'approximation',
    'archaeology', 'architecture', 'articulation', 'asphyxiation', 'assassination', 'astonishment',
    'astrophysics', 'authenticity', 'authoritarian', 'authorization', 'autobiography', 'autonomous',
    'availability', 'benevolence', 'biodegradable', 'biotechnology', 'bureaucracy', 'calamitous',
    'calibration', 'camaraderie', 'capitalization', 'carbohydrate', 'catastrophic', 'categorization',
    'characteristic', 'chronological', 'circumference', 'circumstance', 'civilization', 'classification',
    'collaboration', 'commemoration', 'commensurate', 'communication', 'compassionate', 'compatibility',
    'compensation', 'comprehension', 'concentricity', 'concurrence', 'confidential', 'conflagration',
    'congratulate', 'consequential', 'conservation', 'consideration', 'consolidation', 'conspicuous',
    'constellation', 'constitutional', 'contamination', 'contemporary', 'continuation', 'contradiction',
    'controversial', 'conventional', 'corroboration', 'countermeasure', 'crystallize', 'decryption',
    'defenestrate', 'deliberation', 'demonstration', 'denomination', 'differentiation', 'disappearance',
    'disillusion', 'dissemination', 'documentation', 'electromagnetic', 'emancipation', 'embarrassment',
    'enlightenment', 'enthusiastic', 'environmental', 'epidemiology', 'establishment', 'evolutionary',
    'exemplification', 'exhilaration', 'extraterrestrial', 'fluorescent', 'fundamental', 'generalization',
    'hallucination', 'heterogeneous', 'hierarchical', 'hypothetical', 'idiosyncrasy', 'illumination',
    'illustration', 'implementation', 'inconvenience', 'indispensable', 'infrastructure', 'ingenuity',
    'instantaneous', 'instrumentation', 'insurrection', 'intercontinental', 'interferometer', 'intermittent',
    'interpretation', 'investigation', 'irreversible', 'juxtaposition', 'kaleidoscope', 'luminosity',
    'macroscopic', 'magnification', 'malfunctioning', 'manifestation', 'manipulation', 'masterpiece',
    'measurement', 'meteorological', 'microprocessor', 'miniaturization', 'miscalculation', 'modification',
    'multidisciplinary', 'multiplication', 'nanotechnology', 'navigation', 'neutralization', 'nomenclature',
    'nonchalance', 'notwithstanding', 'obliteration', 'observation', 'omnidirectional', 'opportunistic',
    'optimization', 'orchestration', 'organization', 'oscillation', 'overclocking', 'paleontology',
    'participation', 'particularity', 'pathological', 'perseverance', 'personification', 'perspective',
    'pharmaceutical', 'phenomenological', 'philosophical', 'photosynthesis', 'polytechnic', 'precipitation',
    'predetermine', 'preponderance', 'prerequisite', 'presentation', 'preservation', 'probabilistic',
    'procrastination', 'prognostication', 'pronunciation', 'proportional', 'prototypical', 'psychological',
    'quantification', 'quintessential', 'radiotherapy', 'reconciliation', 'reconfiguration', 'reconnaissance',
    'reconstruction', 'rejuvenation', 'representation', 'responsibility', 'resuscitation', 'retaliation',
    'revolutionary', 'scintillation', 'sedimentation', 'semiconductor', 'signification', 'simultaneous',
    'sophistication', 'spectrometry', 'spontaneous', 'stratification', 'subterranean', 'supercomputer',
    'superposition', 'surveillance', 'sustainability', 'synchronization', 'telecommunication', 'thermometer',
    'transformation', 'transgression', 'transmutation', 'transparency', 'transportation', 'triangulation',
    'uncompromising', 'unconditional', 'underestimate', 'understatement', 'unforeseeable', 'unilateral',
    'unpredictable', 'unprecedented', 'ventilation', 'vulnerability', 'wavelength', 'weatherproofing',
  ],

  technology: [
    'algorithm', 'analytics', 'android', 'antenna', 'api', 'applet', 'archive', 'array',
    'artifact', 'assembly', 'async', 'backend', 'backup', 'bandwidth', 'binary', 'bitrate',
    'blockchain', 'boolean', 'bootloader', 'botnet', 'browser', 'buffer', 'bugfix', 'busbar',
    'bytecode', 'cache', 'callback', 'capacity', 'chipset', 'cipher', 'circuit', 'client',
    'cloud', 'cluster', 'codec', 'compiler', 'compute', 'condenser', 'console', 'container',
    'cookie', 'coroutine', 'cpu', 'crypto', 'cursor', 'daemon', 'dashboard', 'database',
    'dataset', 'debugger', 'decryption', 'deploy', 'desktop', 'devops', 'digest', 'digital',
    'directory', 'diskette', 'display', 'distro', 'dns', 'docker', 'domain', 'driver',
    'dynamo', 'element', 'email', 'emulator', 'encoder', 'encryption', 'endpoint', 'ethernet',
    'eventloop', 'executor', 'express', 'factory', 'failover', 'firewall', 'firmware', 'flagship',
    'flashdrive', 'floating', 'framework', 'frontend', 'function', 'gateway', 'gigabyte', 'git',
    'glitch', 'gpu', 'graphics', 'hacker', 'hardware', 'hashmap', 'headers', 'heatmap',
    'heuristic', 'host', 'hotfix', 'hyperlink', 'hypertext', 'indexing', 'injector', 'installer',
    'instance', 'integer', 'interface', 'internet', 'interpreter', 'intranet', 'iteration', 'javascript',
    'kernel', 'keyframe', 'keyboard', 'keylogger', 'latency', 'layout', 'library', 'lifecycle',
    'linker', 'linux', 'listener', 'loader', 'logic', 'loop', 'machine', 'mainframe',
    'malware', 'manifest', 'memory', 'metadata', 'microchip', 'middleware', 'mirror', 'modem',
    'module', 'monitor', 'monolith', 'motherboard', 'multithread', 'namespace', 'network', 'node',
    'numeric', 'object', 'offline', 'online', 'opcode', 'opencl', 'opengl', 'operand',
    'operating', 'optimizer', 'packet', 'pageview', 'palette', 'paradigm', 'parser', 'partition',
    'payload', 'peer', 'peripherals', 'phishing', 'pipeline', 'pixel', 'platform', 'plugin',
    'pointer', 'polymorphic', 'portal', 'processor', 'profiler', 'program', 'protocol', 'provider',
    'proxy', 'queries', 'queue', 'quicksort', 'ram', 'raster', 'react', 'realtime',
    'recursion', 'redirect', 'redux', 'refactor', 'registry', 'renderer', 'repository', 'request',
    'response', 'restapi', 'router', 'runtime', 'sandbox', 'schema', 'script', 'security',
    'semaphore', 'sensor', 'server', 'servlet', 'session', 'sharding', 'shell', 'shortcut',
    'simulator', 'snippet', 'socket', 'software', 'source', 'spark', 'sql', 'stack',
    'statement', 'stream', 'string', 'struct', 'subnet', 'sudo', 'syntax', 'system',
    'table', 'tag', 'tcp', 'telemetry', 'template', 'terminal', 'thread', 'token',
    'topology', 'traffic', 'transistor', 'tunnel', 'typescript', 'udp', 'unicode', 'unit',
    'upload', 'uptime', 'uri', 'url', 'username', 'uuid', 'variable', 'vector',
    'version', 'viewport', 'virtual', 'virus', 'vlan', 'vpn', 'vulkan', 'wasm',
    'webhook', 'websocket', 'widget', 'wifi', 'window', 'wireless', 'wizard', 'workstation',
  ],

  science: [
    'absolute', 'absorbance', 'acceleration', 'acidic', 'actinide', 'activation', 'adhesion', 'aerodynamics',
    'aerobic', 'aerosol', 'affinity', 'agronomy', 'alchemy', 'allele', 'alkaline', 'alpha',
    'altitude', 'amino', 'amorphous', 'amplitude', 'anaerobic', 'analysis', 'anatomical', 'anion',
    'anode', 'anomaly', 'antimatter', 'aphelion', 'apparatus', 'aqueous', 'archaean', 'astrobiology',
    'astrophysics', 'atmosphere', 'atom', 'atomic', 'bacterium', 'barometer', 'base', 'becquerel',
    'beta', 'biodiversity', 'biohazard', 'biome', 'biophysics', 'biosphere', 'biotechnology', 'boiling',
    'bond', 'boson', 'buoyancy', 'calorie', 'calorimeter', 'capillary', 'carbon', 'catalyst',
    'cation', 'cell', 'cellular', 'centrifugal', 'centripetal', 'ceramic', 'charge', 'chemical',
    'chlorophyll', 'chromatography', 'chromosome', 'circuitry', 'climate', 'cloning', 'cohesion', 'colloid',
    'combustion', 'compound', 'condensation', 'conduction', 'convection', 'corona', 'corrosion', 'coulomb',
    'covalent', 'cryogenic', 'crystal', 'curium', 'current', 'cyclotron', 'cytoplasm', 'decay',
    'density', 'diffraction', 'diffusion', 'dilution', 'diode', 'dipole', 'disaccharide', 'dispersion',
    'distillation', 'dna', 'doppler', 'dynamics', 'ecology', 'ecosystem', 'effusion', 'elasticity',
    'electric', 'electrolyte', 'electromagnet', 'electron', 'elemental', 'emission', 'empirical', 'endothermic',
    'energy', 'enthalpy', 'entropy', 'enzyme', 'equilibrium', 'erosion', 'evaporation', 'evolution',
    'exothermic', 'experiment', 'farenheit', 'fermentation', 'fission', 'fluid', 'fluorescence', 'focal',
    'force', 'formula', 'fossil', 'frequency', 'friction', 'fusion', 'gamete', 'gamma',
    'gas', 'gauge', 'gene', 'generator', 'genetic', 'genome', 'geology', 'geophysics',
    'glucose', 'gradient', 'gravitation', 'gravity', 'hadron', 'half-life', 'halogen', 'heat',
    'helium', 'hemoglobin', 'heredity', 'hertz', 'hormone', 'hybrid', 'hydraulics', 'hydrocarbon',
    'hydrogen', 'hydrolysis', 'hypothesis', 'impedance', 'incandescence', 'inertia', 'infrared', 'inorganic',
    'insulator', 'interface', 'ion', 'ionization', 'isotope', 'joule', 'kelvin', 'kinetics',
    'laser', 'lattice', 'lens', 'lepton', 'lethal', 'ligand', 'liquid', 'litmus',
    'lumen', 'luminescence', 'magnet', 'magnetic', 'magnetism', 'mammal', 'mass', 'matter',
    'mechanics', 'meiosis', 'melting', 'membrane', 'meson', 'metabolism', 'metalloid', 'microbe',
    'microscope', 'mitochondria', 'mitosis', 'mixture', 'molecular', 'molecule', 'momentum', 'monomer',
    'mutation', 'nanometer', 'natural', 'nebular', 'neutrino', 'neutron', 'newton', 'nitrogen',
    'noble', 'nuclear', 'nucleon', 'nucleus', 'nuclide', 'observation', 'ohm', 'optics',
    'orbital', 'organic', 'organism', 'osmosis', 'oxidation', 'oxygen', 'particle', 'pascal',
    'periodic', 'petrology', 'phantom', 'photon', 'photosynthesis', 'physics', 'physiology', 'plasma',
    'polymer', 'positron', 'potential', 'precipitate', 'pressure', 'prism', 'protein', 'proton',
    'quantum', 'quark', 'radiation', 'radioactive', 'radiology', 'reactant', 'reaction', 'refraction',
    'relativity', 'resonance', 'respiration', 'ribosome', 'rna', 'satellite', 'scalar', 'scientific',
    'sediment', 'solenoid', 'solubility', 'solute', 'solution', 'solvent', 'spectrum', 'spectroscopy',
    'static', 'stoichiometry', 'subatomic', 'sublimation', 'superconductor', 'symbiosis', 'synthesis', 'taxonomy',
    'temperature', 'tesla', 'theorem', 'thermal', 'thermodynamics', 'tissue', 'torque', 'trajectory',
    'transcription', 'transition', 'translation', 'transpiration', 'ultraviolet', 'uncertainty', 'valence', 'velocity',
    'viscosity', 'voltage', 'volume', 'wavelength', 'weight', 'work', 'xenon', 'x-ray',
  ],

  space: [
    'accretion', 'albedo', 'altitude', 'andromeda', 'annular', 'apastron', 'aphelion', 'apogee',
    'apollo', 'aquila', 'aries', 'asteroid', 'astronomy', 'atmosphere', 'aurora',
    'azimuth', 'barycenter', 'blackhole', 'blazar', 'bolide', 'booster', 'canis', 'capsule',
    'cassini', 'celestial', 'centaurus', 'cepheid', 'ceres', 'chiron', 'chondrite', 'chromosphere',
    'cislunar', 'collimator', 'comet', 'conjunction', 'constellation', 'copernicus', 'coronal', 'cosmic',
    'cosmodrome', 'cosmology', 'cosmonaut', 'crater', 'cygnus', 'darkmatter', 'debris', 'declination',
    'docking', 'doppler', 'dwarf', 'dynamo', 'eclipse', 'ecliptic', 'electromagnetic', 'ellipse',
    'elongation', 'enceladus', 'ephemeris', 'equinox', 'escape', 'europa', 'evaporation', 'exoplanet',
    'extrasolar', 'eyepiece', 'flare', 'flight', 'fornax', 'fuselage', 'galactic', 'galaxy',
    'galileo', 'gamma', 'gemini', 'geodesic', 'geostationary', 'giant', 'globular', 'gravitational',
    'gyroscope', 'habitable', 'hale', 'heliocentric', 'heliopause', 'heliosphere', 'helium', 'hercules',
    'hubble', 'hyperbolic', 'hyperdrive', 'hypernova', 'inclination', 'infrared', 'intergalactic', 'interplanetary',
    'interstellar', 'ionosphere', 'jupiter', 'kepler', 'kiloparsec', 'kuiper', 'lagrange', 'lander',
    'lightyear', 'lunar', 'lunation', 'mach', 'magellanic', 'magnetic', 'magnetosphere', 'magnitude',
    'mars', 'mercury', 'meteor', 'meteorite', 'meteoroid', 'milkyway', 'module', 'momentum',
    'moon', 'multiverse', 'nadir', 'nasa', 'nebula', 'neptune', 'neutron', 'newtonian',
    'nodal', 'nova', 'observatory', 'occultation', 'oort', 'opposition', 'orbit', 'orbital',
    'orion', 'parallax', 'parsec', 'payload', 'pegasus', 'periastron', 'perigee', 'perihelion',
    'perseus', 'photometry', 'photosphere', 'planet', 'planetarium', 'planetary', 'planetesimal', 'plasma',
    'pluto', 'polar', 'polaris', 'probe', 'propulsion', 'pulsar', 'quadrant', 'quasar',
    'radiation', 'radiotelescope', 'redshift', 'reentry', 'reflector', 'refractor', 'retrograde', 'revolution',
    'ring', 'rocket', 'rover', 'saros', 'satellite', 'saturn', 'scorpio', 'semimajor',
    'shuttle', 'sidereal', 'singularity', 'solar', 'solstice', 'spacecraft', 'spectrograph', 'spectroscopy',
    'starlight', 'stellar', 'suborbital', 'sunspot', 'supercluster', 'supergiant', 'supermassive', 'supernova',
    'tachyon', 'taurus', 'telemetry', 'telescope', 'terminator', 'terraforming', 'thruster', 'titan',
    'trajectory', 'transit', 'umbra', 'universe', 'uranus', 'vacuum', 'vega', 'velocity',
    'venus', 'vertex', 'vostok', 'voyager', 'waning', 'warp', 'wavelength', 'waxing',
    'weightless', 'whitehole', 'wormhole', 'zenith', 'zodiac',
  ],

  nature: [
    'acacia', 'alpine', 'amazon', 'amphibian', 'anemone', 'antelope', 'aquatic', 'archipelago',
    'arctic', 'badger', 'bamboo', 'baobab', 'barnacle', 'barracuda', 'basin', 'bison',
    'blizzard', 'blossom', 'botanical', 'boulder', 'brambles', 'breeze', 'brook', 'buffalo',
    'burrow', 'cactus', 'canopy', 'canyon', 'cascade', 'caterpillar', 'cavern', 'cedar',
    'chameleon', 'cheetah', 'cliff', 'climate', 'clover', 'coastal', 'conifer', 'coral',
    'coyote', 'crag', 'crane', 'creek', 'crevasse', 'crocodile', 'crystal', 'cypress',
    'dale', 'deciduous', 'delta', 'desert', 'dolphin', 'dormant', 'dragonfly', 'drizzle',
    'dune', 'eagle', 'earthquake', 'ecosystem', 'elephant', 'elk', 'elm', 'estuary',
    'evergreen', 'falcon', 'fauna', 'fern', 'fir', 'flamingo', 'flora', 'florence',
    'fog', 'foliage', 'forest', 'fossil', 'fox', 'frost', 'fungus', 'galaxy',
    'gecko', 'geyser', 'glacier', 'glade', 'gorge', 'granite', 'grassland', 'grove',
    'gull', 'habitat', 'hail', 'hawk', 'heather', 'hedgehog', 'heron', 'hibernation',
    'highland', 'hillside', 'horizon', 'hurricane', 'hyena', 'iguana', 'inlet', 'insect',
    'island', 'jaguar', 'jungle', 'kelp', 'kingfisher', 'koala', 'lagoon', 'lake',
    'leopard', 'lichen', 'limestone', 'lion', 'lizard', 'llama', 'locust', 'lynx',
    'magnolia', 'mammoth', 'mangrove', 'mantis', 'meadow', 'meerkat', 'mesa', 'mineral',
    'monsoon', 'moss', 'mountain', 'mushroom', 'nectar', 'nocturnal', 'oasis', 'ocean',
    'octopus', 'orchid', 'otter', 'owl', 'panther', 'pasture', 'peacock', 'pelican',
    'penguin', 'permafrost', 'petrified', 'pine', 'plateau', 'polar', 'pollination', 'pond',
    'prairie', 'predator', 'prey', 'puma', 'quarry', 'rainforest', 'rapids', 'ravine',
    'reef', 'reservoir', 'ridge', 'river', 'salmon', 'sandstone', 'savanna', 'seagull',
    'sequoia', 'serpent', 'shark', 'shrub', 'sierra', 'spruce', 'steppe',
    'stream', 'summit', 'swamp', 'taiga', 'thicket', 'thunder', 'tide', 'timber',
    'tornado', 'torrent', 'toucan', 'tree', 'tributary', 'tropics', 'tundra', 'typhoon',
    'undergrowth', 'valley', 'vegetation', 'volcano', 'vulture', 'walrus', 'waterfall', 'wetland',
    'wilderness', 'willow', 'windstorm', 'wolf', 'woodland', 'zebra',
  ],

  sports: [
    'acrobat', 'agility', 'alpine', 'anchor', 'archer', 'archery', 'arena', 'armband',
    'athlete', 'athletic', 'backhand', 'badminton', 'balance', 'ballpark', 'barbell', 'baseball',
    'baseline', 'baton', 'batter', 'biathlon', 'bicycle', 'bobsled', 'bowling', 'boxing',
    'bullpen', 'caddie', 'calisthenics', 'cardio', 'champion', 'championship', 'cleats', 'climbing',
    'coach', 'competition', 'competitor', 'crossfit', 'cyclist', 'decathlon', 'defense', 'defender',
    'diamond', 'distance', 'diving', 'dodgeball', 'draft', 'dribble', 'dugout', 'endurance',
    'fencing', 'field', 'fitness', 'flexibility', 'football', 'forehand', 'forward', 'freestyle',
    'gamepoint', 'goalie', 'goalkeeper', 'golf', 'gridiron', 'gymnast', 'gymnastics', 'halftime',
    'handball', 'hurdles', 'icehockey', 'infielder', 'innings', 'javelin', 'jersey', 'jogging',
    'judo', 'karate', 'kayak', 'kickboxing', 'lacrosse', 'league', 'longjump', 'manager',
    'marathon', 'medal', 'midfielder', 'motorcross', 'offense', 'olympics', 'outfielder', 'paddle',
    'paragliding', 'penalty', 'pitcher', 'playbook', 'playoff', 'polevault', 'puck', 'quarterback',
    'racquet', 'referee', 'relay', 'rowing', 'rugby', 'runner', 'sailing', 'scoreboard',
    'skateboarding', 'skating', 'skiing', 'slalom', 'snowboarding', 'soccer', 'softball', 'speedway',
    'sprint', 'sprinter', 'squash', 'stadium', 'steeplechase', 'strikeout', 'striker', 'stroke',
    'swimmer', 'swimming', 'taekwondo', 'teamwork', 'tennis', 'track', 'touchdown', 'tournament',
    'triathlon', 'umpire', 'velodrome', 'victory', 'volleyball', 'warmup', 'weightlifting', 'wrestling',
  ],

  adventure: [
    'ambush', 'ancestral', 'anchor', 'archaeology', 'armor', 'artifact', 'ascent', 'avalanche',
    'badlands', 'beacon', 'bivouac', 'bonfire', 'boundary', 'bravado', 'bushcraft', 'cairn',
    'calamity', 'camp', 'campfire', 'canteen', 'canyon', 'caravan', 'cartography', 'catacomb',
    'cavern', 'chalice', 'chronicle', 'clamber', 'cliffside', 'compass', 'conquest', 'corridor',
    'crevasse', 'crypt', 'danger', 'daring', 'darkness', 'discovery', 'domain', 'dungeon',
    'embark', 'emerald', 'enigma', 'epic', 'escape', 'expedition', 'explorer', 'extinct',
    'fable', 'fathom', 'feral', 'firebrand', 'flint', 'folklore', 'footpath', 'forbidden',
    'fortress', 'frontier', 'gallery', 'gargoyle', 'gateway', 'geocache', 'glacier', 'grail',
    'granite', 'haven', 'hazard', 'headlamp', 'heirloom', 'heritage', 'highway', 'highland',
    'hollow', 'horizon', 'iceaxe', 'illuminate', 'immortal', 'impassable', 'intrepid', 'ironwood',
    'isthmus', 'journey', 'jungle', 'karst', 'labyrinth', 'legend', 'legendary', 'lodestone',
    'lore', 'machete', 'maelstrom', 'mapmaker', 'mariner', 'monolith', 'monument', 'mountaineer',
    'mutiny', 'mystic', 'navigating', 'navigator', 'nomad', 'oasis', 'odyssey', 'outback',
    'outlander', 'outpost', 'overland', 'paladin', 'parchment', 'passage', 'pathfinder', 'peril',
    'perilous', 'petroglyph', 'pilgrim', 'pioneer', 'plateau', 'polar', 'portage', 'pyramid',
    'quest', 'rampart', 'rapids', 'ravine', 'relic', 'remote', 'ridge', 'ruins',
    'runestone', 'saga', 'sanctuary', 'scale', 'scavenger', 'scout', 'scroll', 'secret',
    'sepulcher', 'serac', 'settler', 'shrine', 'skylight', 'solitude', 'sojourn', 'spelunking',
    'stronghold', 'survival', 'survivor', 'swashbuckler', 'talisman', 'temple', 'torch', 'trail',
    'trailblazer', 'tramp', 'traverse', 'treasure', 'trekker', 'tomb', 'uncharted', 'unexplored',
    'valley', 'valiant', 'vanguard', 'venture', 'voyage', 'voyager', 'wanderer', 'wayfarer',
    'waypoint', 'wilderness', 'windward', 'wreckage', 'zenith',
  ],

  commonLetterCombinations: [
    'action', 'affection', 'aviation', 'caption', 'caution', 'collection', 'condition', 'creation',
    'dedication', 'direction', 'duration', 'education', 'election', 'emotion', 'fraction', 'friction',
    'generation', 'infection', 'inflation', 'injection', 'intention', 'invention', 'junction', 'location',
    'mention', 'motion', 'nation', 'notation', 'notion', 'option', 'partition', 'passion',
    'patience', 'permission', 'petition', 'pollution', 'position', 'potion', 'protection', 'radiation',
    'reaction', 'relation', 'sanction', 'section', 'solution', 'station', 'traction', 'vacation',
    'accomplishment', 'acknowledgment', 'adjustment', 'agreement', 'alignment', 'amazement', 'amendment', 'amusement',
    'apartment', 'appointment', 'argument', 'arrangement', 'assessment', 'assignment', 'astonishment', 'attachment',
    'commandment', 'commitment', 'containment', 'department', 'development', 'disappointment', 'discouragement', 'displacement',
    'embarrassment', 'encouragement', 'engagement', 'enlargement', 'enlightenment', 'enrollment', 'entertainment', 'environment',
    'establishment', 'excitement', 'experiment', 'fulfillment', 'fundamental', 'government', 'improvement', 'instrument',
    'investment', 'judgment', 'management', 'monument', 'movement', 'nourishment', 'ornament', 'parliament',
    'pavement', 'payment', 'punishment', 'refinement', 'refreshment', 'reinforcement', 'replacement', 'requirement',
    'resentment', 'retirement', 'settlement', 'shipment', 'statement', 'supplement', 'temperament', 'treatment',
    'alarming', 'blessing', 'breathing', 'bringing', 'building', 'burning', 'calling', 'carrying',
    'catching', 'climbing', 'clothing', 'crossing', 'dancing', 'drawing', 'dreaming', 'drinking',
    'driving', 'dropping', 'dwelling', 'fighting', 'floating', 'flowing', 'flying', 'following',
    'growing', 'healing', 'holding', 'jumping', 'keeping', 'knowing', 'landing', 'laughing',
    'leading', 'learning', 'leaving', 'lighting', 'listening', 'looking', 'meaning', 'meeting',
    'morning', 'moving', 'opening', 'passing', 'playing', 'reading', 'riding', 'running',
    'saying', 'seeing', 'shining', 'singing', 'sitting', 'sleeping', 'speaking', 'standing',
    'starting', 'staying', 'striking', 'talking', 'thinking', 'training', 'waiting', 'walking',
    'adaptable', 'admirable', 'advisable', 'agreeable', 'allowable', 'applicable', 'available', 'believable',
    'breakable', 'capable', 'changeable', 'comfortable', 'comparable', 'dependable', 'desirable', 'durable',
    'enjoyable', 'excitable', 'favorable', 'forgivable', 'honorability', 'identifiable', 'imaginable', 'knowledgeable',
    'manageable', 'measurable', 'memorable', 'noticeable', 'obtainable', 'passable', 'peaceable', 'perishable',
    'pleasurable', 'preferable', 'probable', 'profitable', 'questionable', 'reachable', 'reasonable', 'reliable',
    'remarkable', 'removable', 'respectable', 'scalable', 'sensible', 'serviceable', 'suitable', 'sustainable',
    'tolerable', 'traceable', 'transferable', 'understandable', 'valuable', 'variable', 'vulnerable', 'washable',
  ],

  difficultCombinations: [
    'acumen', 'adze', 'aficionado', 'alacrity', 'align', 'amethyst', 'anachronism', 'apocrypha',
    'aqueduct', 'archipelago', 'asphyxiate', 'assassin', 'asymmetry', 'autumn', 'auxiliary', 'awkward',
    'azalea', 'azimuth', 'bagpipe', 'banjo', 'bayou', 'bazaar', 'bequeath', 'bivouac',
    'blizzard', 'bobsled', 'boulevard', 'bureaucracy', 'calisthenics', 'capricious', 'cataclysm', 'cavalry',
    'chasm', 'chintz', 'chlorophyll', 'chrysanthemum', 'cirrhosis', 'coalesce', 'colleague', 'connoisseur',
    'croquet', 'cryptic', 'czar', 'daiquiri', 'dearth', 'defenestrate', 'delicatessen', 'dilemma',
    'diphthong', 'discomfit', 'drought', 'dyslexia', 'eavesdrop', 'eczema', 'effervescent', 'embargo',
    'enigma', 'epiphany', 'equilibrium', 'equivocal', 'eschew', 'etiquette', 'exacerbate', 'exchequer',
    'exuberant', 'facetious', 'fallacious', 'faux', 'fjord', 'flabbergast', 'flummox', 'fluorescent',
    'fuchsia', 'gazebo', 'gnarl', 'gnat', 'gnome', 'gourd', 'graffiti', 'guerrilla',
    'haiku', 'haphazard', 'harangue', 'heirloom', 'hemorrhage', 'hierarchy', 'hymn', 'hyperbole',
    'idiosyncrasy', 'ignominious', 'impromptu', 'indictment', 'infinitesimal', 'innocuous', 'insouciant', 'irascible',
    'isthmus', 'jabberwocky', 'jackal', 'jamboree', 'jinx', 'jockey', 'jovial', 'juxtapose',
    'kakapo', 'kaleidoscope', 'kazoo', 'khaki', 'kiln', 'knack', 'knead', 'knickknack',
    'knight', 'knuckle', 'labyrinth', 'lachrymose', 'lackadaisical', 'liaison', 'lichen', 'limerick',
    'liquefy', 'loquacious', 'lugubrious', 'macabre', 'maelstrom', 'malachite', 'mayhem', 'mezzanine',
    'mnemonic', 'mohair', 'monocle', 'mortgage', 'murmur', 'myrrh', 'mystique', 'nadir',
    'naphtha', 'nebula', 'nemesis', 'nexus', 'nostalgia', 'nuance', 'obelisk', 'obfuscate',
    'obsequious', 'ocelot', 'onomatopoeia', 'opaque', 'ophthalmology', 'ostracize', 'ouroboros', 'oxymoron',
    'pageant', 'panacea', 'panache', 'pariah', 'pastiche', 'pharaoh', 'phlegm', 'phoenix',
    'phosphor', 'phylogeny', 'pique', 'pizzazz', 'plague', 'plebiscite', 'plight', 'pneumonia',
    'poignant', 'polyphony', 'posthumous', 'prerogative', 'pseudonym', 'psyche', 'ptarmigan', 'pterodactyl',
    'pumice', 'pyramid', 'quaff', 'quagmire', 'quandary', 'quarantine', 'quell', 'quenched',
    'querulous', 'queue', 'quibble', 'quiche', 'quicksilver', 'quintuple', 'quirky', 'quiver',
    'quixotic', 'quizzical', 'quorum', 'rapprochement', 'recalcitrant', 'reconnaissance', 'rendezvous', 'rhapsody',
    'rhombus', 'rhythm', 'ricochet', 'rococo', 'saboteur', 'sacrifice', 'schism', 'scythe',
    'semaphore', 'sepulcher', 'serendipity', 'shepherd', 'silhouette', 'sinecure', 'slough', 'smorgasbord',
    'somatic', 'somnambulist', 'sovereign', 'sphinx', 'squalor', 'stalwart', 'stevedore', 'subtle',
    'succinct', 'sycamore', 'symmetry', 'synchronous', 'synonym', 'syzygy', 'taboo', 'taciturn',
    'tautology', 'technique', 'thorough', 'throughout', 'twelfth', 'typhoon', 'ubiquitous', 'ukulele',
    'unctuous', 'usurp', 'vacillate', 'valkyrie', 'vanquish', 'verbatim', 'vicissitude', 'viscount',
    'vivacious', 'vortices', 'voyeur', 'waltz', 'whey', 'whimsical', 'whirlpool', 'wraith',
    'wreak', 'wrestle', 'wretched', 'wry', 'xenon', 'xenophobia', 'xylophone', 'yacht',
    'yield', 'zephyr', 'zigzag', 'zilch', 'zodiac', 'zucchini',
  ],

  // Boss Battle Soldier Combat - Infantry (Frontline scouts, lightweight)
  militaryInfantry: [
    'advance', 'alert', 'ambush', 'ammo', 'armor', 'badge', 'barracks', 'base',
    'bayonet', 'beacon', 'bivouac', 'bootcamp', 'breach', 'bunker', 'camo', 'canteen',
    'carbine', 'charge', 'clear', 'combat', 'commando', 'cover', 'defend', 'deploy',
    'depot', 'drill', 'dugout', 'escort', 'field', 'firefight', 'flank', 'flare',
    'formation', 'fort', 'forward', 'foxhole', 'front', 'frontline', 'garrison', 'grenade',
    'guard', 'gunfire', 'helmet', 'infantry', 'line', 'machete', 'march', 'medic',
    'mission', 'mortar', 'muster', 'objective', 'order', 'outpost', 'pack', 'parade',
    'patrol', 'perimeter', 'picket', 'platoon', 'point', 'post', 'radar', 'radio',
    'raider', 'rally', 'range', 'rank', 'ration', 'recon', 'recruit', 'regiment',
    'reinforce', 'relay', 'retreat', 'rifle', 'salvo', 'scout', 'sector', 'secure',
    'sentry', 'sergeant', 'shield', 'shooter', 'sidearm', 'signal', 'smoke', 'soldier',
    'spotter', 'squad', 'stand', 'station', 'stealth', 'stride', 'strike', 'supply',
    'tactics', 'target', 'terrain', 'trench', 'trigger', 'trooper', 'unit', 'vanguard',
    'vector', 'veteran', 'victor', 'vigil', 'volley', 'warden', 'watch', 'watchman',
  ],

  // Boss Battle Soldier Combat - Assault (Fast, aggressive, tactical)
  militaryAssault: [
    'advance', 'aggressive', 'airborne', 'ambush', 'ammunition', 'armored', 'assault', 'avalanche',
    'barrage', 'bayonet', 'berserker', 'blade', 'blitz', 'blitzkrieg', 'bombard', 'breach',
    'breacher', 'burst', 'cannon', 'carnage', 'charge', 'clearing', 'clash', 'combatant',
    'commando', 'crossfire', 'detonate', 'dynamic', 'escalate', 'explosion', 'faststrike', 'firebrand',
    'firepower', 'firestorm', 'flank', 'frenzy', 'furious', 'grenadier', 'gunner', 'hammer',
    'hardpoint', 'headlong', 'highspeed', 'impact', 'infantry', 'infiltrate', 'initiative', 'interceptor',
    'invasion', 'ironclad', 'juggernaut', 'launcher', 'lightning', 'lockon', 'magazine', 'marksman',
    'momentum', 'neutralize', 'onslaught', 'operation', 'ordnance', 'outflank', 'overrun', 'overthrow',
    'penetrate', 'pincer', 'pioneer', 'pursuit', 'quickfire', 'raider', 'rampart', 'rapidfire',
    'reaction', 'reflex', 'relentless', 'retaliate', 'rifleman', 'rocket', 'rush', 'salvo',
    'scatter', 'scourge', 'shockwave', 'sidearm', 'siege', 'skirmish', 'spearhead', 'speedstrike',
    'sprint', 'strikeforce', 'suppression', 'sweep', 'swift', 'tactician', 'tactics', 'takeover',
    'tempest', 'tracer', 'trajectory', 'trigger', 'unrelenting', 'upheaval', 'uprising', 'vanguard',
    'velocity', 'vicious', 'vigor', 'viper', 'warfare', 'warhead', 'warlord', 'warrior',
  ],

  // Boss Battle Soldier Combat - Armored (Heavy defensive, high resilience)
  militaryArmored: [
    'absorber', 'aegis', 'armorclad', 'armored', 'artillery', 'ballistic', 'barricade', 'barrier',
    'bastion', 'battleship', 'blockade', 'bodyguard', 'brickwall', 'bulwark', 'bunker', 'cataphract',
    'citadel', 'defensive', 'deflector', 'dreadnought', 'earthwork', 'encasement', 'enclosure', 'endurance',
    'entrenchment', 'exoskeleton', 'fireproof', 'fortification', 'fortified', 'fortress', 'frontplate', 'garrison',
    'generator', 'guardian', 'gunship', 'hardcover', 'hardened', 'heavyarmor', 'heavyweight', 'impermeable',
    'impenetrable', 'indomitable', 'insulation', 'invulnerable', 'ironclad', 'ironhide', 'ironshield', 'ironsides',
    'juggernaut', 'kinetic', 'mammoth', 'mechanized', 'megalith', 'metallurgy', 'monolith', 'palisade',
    'panzer', 'parapet', 'perimeter', 'phalanx', 'rampart', 'redoubt', 'reinforced', 'reinforcement',
    'repulsor', 'resistance', 'resistant', 'resilient', 'retaliator', 'safeguard', 'sentinel', 'shelter',
    'shieldbearer', 'shielded', 'shielding', 'shockplate', 'stalwart', 'steelclad', 'steelhull', 'steelplate',
    'steelskin', 'stronghold', 'sturdy', 'survivor', 'tanker', 'tankplate', 'titan', 'titanic',
    'toughness', 'tower', 'trenches', 'unbreakable', 'unyielding', 'vault', 'walkingtank', 'wall',
    'warden', 'warlord', 'watchtower', 'weighty',
  ],

  // Boss Battle Soldier Combat - Elite (Spec-ops, sniper, surgical precision)
  militaryElite: [
    'apex', 'assassin', 'camouflage', 'clandestine', 'commander', 'counterfire', 'countermeasure', 'counterstrike',
    'covert', 'cyberspy', 'deadeye', 'decryption', 'disruption', 'executioner', 'eyewitness', 'ghost',
    'infiltrator', 'intelligence', 'intercept', 'interceptor', 'interdict', 'invisible', 'marksman', 'mastermind',
    'nightstalker', 'nightvision', 'nullifier', 'operative', 'outrider', 'overseer', 'overwatch', 'phantom',
    'precision', 'predator', 'reconnaissance', 'recondite', 'saboteur', 'safecracker', 'scalpel', 'sentinel',
    'shadowfall', 'shadowrunner', 'sharpshooter', 'silencer', 'silent', 'sniper', 'sniperfire', 'specialist',
    'specops', 'spectrum', 'stalker', 'stealth', 'strategist', 'subterfuge', 'subversion', 'subversive',
    'surveillance', 'tactical', 'terminator', 'tracerbullet', 'trailblazer', 'unseen', 'vanguard', 'vigilante',
    'vipershot', 'warlord', 'whisper', 'windtalker', 'zeroerror',
  ],

  // Boss Battle Boss Tactical Phrases (Targeted short attack codes)
  bossPhrases: [
    'divert power to main shields',
    'engage plasma pulse cannons',
    'override defensive protocol',
    'bypass central neural core',
    'fire laser beam trajectory',
    'calibrate kinetic stabilizers',
    'recharge cybernetic armor',
    'disrupt mechanical power grid',
    'activate hyperdrive burst',
    'deploy emergency emp blast',
    'synchronize target coordinates',
    'counterstrike titan mainframe',
    'neutralize heavy artillery cannon',
    'target central armor power grid',
    'coordinate orbital laser strike',
    'destroy frontline weapons battery',
    'initiate primary shield overload',
    'fire concentrated antimatter blast',
    'deploy tactical defense matrix',
    'intercept incoming plasma salvo',
    'execute command override sequence',
    'recalibrate target optical sensors',
    'overcharge kinetic railgun battery',
    'disrupt enemy satellite telemetry',
    'deploy heavy assault combat squad',
    'neutralize ballistic projectile wave',
    'activate perimeter lockdown drill',
    'engage tactical jump thrusters',
    'focus defensive forcefield energy',
    'target commander propulsion core',
    'scramble tactical enemy frequencies',
    'launch auxiliary countermeasure drone',
    'breach armored hull outer shell',
    'fire heavy neutron laser barrage',
    'intercept enemy assault transports',
    'deploy titan suppression ordnance',
    'restore forward shield harmonics',
    'override automated defensive turrets',
    'initiate emergency power rerouting',
    'shatter commander defensive barrier',
    'target command bridge communications',
    'fire concentrated particle beam',
    'execute full tactical barrage',
    'neutralize enemy energy conduit',
    'synchronize auxiliary fire stations',
    'deploy reactive combat countermeasures',
    'strike primary power generator',
    'disrupt orbital targeting array',
    'overload central weapons processor',
    'execute emergency tactical retreat',
    'target heavy artillery munitions',
    'divert auxiliary core cooling',
    'activate vanguard shield barrier',
    'disable commander offensive laser',
    'fire high yield proton torpedo',
    'counterstrike advancing assault wave',
    'shatter frontline armor plating',
    'coordinate synchronized sniper strike',
    'override secondary turret control',
    'execute perimeter defensive surge',
  ],
};

/**
 * Validates vocabulary integrity: no empties, valid lowercase/spaces, uniqueness count
 */
export function validateVocabulary() {
  const categoryCounts = {};
  const allWords = [];
  const errors = [];

  for (const [cat, words] of Object.entries(ARCADE_VOCABULARY)) {
    if (!Array.isArray(words) || words.length === 0) {
      errors.push(`Category ${cat} is empty or not an array.`);
      continue;
    }

    const uniqueSet = new Set();
    for (const w of words) {
      if (typeof w !== 'string' || w.trim() === '') {
        errors.push(`Invalid entry in ${cat}: "${w}"`);
        continue;
      }
      if (!/^[a-z\s-]+$/.test(w)) {
        errors.push(`Entry contains invalid characters in ${cat}: "${w}"`);
      }
      uniqueSet.add(w.toLowerCase().trim());
      allWords.push(w.toLowerCase().trim());
    }

    categoryCounts[cat] = uniqueSet.size;
  }

  const totalUnique = new Set(allWords).size;

  return {
    valid: errors.length === 0 && totalUnique >= 2000,
    totalUnique,
    categoryCounts,
    errors,
  };
}

/**
 * Returns a flattened array of all unique words and phrases
 */
export function getAllVocabulary() {
  const set = new Set();
  for (const words of Object.values(ARCADE_VOCABULARY)) {
    for (const w of words) {
      set.add(w.toLowerCase().trim());
    }
  }
  return Array.from(set);
}

/**
 * Fisher-Yates array shuffle using injected or standard random function
 */
export function shuffleArray(array, randomFn = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Cross-run recent history memory to avoid immediate repeats across new game starts
 */
const STORAGE_RECENT_KEY = 'KEYFLOW_ARCADE_RECENTS_V1';
const MAX_CROSS_RUN_RECENTS = 60;

export function getCrossRunRecentWords(gameId) {
  if (typeof window === 'undefined' || !window.sessionStorage) return [];
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_RECENT_KEY}_${gameId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCrossRunRecentWord(gameId, word) {
  if (typeof window === 'undefined' || !window.sessionStorage || !word) return;
  try {
    const current = getCrossRunRecentWords(gameId);
    const updated = [word, ...current.filter((w) => w !== word)].slice(0, MAX_CROSS_RUN_RECENTS);
    window.sessionStorage.setItem(`${STORAGE_RECENT_KEY}_${gameId}`, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * ArcadeWordDeck: Reusable anti-repetition card-deck system
 */
export class ArcadeWordDeck {
  constructor({
    gameId = 'general',
    pool = null,
    recentHistorySize = 35,
    randomFn = Math.random,
  } = {}) {
    this.gameId = gameId;
    this.randomFn = randomFn;
    this.recentHistorySize = recentHistorySize;
    this.recentHistory = [];
    this.deck = [];
    this.lastDrawn = null;

    // Load initial cross-run history if available
    const crossRun = getCrossRunRecentWords(gameId);
    if (crossRun.length > 0) {
      this.recentHistory = crossRun.slice(0, Math.floor(recentHistorySize / 2));
    }

    if (pool && pool.length > 0) {
      this.setPool(pool);
    }
  }

  /**
   * Set or update vocabulary pool without losing run stability
   */
  setPool(newPool) {
    if (!newPool || newPool.length === 0) return;
    this.pool = Array.from(new Set(newPool.map((w) => w.toLowerCase().trim())));
    this.refillDeck();
  }

  /**
   * Refill the deck from pool, excluding recently used words and preventing
   * boundary duplicate repeats with the last drawn word.
   */
  refillDeck() {
    if (!this.pool || this.pool.length === 0) return;

    // Filter out words in recent history if possible
    let available = this.pool.filter((w) => !this.recentHistory.includes(w));
    if (available.length < 5) {
      // Pool is exhausted or history too restrictive: shrink recent history
      this.recentHistory = this.recentHistory.slice(-Math.floor(this.recentHistorySize / 4));
      available = this.pool.filter((w) => !this.recentHistory.includes(w));
      if (available.length === 0) {
        available = [...this.pool];
      }
    }

    let shuffled = shuffleArray(available, this.randomFn);

    // Prevent boundary duplicate: ensure first card is not identical to lastDrawn
    if (shuffled.length > 1 && shuffled[0] === this.lastDrawn) {
      const swapIdx = Math.floor(this.randomFn() * (shuffled.length - 1)) + 1;
      [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
    }

    this.deck = shuffled;
  }

  /**
   * Draw the next word from the deck, ensuring it is not in excludeList (e.g. on-screen words)
   */
  draw(excludeList = []) {
    if (!this.pool || this.pool.length === 0) return 'keyflow';

    if (this.deck.length === 0) {
      this.refillDeck();
    }

    const excludes = new Set(excludeList.map((w) => (typeof w === 'string' ? w.toLowerCase() : w)));

    // Search from top of deck for candidate not currently on screen
    let candidateIndex = -1;
    for (let i = 0; i < this.deck.length; i++) {
      if (!excludes.has(this.deck[i])) {
        candidateIndex = i;
        break;
      }
    }

    let word;
    if (candidateIndex !== -1) {
      word = this.deck.splice(candidateIndex, 1)[0];
    } else {
      // All cards in remaining deck are excluded; take the top card or refill
      word = this.deck.shift() || this.pool[0];
    }

    this.lastDrawn = word;
    this.recentHistory.push(word);
    if (this.recentHistory.length > this.recentHistorySize) {
      this.recentHistory.shift();
    }

    saveCrossRunRecentWord(this.gameId, word);
    return word;
  }

  /**
   * Reset run-specific state cleanly for replay
   */
  resetRun() {
    this.recentHistory = [];
    this.lastDrawn = null;
    this.refillDeck();
  }
}

/**
 * Returns difficulty-aware vocabulary pool tailored to game mechanics and intensity tier (1 to 6)
 */
export function getVocabularyPool(gameId, tier = 1) {
  const safeTier = Math.max(1, Math.min(6, tier));

  switch (gameId) {
    case 'cascade': {
      // Key Cascade: starts with short words that can fall safely, escalates to medium/tech
      if (safeTier === 1) {
        return [...ARCADE_VOCABULARY.beginnerShort.filter((w) => w.length <= 4)];
      }
      if (safeTier === 2) {
        return [
          ...ARCADE_VOCABULARY.beginnerShort,
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length <= 5),
        ];
      }
      if (safeTier === 3) {
        return [
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length >= 4 && w.length <= 6),
          ...ARCADE_VOCABULARY.mediumWords.filter((w) => w.length <= 6),
        ];
      }
      if (safeTier === 4) {
        return [
          ...ARCADE_VOCABULARY.mediumWords,
          ...ARCADE_VOCABULARY.technology.filter((w) => w.length <= 7),
          ...ARCADE_VOCABULARY.nature.filter((w) => w.length <= 7),
        ];
      }
      if (safeTier === 5) {
        return [
          ...ARCADE_VOCABULARY.mediumWords,
          ...ARCADE_VOCABULARY.science.filter((w) => w.length <= 8),
          ...ARCADE_VOCABULARY.space.filter((w) => w.length <= 8),
          ...ARCADE_VOCABULARY.commonLetterCombinations.filter((w) => w.length <= 8),
        ];
      }
      // Tier 6: expert / master
      return [
        ...ARCADE_VOCABULARY.longAdvanced.filter((w) => w.length <= 10),
        ...ARCADE_VOCABULARY.difficultCombinations.filter((w) => w.length <= 9),
        ...ARCADE_VOCABULARY.technology,
      ];
    }

    case 'sprint': {
      // Speed Sprint: continuous rhythm and burst cadence
      if (safeTier <= 2) {
        return [
          ...ARCADE_VOCABULARY.beginnerShort,
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length <= 6),
        ];
      }
      if (safeTier <= 4) {
        return [
          ...ARCADE_VOCABULARY.commonEveryday,
          ...ARCADE_VOCABULARY.mediumWords,
          ...ARCADE_VOCABULARY.technology.filter((w) => w.length <= 8),
        ];
      }
      return [
        ...ARCADE_VOCABULARY.mediumWords,
        ...ARCADE_VOCABULARY.commonLetterCombinations,
        ...ARCADE_VOCABULARY.science,
        ...ARCADE_VOCABULARY.sports,
      ];
    }

    case 'hunter': {
      // Word Hunter: radar sweep scanning, distinct recognizable visual patterns
      if (safeTier <= 2) {
        return [
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length >= 4 && w.length <= 6),
          ...ARCADE_VOCABULARY.nature.filter((w) => w.length <= 6),
        ];
      }
      if (safeTier <= 4) {
        return [
          ...ARCADE_VOCABULARY.nature,
          ...ARCADE_VOCABULARY.space,
          ...ARCADE_VOCABULARY.adventure.filter((w) => w.length <= 7),
        ];
      }
      return [
        ...ARCADE_VOCABULARY.space,
        ...ARCADE_VOCABULARY.science,
        ...ARCADE_VOCABULARY.difficultCombinations.filter((w) => w.length <= 8),
      ];
    }

    case 'ninja': {
      // Key Ninja: fast projectile motion, punchy action words
      if (safeTier <= 2) {
        return [
          ...ARCADE_VOCABULARY.beginnerShort.filter((w) => w.length >= 3),
          ...ARCADE_VOCABULARY.sports.filter((w) => w.length <= 6),
        ];
      }
      if (safeTier <= 4) {
        return [
          ...ARCADE_VOCABULARY.sports,
          ...ARCADE_VOCABULARY.adventure.filter((w) => w.length <= 7),
          ...ARCADE_VOCABULARY.technology.filter((w) => w.length <= 6),
        ];
      }
      return [
        ...ARCADE_VOCABULARY.adventure,
        ...ARCADE_VOCABULARY.difficultCombinations.filter((w) => w.length <= 8),
        ...ARCADE_VOCABULARY.commonLetterCombinations.filter((w) => w.length <= 8),
      ];
    }

    case 'runner': {
      // Word Runner: hurdle pacing, side-scrolling rhythm
      if (safeTier <= 2) {
        return [
          ...ARCADE_VOCABULARY.beginnerShort.filter((w) => w.length >= 3 && w.length <= 4),
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length <= 5),
        ];
      }
      if (safeTier <= 4) {
        return [
          ...ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length >= 4 && w.length <= 6),
          ...ARCADE_VOCABULARY.sports.filter((w) => w.length <= 6),
          ...ARCADE_VOCABULARY.technology.filter((w) => w.length <= 6),
        ];
      }
      return [
        ...ARCADE_VOCABULARY.mediumWords.filter((w) => w.length >= 5 && w.length <= 7),
        ...ARCADE_VOCABULARY.commonLetterCombinations.filter((w) => w.length <= 7),
      ];
    }

    case 'memory': {
      // Typing Memory: clear unambiguous keywords with controlled sequence complexity
      if (safeTier <= 2) {
        return ARCADE_VOCABULARY.beginnerShort.filter((w) => w.length === 3 || w.length === 4);
      }
      if (safeTier <= 4) {
        return ARCADE_VOCABULARY.commonEveryday.filter((w) => w.length >= 4 && w.length <= 5);
      }
      return ARCADE_VOCABULARY.mediumWords.filter((w) => w.length >= 5 && w.length <= 6);
    }

    case 'boss': {
      // Boss Battle: military combat classes + boss phrases
      return [
        ...ARCADE_VOCABULARY.militaryInfantry,
        ...ARCADE_VOCABULARY.militaryAssault,
        ...ARCADE_VOCABULARY.militaryArmored,
        ...ARCADE_VOCABULARY.militaryElite,
      ];
    }

    default:
      return ARCADE_VOCABULARY.commonEveryday;
  }
}
