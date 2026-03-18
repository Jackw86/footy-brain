// ============================================================
//  Footy Brain — data.js  v3
//  Core data: levels, chapters, badges, daily pool
//  Full 16 original chapters · 480 questions
// ============================================================

'use strict';

const LEVEL_TITLES = [
  '','Grassroots','Sunday League','Academy','Reserve Team',
  'Semi-Pro','Professional','International','World Class','Elite','Legend',
];
const LEVEL_XP = [0,0,150,350,600,900,1300,1800,2500,3400,4500];

function getLevelFromXP(xp){for(let i=LEVEL_XP.length-1;i>=1;i--)if(xp>=LEVEL_XP[i])return i;return 1;}
function getLevelTitle(xp){return LEVEL_TITLES[getLevelFromXP(xp)]||'Legend';}
function getLevelProgress(xp){const lv=getLevelFromXP(xp);if(lv>=LEVEL_XP.length-1)return 100;return Math.round(((xp-LEVEL_XP[lv])/(LEVEL_XP[lv+1]-LEVEL_XP[lv]))*100);}
function getXPToNext(xp){const lv=getLevelFromXP(xp);return lv>=LEVEL_XP.length-1?0:LEVEL_XP[lv+1]-xp;}

function shuffleQuestion(q){
  const correct=q.opts[q.a];
  const shuffled=[...q.opts].sort(()=>Math.random()-.5);
  return{q:q.q,opts:shuffled,a:shuffled.indexOf(correct),exp:q.exp,difficulty:q.difficulty||1};
}

const GAME_META={
  penalty: {name:'Penalty Shootout',emoji:'🥅',max:5},
  offside: {name:'Offside Judge',emoji:'🚩',max:10},
  freekick:{name:'Free-Kick Master',emoji:'⚡',max:5},
  rondo:   {name:'Keep-Away Rondo',emoji:'🔄',max:6},
  scanning:{name:'Scanning Drill',emoji:'👁️',max:8},
  header:  {name:'Header Challenge',emoji:'🏹',max:5},
};

const POSITIONS=[
  {id:'Striker',emoji:'⚡',cssVar:'--amber',desc:'Goals & finishing'},
  {id:'Midfielder',emoji:'🎯',cssVar:'--sky',desc:'Vision & control'},
  {id:'Winger',emoji:'💨',cssVar:'--accent',desc:'Speed & crosses'},
  {id:'Full-Back',emoji:'🏃',cssVar:'--purple',desc:'Attack & defend'},
  {id:'Defender',emoji:'🛡️',cssVar:'--purple',desc:'Tackle & organise'},
  {id:'Goalkeeper',emoji:'🧤',cssVar:'--accent',desc:'Save everything'},
  {id:'All-Rounder',emoji:'⚽',cssVar:'--accent',desc:'Master everything'},
];

