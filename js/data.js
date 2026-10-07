'use strict';
/* =========================================================
   AREAS (street layout is fictional, street names are real)
   ========================================================= */
const AREAS = [
  {id:'ikeja',    city:'Lagos',         name:'Ikeja',         region:'sw',  cost:1.2,  market:'Computer Village Market', greet:'Bawo ni',    streets:['Allen Avenue','Obafemi Awolowo Way','Opebi Road','Toyin Street','Adeniyi Jones Avenue','Oba Akran Avenue']},
  {id:'yaba',     city:'Lagos',         name:'Yaba',          region:'sw',  cost:1.0,  market:'Tejuosho Market',         greet:'Bawo ni',    streets:['Herbert Macaulay Way','Murtala Muhammed Way','Commercial Avenue','Montgomery Road','Akoka Road','Ojuelegba Road']},
  {id:'surulere', city:'Lagos',         name:'Surulere',      region:'sw',  cost:1.0,  market:'Surulere Market',         greet:'Bawo ni',    streets:['Adeniran Ogunsanya Street','Bode Thomas Street','Ogunlana Drive','Western Avenue','Eric Moore Road','Akerele Street']},
  {id:'lekki',    city:'Lagos',         name:'Lekki Phase 1', region:'sw',  cost:1.6,  market:'Lekki Market',            greet:'How far',    streets:['Admiralty Way','Lekki-Epe Expressway','Fola Osibo Road','Freedom Way','Durosimi Etti Drive','Chevron Drive']},
  {id:'wuse',     city:'Abuja',         name:'Wuse 2',        region:'fct', cost:1.5,  market:'Wuse Market',             greet:'Sannu',      streets:['Aminu Kano Crescent','Adetokunbo Ademola Crescent','Ahmadu Bello Way','Herbert Macaulay Way','Obafemi Awolowo Way','Ladoke Akintola Boulevard']},
  {id:'bodija',   city:'Ibadan',        name:'Bodija',        region:'sw',  cost:0.85, market:'Bodija Market',           greet:'E kaabo',    streets:['Awolowo Avenue','Ring Road','Iwo Road','Oyo Road','Polytechnic Road','Lagos-Ibadan Expressway']},
  {id:'ph',       city:'Port Harcourt', name:'Rumuola',       region:'ss',  cost:1.1,  market:'Mile One Market',         greet:'How market', streets:['Aba Road','Ikwerre Road','Olu Obasanjo Road','Rumuola Road','Woji Road','Stadium Road']},
  {id:'kano',     city:'Kano',          name:'Nassarawa GRA', region:'nw',  cost:0.8,  market:'Kurmi Market',            greet:'Sannu',      streets:['Murtala Mohammed Way','Zoo Road','Bompai Road','Ibrahim Taiwo Road','Zaria Road','Club Road']},
  {id:'enugu',    city:'Enugu',         name:'New Haven',     region:'se',  cost:0.85, market:'Ogbete Market',           greet:'Kedu',       streets:['Ogui Road','Okpara Avenue','Zik Avenue','Agbani Road','Abakaliki Road','Chime Avenue']}
];
let AREA = AREAS[0];

/* Family names and hometowns by region */
const REGIONS = {
  sw:  {surnames:['Adeyemi','Balogun','Ogunleye','Adebayo','Akinola','Olawale','Oyelaran'], male:['Adewale','Olusegun','Kunle','Babatunde','Femi'], female:['Folake','Adunni','Yetunde','Bukola','Funmi'], kidsM:['Tobi','Seyi','Damilola','Ayo','Kayode'], kidsF:['Tolu','Simi','Ife','Bimpe','Dami'], towns:['Abeokuta','Osogbo','Ogbomoso','Ilesa'], travel:15000},
  se:  {surnames:['Okafor','Eze','Nwosu','Okonkwo','Obi','Chukwu'], male:['Chukwuemeka','Obinna','Ikechukwu','Nnamdi'], female:['Chinwe','Adaeze','Ifeoma','Nneka'], kidsM:['Chidi','Kene','Somto','Ebuka'], kidsF:['Ada','Nkechi','Uju','Ebube'], towns:['Nsukka','Awka','Onitsha','Abakaliki'], travel:12000},
  ss:  {surnames:['Amadi','Briggs','Wokoma','Ihunwo','Opara','George'], male:['Tamuno','Ibinabo','Godwin','Boma'], female:['Ibiere','Ebiere','Blessing','Data'], kidsM:['Tonye','Sotonye','Daniel','Precious'], kidsF:['Tamara','Grace','Ibim','Miebi'], towns:['Owerri','Bori','Yenagoa','Uyo'], travel:14000},
  nw:  {surnames:['Bello','Musa','Abubakar','Danjuma','Usman','Garba'], male:['Ibrahim','Abdullahi','Sani','Aliyu'], female:['Hauwa','Fatima','Hadiza','Maryam'], kidsM:['Umar','Kabir','Nasiru','Bashir'], kidsF:['Amina','Khadija','Rukayya','Safiya'], towns:['Katsina','Zaria','Dutse','Kaduna'], travel:12000},
  fct: {surnames:['Danladi','Okoro','Adamu','Ojo','Yakubu','Etim'], male:['Daniel','Yakubu','Samuel','Emmanuel'], female:['Comfort','Esther','Halima','Patience'], kidsM:['David','Joshua','Habib','Victor'], kidsF:['Mercy','Ruth','Hannah','Lami'], towns:['Jos','Lokoja','Keffi','Minna'], travel:16000}
};

/* =========================================================
   GAME DATA
   ========================================================= */
const ITEMS = {
  bread:       {name:'Agege Bread',       price:1500, food:25, energy:3},
  indomie:     {name:'Indomie & Egg',     price:1500, food:30, energy:4},
  garri:       {name:'Garri & Groundnut', price:800,  food:18, energy:2},
  water:       {name:'Pure Water (bag)',  price:500,  food:5,  energy:3, health:1},
  malt:        {name:'Malt Drink',        price:700,  food:8,  energy:6},
  suya:        {name:'Suya Wrap',         price:2500, food:30, energy:5},
  paracetamol: {name:'Paracetamol',       price:600,  health:10},
  vitamins:    {name:'Multivitamins',     price:3500, health:20}
};
const MARKET_ITEMS = ['bread','indomie','garri','water','malt','suya'];
const PHARM_ITEMS = ['paracetamol','vitamins'];

