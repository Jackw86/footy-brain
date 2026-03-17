// ============================================================
//  PitchForge Academy — data.js  v2
//  Same curriculum as v1, expanded with difficulty tiers,
//  more questions, badge system, level titles, daily pool.
// ============================================================

'use strict';

// ─────────────────────────────────────────────
//  LEVEL SYSTEM
// ─────────────────────────────────────────────
const LEVEL_TITLES = [
  '',             // 0 unused
  'Grassroots',   // 1
  'Sunday League',// 2
  'Academy',      // 3
  'Reserve Team', // 4
  'Semi-Pro',     // 5
  'Professional', // 6
  'International',// 7
  'World Class',  // 8
  'Elite',        // 9
  'Legend',       // 10
];

const LEVEL_XP = [0, 0, 150, 350, 600, 900, 1300, 1800, 2500, 3400, 4500];

function getLevelFromXP(xp) {
  for (let i = LEVEL_XP.length - 1; i >= 1; i--) {
    if (xp >= LEVEL_XP[i]) return i;
  }
  return 1;
}
function getLevelTitle(xp)     { return LEVEL_TITLES[getLevelFromXP(xp)] || 'Legend'; }
function getLevelProgress(xp)  {
  const lv = getLevelFromXP(xp);
  if (lv >= LEVEL_XP.length - 1) return 100;
  const start = LEVEL_XP[lv], end = LEVEL_XP[lv + 1];
  return Math.round(((xp - start) / (end - start)) * 100);
}
function getXPToNext(xp) {
  const lv = getLevelFromXP(xp);
  if (lv >= LEVEL_XP.length - 1) return 0;
  return LEVEL_XP[lv + 1] - xp;
}

// ─────────────────────────────────────────────
//  GAME META
// ─────────────────────────────────────────────
const GAME_META = {
  penalty:  { name: 'Penalty Shootout', emoji: '🥅', max: 5  },
  offside:  { name: 'Offside Judge',    emoji: '🚩', max: 10 },
  freekick: { name: 'Free-Kick Master', emoji: '⚡', max: 5  },
  rondo:    { name: 'Keep-Away Rondo',  emoji: '🔄', max: 6  },
  scanning: { name: 'Scanning Drill',   emoji: '👁️', max: 8  },
  header:   { name: 'Header Challenge', emoji: '🏹', max: 5  },
};

// ─────────────────────────────────────────────
//  POSITIONS
// ─────────────────────────────────────────────
const POSITIONS = [
  { id: 'Striker',     emoji: '⚡', cssVar: '--orange', desc: 'Goals & finishing' },
  { id: 'Midfielder',  emoji: '🎯', cssVar: '--blue',   desc: 'Vision & control' },
  { id: 'Defender',    emoji: '🛡️', cssVar: '--purple', desc: 'Tackle & organise' },
  { id: 'Goalkeeper',  emoji: '🧤', cssVar: '--green',  desc: 'Save everything' },
  { id: 'All-Rounder', emoji: '⚽', cssVar: '--green',  desc: 'Master the full game' },
];

