/* ==========================================================================
   FitForge — Exercise library
   --------------------------------------------------------------------------
   Add your own by appending a row. Arguments, in order:

     id        unique slug
     name      display name
     primary   main muscle worked (see MUSCLES below)
     secondary array of assisting muscles
     pattern   movement pattern — used to build balanced sessions
     equip     equipment REQUIRED (all items must be available). [] = bodyweight
     level     1 beginner · 2 intermediate · 3 advanced
     stress    joints/areas loaded — used to respect injury limitations
     cue       one-line coaching cue shown in the workout view
     kind      compound | isolation | cardio | mobility

   Equipment vocabulary:
     dumbbell barbell ez_bar bench rack pullup_bar dip_bar cable machine
     smith kettlebell bands trx box ab_wheel jump_rope treadmill bike
     rower elliptical stairmaster sled foam_roller medicine_ball
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  FF.MUSCLES = {
    chest: "Chest",
    back: "Back",
    lats: "Lats",
    traps: "Traps",
    delts: "Shoulders",
    side_delts: "Side delts",
    rear_delts: "Rear delts",
    biceps: "Biceps",
    triceps: "Triceps",
    forearms: "Forearms",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    core: "Core",
    obliques: "Obliques",
    lower_back: "Lower back",
    full_body: "Full body",
    heart: "Conditioning",
    mobility: "Mobility",
  };

  FF.PATTERNS = {
    horizontal_push: "Horizontal push",
    vertical_push: "Vertical push",
    horizontal_pull: "Horizontal pull",
    vertical_pull: "Vertical pull",
    squat: "Squat",
    hinge: "Hinge",
    lunge: "Single leg",
    carry: "Carry",
    core: "Core",
    arms: "Arms",
    accessory: "Accessory",
    conditioning: "Conditioning",
    mobility: "Mobility",
  };

  FF.EQUIPMENT = {
    dumbbell: "Dumbbells",
    barbell: "Barbell + plates",
    ez_bar: "EZ curl bar",
    bench: "Bench",
    rack: "Squat rack",
    pullup_bar: "Pull-up bar",
    dip_bar: "Dip bars / parallettes",
    cable: "Cable machine",
    machine: "Weight machines",
    smith: "Smith machine",
    kettlebell: "Kettlebell",
    bands: "Resistance bands",
    trx: "TRX / rings",
    box: "Plyo box / sturdy chair",
    ab_wheel: "Ab wheel",
    jump_rope: "Jump rope",
    treadmill: "Treadmill",
    bike: "Exercise bike",
    rower: "Rowing machine",
    elliptical: "Elliptical",
    stairmaster: "Stair climber",
    sled: "Sled",
    foam_roller: "Foam roller",
    medicine_ball: "Medicine ball",
  };

  /* Everything a commercial gym is assumed to have. */
  FF.GYM_EQUIPMENT = [
    "dumbbell", "barbell", "ez_bar", "bench", "rack", "pullup_bar", "dip_bar",
    "cable", "machine", "smith", "kettlebell", "bands", "trx", "box",
    "ab_wheel", "jump_rope", "treadmill", "bike", "rower", "elliptical",
    "stairmaster", "sled", "foam_roller", "medicine_ball",
  ];

  function E(id, name, primary, secondary, pattern, equip, level, stress, cue, kind) {
    return { id, name, primary, secondary, pattern, equip, level, stress, cue, kind };
  }

  FF.EXERCISES = [
    /* ------------------------------------------------------------- CHEST */
    E("bb-bench", "Barbell Bench Press", "chest", ["triceps", "delts"], "horizontal_push", ["barbell", "bench"], 2, ["shoulder"], "Ribs down, elbows ~45°, bar to mid-chest.", "compound"),
    E("bb-incline", "Incline Barbell Press", "chest", ["delts", "triceps"], "horizontal_push", ["barbell", "bench"], 2, ["shoulder"], "Bench at 30°. Bar travels to the collarbone.", "compound"),
    E("db-bench", "Dumbbell Bench Press", "chest", ["triceps", "delts"], "horizontal_push", ["dumbbell", "bench"], 1, ["shoulder"], "Wrists stacked over elbows, control the stretch.", "compound"),
    E("db-incline", "Incline Dumbbell Press", "chest", ["delts", "triceps"], "horizontal_push", ["dumbbell", "bench"], 1, ["shoulder"], "Slight arch, press up and slightly back.", "compound"),
    E("db-floor-press", "Dumbbell Floor Press", "chest", ["triceps"], "horizontal_push", ["dumbbell"], 1, [], "Triceps touch the floor, then press. Shoulder friendly.", "compound"),
    E("pushup", "Push-Up", "chest", ["triceps", "core"], "horizontal_push", [], 1, ["wrist"], "Body in one line, hands under shoulders.", "compound"),
    E("pushup-incline", "Incline Push-Up", "chest", ["triceps"], "horizontal_push", [], 1, ["wrist"], "Hands on a bench or counter — easier than the floor.", "compound"),
    E("pushup-decline", "Decline Push-Up", "chest", ["delts", "triceps"], "horizontal_push", ["box"], 2, ["wrist"], "Feet elevated. More load on the upper chest.", "compound"),
    E("pushup-diamond", "Diamond Push-Up", "triceps", ["chest"], "horizontal_push", [], 2, ["wrist", "elbow"], "Hands together under the sternum, elbows tucked.", "compound"),
    E("pushup-archer", "Archer Push-Up", "chest", ["triceps", "core"], "horizontal_push", [], 3, ["wrist", "shoulder"], "Shift weight over one arm, other arm straight.", "compound"),
    E("dips", "Parallel Bar Dips", "chest", ["triceps", "delts"], "horizontal_push", ["dip_bar"], 2, ["shoulder"], "Lean forward for chest, upright for triceps.", "compound"),
    E("cable-fly", "Cable Fly", "chest", [], "accessory", ["cable"], 1, ["shoulder"], "Soft elbows, squeeze hands together in front.", "isolation"),
    E("db-fly", "Dumbbell Fly", "chest", [], "accessory", ["dumbbell", "bench"], 2, ["shoulder"], "Wide arc, stop when you feel the stretch.", "isolation"),
    E("machine-press", "Machine Chest Press", "chest", ["triceps"], "horizontal_push", ["machine"], 1, [], "Handles at nipple height, full but controlled range.", "compound"),
    E("pec-deck", "Pec Deck", "chest", [], "accessory", ["machine"], 1, ["shoulder"], "Squeeze for a beat at the top.", "isolation"),
    E("band-press", "Band Chest Press", "chest", ["triceps"], "horizontal_push", ["bands"], 1, [], "Anchor behind you at chest height. Press and squeeze.", "compound"),

    /* -------------------------------------------------------------- BACK */
    E("pullup", "Pull-Up", "lats", ["biceps", "back"], "vertical_pull", ["pullup_bar"], 3, ["shoulder", "elbow"], "Chest to the bar, no swinging.", "compound"),
    E("chinup", "Chin-Up", "lats", ["biceps"], "vertical_pull", ["pullup_bar"], 2, ["elbow"], "Underhand grip. Easier than pull-ups, more biceps.", "compound"),
    E("negative-pullup", "Negative Pull-Up", "lats", ["biceps"], "vertical_pull", ["pullup_bar"], 1, ["shoulder"], "Jump to the top, lower for 5 seconds.", "compound"),
    E("lat-pulldown", "Lat Pulldown", "lats", ["biceps", "back"], "vertical_pull", ["cable"], 1, [], "Drive elbows down and back, chest tall.", "compound"),
    E("machine-pulldown", "Machine Pulldown", "lats", ["biceps"], "vertical_pull", ["machine"], 1, [], "Lead with the elbows, not the hands.", "compound"),
    E("band-pulldown", "Band Lat Pulldown", "lats", ["biceps"], "vertical_pull", ["bands"], 1, [], "Anchor overhead. Pull to the collarbone, control back.", "compound"),
    E("bb-row", "Barbell Row", "back", ["lats", "biceps"], "horizontal_pull", ["barbell"], 2, ["lower_back"], "Hinge to ~45°, pull to the belly button.", "compound"),
    E("pendlay-row", "Pendlay Row", "back", ["lats", "traps"], "horizontal_pull", ["barbell"], 3, ["lower_back"], "Reset the bar on the floor each rep.", "compound"),
    E("db-row", "One-Arm Dumbbell Row", "back", ["lats", "biceps"], "horizontal_pull", ["dumbbell"], 1, [], "Flat back, pull the elbow past your ribs.", "compound"),
    E("chest-supported-row", "Chest-Supported Row", "back", ["rear_delts", "biceps"], "horizontal_pull", ["dumbbell", "bench"], 1, [], "Incline bench takes the lower back out of it.", "compound"),
    E("cable-row", "Seated Cable Row", "back", ["lats", "biceps"], "horizontal_pull", ["cable"], 1, [], "Tall chest, squeeze the shoulder blades.", "compound"),
    E("machine-row", "Machine Row", "back", ["lats"], "horizontal_pull", ["machine"], 1, [], "Chest on the pad, pull to the ribs.", "compound"),
    E("inverted-row", "Inverted Row", "back", ["biceps", "core"], "horizontal_pull", ["barbell"], 1, [], "Bar at hip height, body straight, chest to bar.", "compound"),
    E("trx-row", "TRX Row", "back", ["biceps", "core"], "horizontal_pull", ["trx"], 1, [], "Walk your feet forward to make it harder.", "compound"),
    E("band-row", "Band Seated Row", "back", ["biceps"], "horizontal_pull", ["bands"], 1, [], "Anchor at foot level, pull to the waist.", "compound"),
    E("kb-row", "Kettlebell Row", "back", ["lats", "biceps"], "horizontal_pull", ["kettlebell"], 1, [], "Hinge, brace, row the bell to your hip.", "compound"),
    E("straight-arm-pulldown", "Straight-Arm Pulldown", "lats", [], "accessory", ["cable"], 2, ["shoulder"], "Arms locked, sweep the bar to your thighs.", "isolation"),
    E("face-pull", "Face Pull", "rear_delts", ["traps", "back"], "accessory", ["cable"], 1, [], "Pull to the forehead, thumbs back. Great for posture.", "isolation"),
    E("band-face-pull", "Band Face Pull", "rear_delts", ["traps"], "accessory", ["bands"], 1, [], "Anchor at eye level, pull apart at your face.", "isolation"),
    E("superman", "Superman Hold", "lower_back", ["glutes"], "accessory", [], 1, [], "Lift chest and thighs, hold, breathe.", "isolation"),
    E("back-extension", "Back Extension", "lower_back", ["glutes", "hamstrings"], "hinge", ["bench"], 1, ["lower_back"], "Hinge at the hips, never round under load.", "isolation"),

    /* --------------------------------------------------------- SHOULDERS */
    E("ohp", "Overhead Press", "delts", ["triceps", "core"], "vertical_push", ["barbell"], 2, ["shoulder", "lower_back"], "Squeeze glutes, press, then pull the head through.", "compound"),
    E("db-ohp", "Dumbbell Shoulder Press", "delts", ["triceps"], "vertical_push", ["dumbbell"], 1, ["shoulder"], "Neutral or slightly angled grip is kinder on shoulders.", "compound"),
    E("arnold-press", "Arnold Press", "delts", ["triceps"], "vertical_push", ["dumbbell"], 2, ["shoulder"], "Rotate from palms-in to palms-out as you press.", "compound"),
    E("kb-press", "Kettlebell Press", "delts", ["triceps", "core"], "vertical_push", ["kettlebell"], 2, ["shoulder"], "Bell rests on the forearm, punch straight up.", "compound"),
    E("landmine-press", "Landmine Press", "delts", ["chest", "triceps"], "vertical_push", ["barbell"], 1, [], "Angled press — the friendliest overhead option.", "compound"),
    E("pike-pushup", "Pike Push-Up", "delts", ["triceps"], "vertical_push", [], 2, ["wrist", "shoulder"], "Hips high, crown of the head to the floor.", "compound"),
    E("handstand-pushup", "Wall Handstand Push-Up", "delts", ["triceps", "core"], "vertical_push", [], 3, ["shoulder", "wrist"], "Only once pike push-ups feel easy.", "compound"),
    E("machine-shoulder-press", "Machine Shoulder Press", "delts", ["triceps"], "vertical_push", ["machine"], 1, [], "Set the seat so handles start at ear height.", "compound"),
    E("lateral-raise", "Dumbbell Lateral Raise", "side_delts", [], "accessory", ["dumbbell"], 1, ["shoulder"], "Lead with the elbows, stop at shoulder height.", "isolation"),
    E("cable-lateral", "Cable Lateral Raise", "side_delts", [], "accessory", ["cable"], 1, [], "Constant tension the whole way — go light.", "isolation"),
    E("band-lateral", "Band Lateral Raise", "side_delts", [], "accessory", ["bands"], 1, [], "Stand on the band, raise to shoulder height.", "isolation"),
    E("rear-delt-fly", "Rear Delt Fly", "rear_delts", ["back"], "accessory", ["dumbbell"], 1, [], "Hinge over, pinkies up, small weight.", "isolation"),
    E("shrug", "Shrug", "traps", [], "accessory", ["dumbbell"], 1, [], "Straight up, pause a beat, no rolling.", "isolation"),
    E("bb-shrug", "Barbell Shrug", "traps", [], "accessory", ["barbell"], 1, [], "Shrug to the ears, controlled descent.", "isolation"),

    /* -------------------------------------------------------------- ARMS */
    E("bb-curl", "Barbell Curl", "biceps", ["forearms"], "arms", ["barbell"], 1, ["elbow"], "Elbows pinned to the ribs, no swinging.", "isolation"),
    E("ez-curl", "EZ-Bar Curl", "biceps", ["forearms"], "arms", ["ez_bar"], 1, ["elbow", "wrist"], "Angled grip is easier on the wrists.", "isolation"),
    E("db-curl", "Dumbbell Curl", "biceps", ["forearms"], "arms", ["dumbbell"], 1, ["elbow"], "Supinate as you curl, squeeze at the top.", "isolation"),
    E("hammer-curl", "Hammer Curl", "biceps", ["forearms"], "arms", ["dumbbell"], 1, [], "Neutral grip. Builds the forearm and arm thickness.", "isolation"),
    E("incline-curl", "Incline Dumbbell Curl", "biceps", [], "arms", ["dumbbell", "bench"], 2, ["elbow"], "Arms hanging behind you for a bigger stretch.", "isolation"),
    E("cable-curl", "Cable Curl", "biceps", [], "arms", ["cable"], 1, [], "Constant tension from bottom to top.", "isolation"),
    E("band-curl", "Band Curl", "biceps", ["forearms"], "arms", ["bands"], 1, [], "Stand on the band, curl slowly, resist the return.", "isolation"),
    E("preacher-curl", "Preacher Curl", "biceps", [], "arms", ["ez_bar", "bench"], 2, ["elbow"], "Don't lock out hard at the bottom.", "isolation"),
    E("chinup-curl", "Chin-Up Hold", "biceps", ["lats"], "arms", ["pullup_bar"], 2, ["elbow"], "Hold at the top, lower for 5 seconds.", "isolation"),
    E("cgbp", "Close-Grip Bench Press", "triceps", ["chest", "delts"], "horizontal_push", ["barbell", "bench"], 2, ["elbow", "wrist"], "Shoulder-width grip, elbows tucked tight.", "compound"),
    E("skullcrusher", "Skullcrusher", "triceps", [], "arms", ["ez_bar", "bench"], 2, ["elbow"], "Lower behind the head, not to the nose.", "isolation"),
    E("pushdown", "Triceps Pushdown", "triceps", [], "arms", ["cable"], 1, [], "Elbows glued to your sides, full lockout.", "isolation"),
    E("oh-triceps", "Overhead Triceps Extension", "triceps", [], "arms", ["dumbbell"], 1, ["elbow", "shoulder"], "Deep stretch behind the head, elbows narrow.", "isolation"),
    E("bench-dip", "Bench Dip", "triceps", ["chest"], "arms", ["bench"], 1, ["shoulder"], "Hands on the bench behind you, elbows straight back.", "isolation"),
    E("band-pushdown", "Band Pushdown", "triceps", [], "arms", ["bands"], 1, [], "Anchor high, lock out and squeeze.", "isolation"),
    E("wrist-curl", "Wrist Curl", "forearms", [], "accessory", ["dumbbell"], 1, ["wrist"], "Forearms on the thigh, small range, high reps.", "isolation"),
    E("farmer-carry", "Farmer's Carry", "forearms", ["traps", "core"], "carry", ["dumbbell"], 1, [], "Tall posture, heavy, walk for distance or time.", "compound"),

    /* -------------------------------------------------------------- LEGS */
    E("back-squat", "Back Squat", "quads", ["glutes", "core"], "squat", ["barbell", "rack"], 2, ["knee", "lower_back"], "Brace hard, knees track over the toes.", "compound"),
    E("front-squat", "Front Squat", "quads", ["core", "glutes"], "squat", ["barbell", "rack"], 3, ["knee", "wrist"], "Elbows high, stay upright.", "compound"),
    E("goblet-squat", "Goblet Squat", "quads", ["glutes", "core"], "squat", ["dumbbell"], 1, ["knee"], "Weight at the chest, sit down between the knees.", "compound"),
    E("kb-goblet", "Kettlebell Goblet Squat", "quads", ["glutes"], "squat", ["kettlebell"], 1, ["knee"], "Elbows inside the knees at the bottom.", "compound"),
    E("bw-squat", "Bodyweight Squat", "quads", ["glutes"], "squat", [], 1, ["knee"], "Full depth, slow down, drive through mid-foot.", "compound"),
    E("smith-squat", "Smith Machine Squat", "quads", ["glutes"], "squat", ["smith"], 1, ["knee"], "Feet slightly forward, controlled tempo.", "compound"),
    E("leg-press", "Leg Press", "quads", ["glutes"], "squat", ["machine"], 1, ["knee"], "Don't let the lower back round off the pad.", "compound"),
    E("hack-squat", "Hack Squat", "quads", ["glutes"], "squat", ["machine"], 2, ["knee"], "Deep and slow beats heavy and short.", "compound"),
    E("leg-extension", "Leg Extension", "quads", [], "accessory", ["machine"], 1, ["knee"], "Pause at the top for a full quad squeeze.", "isolation"),
    E("bulgarian", "Bulgarian Split Squat", "quads", ["glutes"], "lunge", ["bench"], 2, ["knee"], "Back foot elevated, front shin near vertical.", "compound"),
    E("db-bulgarian", "Dumbbell Bulgarian Split Squat", "quads", ["glutes"], "lunge", ["dumbbell", "bench"], 2, ["knee"], "One of the highest-return leg exercises there is.", "compound"),
    E("walking-lunge", "Walking Lunge", "quads", ["glutes", "hamstrings"], "lunge", [], 1, ["knee"], "Long step, back knee just off the floor.", "compound"),
    E("reverse-lunge", "Reverse Lunge", "glutes", ["quads"], "lunge", [], 1, [], "Step back, not forward — much kinder on the knees.", "compound"),
    E("db-lunge", "Dumbbell Lunge", "quads", ["glutes"], "lunge", ["dumbbell"], 1, ["knee"], "Keep the torso tall, weights hanging.", "compound"),
    E("step-up", "Step-Up", "glutes", ["quads"], "lunge", ["box"], 1, ["knee"], "Drive through the heel on the box, don't push off the floor.", "compound"),
    E("deadlift", "Conventional Deadlift", "hamstrings", ["glutes", "back", "lower_back"], "hinge", ["barbell"], 3, ["lower_back"], "Bar over mid-foot, push the floor away.", "compound"),
    E("sumo-deadlift", "Sumo Deadlift", "glutes", ["quads", "hamstrings"], "hinge", ["barbell"], 3, ["lower_back", "hip"], "Wide stance, knees out, more upright torso.", "compound"),
    E("rdl", "Romanian Deadlift", "hamstrings", ["glutes", "lower_back"], "hinge", ["barbell"], 2, ["lower_back"], "Push the hips back, bar stays against the legs.", "compound"),
    E("db-rdl", "Dumbbell Romanian Deadlift", "hamstrings", ["glutes"], "hinge", ["dumbbell"], 1, ["lower_back"], "Soft knees, feel the stretch, stop at mid-shin.", "compound"),
    E("kb-swing", "Kettlebell Swing", "glutes", ["hamstrings", "core", "heart"], "hinge", ["kettlebell"], 2, ["lower_back"], "It's a hip snap, not a squat or a front raise.", "compound"),
    E("good-morning", "Good Morning", "hamstrings", ["lower_back", "glutes"], "hinge", ["barbell"], 3, ["lower_back"], "Light weight. Hinge until you feel the hamstrings.", "compound"),
    E("hip-thrust", "Barbell Hip Thrust", "glutes", ["hamstrings"], "hinge", ["barbell", "bench"], 2, [], "Chin tucked, ribs down, squeeze hard at the top.", "compound"),
    E("glute-bridge", "Glute Bridge", "glutes", ["hamstrings"], "hinge", [], 1, [], "Posterior tilt first, then lift. 2-second squeeze.", "isolation"),
    E("sl-glute-bridge", "Single-Leg Glute Bridge", "glutes", ["hamstrings", "core"], "hinge", [], 2, [], "Hips level throughout — no tilting.", "isolation"),
    E("leg-curl", "Leg Curl", "hamstrings", [], "accessory", ["machine"], 1, [], "Slow negatives. Hamstrings love the eccentric.", "isolation"),
    E("nordic-curl", "Nordic Hamstring Curl", "hamstrings", [], "accessory", [], 3, ["knee"], "Anchor your ankles, lower as slowly as you can.", "isolation"),
    E("slider-curl", "Towel Hamstring Curl", "hamstrings", ["glutes"], "accessory", [], 2, [], "Heels on a towel on a smooth floor, hips up.", "isolation"),
    E("calf-raise", "Standing Calf Raise", "calves", [], "accessory", [], 1, [], "Full stretch at the bottom, pause at the top.", "isolation"),
    E("db-calf-raise", "Dumbbell Calf Raise", "calves", [], "accessory", ["dumbbell"], 1, [], "Elevate the toes on a plate for more range.", "isolation"),
    E("seated-calf", "Seated Calf Raise", "calves", [], "accessory", ["machine"], 1, [], "Targets the soleus. Higher reps work best.", "isolation"),
    E("wall-sit", "Wall Sit", "quads", [], "accessory", [], 1, ["knee"], "Thighs parallel, hold for time.", "isolation"),
    E("jump-squat", "Jump Squat", "quads", ["glutes", "heart"], "squat", [], 2, ["knee"], "Land softly, absorb through the hips.", "compound"),
    E("band-abduction", "Band Hip Abduction", "glutes", [], "accessory", ["bands"], 1, [], "Band above the knees, push out and hold.", "isolation"),

    /* -------------------------------------------------------------- CORE */
    E("plank", "Plank", "core", ["obliques"], "core", [], 1, [], "Squeeze glutes, tuck ribs. Quality over duration.", "isolation"),
    E("side-plank", "Side Plank", "obliques", ["core"], "core", [], 1, ["shoulder"], "Stack the hips, push the floor away.", "isolation"),
    E("dead-bug", "Dead Bug", "core", [], "core", [], 1, [], "Lower back glued to the floor the whole time.", "isolation"),
    E("bird-dog", "Bird Dog", "core", ["lower_back", "glutes"], "core", [], 1, [], "Slow. No rotation through the hips.", "isolation"),
    E("hollow-hold", "Hollow Body Hold", "core", [], "core", [], 2, [], "Lower back pressed down, arms and legs long.", "isolation"),
    E("crunch", "Crunch", "core", [], "core", [], 1, ["neck"], "Curl the ribs to the hips — it's a short movement.", "isolation"),
    E("bicycle-crunch", "Bicycle Crunch", "obliques", ["core"], "core", [], 1, ["neck"], "Slow rotation, opposite elbow toward the knee.", "isolation"),
    E("leg-raise", "Lying Leg Raise", "core", ["obliques"], "core", [], 1, ["lower_back"], "Press the lower back down, control the descent.", "isolation"),
    E("hanging-leg-raise", "Hanging Leg Raise", "core", ["obliques"], "core", ["pullup_bar"], 3, ["shoulder"], "No swinging. Curl the pelvis up at the top.", "isolation"),
    E("v-up", "V-Up", "core", [], "core", [], 2, ["lower_back"], "Hands and feet meet over the hips.", "isolation"),
    E("russian-twist", "Russian Twist", "obliques", ["core"], "core", [], 1, ["lower_back"], "Rotate from the ribcage, not the arms.", "isolation"),
    E("cable-crunch", "Cable Crunch", "core", [], "core", ["cable"], 2, [], "Hips fixed, crunch the ribs toward the pelvis.", "isolation"),
    E("ab-wheel", "Ab Wheel Rollout", "core", ["lats"], "core", ["ab_wheel"], 3, ["lower_back"], "Only roll as far as you can keep the ribs down.", "isolation"),
    E("pallof", "Pallof Press", "obliques", ["core"], "core", ["bands"], 1, [], "Resist the rotation — that's the whole exercise.", "isolation"),
    E("mountain-climber", "Mountain Climber", "core", ["heart", "quads"], "core", [], 1, ["wrist"], "Hips low, drive the knees fast.", "isolation"),
    E("suitcase-carry", "Suitcase Carry", "obliques", ["core", "forearms"], "carry", ["kettlebell"], 1, [], "One side only. Don't let yourself lean.", "compound"),

    /* ------------------------------------------------------ CONDITIONING */
    E("burpee", "Burpee", "full_body", ["heart"], "conditioning", [], 2, ["wrist", "knee"], "Pace yourself — hinge down, don't flop.", "cardio"),
    E("jumping-jack", "Jumping Jack", "heart", ["full_body"], "conditioning", [], 1, [], "Classic warm-up. Land soft.", "cardio"),
    E("high-knees", "High Knees", "heart", ["quads", "core"], "conditioning", [], 1, ["knee"], "Fast feet, knees to hip height.", "cardio"),
    E("jump-rope", "Jump Rope", "heart", ["calves"], "conditioning", ["jump_rope"], 1, ["knee"], "Small hops, wrists do the turning.", "cardio"),
    E("shadow-box", "Shadow Boxing", "heart", ["delts", "core"], "conditioning", [], 1, [], "Keep moving, rotate through the hips.", "cardio"),
    E("brisk-walk", "Brisk Walk", "heart", [], "conditioning", [], 1, [], "Zone 2. You should be able to hold a conversation.", "cardio"),
    E("incline-walk", "Incline Treadmill Walk", "heart", ["glutes", "calves"], "conditioning", ["treadmill"], 1, [], "10-12% incline, 5 km/h, no holding the rails.", "cardio"),
    E("treadmill-run", "Treadmill Run", "heart", ["quads", "calves"], "conditioning", ["treadmill"], 2, ["knee"], "Steady effort or intervals — pick one per session.", "cardio"),
    E("bike-intervals", "Bike Intervals", "heart", ["quads"], "conditioning", ["bike"], 2, [], "30s hard / 90s easy. Repeat 8-10 rounds.", "cardio"),
    E("bike-steady", "Steady Bike", "heart", ["quads"], "conditioning", ["bike"], 1, [], "Low impact. Good on sore days.", "cardio"),
    E("row-erg", "Rowing Intervals", "heart", ["back", "quads"], "conditioning", ["rower"], 2, ["lower_back"], "Legs, then back, then arms. Reverse on the return.", "cardio"),
    E("stair-climber", "Stair Climber", "heart", ["glutes", "calves"], "conditioning", ["stairmaster"], 1, ["knee"], "Stand tall, don't lean on the handles.", "cardio"),
    E("elliptical", "Elliptical", "heart", [], "conditioning", ["elliptical"], 1, [], "Joint-friendly steady state.", "cardio"),
    E("sled-push", "Sled Push", "full_body", ["quads", "heart"], "conditioning", ["sled"], 2, [], "Low body angle, short powerful steps.", "cardio"),

    /* ---------------------------------------------------------- MOBILITY */
    E("cat-cow", "Cat-Cow", "mobility", ["lower_back"], "mobility", [], 1, [], "Move slowly with the breath.", "mobility"),
    E("worlds-greatest", "World's Greatest Stretch", "mobility", ["hip"], "mobility", [], 1, [], "Lunge, drop the elbow inside, then rotate open.", "mobility"),
    E("arm-circles", "Arm Circles", "mobility", ["delts"], "mobility", [], 1, [], "Small to large, both directions.", "mobility"),
    E("leg-swings", "Leg Swings", "mobility", ["glutes"], "mobility", [], 1, [], "Front-back then side-side, 10 each.", "mobility"),
    E("hip-flexor-stretch", "Couch Stretch", "mobility", [], "mobility", [], 1, [], "Squeeze the glute of the stretching side.", "mobility"),
    E("band-pull-apart", "Band Pull-Apart", "rear_delts", ["traps"], "mobility", ["bands"], 1, [], "Perfect between pressing sets.", "mobility"),
    E("downward-dog", "Downward Dog", "mobility", ["hamstrings"], "mobility", [], 1, ["wrist"], "Pedal the heels, lengthen the spine.", "mobility"),
    E("thoracic-rotation", "Thoracic Rotation", "mobility", ["obliques"], "mobility", [], 1, [], "Side-lying, open the top arm and follow with the eyes.", "mobility"),
    E("foam-roll-quads", "Foam Roll Quads", "mobility", [], "mobility", ["foam_roller"], 1, [], "Slow passes, pause on the tender spots.", "mobility"),
  ];

  FF.EX_BY_ID = FF.EXERCISES.reduce(function (acc, e) { acc[e.id] = e; return acc; }, {});

  /* ------------------------------------------------------------------------
     One practical usage tip per equipment type — shown in the workout
     screen's "How to" panel alongside an exercise's coaching cue, so the
     guidance covers both "how to do this exercise" and "how to use this
     equipment well", without needing a tip written for all 135 exercises
     individually.
     ------------------------------------------------------------------------ */
  FF.EQUIPMENT_TIPS = {
    dumbbell: "Pick a weight where your last 1-2 reps are genuinely hard while your form stays clean — if the target reps feel easy, go up.",
    barbell: "Load plates evenly on both sides and always use collars — an unbalanced or uncollared bar is how injuries happen.",
    ez_bar: "The cambered grip angles your wrists — inner grips add triceps emphasis, outer grips add biceps emphasis.",
    bench: "Check it's stable and set to the right angle before loading it — flat for pressing, 15-30° incline for upper-chest work.",
    rack: "Set the safety pins just below your lowest rep depth, so a failed rep gets caught instead of dropped.",
    pullup_bar: "Full range every rep — dead hang at the bottom, chin over the bar at the top. Loop a resistance band under a foot if a full rep isn't there yet.",
    dip_bar: "Lean forward for more chest, stay upright for more triceps. Stop if you feel shoulder pinching at the bottom.",
    cable: "Set the pulley height to match the exercise, and keep tension on the muscle the whole rep — don't let the stack clank between reps.",
    machine: "Set the seat first so the pivot point lines up with your joint — a badly set seat changes the whole exercise.",
    smith: "The bar moves on a fixed vertical rail, so stand with your feet slightly forward of where you would with a free bar.",
    kettlebell: "Most kettlebell moves are hip-driven, not arm-driven — the power comes from snapping your hips, not lifting with your shoulders.",
    bands: "Anchor it securely and check for nicks or wear before each use — a snapped band under tension can hurt.",
    trx: "The steeper your body angle to the anchor, the harder the exercise — walk your feet to adjust difficulty instead of the strap length.",
    box: "Pick a height you can step onto with control — if you have to lunge or jump hard to reach it, it's too high.",
    ab_wheel: "Start from your knees, not your toes, and only roll out as far as you can keep your lower back from arching.",
    jump_rope: "Small hops driven by your wrists, not big jumps from your knees — keep your elbows close to your body.",
    treadmill: "Hold the incline, not the rails — gripping the rails takes load off your legs and skews the effort.",
    bike: "Set the seat height so your knee has a slight bend at the bottom of the pedal stroke — too low strains the knees.",
    rower: "Sequence each stroke legs, then back, then arms — and reverse it on the way back: arms, back, legs.",
    elliptical: "Keep some resistance dialled in — going too easy for too long trains very little.",
    stairmaster: "Stand tall and let your legs do the work — leaning on the handles is the easiest way to make the workout do nothing.",
    sled: "Keep your body angle low and take short, powerful steps — an upright posture wastes most of the effort.",
    foam_roller: "Roll slowly and pause on tender spots for 20-30 seconds, rather than rolling back and forth quickly.",
    medicine_ball: "Full-body throws should come from your hips and legs, not just your arms — catch, absorb, and reset before the next rep.",
  };
})();