/* Question banks: correct answer is ALWAYS index 0 (options get shuffled when drawn) */
const Q_JAMB = [
  ['Nigeria gained independence in which year?', ['1960','1963','1957','1970']],
  ['What is the capital of Nigeria?', ['Abuja','Lagos','Kaduna','Ibadan']],
  ["Choose the word closest in meaning to 'ABUNDANT':", ['Plentiful','Scarce','Rare','Empty']],
  ["Choose the opposite of 'GENEROUS':", ['Stingy','Kind','Liberal','Charitable']],
  ['What is 15% of 2,000?', ['300','150','200','350']],
  ['Which is the longest river in Nigeria?', ['River Niger','River Benue','Ogun River','Cross River']],
  ['Solve: 3x + 5 = 20. What is x?', ['5','4','6','15']],
  ['Which of these words is a noun?', ['Happiness','Quickly','Beautiful','Run']],
  ['The chemical formula for water is:', ['H₂O','CO₂','O₂','NaCl']],
  ['How many states are in Nigeria?', ['36','30','37','19']],
  ['Nigeria became a republic in:', ['1963','1960','1966','1979']],
  ['Which of these is a prime number?', ['17','21','27','15']],
  ["'She ___ to school every day.' Choose the correct option:", ['goes','go','going','gone']],
  ['What is the square root of 144?', ['12','14','11','16']]
];
const Q_CS = [
  ['What does CPU stand for?', ['Central Processing Unit','Computer Personal Unit','Central Program Utility','Core Processing Utility']],
  ['Which number system uses only 0 and 1?', ['Binary','Decimal','Octal','Hexadecimal']],
  ['Which of these is a programming language?', ['Python','Photoshop','Excel','Windows']],
  ['What does RAM stand for?', ['Random Access Memory','Read Access Memory','Run All Memory','Rapid Action Module']],
  ['1 byte is equal to how many bits?', ['8','4','16','2']],
  ['Which data structure is First-In-First-Out (FIFO)?', ['Queue','Stack','Tree','Graph']],
  ['What does SQL stand for?', ['Structured Query Language','Simple Question Language','Sequential Query Logic','Standard Quick Language']],
  ['Which of these is an operating system?', ['Linux','MySQL','Python','Photoshop']],
  ['The time complexity of binary search is:', ['O(log n)','O(n)','O(n²)','O(1)']],
  ['HTML is mainly used to:', ['Structure web pages','Store databases','Compile programs','Design circuits']]
];
const Q_ACCT = [
  ['The accounting equation is:', ['Assets = Liabilities + Equity','Assets = Income − Expenses','Liabilities = Assets + Equity','Equity = Assets + Liabilities']],
  ['An increase in an asset is recorded as a:', ['Debit','Credit','Loss','Liability']],
  ["Which statement shows a company's financial position at a point in time?", ['Balance sheet','Income statement','Cash flow forecast','Sales ledger']],
  ['Depreciation is the:', ['Reduction in value of a non-current asset over time','Increase in cash','Payment of tax','Interest on loans']],
  ['Which of these is a liability?', ['Bank loan','Cash','Inventory','Equipment']],
  ['Revenue minus expenses equals:', ['Profit','Capital','Assets','Drawings']],
  ['The professional body for chartered accountants in Nigeria is:', ['ICAN','NBA','NMA','COREN']],
  ['A trial balance is prepared mainly to:', ['Check the arithmetical accuracy of the ledger','Calculate tax','Pay salaries','Record sales']],
  ['Drawings by the owner reduce:', ['Capital','Liabilities','Revenue','Expenses']]
];
const Q_MASS = [
  ['The press is often called the:', ['Fourth Estate','Third Arm','First Estate','Fifth Column']],
  ["Nigeria's first television station, WNTV, was located in:", ['Ibadan','Lagos','Kaduna','Enugu']],
  ['The body that regulates broadcasting in Nigeria is:', ['NBC','NCC','NAFDAC','NPC']],
  ["In news writing, the 'inverted pyramid' means:", ['The most important facts come first','The main point comes last','Quotes come first','Headlines are written last']],
  ["Which is NOT one of the journalist's 5Ws?", ['Whose','Who','When','Where']],
  ['A press release is mainly a tool of:', ['Public relations','Film editing','Printing','Sound engineering']],
  ["'Libel' refers to:", ['Written defamation','Spoken defamation','Copyright theft','A fake advert']],
  ['The opening paragraph of a news story is called the:', ['Lead (intro)','Byline','Masthead','Caption']],
  ["The 'gatekeeper' in mass communication decides:", ['What news gets published','Who enters the studio','Station security','Advert prices']]
];
const Q_MECH = [
  ['The SI unit of force is the:', ['Newton','Joule','Watt','Pascal']],
  ['"Energy cannot be created or destroyed" is the:', ['First law of thermodynamics','Second law of thermodynamics',"Newton's third law","Hooke's law"]],
  ['Torque is calculated as:', ['Force × perpendicular distance','Mass × acceleration','Work ÷ time','Force ÷ area']],
  ['A four-stroke petrol engine works on the:', ['Otto cycle','Diesel cycle','Rankine cycle','Brayton cycle']],
  ['The SI unit of power is the:', ['Watt','Newton','Joule','Pascal']],
  ['Pressure is defined as:', ['Force per unit area','Mass per unit volume','Work per unit time','Force × distance']],
  ['Which material is a good conductor of heat?', ['Copper','Wood','Rubber','Glass']],
  ["Hooke's law relates:", ['Force and extension of a spring','Pressure and volume','Voltage and current','Heat and work']],
  ['The council that regulates engineering practice in Nigeria is:', ['COREN','ICAN','NBA','NUC']]
];
const Q_MICRO = [
  ['Penicillin was discovered by:', ['Alexander Fleming','Louis Pasteur','Robert Koch','Edward Jenner']],
  ['Malaria is caused by:', ['Plasmodium','Salmonella','Candida','Influenza virus']],
  ['Spherical-shaped bacteria are called:', ['Cocci','Bacilli','Spirilla','Vibrios']],
  ['After Gram staining, Gram-positive bacteria appear:', ['Purple','Pink','Green','Yellow']],
  ['An autoclave typically sterilizes at:', ['121°C','60°C','37°C','200°C']],
  ['Typhoid fever is caused by:', ['Salmonella Typhi','Vibrio cholerae','Plasmodium falciparum','Candida albicans']],
  ['Viruses can only multiply:', ['Inside living host cells','On agar plates','In sunlight','In dry air']],
  ['Who first observed microorganisms with a microscope?', ['Antonie van Leeuwenhoek','Isaac Newton','Charles Darwin','Gregor Mendel']],
  ['Antibiotics are effective against:', ['Bacteria','Viruses','All diseases','Allergies']],
  ['The optimum temperature for most human pathogens is about:', ['37°C','10°C','70°C','100°C']]
];
const Q_INTERVIEW = [
  ['"Tell us about yourself."', ['I summarize my education, skills and what I can offer this company','I talk about my village and family matters','"It is all on my CV."','I ask how much the salary is']],
  ['"Why should we hire you?"', ["I have the right skills, I learn fast and I'm committed to results",'Because I really need money','My uncle knows your MD','I am not sure']],
  ['"Where do you see yourself in 5 years?"', ['Growing into a senior role here and adding more value','Out of this company','Abroad. I go japa','I have not thought about it']],
  ['"What is your greatest weakness?"', ["I sometimes take on too much, but I'm learning to delegate",'I have no weakness at all','I am always late','I hate working under pressure']],
  ['"You disagree with your manager. What do you do?"', ['Discuss it respectfully with facts and respect the final decision','Argue loudly in the office','Post about it on social media','Ignore the instruction']],
  ['"How do you handle pressure?"', ['I prioritize tasks, plan my time and stay calm','I panic','I leave the work for later','I blame my colleagues']],
  ['"Do you have any questions for us?"', ['Yes. What does success look like in this role?','No','When is pay day?','Can I resume next year?']],
  ['"You made a costly mistake at work. What next?"', ['Own it, report it quickly and help fix it','Hide it','Blame the intern','Resign immediately']]
];
const DEPTS = {
  cs:    {name:'Computer Science',       bank:Q_CS,    job:'Software Developer'},
  acct:  {name:'Accounting',             bank:Q_ACCT,  job:'Accountant'},
  mass:  {name:'Mass Communication',     bank:Q_MASS,  job:'TV Journalist'},
  mech:  {name:'Mechanical Engineering', bank:Q_MECH,  job:'Mechanical Engineer'},
  micro: {name:'Microbiology',           bank:Q_MICRO, job:'Lab Scientist'}
};
const JOBS = [
  {id:'labourer',   name:'Site Labourer',       pay:8000,  energy:35, hours:8},
  {id:'sales',      name:'Shop Sales Rep',      pay:12000, energy:25, hours:8, interview:true},
  {id:'okada',      name:'Okada Rider',         pay:18000, energy:40, hours:8, needsOkada:true},
  {id:'teller',     name:'Bank Teller',         pay:35000, energy:25, hours:8, degree:true, nysc:true, cv:true, interview:true},
  {id:'dev',        name:'Software Developer',  pay:60000, energy:25, hours:8, dept:'cs',    nysc:true, cv:true, interview:true},
  {id:'accountant', name:'Accountant',          pay:50000, energy:25, hours:8, dept:'acct',  nysc:true, cv:true, interview:true},
  {id:'journalist', name:'TV Journalist',       pay:45000, energy:30, hours:8, dept:'mass',  nysc:true, cv:true, interview:true},
  {id:'engineer',   name:'Mechanical Engineer', pay:55000, energy:35, hours:8, dept:'mech',  nysc:true, cv:true, interview:true},
  {id:'labsci',     name:'Lab Scientist',       pay:45000, energy:25, hours:8, dept:'micro', nysc:true, cv:true, interview:true}
];
const JOB = {}; JOBS.forEach(j => JOB[j.id] = j);
const HUSTLES = [
  {id:'water',  name:'Hawk pure water 💧',     min:3000,  max:6000,  energy:25, hours:4},
  {id:'pos',    name:'POS agent 🏧',           min:8000,  max:20000, energy:20, hours:6, kit:'pos', kitName:'POS machine', kitCost:150000},
  {id:'phone',  name:'Phone repair 📱',        min:10000, max:25000, energy:20, hours:5, skill:'phone', skillName:'Phone repair training', skillCost:60000},
  {id:'design', name:'Graphic design gigs 🎨', min:15000, max:35000, energy:20, hours:5, skill:'design', skillName:'Graphic design training', skillCost:100000},
  {id:'tutor',  name:'Private tutoring 📖',    min:8000,  max:15000, energy:20, hours:3, req:'student'},
  {id:'code',   name:'Freelance coding 💻',    min:30000, max:80000, energy:25, hours:6, req:'cs'}
];
const HOUSING = [
  {name:'Face-me-I-face-you room', rent:25000,  sleep:70,  rep:0},
  {name:'Self-contain',            rent:60000,  sleep:90,  rep:3},
  {name:'Mini flat',               rent:120000, sleep:100, rep:6},
  {name:'2-Bedroom flat',          rent:350000, sleep:100, rep:12}
];
const NEWS = [
  {h:'Fuel price jumps again at filling stations', mod:1.15},
  {h:'CBN holds interest rate steady, markets calm', mod:1.0},
  {h:'Tomato scarcity hits markets nationwide', mod:1.2},
  {h:'Bumper harvest: food prices ease in markets', mod:0.9},
  {h:'Naira gains slightly against the dollar', mod:0.95},
  {h:'Transport unions call off planned strike', mod:1.0},
  {h:'Heavy rainfall causes gridlock across the city', mod:1.05},
  {h:'Police announce crackdown on internet fraud', mod:1.0, heat:true},
  {h:'Super Eagles win friendly, fans jubilate', mod:1.0},
  {h:'Electricity tariff review sparks debate', mod:1.08},
  {h:'Traders protest new market levy', mod:1.1},
  {h:'Rice importers report bigger shipments', mod:0.92},
  {h:'Tech startups announce new hiring drive', mod:1.0},
  {h:'Road safety corps warns pedestrians: use zebra crossings', mod:1.0},
  {h:'Diesel scarcity: generators go quiet in some areas', mod:1.12}
];
const POLICE_NAMES = ['Sgt. Okon','Cpl. Bello','Insp. Adeyemi'];
const LINES = [
  'How far? Hope body dey inside cream?',
  'This traffic go kill person o!',
  'Abeg, you get change for ₦1,000?',
  'Na God dey run am, my brother.',
  'Hustle no dey stop, sha.',
  'I hear say fuel price don go up again.',
  "Shey you don chop today? Mama Nkechi's buka dey sweet!",
  'Make we see for Chill Spot this evening.',
  "You don register your NIN? Bank no go gree without am.",
  'School fees don cost, but education na key.',
  'My guy, avoid that Yahoo work o. Police dey everywhere.',
  'Abeg cross for zebra crossing o. These drivers no dey look.',
  'If you wan pass interview, cut your hair and dress sharp.'
];
const POLICE_LINES = [
  'Move along, my friend. Everything dey under control.',
  'We dey watch everybody wey dey do Yahoo for this area.',
  'Carry your ID card everywhere. You hear?',
  'Cross at the zebra crossing. Accident no get part two.'
];
const TIPS = [
  'Gist about topics people like. You learn their interests after a good conversation.',
  'Call your family from your phone. Ignoring them has consequences.',
  'Different people enjoy different outings. A frugal person hates a wasteful date.',
  'Happiness matters. Friends, family, worship and good food all lift your mood.',
  "Hungry? Eat at Mama Nkechi's Buka, or buy food at the market and eat it from your Bag.",
  'Follow the yellow dots on the ground. They lead you to your next goal.',
  'Cross roads only at zebra crossings (white stripes). Cars stop for you there.',
  'Traffic lights at every junction tell cars when to stop.',
  'Enrol for your NIN at the NIMC Enrolment Centre before you write JAMB, bank or serve NYSC.',
  'Attend lectures before exams. Each extra lecture gives you a hint.',
  'After 300L you must do SIWES at the Business Hub.',
  'Get a haircut at Kutz before an interview. It helps.'
];