// ─────────────────────────────────────────────
//  CHAPTERS & QUESTIONS
//  difficulty: 1=Beginner 2=Developing 3=Pro 4=Elite
//  positions: omit = visible to all positions
// ─────────────────────────────────────────────
const ALL_CHAPTERS = [

  // ══════════════════════════════════════════
  //  FUNDAMENTALS
  // ══════════════════════════════════════════

  {
    id: 'f1', title: 'Ball Control Basics', emoji: '⚽',
    cat: 'Fundamentals', xp: 20, order: 1,
    desc: 'Master the foundations of receiving and controlling the ball.',
    questions: [
      { q: 'What is "first touch"?', difficulty: 1,
        opts: ['How fast you run to the ball', 'How well you control the ball the moment it arrives', 'A shooting technique used close to goal', 'A type of foul'],
        a: 1, exp: 'First touch sets up every action that follows. A great first touch buys you time and space; a poor one costs you possession instantly.' },
      { q: 'Which foot surface gives the softest, most cushioned first touch?', difficulty: 1,
        opts: ['The toe', 'The heel', 'The inside of the foot', 'The sole'],
        a: 2, exp: 'The inside of the foot offers the largest surface area and best cushioning — perfect for killing the ball\'s pace on arrival.' },
      { q: 'Why should you move toward the ball rather than waiting for it?', difficulty: 2,
        opts: ['To look more active for the coach', 'To reduce spin, control timing, and get ahead of your marker', 'Because the rules require it', 'To confuse the opponent'],
        a: 1, exp: 'Moving to meet the ball lets you control pace and timing — waiting passively invites defenders to nip in front of you.' },
      { q: 'What does "cushioning" the ball mean?', difficulty: 2,
        opts: ['Wearing padded shin pads', 'Relaxing the receiving surface at contact to absorb the ball\'s pace', 'Heading the ball softly', 'Dribbling at reduced speed'],
        a: 1, exp: 'Think of catching an egg — you withdraw your foot slightly on contact, taking the sting out of the ball so it stays close.' },
      { q: 'In a tight space, the best first touch takes the ball...', difficulty: 3,
        opts: ['Directly back the way it came', 'Away from pressure into available space', 'Straight up in the air', 'Into the path of the nearest opponent'],
        a: 1, exp: 'A smart directional first touch moves the ball away from the presser and opens your next option simultaneously — two actions in one.' },
      { q: 'A chest trap is used when the ball arrives...', difficulty: 2,
        opts: ['Along the ground', 'At waist height on the ground', 'Above the waist through the air', 'From a throw-in only'],
        a: 2, exp: 'The chest is used for aerial balls arriving above the waist. Leaning back slightly on contact cushions it down to your feet.' },
      { q: 'What is a "directional first touch"?', difficulty: 3,
        opts: ['Any touch that moves the ball', 'A first touch that deliberately sets the ball into space to launch your next action', 'Controlling the ball with your less dominant foot', 'A touch used only by strikers'],
        a: 1, exp: 'Elite players use their first touch as a weapon — it sets the ball exactly where they want it so the second action is already set up.' },
    ]
  },

  {
    id: 'f2', title: 'Passing Principles', emoji: '🎯',
    cat: 'Fundamentals', xp: 20, order: 2,
    desc: 'Understand the art of moving the ball with precision and purpose.',
    questions: [
      { q: 'What does "weight of pass" mean?', difficulty: 1,
        opts: ['How heavy the football is', 'The power and pace applied to the pass', 'The direction of the pass', 'Whether you use your dominant foot'],
        a: 1, exp: 'Weight is everything — too hard and your teammate can\'t control it; too soft and it\'s intercepted. Getting the weight right is a skill in itself.' },
      { q: 'Where should you aim when passing to a running teammate?', difficulty: 1,
        opts: ['At their current position', 'Into the space they are running into', 'Directly at their feet every time', 'Straight ahead regardless of their run'],
        a: 1, exp: 'Pass to where your teammate WILL BE, not where they are now. Playing into their run keeps them moving at full pace.' },
      { q: 'What is a "through ball"?', difficulty: 2,
        opts: ['A pass that goes through a player\'s legs', 'A pass played into space behind the defensive line', 'A backward pass to the goalkeeper', 'A throw-in technique'],
        a: 1, exp: 'A through ball splits the defence by playing into space behind them — deadly when the timing of pass and run match perfectly.' },
      { q: 'What does "one-touch passing" require above all else?', difficulty: 2,
        opts: ['Extremely strong legs', 'Pre-scanning so you already know where the ball is going before it arrives', 'Wearing lightweight boots', 'Running faster than everyone else'],
        a: 1, exp: 'One-touch passing is only possible if you\'ve scanned and made your decision before the ball arrives. Touch and pass become one movement.' },
      { q: 'The safest pass when under heavy pressure is usually?', difficulty: 1,
        opts: ['A long diagonal switch of play', 'A pass back to the goalkeeper', 'The quickest pass to a free teammate in a safe position', 'A nutmeg through the presser'],
        a: 2, exp: 'Under pressure the priority is retaining possession — pick the option that relieves pressure quickest, even if it\'s backwards or sideways.' },
      { q: 'What is a "switch of play"?', difficulty: 2,
        opts: ['Changing formation mid-game', 'A long diagonal pass that moves the ball quickly from one side of the pitch to the other', 'Swapping positions with a teammate', 'A substitution tactic'],
        a: 1, exp: 'Switching play exploits the fact opponents are overloaded on one side — the free player on the opposite flank gets time and space.' },
      { q: 'What is the "third man" concept in passing?', difficulty: 4,
        opts: ['Always having three players on the pitch', 'Using two passes so a third player receives free of pressure — the key target', 'Playing with three strikers', 'A set piece routine'],
        a: 1, exp: 'While defenders track the first two players exchanging passes, the third man slips in behind them undetected and receives in space.' },
    ]
  },

  {
    id: 'f3', title: 'Dribbling & Beating Players', emoji: '💨',
    cat: 'Fundamentals', xp: 25, order: 3,
    desc: 'Learn when and how to take on defenders effectively.',
    questions: [
      { q: 'When approaching a defender 1v1, you should run at them at?', difficulty: 1,
        opts: ['Absolute full sprint', 'A controlled pace that allows you to change direction explosively', 'Walking pace to be unpredictable', 'Sideways to shield the ball'],
        a: 1, exp: 'Approaching under control means you can change direction at any moment. Going full sprint too early removes your ability to fake or shift.' },
      { q: 'What is a "feint"?', difficulty: 1,
        opts: ['A type of foul committed during a dribble', 'A fake body movement to deceive the defender about your intended direction', 'A long pass while dribbling', 'Diving with the ball'],
        a: 1, exp: 'A feint convinces the defender you\'re going one way — their weight shifts, and you explode the other way while they\'re off balance.' },
      { q: 'Keeping the ball close to your feet while dribbling in a tight space means?', difficulty: 1,
        opts: ['You have more control and less chance of the ball being poked away', 'You can run faster', 'It\'s easier to shoot from distance', 'Defenders cannot legally tackle you'],
        a: 0, exp: 'In tight spaces, close control means the ball never strays far enough for defenders to get a toe on it between your touches.' },
      { q: 'What is a "step-over"?', difficulty: 2,
        opts: ['Stepping over the ball to fake a shot', 'Circling your foot around the outside of the ball to fake a direction change', 'A tackle technique used by defenders', 'A goalkeeper distribution move'],
        a: 1, exp: 'The step-over makes the defender\'s weight go the wrong way — as their momentum shifts, you take the ball the other direction and accelerate.' },
      { q: 'Why is accelerating AFTER beating a defender so important?', difficulty: 2,
        opts: ['It looks more impressive', 'It creates distance before the defender can recover and re-engage', 'It tires the defender out for later', 'The rules give you a head start'],
        a: 1, exp: 'Hesitate for even a second and they recover. The beat and the burst must be one continuous movement — no pause.' },
      { q: 'When dribbling, where should your eyes primarily be looking?', difficulty: 3,
        opts: ['Down at the ball at all times', 'Ahead — scanning the pitch while using peripheral vision to feel the ball', 'At the defender\'s feet', 'At your own feet and the ball alternately'],
        a: 1, exp: 'Elite dribblers barely look at the ball — their touch is automatic. Their eyes are up, reading space and options ahead.' },
      { q: 'What does "shielding the ball" mean?', difficulty: 2,
        opts: ['Hiding the ball behind a wall', 'Using your body legally between the ball and the defender to maintain possession', 'Passing the ball away quickly', 'A technique used only by goalkeepers'],
        a: 1, exp: 'Shielding uses your body as a legal barrier — back to the defender, arms slightly out for balance, ball on the far foot. Vital for hold-up play.' },
    ]
  },

  {
    id: 'f4', title: 'Shooting Technique', emoji: '💥',
    cat: 'Fundamentals', xp: 25, order: 4,
    desc: 'Develop clinical finishing technique from all positions.',
    questions: [
      { q: 'For a powerful driven shot, your standing foot should be?', difficulty: 1,
        opts: ['Well behind the ball', 'Level with the ball and pointing toward your target', 'In front of the ball', 'As far from the ball as possible'],
        a: 1, exp: 'Plant foot position determines power and direction. Level with the ball, pointing at target, gives you a clean full swing through the ball.' },
      { q: 'Which part of the foot is used for a driven instep shot?', difficulty: 1,
        opts: ['The toes', 'The inside of the foot', 'The laces (instep)', 'The outside of the foot'],
        a: 2, exp: 'The laces provide the largest, hardest contact surface — your foot becomes a bat, transferring maximum power into the ball.' },
      { q: 'Statistically, where are goalkeepers hardest to beat?', difficulty: 2,
        opts: ['High to the keeper\'s left', 'Low to either corner', 'Straight down the middle', 'Above the crossbar'],
        a: 1, exp: 'Low corners force the keeper to change height AND direction simultaneously — the hardest combination for any goalkeeper.' },
      { q: 'What is "shooting on the half-turn"?', difficulty: 2,
        opts: ['Spinning completely before shooting', 'Receiving with body half-open so you can shoot immediately without an extra touch', 'A free kick technique', 'Shooting with your weaker foot'],
        a: 1, exp: 'Half-turn receiving means you\'re already facing goal as the ball arrives — no extra touch needed, no time lost.' },
      { q: 'What does "placement over power" mean?', difficulty: 2,
        opts: ['Soft shots are always better than hard ones', 'Accuracy into the corners beats blasting it straight at the keeper', 'Goalkeepers prefer facing powerful shots', 'Power shots always miss the target'],
        a: 1, exp: 'A well-placed shot at 70% power into the corner is harder to save than a thunderbolt straight at the keeper. Placement wins games.' },
      { q: 'The "far post finish" is most effective when?', difficulty: 3,
        opts: ['Shooting from long range', 'The keeper has committed — you place it to the far post they\'ve vacated', 'Only when heading the ball', 'When you are very tired'],
        a: 1, exp: 'The far post exploits a keeper\'s momentum. They\'ve shifted one way and the far post yawns open — composure and placement win it.' },
      { q: 'What is a "driven low cross"?', difficulty: 3,
        opts: ['A shot disguised as a cross', 'A hard, flat ball played across the six-yard box for attackers to tap in', 'A cross aimed at the goalkeeper', 'A cross played backwards'],
        a: 1, exp: 'Driven low crosses across the six-yard box are the hardest deliveries to defend — pace, direction and low height combine to create chaos.' },
    ]
  },

  {
    id: 'f5', title: 'Defending Fundamentals', emoji: '🛡️',
    cat: 'Fundamentals', xp: 20, order: 5,
    desc: 'Master the core principles every player needs when defending.',
    questions: [
      { q: 'What is "jockeying"?', difficulty: 1,
        opts: ['Horse riding drills', 'Staying goalside, balanced, slowing the attacker without diving in', 'Running directly at the ball carrier', 'Committing to a tackle immediately'],
        a: 1, exp: 'Jockeying is patience — low, on your toes, side-on. You\'re channelling the attacker away from danger, waiting for the right moment.' },
      { q: 'When is the right moment to commit to a tackle?', difficulty: 2,
        opts: ['Immediately every time to show aggression', 'When the ball is slightly out of the attacker\'s control or you are certain you can win it', 'When the attacker is at their fastest', 'Never — always just jockey'],
        a: 1, exp: 'Patience is key. Wait until the ball is heavy in their touch or they\'ve shown their direction — then strike with conviction.' },
      { q: 'What does "staying goalside" mean?', difficulty: 1,
        opts: ['Standing inside the goal', 'Keeping yourself between the attacker and your own goal at all times', 'Standing directly in front of the attacker', 'Playing behind your own defensive line'],
        a: 1, exp: 'Goalside means the attacker has to go through or around you to reach goal — the absolute foundation of defending.' },
      { q: 'What is "winning the second ball"?', difficulty: 2,
        opts: ['Scoring a second goal', 'Getting to the loose ball first after any challenge or clearance', 'Playing in the second half more effectively', 'A set piece near the centre circle'],
        a: 1, exp: 'After every challenge, a loose ball appears. The team that arrives first consistently wins passages of play — and matches.' },
      { q: 'The correct defensive body shape is?', difficulty: 2,
        opts: ['Facing the attacker straight on, standing tall', 'Side-on, knees bent, weight on toes, balanced and ready to move either way', 'Facing away from the attacker', 'Arms stretched wide to block space'],
        a: 1, exp: 'Side-on and low puts you in a sprint-ready position — you can move equally quickly left or right. Standing square slows your first step.' },
      { q: 'What is "forcing the attacker onto their weak foot"?', difficulty: 3,
        opts: ['Tackling their weaker leg', 'Positioning to steer the attacker toward their less dominant foot, reducing their threat', 'A foul technique', 'Used only against left-footed players'],
        a: 1, exp: 'Smart defenders do homework — if the attacker is right-footed, position to show them left. Options narrow dramatically on their weaker side.' },
      { q: 'A "recovering run" is used when?', difficulty: 3,
        opts: ['After being substituted', 'When you\'ve been beaten and sprint to get back between the ball and goal', 'During warm-up only', 'When you\'ve made an attacking run and need to jog back'],
        a: 1, exp: 'When beaten, the only answer is to sprint back goalside. Get between the ball and goal as fast as possible — recovery runs save matches.' },
    ]
  },

  // ══════════════════════════════════════════
  //  TACTICS
  // ══════════════════════════════════════════

  {
    id: 't1', title: 'Formations Explained', emoji: '📐',
    cat: 'Tactics', xp: 20, order: 6,
    desc: 'Understand how formations shape a team\'s attack and defence.',
    questions: [
      { q: 'In a 4-3-3 formation, how many defenders are there?', difficulty: 1,
        opts: ['3', '4', '5', '2'],
        a: 1, exp: '4-3-3 means 4 defenders, 3 midfielders, 3 forwards. A classic attacking formation used by Barcelona, Liverpool and Ajax.' },
      { q: 'What does a "false 9" do?', difficulty: 3,
        opts: ['Plays as a traditional number 9 striker', 'Drops deep into midfield to create space for runners from deeper positions', 'Plays on the right wing', 'Defends set pieces only'],
        a: 1, exp: 'The false 9 confuses centre-backs — if they follow him deep, space opens behind them; if they don\'t, he has time on the ball in midfield.' },
      { q: 'A "high press" means?', difficulty: 2,
        opts: ['Only pressing in your own half', 'Pressing opponents aggressively in their own half', 'Jumping to win aerial duels more often', 'Playing long balls over the top consistently'],
        a: 1, exp: 'A high press wins the ball close to the opponent\'s goal. When it works, you\'re already positioned to attack immediately.' },
      { q: 'What is a "back four"?', difficulty: 1,
        opts: ['Four strikers playing together', 'A defensive line of two centre-backs and two full-backs', 'Four goals scored in a row', 'The four weakest players in a squad'],
        a: 1, exp: 'The back four — two CBs and two full-backs — is the defensive unit of most modern teams. Communication and coordination between them is crucial.' },
      { q: 'What does attacking "width" provide?', difficulty: 2,
        opts: ['Nothing particularly important', 'It stretches the defence horizontally, creating space in central areas', 'It makes the pitch physically smaller', 'It confuses the linesman'],
        a: 1, exp: 'Width forces defenders to spread out. The wider your wingers, the bigger the gaps in central areas for runs, passes and shots.' },
      { q: 'In a 4-2-3-1, what do the "2" represent?', difficulty: 3,
        opts: ['Two wingers', 'Two holding midfielders who screen the defence', 'Two forwards', 'Two overlapping full-backs'],
        a: 1, exp: 'The double pivot — two defensive midfielders — screens the back four, covers ground and provides the platform for attacking players.' },
      { q: 'What is the key advantage of a 3-5-2 formation?', difficulty: 4,
        opts: ['Having three goalkeepers', 'Numerical overload in midfield combined with defensive solidity from three centre-backs', 'Playing with more strikers than any other formation', 'Confusing opponents with unusual positioning'],
        a: 1, exp: 'Three at the back with wing-backs gives width in attack AND defensive cover. The five-man midfield dominates central areas — hard to play through.' },
    ]
  },

  {
    id: 't2', title: 'Pressing & Transitions', emoji: '⚡',
    cat: 'Tactics', xp: 25, order: 7,
    desc: 'Master the moments when possession changes — the most dangerous phases.',
    questions: [
      { q: 'What is a "trigger" for pressing?', difficulty: 2,
        opts: ['The referee\'s whistle', 'A pre-agreed cue (back pass, heavy touch) that signals the whole team to press simultaneously', 'Scoring a goal', 'The end of the first half'],
        a: 1, exp: 'Pressing triggers make the press organised. Everyone moves at the same moment — the opponent suddenly has nowhere to go.' },
      { q: 'What is a "transition" in football?', difficulty: 1,
        opts: ['Moving to a new club', 'The split second when possession switches from one team to the other', 'The half-time break', 'A substitution'],
        a: 1, exp: 'Transitions — the moments immediately after possession changes — are statistically the most dangerous phases. Both teams are temporarily out of shape.' },
      { q: 'Why is immediate pressing after losing the ball so valuable?', difficulty: 2,
        opts: ['It looks energetic for spectators', 'The opponent hasn\'t organised yet — the chance of winning it back is highest in the first 5 seconds', 'It tires opponents out over time', 'Coaches specifically like it on tape'],
        a: 1, exp: 'Klopp called it "gegenpressing" — winning the ball back immediately before opponents organise is the best attacking move you can make.' },
      { q: 'What does "compactness" mean in defence?', difficulty: 2,
        opts: ['Playing in a very small stadium', 'Keeping the team\'s shape tight with short distances between lines, leaving no gaps to play through', 'Running in a compact group up and down the pitch', 'Standing near the sideline'],
        a: 1, exp: 'Compact teams are hard to play through — short distances between lines mean no space for opponents to receive and turn.' },
      { q: 'A counter-attack is most effective launched?', difficulty: 2,
        opts: ['When your team is already winning by 3 goals', 'Immediately after winning the ball — the opposition is out of shape and space is available', 'During a corner kick routine', 'In the final minute of a game only'],
        a: 1, exp: 'Counter-attacks devastate when launched instantly. The opposition is committed forward, their defence is thin, the space behind is huge.' },
      { q: 'What is "pressing intensity" measured by?', difficulty: 4,
        opts: ['How loud players shout', 'PPDA — passes allowed per defensive action — the lower the number, the more intense the press', 'Tackles per game only', 'Distance covered per game'],
        a: 1, exp: 'PPDA (Passes Per Defensive Action) is the key pressing metric. Elite pressing teams like Man City and Liverpool post consistently low PPDA figures.' },
      { q: 'What is a "pressing trap"?', difficulty: 4,
        opts: ['A trap used to catch animals on the pitch', 'Deliberately inviting the ball into a specific zone, then surrounding the recipient instantly', 'A defensive formation name', 'A set piece corner routine'],
        a: 1, exp: 'A pressing trap lures the ball to a zone where your team outnumbers opponents. Guardiola\'s teams force the ball wide then pounce.' },
    ]
  },

  {
    id: 't3', title: 'Set Pieces', emoji: '🎯',
    cat: 'Tactics', xp: 20, order: 8,
    desc: 'Understand how goals are created from dead-ball situations.',
    questions: [
      { q: 'What is a "near post run" at a corner?', difficulty: 2,
        opts: ['Running away from the ball toward the far post', 'A run to the post closest to the corner taker, designed to flick on or deflect', 'Standing on the penalty spot', 'A run that starts outside the box'],
        a: 1, exp: 'Near post runs create chaos — a flick-on can confuse the keeper and reach attackers at the far post who\'ve timed their runs perfectly.' },
      { q: 'In a defensive wall, why do players stand tight together?', difficulty: 1,
        opts: ['To intimidate the free kick taker', 'To cover as much of the goal as possible and eliminate any gaps', 'Because the rules require it', 'To prevent themselves from running away'],
        a: 1, exp: 'Every gap in the wall is an invitation. Tight, linked arms, heads over the ball — a good wall forces the free kick taker into a more difficult position.' },
      { q: 'What is a "short corner"?', difficulty: 2,
        opts: ['A corner kick that only travels a short distance', 'Playing a short pass from the corner flag to draw defenders out and create different angles', 'A corner taken very quickly', 'A foul at the corner flag'],
        a: 1, exp: 'Short corners disrupt organised defensive systems — defenders must come out, creating gaps and better delivery angles.' },
      { q: 'Where do most headed goals from corners originate?', difficulty: 3,
        opts: ['The far post area', 'The near post area', 'The penalty spot area', 'The edge of the box'],
        a: 2, exp: 'Deliveries aimed at the penalty spot area create the most danger — runners arriving at pace from deeper are the hardest to track and mark.' },
      { q: 'What is a "dummy run" at a set piece?', difficulty: 3,
        opts: ['A run made by an unintelligent player', 'A decoy movement designed to drag a defender away and create space for the real target', 'Running to the wrong position accidentally', 'A run made only by substitutes'],
        a: 1, exp: 'Dummy runs create organised chaos — defenders must choose between following the decoy and leaving the real target free. They can\'t do both.' },
      { q: 'Why is "zonal marking" used at corners?', difficulty: 4,
        opts: ['Because man-marking is against the rules', 'Players defend an area of space rather than a specific opponent — removes the disadvantage of block-running', 'To confuse the referee', 'Only used in lower leagues'],
        a: 1, exp: 'Zonal marking means defenders own an area and attack any ball entering it. It removes the block-running advantage attackers gain from man-marking situations.' },
      { q: 'What is an "inswinging corner"?', difficulty: 3,
        opts: ['A corner that swings away from goal', 'A corner with spin that curves toward the goal, making the keeper\'s decision harder', 'A corner taken from inside the box', 'A short corner routine'],
        a: 1, exp: 'An inswinging corner curves toward the goal — the keeper must commit or stay, and any touch can deflect it in. Terrifying for defences to defend.' },
    ]
  },

  // ══════════════════════════════════════════
  //  POSITION-SPECIFIC
  // ══════════════════════════════════════════

  {
    id: 's1', title: 'Striker: Movement & Finishing', emoji: '⚡',
    cat: 'Striker', xp: 30, order: 9,
    positions: ['Striker', 'All-Rounder'],
    desc: 'Elite movement and clinical finishing for centre-forwards.',
    questions: [
      { q: 'What is a "blindside run"?', difficulty: 2,
        opts: ['Running when the referee isn\'t watching', 'Making a run on the side of the defender where they cannot see you without turning fully', 'Running backwards toward goal', 'A run made behind your own goal'],
        a: 1, exp: 'Blindside runs exploit the defender\'s vision. Get on their blind side and they must choose between watching you or the ball — they can\'t do both.' },
      { q: 'What does "hold-up play" mean for a striker?', difficulty: 2,
        opts: ['Deliberately slowing the game down', 'Receiving with back to goal, shielding the ball, and linking play for arriving teammates', 'Always running in behind the defence', 'Shooting from distance regularly'],
        a: 1, exp: 'A striker who can hold the ball becomes the team\'s pivot point — midfielders join the attack knowing the striker will protect possession.' },
      { q: 'What is a "poacher\'s goal"?', difficulty: 1,
        opts: ['A spectacular long-range thunderbolt', 'A close-range goal from a rebound, deflection or tap-in — instinct over technique', 'A bicycle kick', 'A penalty kick'],
        a: 1, exp: 'Poachers live in the six-yard box. They score the scrappy, ugly goals others miss simply by always being there, always alert.' },
      { q: 'Timing your run to stay onside requires?', difficulty: 3,
        opts: ['Being the fastest player on the pitch', 'Watching the last defender\'s position and moving the instant the ball is played — not before', 'Starting every run from very deep', 'Always staying behind the ball'],
        a: 1, exp: 'Great strikers time their runs off the last defender. The movement starts as the pass is played — not before, which triggers the offside flag.' },
      { q: 'A "far post finish" is used when?', difficulty: 2,
        opts: ['Shooting from long range with power', 'The keeper has committed — you place the ball to the far post they\'ve moved away from', 'Used only for headers', 'When you are exhausted and can\'t shoot hard'],
        a: 1, exp: 'When the keeper commits one way, the far post opens up. Composure and placement — not power — is all that\'s needed.' },
      { q: 'What is a striker\'s "movement off the ball"?', difficulty: 3,
        opts: ['Standing still waiting for the ball', 'Constant purposeful movement to drag defenders out of position and create space', 'Jogging slowly in circles to conserve energy', 'Only moving when called for by the captain'],
        a: 1, exp: 'The best strikers work hardest without the ball — dragging defenders, creating space, then making the decisive run at exactly the right moment.' },
      { q: 'When a striker "drops into the hole", what does this mean?', difficulty: 4,
        opts: ['They have fallen over and been injured', 'Dropping into the space between midfield and defence to receive, turn and face goal', 'Running into the penalty area to receive a cross', 'Playing as a second goalkeeper in emergencies'],
        a: 1, exp: 'Dropping into the hole pulls defenders out of position. If a CB follows, space opens behind. If they don\'t follow, the striker receives with time to turn and attack.' },
    ]
  },

  {
    id: 'm1', title: 'Midfielder: Vision & Press Resistance', emoji: '🎯',
    cat: 'Midfielder', xp: 30, order: 10,
    positions: ['Midfielder', 'All-Rounder'],
    desc: 'Develop the vision, awareness and composure of an elite midfielder.',
    questions: [
      { q: 'What does "scanning" mean in midfield?', difficulty: 1,
        opts: ['Only looking at the ball', 'Regularly checking your surroundings before receiving so you already know your next action', 'Using technology to analyse the game', 'Checking the scoreboard frequently'],
        a: 1, exp: 'Elite midfielders scan constantly. By the time the ball arrives they\'ve already decided — no hesitation, no delay, impossible to press effectively.' },
      { q: 'What is "press resistance"?', difficulty: 2,
        opts: ['Doing physical resistance training', 'Staying composed under pressure and finding the right pass or escape route when opponents press', 'Pressing opponents yourself', 'Avoiding training when tired'],
        a: 1, exp: 'Press resistance is composure under fire — the ability to stay calm when opponents crowd you and find the solution. Thiago Alcantara defines this quality.' },
      { q: 'A "box-to-box" midfielder does?', difficulty: 2,
        opts: ['Only attacks', 'Only defends', 'Contributes fully in both penalty boxes — attacking and defending with equal intensity', 'Stays near the centre circle at all times'],
        a: 2, exp: 'Box-to-box midfielders are engines — vast distances covered, contributing to attacks and recovering to defend. Gerrard, Lampard and Vidal are the archetypes.' },
      { q: 'What is the "pivot" role in midfield?', difficulty: 3,
        opts: ['A winger who cuts inside', 'A holding midfielder who screens the defence and distributes calmly under pressure', 'A full-back who pushes forward', 'A striker who drops deep'],
        a: 1, exp: 'The pivot (holding midfielder) is the team\'s anchor — protecting the back four and being the first receiver who distributes to more advanced players.' },
      { q: 'When should a midfielder shoot from outside the box?', difficulty: 3,
        opts: ['Never — always pass to the striker', 'When in a good striking position with no better option — the threat of long shots opens space', 'Only in the last minute of a game', 'When the goalkeeper isn\'t looking'],
        a: 1, exp: 'Long-range shooting isn\'t just about goals — it forces the defensive block to move, creating space. Knowing when to shoot versus pass is key IQ.' },
      { q: 'What is a "double pivot" in midfield?', difficulty: 4,
        opts: ['Two strikers playing together', 'Two holding midfielders playing alongside each other to screen and protect the defence', 'A crossing technique from wide areas', 'A defensive formation used at corners'],
        a: 1, exp: 'A double pivot gives double protection and two passing options at all times. Fabinho and Henderson for Liverpool; Busquets and Xavi for Barcelona.' },
      { q: 'What does "dictating the tempo" mean for a midfielder?', difficulty: 4,
        opts: ['Running very fast throughout the match', 'Controlling the pace of the game through deliberate pass selection — speeding up or slowing down as needed', 'Telling teammates what to do loudly', 'Only ever passing quickly'],
        a: 1, exp: 'The best midfielders control the game\'s rhythm — speed it up when space is available, slow it down when composure is needed. Pirlo was the master.' },
    ]
  },

  {
    id: 'd1', title: 'Defender: Reading the Game', emoji: '🛡️',
    cat: 'Defender', xp: 30, order: 11,
    positions: ['Defender', 'All-Rounder'],
    desc: 'Develop the reading, organisation and leadership of a top centre-back.',
    questions: [
      { q: 'What is "anticipation" for a defender?', difficulty: 2,
        opts: ['Feeling anxious before a big game', 'Reading the play before it happens and positioning accordingly — no chasing, no scrambling', 'Guessing randomly where the ball will go', 'Fouling attackers before they receive'],
        a: 1, exp: 'Great defenders read the game two passes ahead. Anticipation means you\'re already in position — no desperate defending required.' },
      { q: 'Why should centre-backs communicate constantly?', difficulty: 1,
        opts: ['They are the loudest players by nature', 'To organise the defensive line, call for the ball, alert teammates to runners', 'Only to speak to the goalkeeper', 'To shout at the opposition'],
        a: 1, exp: 'The CB is the team\'s organiser — your voice controls the line, warns of runners and keeps the defensive shape compact. Leadership through communication.' },
      { q: 'What is an "aerial duel"?', difficulty: 1,
        opts: ['A fight during the game', 'A contest between players to win a headed ball', 'A type of free kick', 'A bicycle kick goal'],
        a: 1, exp: 'Winning aerial duels — timing your jump, using your body and attacking the ball with your forehead — is a core centre-back skill, especially from set pieces.' },
      { q: 'When is it right to step out aggressively from the defensive line?', difficulty: 3,
        opts: ['Never — always hold your position', 'When an opponent receives and faces away from goal — step in to squeeze and win the ball high', 'Every time the ball is played forward', 'Only from corners'],
        a: 1, exp: 'Stepping onto a turned player wins the ball high and in a dangerous area for the opponents. The key is doing it as a unit — not individually.' },
      { q: 'What does "playing an offside trap" require?', difficulty: 3,
        opts: ['Individual pace to run fast', 'Total coordination — every defender steps up at the exact same moment when the pass is played', 'One very fast defender to cover', 'The goalkeeper\'s hand signal to go'],
        a: 1, exp: 'The offside trap lives and dies by coordination. One defender who doesn\'t step up breaks the whole line — one person ruins it for everyone.' },
      { q: 'What does a defender\'s "defensive shape" refer to?', difficulty: 3,
        opts: ['Their physical physique and build', 'The organised positioning of the defensive unit — distances, lines and cover maintained as a collective', 'How they individually stand', 'Their sprint mechanics and technique'],
        a: 1, exp: 'Defensive shape is collective — distances between defenders, between defensive and midfield lines, and how they shift together as one unit.' },
      { q: 'What is "cover shadowing" by a defender?', difficulty: 4,
        opts: ['Standing in the shade during a summer match', 'Positioning your body to block the passing lane to a specific opponent without directly marking them', 'A shadow drill used in pre-season training', 'Covering the sun to improve visibility'],
        a: 1, exp: 'Cover shadowing intercepts passes without engaging. You make yourself a physical barrier in the passing lane — the opponent is out of the game without being touched.' },
    ]
  },

  {
    id: 'g1', title: 'Goalkeeper: Saves & Organisation', emoji: '🧤',
    cat: 'Goalkeeper', xp: 30, order: 12,
    positions: ['Goalkeeper', 'All-Rounder'],
    desc: 'Develop the technique, positioning and leadership of a modern goalkeeper.',
    questions: [
      { q: 'What is the correct "ready position" for a goalkeeper?', difficulty: 1,
        opts: ['Sitting on the goal line relaxed', 'On toes, slightly forward-leaning, hands up, weight evenly balanced', 'Arms crossed, standing completely still', 'Crouching very low to the ground'],
        a: 1, exp: 'The ready position — on toes, weight forward — means you can explode in any direction at a moment\'s notice. Static keepers react too slowly.' },
      { q: 'For a close-range shot, what is the best technique?', difficulty: 2,
        opts: ['Dive dramatically to the side', 'Get your whole body behind the ball — if you spill it, you\'re still there to smother', 'Close your eyes and trust instinct', 'Jump as high as possible'],
        a: 1, exp: 'Close-range shots need the whole body as a barrier. Even if you spill it, your body position lets you recover and smother the rebound.' },
      { q: '"Narrowing the angle" means?', difficulty: 2,
        opts: ['Physically moving the goalposts closer', 'Coming off your line toward the attacker to reduce the visible goal from their perspective', 'Moving to one side of the goal early', 'Asking defenders to help close down'],
        a: 1, exp: 'As you advance, the visible goal shrinks dramatically. Come too far and they chip you — the art is finding the right distance off your line.' },
      { q: 'What is "distribution" for a goalkeeper?', difficulty: 2,
        opts: ['Sharing equipment with the squad', 'How accurately and intelligently you restart play to launch attacks', 'Taking penalty kicks for the team', 'Kicking the ball into the stands for time'],
        a: 1, exp: 'Modern goalkeepers are the first playmakers. A quick, accurate distribution after a save can launch a counter-attack before the opposition organises.' },
      { q: 'What does "set for a penalty" mean?', difficulty: 2,
        opts: ['Setting up a camera to record the kick', 'Getting your ready position — centred, on toes — before the kick is taken', 'Choosing a corner to dive to before the kick', 'Trying to distract the penalty taker'],
        a: 1, exp: 'Setting well means being centred and ready to move in any direction. Guessing a corner too early is a gamble — a well-set keeper gives themselves the best chance.' },
      { q: 'What is "sweeper-keeper" play?', difficulty: 3,
        opts: ['A goalkeeper who also sweeps the dressing room', 'An active goalkeeper who comes off their line to deal with through balls and act as a last defender', 'A goalkeeper restricted to their six-yard box', 'A specific penalty-saving technique'],
        a: 1, exp: 'The sweeper-keeper (Neuer\'s model) acts as a libero behind the defence — reading through balls early, rushing to clear and extending the defensive line.' },
      { q: 'What is "footwork" in goalkeeping?', difficulty: 3,
        opts: ['Playing with your feet only and no hands', 'Precise, quick foot movements that get you into position correctly before and during a save', 'All the various kicking techniques', 'Playing football with no hands at all'],
        a: 1, exp: 'Good footwork gets you into position quickly without unnecessary diving. Your feet set your body, your body sets your hands. The best keepers look unhurried because their feet are excellent.' },
    ]
  },

  // ══════════════════════════════════════════
  //  RULES
  // ══════════════════════════════════════════

  {
    id: 'r1', title: 'The Laws of Football', emoji: '📋',
    cat: 'Rules', xp: 15, order: 13,
    desc: 'Know the rules of the game inside out.',
    questions: [
      { q: 'How many players does a full team have on the pitch?', difficulty: 1,
        opts: ['9', '10', '11', '12'],
        a: 2, exp: '11 players per side. A game can continue with a minimum of 7 if red cards or injuries reduce numbers.' },
      { q: 'A goal kick is awarded when?', difficulty: 1,
        opts: ['The ball goes out for a corner kick', 'The attacking team puts the ball over the goal line without scoring', 'The goalkeeper makes a save', 'A penalty kick is missed'],
        a: 1, exp: 'Goal kick: the attacking team last touched the ball before it crossed the goal line without a goal. The defending team restart.' },
      { q: 'How long is a standard half?', difficulty: 1,
        opts: ['30 minutes', '45 minutes', '60 minutes', '40 minutes'],
        a: 1, exp: '45 minutes per half, plus stoppage time added by the referee for delays — goals, injuries, substitutions, VAR reviews and time-wasting.' },
      { q: 'When is a handball offence committed?', difficulty: 2,
        opts: ['Any time the ball touches any part of the arm at all', 'When the ball touches the hand or arm in an unnatural position, or deliberately', 'Only when a player catches the ball cleanly', 'Only when it directly prevents a goal'],
        a: 1, exp: 'Handball requires context — an arm in an unnatural position, or deliberately used to control the ball. Natural positions close to the body are generally not penalised.' },
      { q: 'When is a player in an offside position?', difficulty: 2,
        opts: ['When they are behind the referee on the pitch', 'When any part of their scoring body is closer to the goal line than both the ball AND the second-to-last defender', 'When they are running very fast in the opposition half', 'When they are in the opposition half at all'],
        a: 1, exp: 'Offside position requires being ahead of the second-to-last defender AND ahead of the ball. Being in position alone isn\'t an offence — being active in play is.' },
      { q: 'What is a "direct free kick"?', difficulty: 2,
        opts: ['A free kick where you can score directly without the ball touching another player first', 'A free kick that must go to a teammate first before shooting', 'Any free kick awarded in your own half', 'A free kick taken very quickly before the wall is set'],
        a: 0, exp: 'A direct free kick can go straight into goal without touching another player. Awarded for more serious fouls — pushing, kicking, holding, tripping.' },
      { q: 'What does "advantage" mean when the referee waves play on?', difficulty: 3,
        opts: ['The team with the most players wins', 'The referee lets play continue after a foul because stopping play would disadvantage the fouled team', 'The team that scored most recently has an advantage', 'The home team always has a playing advantage'],
        a: 1, exp: 'Advantage means the referee has seen a foul but allows play to continue because stopping would disadvantage the fouled team. The referee can still come back and card the fouler.' },
    ]
  },

  {
    id: 'r2', title: 'Referee Signals & Decisions', emoji: '🟨',
    cat: 'Rules', xp: 15, order: 14,
    desc: 'Understand what referees are signalling and why.',
    questions: [
      { q: 'A yellow card means?', difficulty: 1,
        opts: ['Excellent play deserving recognition', 'A caution — two yellows in one game equals a red card and dismissal', 'The game is being paused briefly', 'A goal has been disallowed'],
        a: 1, exp: 'Yellow = caution. Players must manage discipline carefully — accumulated yellows across matches also lead to automatic suspensions.' },
      { q: 'VAR stands for?', difficulty: 1,
        opts: ['Very Accurate Referee', 'Video Assistant Referee', 'Visual Alert Review', 'Visiting Assistant Rules'],
        a: 1, exp: 'VAR reviews four categories: goals, penalties, red cards, and mistaken identity. It can only recommend — the on-field referee makes the final decision.' },
      { q: 'What does the referee signal for a penalty kick?', difficulty: 1,
        opts: ['Both arms raised above head', 'Pointing clearly to the penalty spot', 'Waving play on toward goal', 'Showing a yellow card to the goalkeeper'],
        a: 1, exp: 'Pointing to the penalty spot is universal and unambiguous. The referee will also blow their whistle and may indicate which player committed the foul.' },
      { q: 'Stoppage time is added for?', difficulty: 1,
        opts: ['Goals scored during the half', 'Time lost for stoppages — substitutions, injuries, goals, VAR checks, time-wasting', 'When a team is losing by two or more goals', 'Weather delays only'],
        a: 1, exp: 'The fourth official boards the minimum stoppage time based on delays. Since 2022, IFAB guidance allows much longer additions — sometimes 10+ minutes.' },
      { q: 'Denying an obvious goal-scoring opportunity (DOGSO) results in?', difficulty: 3,
        opts: ['A yellow card and a warning only', 'A red card — immediate dismissal', 'A penalty and a yellow card', 'Play is waved on'],
        a: 1, exp: 'DOGSO is a red card offence. Though for fouls inside the box where a penalty is given, a yellow card is now sometimes shown instead of red.' },
      { q: 'What is "simulation" (diving) and what is the punishment?', difficulty: 2,
        opts: ['A legal technique to draw fouls', 'Deliberately falling to deceive the referee — punishable with a yellow card for unsporting behaviour', 'Only illegal if done in the penalty area', 'Punishable with an automatic red card'],
        a: 1, exp: 'Simulation — diving or feigning injury to deceive the referee — is a yellow card. The referee must judge intent, making it one of the harder decisions in the game.' },
      { q: 'A "professional foul" near the halfway line results in?', difficulty: 3,
        opts: ['Just a free kick with no card', 'A yellow card and a free kick in most cases', 'A red card if it denies an obvious goal-scoring opportunity', 'Nothing — it\'s legal near halfway'],
        a: 2, exp: 'Location matters for DOGSO — a player with a clear run on goal, cynically stopped by a foul near halfway, can absolutely receive a red card for denying an obvious opportunity.' },
    ]
  },

  // ══════════════════════════════════════════
  //  PRO KNOWLEDGE
  // ══════════════════════════════════════════

  {
    id: 'p1', title: 'Football IQ: Pro Concepts', emoji: '🧠',
    cat: 'Pro Knowledge', xp: 30, order: 15,
    desc: 'Understand the tactical and analytical concepts used at the highest level.',
    questions: [
      { q: 'What does "Expected Goals (xG)" measure?', difficulty: 2,
        opts: ['The total goals scored in a match', 'The probability that a given shot results in a goal, based on shot quality', 'A player\'s historical goal-scoring record', 'Goals that were disallowed by VAR'],
        a: 1, exp: 'xG tells you whether a team should have scored more or less than they did. A team with 3.0 xG that scores 1 is likely to outperform that in future matches.' },
      { q: 'What is "positional play" (juego de posición)?', difficulty: 3,
        opts: ['Playing only in your assigned position no matter what', 'Intelligent occupation of the pitch to create numerical and positional superiorities in key zones', 'Marking opponents tightly wherever they go', 'A rigid fixed formation system'],
        a: 1, exp: 'Juego de posición — associated with Cruyff, Guardiola and Xavi — is about dominating space. Players occupy positions to create passing triangles and overloads, not positions for their own sake.' },
      { q: 'What does "PPDA" stand for and what does it measure?', difficulty: 4,
        opts: ['Passes Per Defensive Area', 'Passes Permitted per Defensive Action — measures pressing intensity, lower = more pressing', 'Points Per Draw Away from home', 'Player Performance Data Analysis score'],
        a: 1, exp: 'PPDA measures how many passes opponents make per defensive action (tackle, interception, pressure). Low PPDA = aggressive pressing team. Man City and Liverpool post elite figures.' },
      { q: 'What is a "half-space" in attacking play?', difficulty: 3,
        opts: ['Playing with only five players in attack', 'The zone between the winger and centre-forward — diagonally dangerous, hard for defences to cover', 'The space available at half-time', 'Playing only in the opponents\' half'],
        a: 1, exp: 'Half-spaces are the most dangerous attacking zones — direct access to goal, hard for full-backs and centre-backs to cover simultaneously. Özil and Iniesta operated here masterfully.' },
      { q: 'What does "overloading a flank" mean?', difficulty: 3,
        opts: ['Having too many players on the pitch illegally', 'Getting more players than the opposition into one wide channel to create a numerical advantage', 'A dangerous defensive mistake that leads to goals', 'Running with the ball along the touchline'],
        a: 1, exp: 'Flank overloads create 2v1 or 3v2 situations wide — forcing the defence to choose between holding shape or shifting, which opens space elsewhere on the pitch.' },
      { q: 'What is "vertical compactness"?', difficulty: 4,
        opts: ['Storing kit vertically in a cupboard', 'Keeping short distances between defensive and midfield lines to deny space between them', 'Playing with a very tall striker up front', 'A gym exercise used by professional footballers'],
        a: 1, exp: 'Vertical compactness — short distances between lines — is the foundation of modern defensive organisation. No space between lines means no room to receive and turn.' },
      { q: 'What does "progressive passing" measure as a metric?', difficulty: 4,
        opts: ['Passing while running forward physically', 'Passes that move the ball significantly closer to the opponent\'s goal — a measure of attacking intent', 'Passing to the most expensive player on the team', 'The total number of passes made in a game'],
        a: 1, exp: 'Progressive passing separates safe sideways ball movement from genuine attacking intent. Teams with high progressive passing tend to create more chances consistently.' },
    ]
  },

  {
    id: 'p2', title: 'World Football: History & Icons', emoji: '🌍',
    cat: 'Pro Knowledge', xp: 20, order: 16,
    desc: 'Know the legends, moments and history that shaped the beautiful game.',
    questions: [
      { q: 'Who is the only person to win the World Cup as both player AND manager?', difficulty: 2,
        opts: ['Pelé', 'Franz Beckenbauer', 'Johan Cruyff', 'Ronaldo R9'],
        a: 1, exp: 'Franz Beckenbauer — "Der Kaiser" — won the 1974 World Cup as captain and managed West Germany to the 1990 title. A unique double in football history.' },
      { q: 'Which club is credited with developing "Total Football"?', difficulty: 2,
        opts: ['Bayern Munich', 'Ajax Amsterdam', 'Liverpool FC', 'FC Barcelona'],
        a: 1, exp: 'Ajax in the early 1970s, under Rinus Michels with Johan Cruyff as the embodiment, revolutionised football — every player able to play every position.' },
      { q: 'How many times has Brazil won the FIFA World Cup?', difficulty: 1,
        opts: ['3', '4', '5', '6'],
        a: 2, exp: 'Brazil leads all nations with 5 World Cup titles — 1958, 1962, 1970, 1994 and 2002. The 1970 side featuring Pelé is considered by many the greatest team ever.' },
      { q: 'What year was the Premier League founded?', difficulty: 2,
        opts: ['1985', '1988', '1992', '1996'],
        a: 2, exp: 'The Premier League launched in 1992 as a breakaway from the Football League, transforming English football commercially and attracting global talent and investment.' },
      { q: 'Which nation is credited with popularising the 4-4-2 formation?', difficulty: 3,
        opts: ['Brazil', 'Italy', 'England', 'Netherlands'],
        a: 2, exp: 'England popularised the 4-4-2 in the 1960s-70s. Alf Ramsey\'s 1966 World Cup "Wingless Wonders" laid the groundwork for what became the global default formation.' },
      { q: 'What was significant about the 1953 "Match of the Century"?', difficulty: 4,
        opts: ['The first ever World Cup final', 'Hungary beat England 6-3 at Wembley — England\'s first ever home defeat to foreign opposition', 'The first match broadcast live on television', 'The first match played under floodlights'],
        a: 1, exp: 'Hungary\'s 6-3 demolition of England at Wembley in 1953 shattered the myth of English football superiority and ushered in a new tactical era worldwide.' },
      { q: 'What is the "Cruyff Turn"?', difficulty: 2,
        opts: ['A turn used exclusively by Dutch players', 'A deceptive move where you fake to cross or pass then drag the ball behind your standing leg and accelerate away', 'A type of diving header technique', 'A defensive clearance technique'],
        a: 1, exp: 'Johan Cruyff unveiled this move at the 1974 World Cup and it changed football forever. It\'s now a fundamental skill taught to young players all over the world.' },
    ]
  },

];