const ALL_CHAPTERS=[
  {id:'f1',title:'Ball Control Basics',emoji:'⚽',cat:'Fundamentals',xp:20,order:1,
   desc:'Master the foundations of receiving and controlling the ball.',
   questions:[
    {q:'What is "first touch"?',difficulty:1,a:2,opts:['How fast you run','A type of foul','How well you control the ball on arrival','A shooting technique'],exp:'First touch sets up every action that follows — it buys you time and space.'},
    {q:'Which surface gives the softest first touch?',difficulty:1,a:0,opts:['Inside of the foot','The toe','The heel','The kneecap'],exp:'The inside of the foot gives the largest, most cushioned surface.'},
    {q:'Why move toward the ball rather than wait?',difficulty:1,a:3,opts:['To look impressive','Rules require it','To confuse opponents','To control timing and get ahead of markers'],exp:'Moving to meet the ball lets you dictate pace and timing.'},
    {q:'What does "cushioning" the ball mean?',difficulty:2,a:1,opts:['Wearing shin pads','Relaxing the receiving surface to absorb pace','Heading softly','Dribbling slowly'],exp:'Cushioning means withdrawing your foot slightly on contact.'},
    {q:'A chest trap is used when the ball arrives...?',difficulty:2,a:2,opts:['Along the ground','At knee height','Above the waist through the air','From a throw-in only'],exp:'The chest is used for aerial balls above the waist.'},
    {q:'What is a "directional first touch"?',difficulty:3,a:0,opts:['A touch that sets the ball into space for your next action','Any touch that moves the ball','A touch with your weak foot','Used only by strikers'],exp:'Elite players use their first touch as a weapon — setting the ball exactly where needed.'},
    {q:'Close control means keeping the ball...?',difficulty:1,a:3,opts:['Far ahead','Behind your body','At arm\'s length','Very close to your feet'],exp:'Close control means the ball never strays far enough for defenders to nip in.'},
   ]},
  {id:'f2',title:'Passing Principles',emoji:'🎯',cat:'Fundamentals',xp:20,order:2,
   desc:'Understand the art of moving the ball with precision and purpose.',
   questions:[
    {q:'What does "weight of pass" mean?',difficulty:1,a:3,opts:['How heavy the ball is','The direction','Whether you use dominant foot','The power and pace applied to the pass'],exp:'Weight determines whether your teammate can control it.'},
    {q:'Where do you aim when passing to a running teammate?',difficulty:1,a:0,opts:['Into the space they are running into','At their current feet','At the defender','Straight ahead regardless'],exp:'Pass to where they WILL BE — not where they are now.'},
    {q:'What is a "through ball"?',difficulty:2,a:1,opts:['A ball through the legs','A pass played into space behind the defensive line','A backward pass','A throw-in'],exp:'A through ball splits the defence by playing behind them.'},
    {q:'What does one-touch passing require?',difficulty:2,a:3,opts:['Strong legs','Lightweight boots','Running faster','Pre-scanning before the ball arrives'],exp:'One-touch passing only works if the decision is already made before the ball arrives.'},
    {q:'What is a "switch of play"?',difficulty:2,a:2,opts:['Changing formation','Swapping positions','A long diagonal pass moving the ball quickly to the other flank','A substitution tactic'],exp:'Switching play exploits opponents overloaded on one side.'},
    {q:'What is the "third man" concept?',difficulty:4,a:0,opts:['Two passes that free a third player in space','Always having three forward','Playing with three strikers','A set piece routine'],exp:'While defenders track the first two, the third man slips in undetected.'},
    {q:'The safest pass under pressure is usually...?',difficulty:1,a:1,opts:['A long ball forward','The quickest pass to a free teammate in a safe position','A nutmeg','A long diagonal'],exp:'Under pressure, retain possession first.'},
   ]},
  {id:'f3',title:'Dribbling & Beating Players',emoji:'💨',cat:'Fundamentals',xp:25,order:3,
   desc:'Learn when and how to take on defenders effectively.',
   questions:[
    {q:'When approaching a defender 1v1, run at...?',difficulty:1,a:2,opts:['Full sprint','Walking pace','Controlled pace allowing direction changes','Sideways to shield'],exp:'Controlled approach lets you change direction explosively.'},
    {q:'What is a "feint"?',difficulty:1,a:0,opts:['A fake movement to deceive the defender','A type of foul','A long pass','Diving'],exp:'A feint shifts the defender\'s weight the wrong way.'},
    {q:'What is a "step-over"?',difficulty:2,a:3,opts:['Stepping over the ball to fake','A tackle technique','A goalkeeper move','Circling your foot around the ball to fake direction'],exp:'The step-over tricks the defender\'s weight.'},
    {q:'Why is accelerating AFTER a beat important?',difficulty:2,a:1,opts:['It looks impressive','Creates distance before the defender can recover','Tires them out','Rules require it'],exp:'Hesitate and they recover instantly.'},
    {q:'What does "shielding the ball" mean?',difficulty:2,a:2,opts:['Hiding the ball','Passing quickly','Using your body legally between the ball and defender','A goalkeeper technique'],exp:'Shielding uses your body as a legal barrier.'},
    {q:'When dribbling, where should your eyes be?',difficulty:3,a:3,opts:['Down at the ball','At the defender\'s feet','At the coach','Up — scanning with peripheral vision on the ball'],exp:'Elite dribblers barely look at the ball — eyes read space ahead.'},
    {q:'What is a "nutmeg"?',difficulty:1,a:1,opts:['A type of foul','Passing the ball through an opponent\'s legs','A heading technique','A goalkeeper save'],exp:'A nutmeg is both effective and psychologically deflating for the victim.'},
   ]},
  {id:'f4',title:'Shooting Technique',emoji:'💥',cat:'Fundamentals',xp:25,order:4,
   desc:'Develop clinical finishing technique from all positions.',
   questions:[
    {q:'For a powerful shot, your standing foot should be...?',difficulty:1,a:1,opts:['Well behind the ball','Level with the ball pointing at target','In front of the ball','As far away as possible'],exp:'Plant foot position determines power and direction.'},
    {q:'Which part of the foot for a driven shot?',difficulty:1,a:3,opts:['The toe','The inside','The heel','The laces (instep)'],exp:'The laces provide the largest, hardest contact surface.'},
    {q:'Where are goalkeepers hardest to beat?',difficulty:2,a:0,opts:['Low to either corner','Straight at them','High corners','Above the crossbar'],exp:'Low corners force the keeper to change height AND direction simultaneously.'},
    {q:'What is "shooting on the half-turn"?',difficulty:2,a:2,opts:['Spinning fully before shooting','A free kick technique','Receiving body half-open so you shoot immediately','Shooting with your weaker foot'],exp:'Half-turn receiving means you face goal as the ball arrives.'},
    {q:'What does "placement over power" mean?',difficulty:2,a:1,opts:['Soft shots always better','Accuracy into corners beats blasting at the keeper','Power shots always miss','Goalkeepers prefer power'],exp:'A placed shot into the corner is harder to save than a thunderbolt straight at the keeper.'},
    {q:'When is the "far post finish" most effective?',difficulty:3,a:3,opts:['Long range','Headers only','When very tired','Keeper has committed — place it to the vacated far post'],exp:'Far post exploits keeper momentum.'},
    {q:'What does "getting your body over the ball" mean?',difficulty:2,a:0,opts:['Leaning forward over ball to keep it low and on target','Falling over','A celebration','Heading the ball'],exp:'Getting over the ball keeps the shot down.'},
   ]},
  {id:'f5',title:'Defending Fundamentals',emoji:'🛡️',cat:'Fundamentals',xp:20,order:5,
   desc:'Master the core principles every player needs when defending.',
   questions:[
    {q:'What is "jockeying"?',difficulty:1,a:0,opts:['Staying goalside balanced slowing the attacker without diving in','Horse riding','Tackling immediately','Running at the ball carrier'],exp:'Jockeying is patience — low, side-on, on your toes.'},
    {q:'When is the right moment to commit to a tackle?',difficulty:2,a:3,opts:['Immediately','When attacker is fastest','Never — always jockey','When ball is slightly out of control or you\'re certain'],exp:'Patience — wait for the heavy touch or shown direction.'},
    {q:'What does "staying goalside" mean?',difficulty:1,a:1,opts:['Standing in goal','Keeping yourself between attacker and your goal','Standing in front of attacker','Playing behind defensive line'],exp:'Goalside means the attacker must go through you.'},
    {q:'What is "winning the second ball"?',difficulty:2,a:2,opts:['Scoring a second goal','Playing second half better','Getting to the loose ball first after any challenge','A set piece tactic'],exp:'Arriving first to the second ball wins passages of play.'},
    {q:'The correct defensive body shape is...?',difficulty:2,a:0,opts:['Side-on knees bent weight on toes balanced','Facing straight on tall','Facing away','Arms stretched wide'],exp:'Side-on and low puts you in a sprint-ready position.'},
    {q:'What is "forcing the attacker onto their weak foot"?',difficulty:3,a:3,opts:['Tackling their weaker leg','A foul technique','Used only against left-footed players','Positioning to steer toward their less dominant foot'],exp:'Smart defenders show opponents their weaker side.'},
    {q:'A "recovering run" is used when...?',difficulty:3,a:1,opts:['After being substituted','When beaten — sprinting to get back between ball and goal','During warm-up','After attacking runs'],exp:'When beaten, sprint back goalside immediately.'},
   ]},
  {id:'t1',title:'Formations Explained',emoji:'📐',cat:'Tactics',xp:20,order:6,
   desc:'Understand how formations shape a team\'s attack and defence.',
   questions:[
    {q:'In a 4-3-3, how many defenders?',difficulty:1,a:2,opts:['3','5','4','2'],exp:'4-3-3: 4 defenders, 3 midfielders, 3 forwards.'},
    {q:'What does a "false 9" do?',difficulty:3,a:0,opts:['Drops deep into midfield creating space for runners','Plays as traditional striker','Plays on wing','Only defends set pieces'],exp:'The false 9 confuses centre-backs — follow him and space opens behind.'},
    {q:'A "high press" means...?',difficulty:2,a:3,opts:['Only pressing in your half','Jumping to win aerial duels','Playing long balls','Pressing opponents aggressively in their own half'],exp:'A high press wins the ball close to the opponent\'s goal.'},
    {q:'What is a "back four"?',difficulty:1,a:1,opts:['Four strikers','A defensive line of two centre-backs and two full-backs','Four goals in a row','The four weakest players'],exp:'The back four — two CBs and two full-backs.'},
    {q:'What does attacking "width" provide?',difficulty:2,a:2,opts:['Nothing important','Makes pitch smaller','Stretches defence creating space centrally','Confuses the linesman'],exp:'Width forces defenders to spread — bigger gaps open centrally.'},
    {q:'In a 4-2-3-1, what do the "2" represent?',difficulty:3,a:0,opts:['Two holding midfielders screening the defence','Two wingers','Two forwards','Two overlapping full-backs'],exp:'The double pivot screens the back four.'},
    {q:'Key advantage of 3-5-2?',difficulty:4,a:3,opts:['Three goalkeepers','More strikers','Confusing opponents','Midfield overload with defensive solidity from three centre-backs'],exp:'Three at the back with wing-backs gives width AND cover.'},
   ]},
  {id:'t2',title:'Pressing & Transitions',emoji:'⚡',cat:'Tactics',xp:25,order:7,
   desc:'Master the moments when possession changes — the most dangerous phases.',
   questions:[
    {q:'What is a "trigger" for pressing?',difficulty:2,a:1,opts:['Referee\'s whistle','A pre-agreed cue signalling the whole team to press simultaneously','Scoring a goal','End of half'],exp:'Pressing triggers make the press organised — everyone moves at once.'},
    {q:'What is a "transition" in football?',difficulty:1,a:3,opts:['Moving clubs','A substitution','Half-time','The split second when possession switches between teams'],exp:'Transitions are the most dangerous moments — both teams temporarily out of shape.'},
    {q:'Why is immediate pressing after losing the ball valuable?',difficulty:2,a:0,opts:['The opponent hasn\'t organised — highest chance of winning it back immediately','Looks energetic','Tires opponents','Coaches like it'],exp:'Win the ball back in the first 5 seconds before opponents organise.'},
    {q:'What does "compactness" mean in defence?',difficulty:2,a:2,opts:['Playing in a small stadium','Running in groups','Keeping team shape tight with short distances between lines','Standing near the sideline'],exp:'Compact teams are hard to play through.'},
    {q:'A counter-attack is most effective launched when?',difficulty:2,a:1,opts:['Already winning by 3','Immediately after winning the ball — opposition out of shape','During a corner','Last minute only'],exp:'Counter-attacks devastate when launched instantly.'},
    {q:'What does PPDA measure?',difficulty:4,a:3,opts:['Passes Per Defensive Area','Player Performance Data Analysis','Points Per Draw Away','Passes Permitted per Defensive Action — lower means more pressing'],exp:'PPDA measures pressing intensity.'},
    {q:'What is a "pressing trap"?',difficulty:4,a:2,opts:['Catching animals','A formation name','Deliberately inviting the ball to a zone then surrounding the recipient instantly','A training drill'],exp:'Pressing traps lure the ball to where you\'re strongest.'},
   ]},
  {id:'t3',title:'Set Pieces',emoji:'🎯',cat:'Tactics',xp:20,order:8,
   desc:'Understand how goals are created from dead-ball situations.',
   questions:[
    {q:'What is a "near post run" at a corner?',difficulty:2,a:0,opts:['A run to the post closest to the corner taker to flick or deflect','Running away','Standing on penalty spot','Starting outside the box'],exp:'Near post runs create flick-ons and deflections.'},
    {q:'Why do players stand tight in a defensive wall?',difficulty:1,a:3,opts:['To intimidate the taker','Rules require it','Prevents them running','To cover as much of the goal as possible and eliminate gaps'],exp:'Every gap in the wall is an invitation.'},
    {q:'What is a "short corner"?',difficulty:2,a:1,opts:['A corner travelling a short distance','Playing a short pass from the corner flag to draw defenders out','Taken very quickly','A foul at the corner flag'],exp:'Short corners disrupt organised defences.'},
    {q:'Where do most headed goals from corners come from?',difficulty:3,a:2,opts:['Far post area','Near post area','The penalty spot area','Edge of the box'],exp:'Penalty spot deliveries cause the most chaos.'},
    {q:'What is a "dummy run" at a set piece?',difficulty:3,a:3,opts:['Running unintelligently','Running to wrong position','Made by substitutes only','A decoy movement designed to drag a defender away and free the real target'],exp:'Dummy runs create organised chaos.'},
    {q:'What is "zonal marking" at corners?',difficulty:4,a:0,opts:['Players defending an area of space rather than a specific opponent','Man-marking every player','A goalkeeper-only technique','Only used in lower leagues'],exp:'Zonal marking means you own an area — attack any ball entering your zone.'},
    {q:'What is an "inswinging corner"?',difficulty:3,a:1,opts:['A corner that curves away from goal','A corner with spin curving toward the goal — harder for keeper','A short corner routine','An illegal delivery'],exp:'Inswinging corners curve toward goal — the keeper must decide fast.'},
   ]},
  {id:'s1',title:'Striker: Movement & Finishing',emoji:'⚡',cat:'Striker',xp:30,order:9,
   positions:['Striker','All-Rounder'],
   desc:'Elite movement and clinical finishing for centre-forwards.',
   questions:[
    {q:'What is a "blindside run"?',difficulty:2,a:2,opts:['Running when referee isn\'t watching','Running backwards','Making a run where the defender cannot see you without turning','A run behind your own goal'],exp:'Blindside runs exploit the defender\'s vision.'},
    {q:'What does "hold-up play" mean for a striker?',difficulty:2,a:0,opts:['Receiving with back to goal shielding ball linking play for teammates','Deliberately slowing down','Always running in behind','Shooting from distance'],exp:'Hold-up play makes the striker the team\'s pivot point.'},
    {q:'What is a "poacher\'s goal"?',difficulty:1,a:3,opts:['A long-range thunderbolt','A bicycle kick','A penalty','A close-range goal from a rebound or deflection — instinct over technique'],exp:'Poachers live in the six-yard box.'},
    {q:'Timing your run to stay onside requires...?',difficulty:3,a:1,opts:['Being fastest on the pitch','Watching last defender\'s position and moving the instant the ball is played','Starting every run deep','Always staying behind ball'],exp:'Great strikers time their runs off the last defender.'},
    {q:'A "far post finish" is used when...?',difficulty:2,a:3,opts:['Long range','Headers only','Very tired','Keeper has committed — place it to the vacated far post'],exp:'Far post exploits keeper momentum.'},
    {q:'What is a striker\'s "movement off the ball"?',difficulty:3,a:1,opts:['Standing still waiting','Constant purposeful movement dragging defenders out of position','Jogging slowly','Only moving when the captain says'],exp:'The best strikers work hardest without the ball.'},
    {q:'When a striker "drops into the hole", what does this mean?',difficulty:4,a:2,opts:['Falling over','Running into the penalty area','Dropping into the space between midfield and defence to receive and turn','Playing in goal'],exp:'Dropping into the hole pulls defenders out of position.'},
   ]},
  {id:'m1',title:'Midfielder: Vision & Press Resistance',emoji:'🎯',cat:'Midfielder',xp:30,order:10,
   positions:['Midfielder','All-Rounder'],
   desc:'Develop the vision, awareness and composure of an elite midfielder.',
   questions:[
    {q:'What does "scanning" mean in midfield?',difficulty:1,a:1,opts:['Looking at ball only','Regularly checking surroundings before receiving so you already know your next action','Using technology','Checking the scoreboard'],exp:'Elite midfielders scan constantly — decision made before ball arrives.'},
    {q:'What is "press resistance"?',difficulty:2,a:3,opts:['Physical training','Pressing opponents yourself','Avoiding training','Staying composed under pressure and finding the right pass or escape'],exp:'Press resistance is composure under fire.'},
    {q:'A "box-to-box" midfielder does...?',difficulty:2,a:0,opts:['Contributes fully in both penalty boxes — equal intensity attacking and defending','Only attacks','Only defends','Stays near centre circle'],exp:'Box-to-box midfielders are engines — vast distances, both boxes.'},
    {q:'What is the "pivot" role?',difficulty:3,a:2,opts:['A winger who cuts inside','An attacking full-back','A holding midfielder who screens the defence and distributes calmly','A striker who drops deep'],exp:'The pivot protects the back four and distributes.'},
    {q:'When should a midfielder shoot from outside the box?',difficulty:3,a:1,opts:['Never','When in a good striking position — the threat opens space','Only in last minute','When keeper isn\'t looking'],exp:'Long-range shooting forces the block to move, creating space.'},
    {q:'What is a "double pivot"?',difficulty:4,a:3,opts:['Two strikers','A crossing technique','A corner routine','Two holding midfielders alongside each other screening the defence'],exp:'The double pivot gives double protection and two passing options.'},
    {q:'What does "dictating tempo" mean?',difficulty:4,a:2,opts:['Running very fast','Shouting at teammates','Controlling the pace of the game through deliberate pass selection','Only passing quickly'],exp:'The best midfielders control the game\'s rhythm.'},
   ]},
  {id:'d1',title:'Defender: Reading the Game',emoji:'🛡️',cat:'Defender',xp:30,order:11,
   positions:['Defender','All-Rounder'],
   desc:'Develop the reading, organisation and leadership of a top centre-back.',
   questions:[
    {q:'What is "anticipation" for a defender?',difficulty:2,a:3,opts:['Feeling nervous','Guessing randomly','Fouling attackers early','Reading the play before it happens and positioning accordingly'],exp:'Great defenders are already in position — two passes ahead.'},
    {q:'Why should centre-backs communicate constantly?',difficulty:1,a:0,opts:['To organise the defensive line alert teammates and call for the ball','They\'re loudest','Only to speak to goalkeeper','To shout at opposition'],exp:'The CB is the team\'s organiser — voice controls the line.'},
    {q:'What is an "aerial duel"?',difficulty:1,a:1,opts:['A fight during the game','A contest to win a headed ball','A type of free kick','A bicycle kick goal'],exp:'Winning aerial duels — timing and body position — is a core CB skill.'},
    {q:'When is it right to step out from the defensive line?',difficulty:3,a:2,opts:['Never','Only at set pieces','When opponent receives facing away — step in aggressively to win the ball high','Every time ball is played forward'],exp:'Stepping onto a turned player wins the ball high.'},
    {q:'What does "playing an offside trap" require?',difficulty:3,a:3,opts:['Individual pace','One fast defender','Goalkeeper\'s signal','Total coordination — every defender steps up at the exact same moment'],exp:'The offside trap requires absolute synchronisation.'},
    {q:'What is "cover shadowing"?',difficulty:4,a:0,opts:['Positioning your body to block the passing lane to a specific opponent without marking them','Standing in shade','A training drill','A goalkeeper technique'],exp:'Cover shadowing removes an opponent without engaging them.'},
    {q:'What is "defensive shape"?',difficulty:3,a:1,opts:['Physical build of defenders','The organised positioning of the unit — distances and lines maintained collectively','Individual standing position','Sprint mechanics'],exp:'Defensive shape is collective — distances between players and lines.'},
   ]},
  {id:'g1',title:'Goalkeeper: Saves & Organisation',emoji:'🧤',cat:'Goalkeeper',xp:30,order:12,
   positions:['Goalkeeper','All-Rounder'],
   desc:'Develop the technique, positioning and leadership of a modern goalkeeper.',
   questions:[
    {q:'What is the correct "ready position"?',difficulty:1,a:2,opts:['Sitting on goal line','Arms crossed standing still','On toes slightly forward-leaning hands up weight balanced','Crouching very low'],exp:'The ready position allows you to explode in any direction instantly.'},
    {q:'For a close-range shot, the best technique is...?',difficulty:2,a:0,opts:['Get your whole body behind the ball — if spilled you\'re there to smother','Dive dramatically','Close your eyes','Jump as high as possible'],exp:'Close-range shots need the whole body as a barrier.'},
    {q:'"Narrowing the angle" means...?',difficulty:2,a:3,opts:['Asking defenders to help','Moving to one side early','Moving the goalposts','Coming off your line toward the attacker to reduce the visible goal'],exp:'As you advance, the visible goal shrinks dramatically.'},
    {q:'What is "distribution" for a goalkeeper?',difficulty:2,a:1,opts:['Sharing equipment','How accurately and intelligently you restart play to launch attacks','Taking penalties','Kicking into the stands'],exp:'Modern goalkeepers are the first playmakers.'},
    {q:'What does "set for a penalty" mean?',difficulty:2,a:2,opts:['Choosing a corner early','Setting up a camera','Getting your ready position — centred on toes — before the kick','Distracting the taker'],exp:'Setting well gives you the best chance.'},
    {q:'What is "sweeper-keeper" play?',difficulty:3,a:3,opts:['Sweeping the dressing room','Restricted to six-yard box','A specific penalty technique','Coming off the line to deal with through balls — acting as last defender'],exp:'The sweeper-keeper model extends the defensive line.'},
    {q:'What is "footwork" in goalkeeping?',difficulty:3,a:0,opts:['Precise quick foot movements that position you correctly before and during a save','Playing with feet only','Kicking technique only','No hands at all'],exp:'Good footwork means rarely needing to dive unnecessarily.'},
   ]},
  {id:'r1',title:'The Laws of Football',emoji:'📋',cat:'Rules',xp:15,order:13,
   desc:'Know the rules of the game inside out.',
   questions:[
    {q:'How many players on the pitch per team?',difficulty:1,a:3,opts:['9','10','12','11'],exp:'11 players per side — a game can continue with a minimum of 7.'},
    {q:'A goal kick is awarded when...?',difficulty:1,a:0,opts:['The attacking team puts the ball over the goal line without scoring','Ball goes out for a corner','Keeper makes a save','A penalty is missed'],exp:'Goal kick: the attacking team last touched the ball before it crossed the goal line.'},
    {q:'How long is a standard half?',difficulty:1,a:2,opts:['30 minutes','40 minutes','45 minutes','60 minutes'],exp:'45 minutes per half, plus stoppage time.'},
    {q:'When is a handball offence committed?',difficulty:2,a:1,opts:['Any time ball touches the arm','When the ball touches the hand or arm deliberately or in an unnatural position','Only when catching','Only when preventing a goal'],exp:'Handball requires context — deliberate use or an unnatural arm position.'},
    {q:'When is a player in an offside position?',difficulty:2,a:3,opts:['When in the opposition half at all','When running fast','When behind the referee','When any scoring body part is closer to goal than both ball AND second-to-last defender'],exp:'Offside: ahead of both the ball and the second-to-last defender.'},
    {q:'What is a "direct free kick"?',difficulty:2,a:0,opts:['A free kick where the ball can go directly into goal without touching another player','Must go to teammate first','Any free kick in your own half','Quickly taken free kick'],exp:'Direct free kicks can go straight into goal.'},
    {q:'What does "advantage" mean when the referee waves play on?',difficulty:3,a:1,opts:['Home team always has advantage','Referee lets play continue because stopping would disadvantage the fouled team','Team ahead has advantage','A rule about extra time'],exp:'Advantage means the referee waves play on — the foul can still be carded.'},
   ]},
  {id:'r2',title:'Referee Signals & Decisions',emoji:'🟨',cat:'Rules',xp:15,order:14,
   desc:'Understand what referees are signalling and why.',
   questions:[
    {q:'A yellow card means...?',difficulty:1,a:1,opts:['Excellent play','A caution — two yellows in one game equals a red card','Game paused','Goal disallowed'],exp:'Yellow = caution. Two in one game = red.'},
    {q:'VAR stands for...?',difficulty:1,a:3,opts:['Very Accurate Referee','Visual Alert Review','Visiting Assistant Rules','Video Assistant Referee'],exp:'VAR reviews goals, penalties, red cards and mistaken identity.'},
    {q:'What does the referee signal for a penalty?',difficulty:1,a:0,opts:['Pointing clearly to the penalty spot','Both arms raised','Waving play on','Showing a yellow card to the keeper'],exp:'Pointing to the penalty spot is universal and unambiguous.'},
    {q:'Stoppage time is added for...?',difficulty:1,a:2,opts:['When a team is losing','Goals only','Time lost for stoppages — injuries substitutions goals VAR time-wasting','Weather delays only'],exp:'Stoppage time compensates for all stoppages.'},
    {q:'DOGSO results in...?',difficulty:3,a:1,opts:['A yellow card only','A red card — denying an obvious goal-scoring opportunity','A penalty automatically','A warning'],exp:'DOGSO is a red card offence.'},
    {q:'What is "simulation" (diving)?',difficulty:2,a:3,opts:['A legal technique','Only illegal in the penalty area','Always a red card','Deliberately falling to deceive the referee — yellow card'],exp:'Simulation earns a yellow card.'},
    {q:'What does the referee signal for offside?',difficulty:2,a:0,opts:['Raising their flag vertically then indicating position','Blowing whistle only','Pointing to the spot','Red flag raised'],exp:'The assistant referee raises the flag then indicates position.'},
   ]},
  {id:'p1',title:'Football IQ: Pro Concepts',emoji:'🧠',cat:'Pro Knowledge',xp:30,order:15,
   desc:'Understand the tactical and analytical concepts used at the highest level.',
   questions:[
    {q:'What does "Expected Goals (xG)" measure?',difficulty:2,a:2,opts:['Total goals scored','A player\'s historical goals','The probability that a specific shot results in a goal based on shot quality','Goals disallowed by VAR'],exp:'xG tells you whether a team should have scored more or fewer goals.'},
    {q:'What is "positional play" (juego de posición)?',difficulty:3,a:0,opts:['Intelligent occupation of space creating numerical and positional superiorities','Playing only in your position','A rigid formation','A type of dribbling'],exp:'Juego de posición — Cruyff, Guardiola — dominates space through positioning.'},
    {q:'What does PPDA measure?',difficulty:4,a:3,opts:['Passes Per Defensive Area','Player Performance Data Analysis','Points Per Draw Away','Passes Permitted per Defensive Action — lower means more pressing'],exp:'PPDA measures pressing intensity.'},
    {q:'What is a "half-space"?',difficulty:3,a:1,opts:['Playing with five attackers','The zone between winger and centre-forward — diagonally dangerous','The half-time room','Playing only in opponent\'s half'],exp:'Half-spaces are the most dangerous attacking zones.'},
    {q:'What does "overloading a flank" mean?',difficulty:3,a:2,opts:['Having too many players illegally','A foul technique','Getting more players than opponents in one wide channel','Running along the touchline'],exp:'Flank overloads create 2v1 or 3v2 situations.'},
    {q:'What is "vertical compactness"?',difficulty:4,a:3,opts:['Having tall players','A gym exercise','Playing with a tall striker','Short distances between defensive and midfield lines — denying space between them'],exp:'Vertical compactness means no space between lines.'},
    {q:'What does "progressive passing" measure?',difficulty:4,a:0,opts:['Passes moving the ball significantly closer to opponent\'s goal — genuine attacking intent','Passing while running','Passing to most expensive player','Total passes made'],exp:'Progressive passing separates safe sideways movement from genuine attacking intent.'},
   ]},
  {id:'p2',title:'World Football: History & Icons',emoji:'🌍',cat:'Pro Knowledge',xp:20,order:16,
   desc:'Know the legends, moments and history that shaped the beautiful game.',
   questions:[
    {q:'Who won the World Cup as player AND manager?',difficulty:2,a:1,opts:['Pelé','Franz Beckenbauer','Johan Cruyff','Ronaldo R9'],exp:'Beckenbauer won the 1974 World Cup as captain and 1990 as manager.'},
    {q:'Which club developed "Total Football"?',difficulty:2,a:3,opts:['Bayern Munich','Liverpool FC','FC Barcelona','Ajax Amsterdam'],exp:'Ajax in the 1970s under Michels and Cruyff.'},
    {q:'How many World Cups has Brazil won?',difficulty:1,a:0,opts:['5','4','3','6'],exp:'Brazil leads all nations with 5 World Cup titles.'},
    {q:'What year was the Premier League founded?',difficulty:2,a:2,opts:['1985','1988','1992','1996'],exp:'The Premier League launched in 1992.'},
    {q:'What is the "Cruyff Turn"?',difficulty:2,a:1,opts:['A type of header','Faking to pass then dragging ball behind standing leg and turning away','A defensive technique','A free kick technique'],exp:'Cruyff unveiled this at the 1974 World Cup — still taught worldwide.'},
    {q:'Which nation popularised the 4-4-2?',difficulty:3,a:2,opts:['Brazil','Italy','England','Netherlands'],exp:'England popularised 4-4-2 — Alf Ramsey\'s 1966 World Cup team laid the groundwork.'},
    {q:'What was significant about Hungary\'s 6-3 win at Wembley in 1953?',difficulty:4,a:0,opts:['England\'s first ever home defeat to foreign opposition — changed global football thinking','The first World Cup final','The first televised match','The first floodlit match'],exp:'Hungary\'s win shattered the myth of English football superiority.'},
   ]},
];