/* =========================================================
   GOVERNMENT PROCESSES (data-driven: update fees here)
   ========================================================= */
const GOV = {
  nin:  {office:'nimc', fee:0, waitDays:1, mins:180, open:[8, 16]},
  jamb: {fee:7700, cutoff:200, needsNIN:true},
  uni:  {acceptance:200000, fees:150000, carryover:20000},
  nysc: {allawee:77000},
  police: {bail:250000, lawyer:500000}
};

/* Gifts (bought at the market, given to people) */
Object.assign(ITEMS, {
  chocolate: {name:'Chocolate & card',   price:5000,  gift:5},
  flowers:   {name:'Bouquet of flowers', price:9000,  gift:7},
  perfume:   {name:'Designer perfume',   price:28000, gift:13},
  watch:     {name:'Wristwatch',         price:70000, gift:22}
});
const GIFT_ITEMS = ['chocolate','flowers','perfume','watch'];
const PHONE_PRICE = 85000;

/* =========================================================
   PERSONALITY, TOPICS AND PEOPLE
   ========================================================= */
const TRAITS = {
  ambitious:     {label:'Ambitious',               icon:'🚀', desc:'Likes people with goals: studying, working or building something.'},
  family:        {label:'Family-oriented',         icon:'👪', desc:'Values commitment, family and a stable future.'},
  materialistic: {label:'Materialistic',           icon:'💎', desc:'Cares about money, nice gifts and fancy outings.'},
  religious:     {label:'Religious',               icon:'🙏', desc:'Values faith. Prefers someone of the same religion who worships.'},
  educated:      {label:'Educated',                icon:'🎓', desc:'Values education and intelligent conversation.'},
  introvert:     {label:'Introverted',             icon:'📚', desc:'Warms up slowly. Prefers quiet outings.'},
  social:        {label:'Social',                  icon:'🎉', desc:'Loves outings, music and gist. Warms up fast.'},
  jealous:       {label:'Jealous',                 icon:'😒', desc:'Gets upset easily. Will not tolerate cheating.'},
  loyal:         {label:'Loyal',                   icon:'🤝', desc:'Steady and committed. Forgives small mistakes.'},
  frugal:        {label:'Financially responsible', icon:'💰', desc:'Dislikes reckless spending. Respects savers.'}
};
const TOPICS = {
  career:'Career & goals 💼', business:'Business & hustle 📈', money:'Money matters 💵', faith:'Faith & religion 🙏',
  family:'Family 👪', tech:'Tech & gadgets 💻', football:'Football ⚽', music:'Afrobeats & music 🎶',
  fashion:'Fashion & style 👗', politics:'Politics & news 📰', food:'Food 🍲'
};
const STAGE_LABEL = {stranger:'Stranger', acquaintance:'Acquaintance', friend:'Friend', close:'Close friend', talking:'Talking stage 💬', dating:'Dating ❤️', serious:'Serious relationship 💑', ex:'Ex 💔'};