// ─────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────
function getChapterById(id) {
  return ALL_CHAPTERS.find(c => c.id === id) || null;
}

function getChaptersForPosition(position) {
  return ALL_CHAPTERS
    .filter(c => !c.positions || c.positions.includes(position))
    .sort((a, b) => a.order - b.order);
}

function getCategoriesForPosition(position) {
  const chapters = getChaptersForPosition(position);
  return [...new Set(chapters.map(c => c.cat))];
}

// ─────────────────────────────────────────────
//  BADGE DEFINITIONS
// ─────────────────────────────────────────────
const BADGES = [
  { id: 'first_quiz',    emoji: '📝', name: 'First Whistle',    desc: 'Complete your first quiz',
    condition: s => Object.keys(s.quizScores).length >= 1 },
  { id: 'perfect_quiz',  emoji: '💯', name: 'Perfect 10',       desc: 'Score 100% on any chapter',
    condition: s => Object.entries(s.quizScores).some(([id, sc]) => { const ch = getChapterById(id); return ch && sc === ch.questions.length; }) },
  { id: 'three_perfect', emoji: '🌟', name: 'Hat-Trick Brain',  desc: 'Score 100% on three chapters',
    condition: s => Object.entries(s.quizScores).filter(([id, sc]) => { const ch = getChapterById(id); return ch && sc === ch.questions.length; }).length >= 3 },
  { id: 'streak_3',      emoji: '🔥', name: 'On Fire',          desc: 'Reach a 3-day streak',
    condition: s => s.streak >= 3 },
  { id: 'streak_7',      emoji: '🏆', name: 'Week Warrior',     desc: 'Reach a 7-day streak',
    condition: s => s.streak >= 7 },
  { id: 'streak_30',     emoji: '👑', name: 'Iron Commitment',  desc: 'Reach a 30-day streak',
    condition: s => s.streak >= 30 },
  { id: 'level_3',       emoji: '⭐', name: 'Academy Graduate', desc: 'Reach Level 3',
    condition: s => getLevelFromXP(s.xp) >= 3 },
  { id: 'level_6',       emoji: '🎖️', name: 'Pro Contract',     desc: 'Reach Level 6',
    condition: s => getLevelFromXP(s.xp) >= 6 },
  { id: 'level_10',      emoji: '🥇', name: 'Living Legend',    desc: 'Reach Level 10',
    condition: s => getLevelFromXP(s.xp) >= 10 },
  { id: 'five_chapters', emoji: '📚', name: 'Bookworm',         desc: 'Complete 5 chapters',
    condition: s => s.completedChapters.length >= 5 },
  { id: 'all_chapters',  emoji: '🎓', name: 'Full Education',   desc: 'Complete every chapter for your position',
    condition: s => s.completedChapters.length >= getChaptersForPosition(s.position).length },
  { id: 'game_master',   emoji: '🎮', name: 'Game Master',      desc: 'Score 4+ in any mini-game',
    condition: s => Object.values(s.gameHighScores).some(v => v >= 4) },
  { id: 'clean_sweep',   emoji: '💎', name: 'Clean Sweep',      desc: 'Score maximum in any mini-game',
    condition: s => Object.entries(s.gameHighScores).some(([k, v]) => { const g = GAME_META[k]; return g && v >= g.max; }) },
  { id: 'daily_done',    emoji: '📅', name: 'Daily Grind',      desc: 'Complete your first daily challenge',
    condition: s => (s.dailyChallengesCompleted || 0) >= 1 },
  { id: 'daily_7',       emoji: '🗓️', name: 'Consistent',       desc: 'Complete 7 daily challenges',
    condition: s => (s.dailyChallengesCompleted || 0) >= 7 },
  { id: 'xp_500',        emoji: '💪', name: 'Rising Star',      desc: 'Earn 500 XP',
    condition: s => s.xp >= 500 },
  { id: 'xp_1000',       emoji: '🚀', name: 'Breakthrough',     desc: 'Earn 1,000 XP',
    condition: s => s.xp >= 1000 },
  { id: 'xp_2500',       emoji: '🔮', name: 'Elite Level',      desc: 'Earn 2,500 XP',
    condition: s => s.xp >= 2500 },
  { id: 'speed_demon',   emoji: '⚡', name: 'Speed Demon',      desc: 'Answer 5 questions in under 4 seconds each',
    condition: s => (s.fastAnswers || 0) >= 5 },
];