// Merge batch 2 chapters if available
if (typeof BATCH2_CHAPTERS !== 'undefined') {
  ALL_CHAPTERS.push(...BATCH2_CHAPTERS);
}

function getChapterById(id){return ALL_CHAPTERS.find(c=>c.id===id)||null;}
function getChaptersForPosition(position){
  return ALL_CHAPTERS.filter(c=>!c.positions||c.positions.includes(position)).sort((a,b)=>a.order-b.order);
}
function getCategoriesForPosition(position){
  return[...new Set(getChaptersForPosition(position).map(c=>c.cat))];
}

const BADGES=[
  {id:'first_quiz',emoji:'📝',name:'First Whistle',desc:'Complete your first quiz',condition:s=>Object.keys(s.quizScores||{}).length>=1},
  {id:'perfect_quiz',emoji:'💯',name:'Perfect 10',desc:'Score 100% on any chapter',condition:s=>Object.entries(s.quizScores||{}).some(([id,sc])=>{const ch=getChapterById(id);return ch&&sc===ch.questions.length;})},
  {id:'three_perfect',emoji:'🌟',name:'Hat-Trick Brain',desc:'Score 100% on three chapters',condition:s=>Object.entries(s.quizScores||{}).filter(([id,sc])=>{const ch=getChapterById(id);return ch&&sc===ch.questions.length;}).length>=3},
  {id:'streak_3',emoji:'🔥',name:'On Fire',desc:'Reach a 3-day streak',condition:s=>s.streak>=3},
  {id:'streak_7',emoji:'🏆',name:'Week Warrior',desc:'Reach a 7-day streak',condition:s=>s.streak>=7},
  {id:'streak_30',emoji:'👑',name:'Iron Commitment',desc:'Reach a 30-day streak',condition:s=>s.streak>=30},
  {id:'level_3',emoji:'⭐',name:'Academy Graduate',desc:'Reach Level 3',condition:s=>getLevelFromXP(s.xp)>=3},
  {id:'level_6',emoji:'🎖️',name:'Pro Contract',desc:'Reach Level 6',condition:s=>getLevelFromXP(s.xp)>=6},
  {id:'level_10',emoji:'🥇',name:'Living Legend',desc:'Reach Level 10',condition:s=>getLevelFromXP(s.xp)>=10},
  {id:'five_chapters',emoji:'📚',name:'Bookworm',desc:'Complete 5 chapters',condition:s=>s.completedChapters.length>=5},
  {id:'all_chapters',emoji:'🎓',name:'Full Education',desc:'Complete every chapter',condition:s=>s.completedChapters.length>=getChaptersForPosition(s.position).length},
  {id:'game_master',emoji:'🎮',name:'Game Master',desc:'Score 4+ in any mini-game',condition:s=>Object.values(s.gameHighScores||{}).some(v=>v>=4)},
  {id:'clean_sweep',emoji:'💎',name:'Clean Sweep',desc:'Score maximum in any mini-game',condition:s=>Object.entries(s.gameHighScores||{}).some(([k,v])=>{const g=GAME_META[k];return g&&v>=g.max;})},
  {id:'daily_done',emoji:'📅',name:'Daily Grind',desc:'Complete your first daily challenge',condition:s=>(s.dailyChallengesCompleted||0)>=1},
  {id:'daily_7',emoji:'🗓️',name:'Consistent',desc:'Complete 7 daily challenges',condition:s=>(s.dailyChallengesCompleted||0)>=7},
  {id:'xp_500',emoji:'💪',name:'Rising Star',desc:'Earn 500 XP',condition:s=>s.xp>=500},
  {id:'xp_1000',emoji:'🚀',name:'Breakthrough',desc:'Earn 1,000 XP',condition:s=>s.xp>=1000},
  {id:'xp_2500',emoji:'🔮',name:'Elite Level',desc:'Earn 2,500 XP',condition:s=>s.xp>=2500},
  {id:'speed_demon',emoji:'⚡',name:'Speed Demon',desc:'Answer 5 questions in under 4 seconds each',condition:s=>(s.fastAnswers||0)>=5},
];
function getEarnedBadges(state){return BADGES.filter(b=>{try{return b.condition(state);}catch{return false;}});}