// All NPCs are adults. taken = already married (friendship only).
const NPCS = [
  {id:'chinedu', name:'Chinedu', g:'m', age:27, role:'Trader',             rel:'christian', traits:['ambitious','materialistic'],        likes:['business','football','money'], dislikes:'politics', home:'market'},
  {id:'aisha',   name:'Aisha',   g:'f', age:21, role:'Student',            rel:'muslim',    traits:['educated','religious','introvert'], likes:['tech','faith','career'],       dislikes:'football', home:'uni'},
  {id:'tunde',   name:'Tunde',   g:'m', age:30, role:'Okada rider',        rel:'muslim',    traits:['social','loyal'],                   likes:['football','music','food'],     dislikes:'tech',     home:'motors'},
  {id:'ngozi',   name:'Ngozi',   g:'f', age:29, role:'Lecturer',           rel:'christian', traits:['educated','ambitious','frugal'],    likes:['career','politics','tech'],    dislikes:'fashion',  home:'uni'},
  {id:'emeka',   name:'Emeka',   g:'m', age:33, role:'Banker',             rel:'christian', traits:['ambitious','frugal'],               likes:['money','business','football'], dislikes:'music',    home:'bank', taken:true},
  {id:'bisi',    name:'Bisi',    g:'f', age:24, role:'Fashion designer',   rel:'christian', traits:['social','materialistic'],           likes:['fashion','music','food'],      dislikes:'politics', home:'barber'},
  {id:'musa',    name:'Musa',    g:'m', age:26, role:'Mechanic',           rel:'muslim',    traits:['loyal','family','religious'],       likes:['football','family','faith'],   dislikes:'fashion',  home:'motors'},
  {id:'funke',   name:'Funke',   g:'f', age:27, role:'Nurse',              rel:'christian', traits:['family','loyal','religious'],       likes:['family','faith','food'],       dislikes:'money',    home:'hospital'},
  {id:'ifeanyi', name:'Ifeanyi', g:'m', age:24, role:'Software developer', rel:'christian', traits:['educated','introvert','ambitious'], likes:['tech','career','music'],       dislikes:'fashion',  home:'jobs'},
  {id:'zainab',  name:'Zainab',  g:'f', age:25, role:'Hairdresser',        rel:'muslim',    traits:['social','jealous'],                 likes:['fashion','music','family'],    dislikes:'tech',     home:'barber'},
  {id:'segun',   name:'Segun',   g:'m', age:24, role:'Corper',             rel:'christian', traits:['social','ambitious'],               likes:['politics','music','football'], dislikes:'food',     home:'nysc'},
  {id:'amaka',   name:'Amaka',   g:'f', age:26, role:'Caterer',            rel:'christian', traits:['frugal','family','jealous'],        likes:['food','business','family'],    dislikes:'politics', home:'mamaput'},
  {id:'kemi',    name:'Kemi',    g:'f', age:22, role:'Content creator',    rel:'christian', traits:['social','materialistic','ambitious'], likes:['fashion','music','money'],   dislikes:'politics', home:'cyber'},
  {id:'yusuf',   name:'Yusuf',   g:'m', age:28, role:'Civil servant',      rel:'muslim',    traits:['religious','frugal','family'],      likes:['politics','faith','family'],   dislikes:'music',    home:'lg'},
  {id:'chioma',  name:'Chioma',  g:'f', age:31, role:'Pharmacist',         rel:'christian', traits:['educated','loyal'],                 likes:['career','food','family'],      dislikes:'football', home:'hospital', taken:true},
  {id:'dayo',    name:'Dayo',    g:'m', age:25, role:'Photographer',       rel:'christian', traits:['social','materialistic'],           likes:['fashion','music','business'],  dislikes:'politics', home:'joint'}
];