function getEarnedBadges(state) {
  return BADGES.filter(b => { try { return b.condition(state); } catch { return false; } });
}

// ─────────────────────────────────────────────
//  DAILY CHALLENGE POOL
// ─────────────────────────────────────────────
const DAILY_POOL = [
  { q: 'In football, what does "pressing high" mean?',
    opts: ['Pressing from your own goal', 'Pressing opponents in their own half', 'Pressing the referee for decisions', 'Pressing the ball against the net'],
    a: 1, exp: 'Pressing high means winning the ball back close to the opponent\'s goal — the best starting position for an immediate attack.' },
  { q: 'What does "xG" stand for?',
    opts: ['Extra Goals', 'Expected Goals', 'Excellent Game', 'Extreme Goalscoring'],
    a: 1, exp: 'Expected Goals (xG) measures the quality of a chance — the probability it results in a goal based on distance, angle and type of assist.' },
  { q: 'A player can be offside from a goal kick. True or false?',
    opts: ['True', 'False', 'Only in extra time', 'Only in the attacking half'],
    a: 1, exp: 'False — you cannot be offside from a goal kick, corner kick or throw-in. These are direct restart exceptions in the Laws of the Game.' },
  { q: 'What is the "false 9" position?',
    opts: ['A winger who tracks back defensively', 'A striker who drops deep to confuse defenders and create space', 'A goalkeeper who plays outfield', 'A defender who joins attacks regularly'],
    a: 1, exp: 'The false 9 drops into the space between midfield and defence. If defenders follow, space opens behind them; if they don\'t, the player has time on the ball.' },
  { q: 'How many officials are typically on-site at a top-level match?',
    opts: ['1', '2', '4', '6'],
    a: 2, exp: 'A referee, two assistant referees, and a fourth official — plus VAR officials in a separate room at the highest levels. So typically 4 on-site minimum.' },
  { q: 'What does "pressing intensity" describe?',
    opts: ['How loudly fans chant and press for tickets', 'How aggressively a team hunts the ball in opposition territory', 'How physically strong the players are', 'How hard the ball is kicked on average'],
    a: 1, exp: 'Pressing intensity describes how aggressively and how high up the pitch a team hunts possession — measured by PPDA in modern analytics.' },
  { q: 'The "number 10" shirt traditionally belongs to which type of player?',
    opts: ['Goalkeeper', 'Centre-back', 'Attacking midfielder or playmaker', 'Centre-forward'],
    a: 2, exp: 'The number 10 belongs to the creative playmaker — the most glamorous shirt in football. Think Pelé, Maradona, Zidane, Messi, Iniesta.' },
  { q: 'What is a "clean sheet"?',
    opts: ['A new kit issued to the team', 'A match in which the goalkeeper and defence concede zero goals', 'A draw at the end of 90 minutes', 'A yellow card given for foul play'],
    a: 1, exp: 'A clean sheet means zero goals conceded. A point of immense pride for defenders and keepers — it takes the whole team to keep one.' },
  { q: 'What does "playing out from the back" mean?',
    opts: ['Defending near your own goal', 'Building attacks with short passes from the goalkeeper and defenders rather than long kicks', 'Hoofing long balls out of defence', 'Kicking the ball out for a corner deliberately'],
    a: 1, exp: 'Playing out from the back keeps possession and builds attacks patiently. It requires composure under pressure but controls the game when done well.' },
  { q: 'What is a "brace" in football?',
    opts: ['Wearing protective leg equipment', 'Scoring two goals in the same match', 'A tackle from behind', 'A type of corner kick routine'],
    a: 1, exp: 'A brace is two goals by the same player in one match. Three goals is a hat-trick. Standard football vocabulary used by commentators worldwide.' },
];

function getDailyQuestions(count = 5) {
  // Deterministic daily shuffle based on today's date
  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const pool = [...DAILY_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// When using plain <script> tags everything above is global.
// For ES modules, uncomment:
// export { ALL_CHAPTERS, BADGES, DAILY_POOL, GAME_META, LEVEL_TITLES,
//   LEVEL_XP, POSITIONS, getLevelFromXP, getLevelTitle, getLevelProgress,
//   getXPToNext, getChapterById, getChaptersForPosition,
//   getCategoriesForPosition, getEarnedBadges, getDailyQuestions };