const DAILY_POOL=[
  {q:'What does "pressing high" mean?',opts:['Pressing in your own half','Pressing opponents in their own half','Pressing the referee','Pressing the ball against the net'],a:1,exp:'Pressing high wins the ball close to the opponent\'s goal.'},
  {q:'What does xG stand for?',opts:['Extra Goals','Expected Goals','Excellent Game','Extreme Goalscoring'],a:1,exp:'Expected Goals — the probability a shot results in a goal.'},
  {q:'Can you be offside from a goal kick?',opts:['Yes','No','Only in extra time','Only in attacking half'],a:1,exp:'No — you cannot be offside from a goal kick, corner kick or throw-in.'},
  {q:'What does the "false 9" do?',opts:['Plays as traditional striker','Drops deep to confuse defenders and create space','Plays on the wing','Only defends set pieces'],a:1,exp:'The false 9 drops into midfield — if defenders follow, space opens.'},
  {q:'The number 10 shirt belongs to...?',opts:['Goalkeeper','Centre-back','Attacking midfielder / playmaker','Centre-forward'],a:2,exp:'The number 10 belongs to the creative playmaker.'},
  {q:'What is a "clean sheet"?',opts:['A new kit','Conceding zero goals in a match','A draw','A yellow card'],a:1,exp:'A clean sheet means zero goals conceded.'},
  {q:'What does "playing out from the back" mean?',opts:['Defending near your goal','Building attacks from the goalkeeper with short passes','Hoofing it long','Kicking out for a corner'],a:1,exp:'Playing out from the back keeps possession and builds attacks patiently.'},
  {q:'What is a "brace"?',opts:['Protective equipment','Two goals in the same match','A tackle from behind','A type of corner routine'],a:1,exp:'A brace is two goals by the same player in one match.'},
  {q:'What is "tiki-taka"?',opts:['A Brazilian dance','Short passing movement and possession to control games','A type of press','A defensive system'],a:1,exp:'Tiki-taka — perfected by Guardiola\'s Barcelona — dominates through relentless short passing.'},
  {q:'What does PPDA measure?',opts:['Passes Per Defensive Area','Passes Permitted per Defensive Action — pressing intensity','Points Per Draw Away','Player Performance Data'],a:1,exp:'PPDA measures pressing intensity — lower means more pressing.'},
];

function getDailyQuestions(count=5){
  const seed=new Date().toDateString();
  let hash=0;
  for(let i=0;i<seed.length;i++)hash=(hash*31+seed.charCodeAt(i))|0;
  const pool=[...DAILY_POOL];
  for(let i=pool.length-1;i>0;i--){hash=(hash*1664525+1013904223)|0;const j=Math.abs(hash)%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,count).map(q=>shuffleQuestion(q));
}