/* Outings / dates */
const OUTINGS = [
  {id:'walk',    name:'Evening walk & gist 🚶🏾',        cost:0,     mins:90,  vibe:'quiet'},
  {id:'buka',    name:"Lunch at Mama Nkechi's 🍛",     cost:7000,  mins:90,  vibe:'casual', food:40},
  {id:'chill',   name:'Chill Spot: drinks & suya 🍻',   cost:18000, mins:150, vibe:'lively', food:20},
  {id:'cinema',  name:'Movie night at the cinema 🎬',   cost:22000, mins:180, vibe:'fun'},
  {id:'fancy',   name:'Fancy restaurant 🍷',            cost:55000, mins:180, vibe:'luxury', food:50},
  {id:'worship', name:'Attend service together 🙏',     cost:2000,  mins:120, vibe:'faith'}
];
const VIBE_PREF = {
  materialistic:{luxury:10, fun:4, quiet:-5, casual:-2},
  frugal:{luxury:-6, quiet:5, casual:3},
  introvert:{lively:-5, quiet:6, fun:2},
  social:{lively:7, fun:5, quiet:-2},
  religious:{faith:9, lively:-3},
  family:{casual:3, faith:3},
  ambitious:{luxury:3},
  educated:{fun:3, quiet:2}
};

/* Chat lines */
const CHAT = {
  checkMe:['How you dey? 😊','Hope your day is going well?','Just checking on you 👋🏾','How body?'],
  checkWarm:['I dey o! Thanks for checking on me 😊','Fine, thank God. How your side?',"I'm good! You don chop?",'All good. Work dey stress me small sha 😅'],
  checkCold:['Ok.',"I'm fine.",'👍','Hmm. Fine.'],
  callWarm:['You called just when I needed to talk 😊','We gist tire! 😂','Your voice sweet for phone o 😄','Thanks for calling, I appreciate it.'],
  flirtMe:['You looked so good today 😍',"I can't stop thinking about you 🥰",'Na you dey my mind all day ❤️','You make my day better, you know that? 😊'],
  flirtWarm:['Hehe you too sweet 🙈','Stop it jare 😂❤️','You dey make me blush o 😊','Na you be my favourite person 🥰'],
  flirtCold:['Ehn? Calm down abeg 😅','Lol ok...',"Hmm. Let's take am easy."],
  morningPartner:['Good morning dear ❤️','Did you sleep well? 😘','Thinking of you this morning 🥰','Have a blessed day, love ❤️'],
  friendPing:['How far? Long time o!','Make we link up this week 👊🏾',"You don japa abi? 😂 I never see you.",'How life dey treat you?'],
  money:['Ahh thank you so much! God bless you 🙏🏾','You no know how much this help me ❤️','Correct person! Thank you!'],
  birthday:['Happy birthday! 🎉 Long life and prosperity!','HBD! More money, more joy 🥳','Happy birthday dear! Enjoy your day 🎂'],
  declineOut:['I no free today o, maybe another time.','Today no good for me, sorry 🙏🏾','Hmm, I get plenty work today.'],
  agreeNum:["Sure! Here's my number 📱",'No wahala, save my number.','Oya, take my number 😊'],
  refuseNum:["Ehn... let's get to know each other first.",'I no dey give my number like that o 😅']
};

/* =========================================================
   RANDOM LIFE EVENTS
   w = weight (0 = only triggered by the game), cool = days before it can repeat,
   phone = arrives as a call/SMS (waits in 📱 notifications), ignore = option used if you don't respond
   ========================================================= */
const amtA = base => Math.round(base * AREA.cost / 1000) * 1000;
const EVENTS = [
  {id:'mumSick', w:3, cool:14, phone:true, ignore:2,
    ctx:() => ({amt:amtA(30000)}),
    title:() => 'Mum is calling 📞',
    body:c => `"${state.name}, my child, I have been down with malaria. The hospital bill is ${fmt(c.amt)}. Abeg help me."`,
    options:c => [
      opt('Send the full amount 💸', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; famRel('mum', 12); gain('happy', 3); gain('rep', 1); addHistory(`Paid Mum's hospital bill (${fmt(c.amt)})`, '💊'); return 'Mum: "God bless you, my child! You will never lack." ❤️'; }),
      opt('Send half', fmt(c.amt / 2), () => { if (!spendAny(c.amt / 2)) return false; famRel('mum', 4); return 'Mum: "Thank you. I will manage the rest."'; }),
      opt('Ignore the call', 'Keep your money', () => { famRel('mum', -15); gain('happy', -5); return 'Mum feels abandoned. The whole family heard about it.'; }, null, 'danger')
    ]},
  {id:'sibFees', w:2.5, cool:14, phone:true, ignore:2,
    cond:() => state.family.members.some(m => m.key.startsWith('sib') && famAge(m) < 23),
    ctx:() => { const s = shuffle(state.family.members.filter(m => m.key.startsWith('sib') && famAge(m) < 23))[0]; return {key:s.key, amt:amtA(famAge(s) < 18 ? 35000 : 80000)}; },
    title:c => `${fam(c.key).first} needs school fees 📞`,
    body:c => `Your ${fam(c.key).role.toLowerCase()} ${fam(c.key).first} called: "They said if I don't pay ${fmt(c.amt)} school fees this week, they will send me home. Please help me."`,
    options:c => [
      opt('Pay the full fees 🎓', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; famRel(c.key, 15); famRel('mum', 4); gain('happy', 3); addHistory(`Paid ${fam(c.key).first}'s school fees`, '🎓'); return `${fam(c.key).first}: "Thank you! I won't disappoint you!" 🥹`; }),
      opt('Pay half', fmt(c.amt / 2), () => { if (!spendAny(c.amt / 2)) return false; famRel(c.key, 5); return `${fam(c.key).first}: "Thank you. I'll beg Dad for the rest."`; }),
      opt('Tell them you have nothing', '', () => { famRel(c.key, -10); return `${fam(c.key).first} is disappointed.`; }, null, 'danger')
    ]},
  {id:'dadCall', w:2, cool:8, phone:true, ignore:0,
    title:() => 'Dad is calling 📞',
    body:() => `"${state.name}! How is ${AREA.city} treating you? Remember where you come from. Work hard, stay out of trouble and don't forget to pray."`,
    options:() => [opt('Thank him 🙏🏾', '+happiness, +family', () => { famRel('dad', 5); gain('happy', 4); return 'Dad: "Good. Take care of yourself."'; })]},
  {id:'familyGift', w:3, cool:10, phone:true, ignore:0,
    cond:() => state.money + state.bank < 40000 && famAvg() >= 55,
    title:() => 'Credit alert from home 💸',
    body:() => `Your father heard things are tight for you. He sent ${fmt(20000)}: "Take care of yourself, my child."`,
    options:() => [opt('Thank him', '+₦20,000', () => { state.bank += 20000; famRel('dad', 3); gain('happy', 5); return '₦20,000 has been added to your bank account.'; })]},
  {id:'phoneStolen', w:1.2, cool:20, ignore:1,
    cond:() => !state.noPhone && state.day > 3,
    ctx:() => ({amt:price(PHONE_PRICE)}),
    title:() => 'Your phone was snatched! 📵',
    body:() => 'A boy on a bike snatched your phone at the bus stop and disappeared into traffic.',
    options:c => [
      opt('Buy a new phone now', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; gain('happy', -3); return 'You bought a new phone and restored your contacts.'; }),
      opt('Manage without a phone', 'Buy one later at the market', () => { state.noPhone = true; gain('happy', -6); addHistory('Phone was stolen', '📵'); return `No calls or chats until you buy a new phone at ${AREA.market}.`; }, null, 'danger')
    ]},
  {id:'rentHike', w:1.5, cool:25, phone:true, ignore:0,
    title:() => 'Landlord is calling 🏠',
    body:() => '"Good afternoon. Because of the economy, rent is going up by 15% from next week. Nothing I fit do."',
    options:() => [
      opt('Accept the increase', 'Rent +15%', () => { state.rentMod = (state.rentMod || 1) * 1.15; return 'Your rent is now 15% higher.'; }),
      opt('Beg and negotiate 🙏🏾', 'Needs good reputation (60+)', () => {
        if (state.rep >= 60){ state.rentMod = (state.rentMod || 1) * 1.05; return 'Landlord: "Because you be good tenant, make it 5%."'; }
        state.rentMod = (state.rentMod || 1) * 1.15; gain('rep', -1); return 'Landlord: "No dulling me abeg. 15% it is."';
      })
    ]},
  {id:'bonus', w:2, cool:10, phone:true, ignore:0,
    cond:() => !!state.job,
    ctx:() => ({amt:JOB[state.job].pay * 3}),
    title:() => 'Bonus alert! 💰',
    body:c => `Your manager: "Great work this period. Here's a ${fmt(c.amt)} bonus."`,
    options:c => [opt('Collect bonus', '+' + fmt(c.amt), () => { state.bank += c.amt; gain('happy', 6); gain('rep', 1); addHistory(`Got a ${fmt(c.amt)} work bonus`, '💰'); return 'Bonus paid into your bank account.'; })]},
  {id:'flood', w:1, cool:20, ignore:1,
    ctx:() => ({amt:amtA(15000)}),
    title:() => 'Flood! 🌧️',
    body:() => 'Heavy rain all night. Water entered your room and damaged some things.',
    options:c => [
      opt('Pay for repairs', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; gain('happy', -2); return 'Room cleaned and repaired.'; }),
      opt('Manage it yourself', 'Free, but stressful', () => { gain('health', -8); gain('happy', -6); MARKET_ITEMS.forEach(k => { if (state.inv[k]) state.inv[k] = Math.floor(state.inv[k] / 2); }); return 'You spent hours packing water. Half your food got spoilt.'; }, null, 'danger')
    ]},
  {id:'outage', w:3, cool:4, ignore:1,
    ctx:() => ({amt:price(8000)}),
    title:() => 'NEPA don take light ⚡',
    body:() => 'No light since morning. The room is hot and your phone battery is low.',
    options:c => [
      opt('Buy fuel for the generator ⛽', fmt(c.amt), () => { if (!spend(c.amt)) return false; gain('energy', 5); return 'Gen don start. You can rest well.'; }),
      opt('Endure the heat 🥵', 'Free', () => { gain('happy', -5); gain('energy', -10); return 'You managed with a hand fan all night.'; })
    ]},
  {id:'scam', w:2, cool:8, phone:true, ignore:1,
    title:() => 'SMS: You won ₦5,000,000! 🎉',
    body:() => '"Congratulations! Your number won ₦5,000,000 in the NaijaTel Mega Promo. Send ₦20,000 processing fee to claim. Hurry!"',
    options:() => [
      opt('Send ₦20,000 to claim', 'Hmm...', () => { if (!spendAny(20000)) return false; gain('happy', -6); addHistory('Fell for a promo scam', '🤦🏾'); return 'They blocked your number. It was a scam! 🤦🏾'; }, null, 'danger'),
      opt('Delete the message', 'Smart move', () => { gain('rep', 1); return 'Correct. Scammers no go catch you.'; })
    ]},
  {id:'foundMoney', w:1, cool:15, ignore:0,
    title:() => 'Money on the road 💵',
    body:() => `You found ${fmt(10000)} lying on the road.`,
    options:() => [
      opt('Keep it', '+₦10,000', () => { state.money += 10000; return 'Lucky day!'; }),
      opt('Take it to the police station', '+reputation', () => { gain('rep', 3); gain('happy', 3); return 'The officers were impressed by your honesty.'; })
    ]},
  {id:'areaBoys', w:1.5, cool:6, ignore:0,
    title:() => 'Area boys 😬',
    body:() => '"Oga, drop something for the boys now! We dey hungry."',
    options:() => [
      opt('Give them ₦2,000', 'Peace', () => { if (!spend(2000)) return false; return '"Correct guy! Go well."'; }),
      opt('Refuse and walk away', 'Risky', () => {
        if (Math.random() < 0.5){ gain('rep', 1); return 'They hissed but let you go.'; }
        const loss = Math.min(state.money, 5000); state.money -= loss; gain('health', -10); gain('happy', -5); return `They roughed you up and took ${fmt(loss)}.`;
      }, null, 'danger')
    ]},
  {id:'friendLoan', w:2, cool:8, phone:true, ignore:1,
    cond:() => friendIds(30, true).length > 0,
    ctx:() => ({who:pick(friendIds(30, true)), amt:rint(1, 5) * 10000}),
    title:c => `${NPC[c.who].name} needs a favour 📱`,
    body:c => `${NPC[c.who].name}: "Abeg, I need ${fmt(c.amt)} urgently. I go pay you back next week, I promise."`,
    options:c => [
      opt('Lend the money', fmt(c.amt), () => {
        if (!spendAny(c.amt)) return false;
        const n = NPC[c.who];
        state.loans.push({who:c.who, amt:c.amt, due:state.day + rint(4, 8), repay:Math.random() < (n.traits.includes('loyal') ? 0.85 : 0.6)});
        bond(c.who, 6); remember(c.who, 'loan'); return `${n.name}: "You be real friend! I no go forget."`;
      }),
      opt('Refuse politely', '', () => { bond(c.who, -3); remember(c.who, 'refused'); return `${NPC[c.who].name}: "Okay o. No wahala."`; })
    ]},
  {id:'friendInvest', w:1, cool:12, phone:true, ignore:1,
    cond:() => friendIds(40, true).length > 0,
    ctx:() => ({who:pick(friendIds(40, true)), amt:50000}),
    title:c => `${NPC[c.who].name} has a business idea 📈`,
    body:c => `${NPC[c.who].name}: "I'm starting a small business. Invest ${fmt(c.amt)} and I'll pay you back with profit in a week."`,
    options:c => [
      opt('Invest', fmt(c.amt) + ' · could double, could vanish', () => { if (!spendAny(c.amt)) return false; state.invest.push({who:c.who, amt:c.amt, due:state.day + 7, win:Math.random() < 0.55}); bond(c.who, 4); return 'Investment made. Fingers crossed 🤞🏾'; }),
      opt('Decline', '', () => { return 'You decided not to risk it.'; })
    ]},
  {id:'wedding', w:1.5, cool:10, phone:true, ignore:1,
    cond:() => friendIds(30, true).length > 0,
    ctx:() => ({who:pick(friendIds(30, true)), amt:amtA(15000)}),
    title:c => `Wedding invitation from ${NPC[c.who].name} 💒`,
    body:c => `${NPC[c.who].name}: "My cousin's wedding is this weekend! Aso-ebi is ${fmt(c.amt)}. You must come o!"`,
    options:c => [
      opt('Buy aso-ebi and attend 💃🏾', fmt(c.amt) + ' · 5 hours', () => { if (!spendAny(c.amt)) return false; advanceTime(300); bond(c.who, 8); gain('happy', 8); gain('rep', 2); gain('hunger', 40); return 'Jollof, small chops and dancing. You enjoyed yourself!'; }),
      opt('Decline', '', () => { bond(c.who, -2); return `${NPC[c.who].name}: "Hmm. Okay."`; })
    ]},
  {id:'malaria', w:1.5, cool:15, ignore:2,
    cond:() => state.health > 30,
    title:() => 'You feel sick 🤒',
    body:() => 'Headache, fever and body pain. It looks like malaria.',
    options:() => [
      opt('Go to the hospital', 'Navigate there now', () => { gain('health', -10); state.nav = 'hospital'; return 'Follow the yellow dots to General Hospital.'; }),
      opt('Buy drugs from a chemist', fmt(4000), () => { if (!spend(4000)) return false; gain('health', -5); return 'You took the drugs and rested.'; }),
      opt('Ignore it', 'Dangerous', () => { gain('health', -25); gain('energy', -20); return 'The malaria got worse. Please see a doctor.'; }, null, 'danger')
    ]},
  {id:'partnerMoney', w:2, cool:7, phone:true, ignore:2,
    cond:() => !!state.partner && P(state.partner).stage !== 'talking',
    ctx:() => ({who:state.partner, amt:NPC[state.partner].traits.includes('materialistic') ? amtA(40000) : amtA(15000)}),
    title:c => `${NPC[c.who].name} needs something ❤️`,
    body:c => `${NPC[c.who].name}: "Babe, I need ${fmt(c.amt)} to sort out something. Please help me 🥺"`,
    options:c => [
      opt('Send it', fmt(c.amt), () => { if (!spendAny(c.amt)) return false; woo(c.who, 8); chatAdd(c.who, 1, `Sent you ${fmt(c.amt)} 💸`); chatAdd(c.who, 0, pick(CHAT.money)); return `${NPC[c.who].name}: "Thank you my love! ❤️"`; }),
      opt('Send half', fmt(c.amt / 2), () => { if (!spendAny(c.amt / 2)) return false; woo(c.who, 3); return `${NPC[c.who].name}: "Thank you, I'll manage."`; }),
      opt("Explain you can't right now", '', () => {
        const n = NPC[c.who];
        if (n.traits.includes('frugal')){ woo(c.who, 3); return `${n.name}: "I understand. Saving is important."`; }
        if (n.traits.includes('materialistic')){ woo(c.who, -8); return `${n.name}: "Hmm. Okay o. 😒"`; }
        woo(c.who, -2); return `${n.name}: "Okay, no problem."`;
      })
    ]},
  {id:'partnerMiss', w:3, cool:4, phone:true, ignore:1,
    cond:() => !!state.partner && state.day - (P(state.partner).lastContact || 0) >= 2,
    ctx:() => ({who:state.partner}),
    title:c => `${NPC[c.who].name}: "You don forget me abi?" 😒`,
    body:c => `${NPC[c.who].name}: "Two days now, no call, no text. Am I not important to you again?"`,
    options:c => [
      opt('Call and apologize 📞', '20 minutes', () => { advanceTime(20); woo(c.who, 7); bond(c.who, 2); return `${NPC[c.who].name}: "Okay, I've heard you. Just don't do it again."`; }),
      opt('Ignore', '', () => { woo(c.who, -10); remember(c.who, 'argument'); return `${NPC[c.who].name} is very upset with you.`; }, null, 'danger')
    ]},
  {id:'partnerFuture', w:3, cool:15, phone:true, ignore:1,
    cond:() => !!state.partner && P(state.partner).stage === 'serious' && P(state.partner).rom >= 80 && !state.flags.futureTalk,
    ctx:() => ({who:state.partner}),
    title:c => `${NPC[c.who].name} wants to talk about the future 💍`,
    body:c => `${NPC[c.who].name}: "We've been together for a while. Where is this going? My family has been asking about you."`,
    options:c => [
      opt("Let's start planning 💍", 'Introduction and marriage arrive in the next update', () => { state.flags.futureTalk = true; woo(c.who, 6); addHistory(`Agreed with ${NPC[c.who].name} to plan a future together`, '💍'); return `${NPC[c.who].name}: "Really?! I'm so happy! ❤️"`; }),
      opt("I'm not ready yet", '', () => { woo(c.who, NPC[c.who].traits.includes('family') ? -12 : -5); return `${NPC[c.who].name}: "Hmm. I hope you know what you want."`; })
    ]},
  {id:'fuelHike', w:1.5, cool:12, ignore:0,
    title:() => 'Fuel price don go up ⛽',
    body:() => 'Filling stations increased the pump price overnight. Transport and food will cost more for the next few days.',
    options:() => [opt('Ah, this country!', 'Prices +12% for 4 days', () => { state.fuelShockUntil = state.day + 4; gain('happy', -2); return 'Prices are up everywhere.'; })]},
  {id:'network', w:1.5, cool:6, ignore:0,
    title:() => 'Network don jam 📶',
    body:() => '"No service." Your data is not working and calls keep dropping.',
    options:() => [opt('Wait it out', '', () => { gain('happy', -2); return 'Network came back after a few hours.'; })]},
  {id:'party', w:1.5, cool:5, ignore:1,
    cond:() => hour() >= 17,
    title:() => 'Neighbour is throwing a party 🎉',
    body:() => 'Your neighbour is celebrating a promotion. Music is loud and the jollof smells amazing.',
    options:() => [
      opt('Join the party 💃🏾', '2 hours', () => { advanceTime(120); gain('happy', 8); gain('energy', -10); gain('hunger', 30); gain('rep', 1); return 'You danced and ate well!'; }),
      opt('Stay indoors', '', () => { gain('happy', -1); return 'You tried to sleep through the noise.'; })
    ]},
  {id:'pickpocket', w:1, cool:10, ignore:0,
    cond:() => state.money > 10000,
    title:() => 'Pickpocket! 👛',
    body:() => 'Someone brushed past you in the crowd. When you checked your pocket, some cash was gone.',
    options:() => [opt('Ah! 😤', '', () => { const loss = Math.min(state.money, rint(3, 8) * 1000); state.money -= loss; gain('happy', -4); return `You lost ${fmt(loss)}. Keep more money in the bank.`; })]},

  /* Triggered by the game (w:0) */
  {id:'caught', w:0, cool:0, ignore:0,
    title:c => `${NPC[state.partner || c.partner].name} found out! 😡`,
    body:c => `${NPC[c.partner].name} saw your chats with ${NPC[c.other].name}: "So this is what you've been doing behind my back?!"`,
    options:c => [
      opt('Apologize and beg 🙏🏾', '', () => { woo(c.partner, -25); remember(c.partner, 'argument'); if (P(c.partner).rom < 10){ breakUp(c.partner, true); return `${NPC[c.partner].name}: "It's over. Don't call me again."`; } return `${NPC[c.partner].name}: "I don't know if I can trust you again."`; }),
      opt('Deny everything', '50/50', () => { if (Math.random() < 0.5){ woo(c.partner, -10); return `${NPC[c.partner].name}: "Hmm. I'm watching you."`; } woo(c.partner, -35); if (P(c.partner).rom < 10){ breakUp(c.partner, true); return `${NPC[c.partner].name}: "Liar! We're done!"`; } return `${NPC[c.partner].name}: "You're lying to my face?!"`; }),
      opt('End the relationship', '', () => { breakUp(c.partner, false); return 'You ended things.'; }, null, 'danger')
    ]},
  {id:'dumped', w:0, cool:0, ignore:0,
    title:c => `${NPC[c.who].name} wants to end things 💔`,
    body:c => `${NPC[c.who].name}: "I've tried, but you don't make time for me anymore. I think we should end this."`,
    options:c => [
      opt('Accept it', '', () => { breakUp(c.who, true); return 'It hurts, but life goes on.'; }),
      opt('Beg for another chance 🙏🏾', '30% chance', () => { if (Math.random() < 0.3){ P(c.who).rom = 30; P(c.who).lastContact = state.day; return `${NPC[c.who].name}: "Okay. One last chance."`; } breakUp(c.who, true); return `${NPC[c.who].name}: "No. My mind is made up."`; })
    ]}
];
