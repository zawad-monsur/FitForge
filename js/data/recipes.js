/* ==========================================================================
   FitForge — Recipe library
   --------------------------------------------------------------------------
   Add your own by appending to FF.RECIPES. Fields:

     id, name       slug + display name
     slots          which meals it fits: breakfast lunch dinner snack
     kcal p c f     per ONE serving (the planner scales servings to your target)
     skill          0 no-cook assembly · 1 basic · 2 confident · 3 ambitious
     mins           active time in minutes
     equip          kitchen gear REQUIRED: stove oven microwave blender
                    air_fryer rice_cooker kettle (none listed = knife + bowl)
     contains       allergen / diet flags: pork beef poultry fish shellfish
                    dairy egg gluten nuts soy
     cuisine        general south_asian mediterranean mexican east_asian
                    middle_eastern american
     cost           1 cheap · 2 mid · 3 pricey
     tags           quick meal_prep one_pan high_protein low_carb comfort
     ing            [name, qty per serving, unit, grocery aisle]
     steps          plain instructions
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  FF.KITCHEN = {
    stove: "Stove / hob",
    oven: "Oven",
    microwave: "Microwave",
    blender: "Blender",
    air_fryer: "Air fryer",
    rice_cooker: "Rice cooker",
    kettle: "Kettle",
  };

  /* The eating pattern — independent of any religious dietary law, since
     someone can be e.g. an omnivore AND need halal food, or pescatarian AND
     need kosher. See FF.RELIGIOUS below for that second, independent axis. */
  FF.DIETS = {
    omnivore: "Omnivore — No restrictions",
    vegetarian: "Vegetarian — No meat or fish",
    vegan: "Vegan — No animal products at all",
    pescatarian: "Pescatarian — Fish, no other meat",
    keto: "Keto / low carb — Very low carbohydrate",
  };

  FF.RELIGIOUS = {
    none: "None",
    halal: "Halal — No pork, no alcohol",
    kosher: "Kosher — No pork or shellfish",
  };

  FF.CUISINES = {
    general: "No preference",
    south_asian: "South Asian",
    mediterranean: "Mediterranean",
    mexican: "Mexican",
    east_asian: "East Asian",
    middle_eastern: "Middle Eastern",
    american: "American / diner",
  };

  function R(o) { return o; }

  FF.RECIPES = [
    /* ------------------------------------------------------- BREAKFAST */
    R({
      id: "greek-yogurt-bowl", name: "Greek Yogurt Protein Bowl", slots: ["breakfast", "snack"],
      kcal: 380, p: 34, c: 40, f: 8, skill: 0, mins: 4, equip: [], contains: ["dairy", "nuts"],
      cuisine: "general", cost: 2, tags: ["quick", "high_protein"],
      ing: [["Greek yogurt 0%", 250, "g", "dairy"], ["Berries", 100, "g", "produce"], ["Honey", 10, "g", "pantry"], ["Almonds", 15, "g", "pantry"], ["Oats", 25, "g", "grains"]],
      steps: ["Spoon the yogurt into a bowl.", "Top with berries, oats and chopped almonds.", "Drizzle honey over the top."],
    }),
    R({
      id: "overnight-oats", name: "Peanut Butter Overnight Oats", slots: ["breakfast", "snack"],
      kcal: 450, p: 24, c: 55, f: 15, skill: 0, mins: 5, equip: [], contains: ["dairy", "gluten", "nuts"],
      cuisine: "general", cost: 1, tags: ["meal_prep", "quick"],
      ing: [["Rolled oats", 60, "g", "grains"], ["Milk", 200, "ml", "dairy"], ["Whey or soy protein", 25, "g", "pantry"], ["Peanut butter", 15, "g", "pantry"], ["Banana", 0.5, "pc", "produce"]],
      steps: ["Stir oats, milk and protein powder in a jar.", "Swirl in the peanut butter.", "Refrigerate overnight. Top with sliced banana before eating."],
    }),
    R({
      id: "veg-omelette", name: "Three-Egg Vegetable Omelette", slots: ["breakfast", "lunch"],
      kcal: 400, p: 30, c: 10, f: 26, skill: 1, mins: 10, equip: ["stove"], contains: ["egg", "dairy"],
      cuisine: "general", cost: 1, tags: ["quick", "one_pan", "low_carb", "high_protein"],
      ing: [["Eggs", 3, "pc", "protein"], ["Spinach", 50, "g", "produce"], ["Bell pepper", 0.5, "pc", "produce"], ["Cheddar", 20, "g", "dairy"], ["Olive oil", 5, "ml", "pantry"]],
      steps: ["Beat the eggs with a pinch of salt.", "Soften the pepper and spinach in oil over medium heat, 2 min.", "Pour in the eggs, tilt the pan, cook until nearly set.", "Add cheese, fold, and slide onto a plate."],
    }),
    R({
      id: "protein-shake", name: "Banana Protein Shake", slots: ["breakfast", "snack"],
      kcal: 340, p: 32, c: 40, f: 6, skill: 0, mins: 2, equip: ["blender"], contains: ["dairy"],
      cuisine: "general", cost: 1, tags: ["quick", "high_protein"],
      ing: [["Whey or plant protein", 30, "g", "pantry"], ["Banana", 1, "pc", "produce"], ["Milk", 250, "ml", "dairy"], ["Oats", 20, "g", "grains"]],
      steps: ["Put everything in the blender.", "Blend 30 seconds until smooth."],
    }),
    R({
      id: "shakshuka", name: "Shakshuka", slots: ["breakfast", "dinner"],
      kcal: 420, p: 22, c: 24, f: 26, skill: 2, mins: 25, equip: ["stove"], contains: ["egg"],
      cuisine: "middle_eastern", cost: 1, tags: ["one_pan", "comfort"],
      ing: [["Eggs", 2, "pc", "protein"], ["Chopped tomatoes", 200, "g", "pantry"], ["Onion", 0.5, "pc", "produce"], ["Bell pepper", 1, "pc", "produce"], ["Cumin + paprika", 3, "g", "spices"], ["Olive oil", 10, "ml", "pantry"]],
      steps: ["Soften onion and pepper in oil, 6-8 min.", "Add spices, cook 30 seconds until fragrant.", "Pour in tomatoes, simmer 10 min until thickened.", "Make wells, crack in the eggs, cover and cook 5-6 min."],
    }),
    R({
      id: "paratha-eggs", name: "Egg Bhurji with Roti", slots: ["breakfast", "lunch"],
      kcal: 480, p: 26, c: 42, f: 24, skill: 1, mins: 15, equip: ["stove"], contains: ["egg", "gluten"],
      cuisine: "south_asian", cost: 1, tags: ["quick", "comfort"],
      ing: [["Eggs", 3, "pc", "protein"], ["Roti / chapati", 2, "pc", "grains"], ["Onion", 0.5, "pc", "produce"], ["Tomato", 1, "pc", "produce"], ["Green chilli", 1, "pc", "produce"], ["Turmeric + chilli powder", 2, "g", "spices"]],
      steps: ["Fry onion until golden, add chilli and tomato.", "Add spices and a pinch of salt, cook 2 min.", "Pour in beaten eggs and scramble on low heat.", "Warm the roti and serve alongside."],
    }),
    R({
      id: "tofu-scramble", name: "Turmeric Tofu Scramble", slots: ["breakfast", "lunch"],
      kcal: 390, p: 28, c: 22, f: 22, skill: 1, mins: 12, equip: ["stove"], contains: ["soy"],
      cuisine: "general", cost: 1, tags: ["quick", "one_pan", "high_protein"],
      ing: [["Firm tofu", 200, "g", "protein"], ["Spinach", 60, "g", "produce"], ["Turmeric", 2, "g", "spices"], ["Nutritional yeast", 8, "g", "pantry"], ["Olive oil", 10, "ml", "pantry"], ["Wholegrain toast", 1, "slice", "grains"]],
      steps: ["Crumble the tofu with your hands.", "Fry in oil over medium-high heat, 5 min, until edges brown.", "Stir in turmeric, nutritional yeast, salt and spinach.", "Serve on toast."],
    }),
    R({
      id: "cottage-toast", name: "Cottage Cheese & Avocado Toast", slots: ["breakfast", "snack"],
      kcal: 360, p: 24, c: 30, f: 16, skill: 0, mins: 5, equip: [], contains: ["dairy", "gluten"],
      cuisine: "general", cost: 2, tags: ["quick", "high_protein"],
      ing: [["Cottage cheese", 150, "g", "dairy"], ["Wholegrain bread", 2, "slice", "grains"], ["Avocado", 0.5, "pc", "produce"], ["Chilli flakes", 1, "g", "spices"]],
      steps: ["Toast the bread.", "Spread cottage cheese, top with sliced avocado.", "Season with salt, pepper and chilli flakes."],
    }),

    /* ------------------------------------------------------------ LUNCH */
    R({
      id: "chicken-rice-bowl", name: "Chicken & Rice Power Bowl", slots: ["lunch", "dinner"],
      kcal: 560, p: 48, c: 58, f: 14, skill: 1, mins: 20, equip: ["stove"], contains: ["poultry"],
      cuisine: "general", cost: 2, tags: ["meal_prep", "high_protein"],
      ing: [["Chicken breast", 180, "g", "protein"], ["Rice", 70, "g", "grains"], ["Broccoli", 120, "g", "produce"], ["Olive oil", 8, "ml", "pantry"], ["Paprika + garlic powder", 3, "g", "spices"]],
      steps: ["Cook the rice.", "Season the chicken and pan-fry 5-6 min a side until 74°C inside.", "Steam or boil the broccoli 4 min.", "Slice the chicken and build the bowl."],
    }),
    R({
      id: "tuna-pasta", name: "Tuna & Sweetcorn Pasta", slots: ["lunch", "dinner"],
      kcal: 540, p: 40, c: 68, f: 12, skill: 1, mins: 15, equip: ["stove"], contains: ["fish", "gluten"],
      cuisine: "general", cost: 1, tags: ["quick", "cheap", "high_protein"],
      ing: [["Tinned tuna", 150, "g", "protein"], ["Pasta", 80, "g", "grains"], ["Sweetcorn", 80, "g", "pantry"], ["Greek yogurt", 60, "g", "dairy"], ["Lemon", 0.25, "pc", "produce"]],
      steps: ["Boil the pasta.", "Drain and mix with tuna, sweetcorn and yogurt.", "Finish with lemon, salt and black pepper."],
    }),
    R({
      id: "chickpea-salad", name: "Lemon Chickpea Salad", slots: ["lunch", "snack"],
      kcal: 430, p: 18, c: 48, f: 18, skill: 0, mins: 8, equip: [], contains: [],
      cuisine: "mediterranean", cost: 1, tags: ["quick", "meal_prep", "no_cook"],
      ing: [["Chickpeas, tinned", 200, "g", "pantry"], ["Cucumber", 0.5, "pc", "produce"], ["Cherry tomatoes", 100, "g", "produce"], ["Red onion", 0.25, "pc", "produce"], ["Olive oil", 12, "ml", "pantry"], ["Lemon", 0.5, "pc", "produce"]],
      steps: ["Rinse and drain the chickpeas.", "Chop the vegetables roughly.", "Toss everything with oil, lemon, salt and pepper."],
    }),
    R({
      id: "turkey-wrap", name: "Turkey & Hummus Wrap", slots: ["lunch", "snack"],
      kcal: 470, p: 38, c: 44, f: 16, skill: 0, mins: 6, equip: [], contains: ["poultry", "gluten"],
      cuisine: "general", cost: 2, tags: ["quick", "no_cook", "high_protein"],
      ing: [["Turkey slices", 150, "g", "protein"], ["Tortilla wrap", 1, "pc", "grains"], ["Hummus", 40, "g", "pantry"], ["Lettuce + tomato", 80, "g", "produce"]],
      steps: ["Spread hummus over the wrap.", "Layer turkey and salad down the middle.", "Fold the ends in and roll tightly."],
    }),
    R({
      id: "lentil-dal", name: "Red Lentil Dal", slots: ["lunch", "dinner"],
      kcal: 450, p: 22, c: 62, f: 12, skill: 1, mins: 30, equip: ["stove"], contains: [],
      cuisine: "south_asian", cost: 1, tags: ["meal_prep", "cheap", "one_pan", "comfort"],
      ing: [["Red lentils", 100, "g", "pantry"], ["Onion", 0.5, "pc", "produce"], ["Garlic", 2, "clove", "produce"], ["Ginger", 5, "g", "produce"], ["Turmeric + cumin", 4, "g", "spices"], ["Rice", 50, "g", "grains"]],
      steps: ["Rinse lentils, simmer in 500ml water 20 min until soft.", "Separately fry onion, garlic and ginger until golden.", "Add spices, cook 30 seconds, then stir into the lentils.", "Season well and serve over rice."],
    }),
    R({
      id: "burrito-bowl", name: "Beef Burrito Bowl", slots: ["lunch", "dinner"],
      kcal: 620, p: 44, c: 56, f: 22, skill: 1, mins: 25, equip: ["stove"], contains: ["beef"],
      cuisine: "mexican", cost: 2, tags: ["meal_prep", "high_protein"],
      ing: [["Lean beef mince 5%", 160, "g", "protein"], ["Rice", 70, "g", "grains"], ["Black beans", 80, "g", "pantry"], ["Salsa", 50, "g", "pantry"], ["Cumin + paprika", 4, "g", "spices"], ["Avocado", 0.25, "pc", "produce"]],
      steps: ["Cook the rice.", "Brown the mince, breaking it up, 6-8 min.", "Add spices and beans, cook 3 more min.", "Layer rice, beef, salsa and avocado."],
    }),
    R({
      id: "salmon-salad", name: "Salmon & Quinoa Salad", slots: ["lunch", "dinner"],
      kcal: 560, p: 40, c: 42, f: 24, skill: 2, mins: 22, equip: ["stove", "oven"], contains: ["fish"],
      cuisine: "mediterranean", cost: 3, tags: ["high_protein"],
      ing: [["Salmon fillet", 150, "g", "protein"], ["Quinoa", 60, "g", "grains"], ["Rocket", 40, "g", "produce"], ["Cherry tomatoes", 80, "g", "produce"], ["Olive oil", 10, "ml", "pantry"], ["Lemon", 0.5, "pc", "produce"]],
      steps: ["Cook the quinoa, 12-15 min, then cool slightly.", "Bake the salmon at 200°C for 12-14 min.", "Toss quinoa with rocket, tomatoes, oil and lemon.", "Flake the salmon over the top."],
    }),
    R({
      id: "egg-fried-rice", name: "Chicken Egg Fried Rice", slots: ["lunch", "dinner"],
      kcal: 580, p: 42, c: 62, f: 16, skill: 2, mins: 18, equip: ["stove"], contains: ["poultry", "egg", "soy"],
      cuisine: "east_asian", cost: 1, tags: ["one_pan", "quick", "cheap"],
      ing: [["Chicken thigh", 150, "g", "protein"], ["Cooked cold rice", 180, "g", "grains"], ["Egg", 1, "pc", "protein"], ["Frozen peas + carrots", 80, "g", "frozen"], ["Soy sauce", 15, "ml", "pantry"], ["Spring onion", 1, "pc", "produce"]],
      steps: ["Get the pan very hot. Sear the diced chicken until cooked.", "Push aside, scramble the egg in the same pan.", "Add cold rice and vegetables, fry hard 3-4 min without stirring much.", "Splash in soy sauce, toss, finish with spring onion."],
    }),
    R({
      id: "falafel-bowl", name: "Falafel & Tahini Bowl", slots: ["lunch", "dinner"],
      kcal: 520, p: 20, c: 58, f: 22, skill: 1, mins: 15, equip: ["air_fryer"], contains: ["nuts"],
      cuisine: "middle_eastern", cost: 2, tags: ["quick"],
      ing: [["Falafel", 6, "pc", "frozen"], ["Couscous", 60, "g", "grains"], ["Tahini", 20, "g", "pantry"], ["Cucumber + tomato", 120, "g", "produce"], ["Lemon", 0.5, "pc", "produce"]],
      steps: ["Air fry the falafel 10-12 min at 190°C.", "Cover couscous with boiling water, stand 5 min, fluff.", "Thin the tahini with lemon and water.", "Assemble and drizzle."],
    }),
    R({
      id: "soup-sandwich", name: "Lentil Soup & Cheese Toastie", slots: ["lunch"],
      kcal: 540, p: 26, c: 60, f: 20, skill: 1, mins: 12, equip: ["stove"], contains: ["dairy", "gluten"],
      cuisine: "general", cost: 1, tags: ["comfort", "cheap", "quick"],
      ing: [["Lentil soup", 400, "ml", "pantry"], ["Wholegrain bread", 2, "slice", "grains"], ["Cheddar", 40, "g", "dairy"], ["Butter", 8, "g", "dairy"]],
      steps: ["Heat the soup gently.", "Butter the bread on the outside, fill with cheese.", "Toast in a dry pan 3 min a side, pressing down."],
    }),

    /* ----------------------------------------------------------- DINNER */
    R({
      id: "sheet-pan-chicken", name: "Sheet-Pan Chicken & Vegetables", slots: ["dinner"],
      kcal: 580, p: 50, c: 48, f: 18, skill: 1, mins: 35, equip: ["oven"], contains: ["poultry"],
      cuisine: "general", cost: 2, tags: ["one_pan", "meal_prep", "high_protein"],
      ing: [["Chicken thighs", 200, "g", "protein"], ["Potatoes", 250, "g", "produce"], ["Bell pepper", 1, "pc", "produce"], ["Red onion", 0.5, "pc", "produce"], ["Olive oil", 12, "ml", "pantry"], ["Oregano + paprika", 4, "g", "spices"]],
      steps: ["Heat the oven to 210°C.", "Toss everything with oil, herbs, salt and pepper on one tray.", "Roast 30-35 min, turning once halfway."],
    }),
    R({
      id: "stir-fry-beef", name: "Beef & Broccoli Stir Fry", slots: ["dinner", "lunch"],
      kcal: 560, p: 46, c: 48, f: 18, skill: 2, mins: 20, equip: ["stove"], contains: ["beef", "soy"],
      cuisine: "east_asian", cost: 2, tags: ["quick", "one_pan", "high_protein"],
      ing: [["Beef strips", 180, "g", "protein"], ["Broccoli", 150, "g", "produce"], ["Rice", 65, "g", "grains"], ["Soy sauce", 20, "ml", "pantry"], ["Garlic", 2, "clove", "produce"], ["Sesame oil", 6, "ml", "pantry"]],
      steps: ["Start the rice.", "Sear the beef in a very hot pan, 90 seconds, remove.", "Stir fry broccoli and garlic 3 min with a splash of water.", "Return the beef, add soy and sesame oil, toss and serve."],
    }),
    R({
      id: "chicken-curry", name: "Weeknight Chicken Curry", slots: ["dinner"],
      kcal: 610, p: 44, c: 56, f: 22, skill: 2, mins: 35, equip: ["stove"], contains: ["poultry"],
      cuisine: "south_asian", cost: 2, tags: ["meal_prep", "comfort", "one_pan"],
      ing: [["Chicken thigh", 200, "g", "protein"], ["Onion", 1, "pc", "produce"], ["Chopped tomatoes", 150, "g", "pantry"], ["Garlic + ginger paste", 15, "g", "produce"], ["Curry powder", 8, "g", "spices"], ["Rice", 60, "g", "grains"]],
      steps: ["Brown the onion properly — 8-10 min, don't rush it.", "Add garlic-ginger and curry powder, 1 min.", "Add chicken, seal, then tomatoes and 150ml water.", "Simmer 20 min. Serve with rice."],
    }),
    R({
      id: "salmon-potato", name: "Baked Salmon, Potatoes & Greens", slots: ["dinner"],
      kcal: 600, p: 42, c: 48, f: 26, skill: 1, mins: 30, equip: ["oven"], contains: ["fish"],
      cuisine: "general", cost: 3, tags: ["one_pan", "high_protein"],
      ing: [["Salmon fillet", 170, "g", "protein"], ["New potatoes", 250, "g", "produce"], ["Green beans", 120, "g", "produce"], ["Olive oil", 12, "ml", "pantry"], ["Lemon", 0.5, "pc", "produce"]],
      steps: ["Halve the potatoes, toss in oil, roast at 200°C for 20 min.", "Add the salmon and beans to the tray.", "Roast 12-14 min more, until the salmon flakes.", "Squeeze over lemon."],
    }),
    R({
      id: "veg-chilli", name: "Black Bean Chilli", slots: ["dinner", "lunch"],
      kcal: 480, p: 22, c: 70, f: 12, skill: 1, mins: 30, equip: ["stove"], contains: [],
      cuisine: "mexican", cost: 1, tags: ["meal_prep", "cheap", "one_pan", "comfort"],
      ing: [["Black beans", 240, "g", "pantry"], ["Chopped tomatoes", 200, "g", "pantry"], ["Onion", 1, "pc", "produce"], ["Bell pepper", 1, "pc", "produce"], ["Chilli + cumin", 6, "g", "spices"], ["Rice", 55, "g", "grains"]],
      steps: ["Fry onion and pepper 8 min.", "Add spices, then tomatoes and beans.", "Simmer 15-20 min until thick. Season generously.", "Serve over rice."],
    }),
    R({
      id: "tofu-noodles", name: "Peanut Tofu Noodles", slots: ["dinner", "lunch"],
      kcal: 590, p: 30, c: 64, f: 24, skill: 2, mins: 20, equip: ["stove"], contains: ["soy", "nuts", "gluten"],
      cuisine: "east_asian", cost: 2, tags: ["quick", "one_pan"],
      ing: [["Firm tofu", 200, "g", "protein"], ["Noodles", 80, "g", "grains"], ["Peanut butter", 25, "g", "pantry"], ["Soy sauce", 15, "ml", "pantry"], ["Lime", 0.5, "pc", "produce"], ["Pak choi", 100, "g", "produce"]],
      steps: ["Press and cube the tofu, fry until golden on all sides.", "Boil the noodles.", "Whisk peanut butter, soy, lime and 60ml hot water into a sauce.", "Toss noodles, tofu, greens and sauce together."],
    }),
    R({
      id: "steak-salad", name: "Steak & Sweet Potato", slots: ["dinner"],
      kcal: 640, p: 48, c: 52, f: 24, skill: 2, mins: 30, equip: ["oven", "stove"], contains: ["beef"],
      cuisine: "american", cost: 3, tags: ["high_protein"],
      ing: [["Sirloin steak", 180, "g", "protein"], ["Sweet potato", 280, "g", "produce"], ["Rocket", 40, "g", "produce"], ["Olive oil", 10, "ml", "pantry"], ["Black pepper", 2, "g", "spices"]],
      steps: ["Cube and roast the sweet potato at 210°C for 25 min.", "Season the steak heavily, sear 3 min a side for medium.", "Rest the steak 5 minutes before slicing — this matters.", "Plate with the rocket."],
    }),
    R({
      id: "pasta-bolognese", name: "Turkey Bolognese", slots: ["dinner"],
      kcal: 600, p: 46, c: 66, f: 16, skill: 1, mins: 30, equip: ["stove"], contains: ["poultry", "gluten"],
      cuisine: "mediterranean", cost: 2, tags: ["meal_prep", "comfort", "high_protein"],
      ing: [["Turkey mince", 180, "g", "protein"], ["Pasta", 80, "g", "grains"], ["Passata", 200, "g", "pantry"], ["Onion", 0.5, "pc", "produce"], ["Garlic", 2, "clove", "produce"], ["Italian herbs", 4, "g", "spices"]],
      steps: ["Fry onion and garlic, add the mince and brown it.", "Add passata and herbs, simmer 15-20 min.", "Cook the pasta, keep a splash of the water.", "Toss together with the pasta water to bind the sauce."],
    }),
    R({
      id: "prawn-stirfry", name: "Garlic Prawn Stir Fry", slots: ["dinner", "lunch"],
      kcal: 480, p: 38, c: 52, f: 12, skill: 2, mins: 18, equip: ["stove"], contains: ["shellfish", "soy"],
      cuisine: "east_asian", cost: 3, tags: ["quick", "one_pan", "high_protein"],
      ing: [["Prawns", 180, "g", "protein"], ["Rice noodles", 70, "g", "grains"], ["Mixed vegetables", 150, "g", "frozen"], ["Garlic", 3, "clove", "produce"], ["Soy sauce", 15, "ml", "pantry"], ["Chilli flakes", 2, "g", "spices"]],
      steps: ["Soak the noodles per the packet.", "Fry garlic 30 seconds, add prawns, 2 min until pink.", "Add vegetables, toss 3 min.", "Fold in noodles and soy sauce."],
    }),
    R({
      id: "kebab-plate", name: "Chicken Shish Plate", slots: ["dinner"],
      kcal: 580, p: 52, c: 46, f: 20, skill: 2, mins: 30, equip: ["oven"], contains: ["poultry", "dairy"],
      cuisine: "middle_eastern", cost: 2, tags: ["high_protein", "meal_prep"],
      ing: [["Chicken breast", 200, "g", "protein"], ["Yogurt", 60, "g", "dairy"], ["Bulgur wheat", 60, "g", "grains"], ["Salad vegetables", 150, "g", "produce"], ["Paprika + garlic", 5, "g", "spices"], ["Lemon", 0.5, "pc", "produce"]],
      steps: ["Marinate the diced chicken in yogurt, spices and lemon — 20 min minimum.", "Thread onto skewers, grill 12-15 min, turning.", "Cook the bulgur, 12 min.", "Serve with chopped salad."],
    }),
    R({
      id: "keto-chicken-cream", name: "Creamy Garlic Chicken & Greens", slots: ["dinner"],
      kcal: 520, p: 46, c: 10, f: 32, skill: 2, mins: 25, equip: ["stove"], contains: ["poultry", "dairy"],
      cuisine: "general", cost: 2, tags: ["low_carb", "one_pan", "high_protein"],
      ing: [["Chicken breast", 200, "g", "protein"], ["Double cream", 60, "ml", "dairy"], ["Spinach", 100, "g", "produce"], ["Garlic", 3, "clove", "produce"], ["Butter", 10, "g", "dairy"], ["Parmesan", 15, "g", "dairy"]],
      steps: ["Sear the seasoned chicken in butter, 5 min a side, remove.", "Soften garlic in the pan, add cream, simmer 2 min.", "Wilt in the spinach and stir through parmesan.", "Return the chicken and coat in the sauce."],
    }),
    R({
      id: "chickpea-curry", name: "Coconut Chickpea Curry", slots: ["dinner", "lunch"],
      kcal: 540, p: 20, c: 62, f: 24, skill: 1, mins: 25, equip: ["stove"], contains: [],
      cuisine: "south_asian", cost: 1, tags: ["cheap", "one_pan", "meal_prep", "comfort"],
      ing: [["Chickpeas, tinned", 240, "g", "pantry"], ["Coconut milk", 120, "ml", "pantry"], ["Spinach", 80, "g", "produce"], ["Onion", 0.5, "pc", "produce"], ["Curry powder", 8, "g", "spices"], ["Rice", 55, "g", "grains"]],
      steps: ["Fry the onion until soft, add curry powder.", "Add chickpeas and coconut milk, simmer 12 min.", "Stir in spinach until wilted.", "Serve with rice."],
    }),

    /* ------------------------------------------------------------ SNACK */
    R({
      id: "cottage-fruit", name: "Cottage Cheese & Pineapple", slots: ["snack"],
      kcal: 200, p: 22, c: 18, f: 4, skill: 0, mins: 2, equip: [], contains: ["dairy"],
      cuisine: "general", cost: 1, tags: ["quick", "no_cook", "high_protein"],
      ing: [["Cottage cheese", 180, "g", "dairy"], ["Pineapple", 100, "g", "produce"]],
      steps: ["Combine in a bowl. That's it."],
    }),
    R({
      id: "apple-pb", name: "Apple with Peanut Butter", slots: ["snack"],
      kcal: 230, p: 8, c: 26, f: 12, skill: 0, mins: 2, equip: [], contains: ["nuts"],
      cuisine: "general", cost: 1, tags: ["quick", "no_cook"],
      ing: [["Apple", 1, "pc", "produce"], ["Peanut butter", 20, "g", "pantry"]],
      steps: ["Slice the apple.", "Dip."],
    }),
    R({
      id: "protein-bar-diy", name: "No-Bake Protein Bites", slots: ["snack"],
      kcal: 260, p: 16, c: 26, f: 10, skill: 1, mins: 10, equip: [], contains: ["nuts", "dairy"],
      cuisine: "general", cost: 2, tags: ["meal_prep", "no_cook"],
      ing: [["Oats", 40, "g", "grains"], ["Protein powder", 20, "g", "pantry"], ["Peanut butter", 20, "g", "pantry"], ["Honey", 12, "g", "pantry"]],
      steps: ["Mix everything into a stiff dough — add a splash of milk if dry.", "Roll into balls.", "Chill 30 min. Keeps for a week."],
    }),
    R({
      id: "boiled-eggs", name: "Boiled Eggs & Fruit", slots: ["snack", "breakfast"],
      kcal: 240, p: 18, c: 18, f: 12, skill: 1, mins: 10, equip: ["stove"], contains: ["egg"],
      cuisine: "general", cost: 1, tags: ["quick", "meal_prep", "high_protein"],
      ing: [["Eggs", 2, "pc", "protein"], ["Banana", 1, "pc", "produce"]],
      steps: ["Boil eggs 8 minutes for a set yolk.", "Cool under cold water, peel, salt."],
    }),
    R({
      id: "edamame", name: "Chilli Edamame", slots: ["snack"],
      kcal: 190, p: 17, c: 14, f: 8, skill: 1, mins: 6, equip: ["microwave"], contains: ["soy"],
      cuisine: "east_asian", cost: 1, tags: ["quick", "high_protein"],
      ing: [["Frozen edamame", 150, "g", "frozen"], ["Sea salt + chilli", 2, "g", "spices"]],
      steps: ["Microwave the edamame 3-4 min.", "Toss with salt and chilli flakes."],
    }),
    R({
      id: "hummus-veg", name: "Hummus & Crudités", slots: ["snack"],
      kcal: 210, p: 8, c: 22, f: 11, skill: 0, mins: 4, equip: [], contains: ["nuts"],
      cuisine: "middle_eastern", cost: 1, tags: ["quick", "no_cook"],
      ing: [["Hummus", 60, "g", "pantry"], ["Carrot + cucumber", 150, "g", "produce"]],
      steps: ["Cut the vegetables into sticks.", "Serve with hummus."],
    }),
    R({
      id: "greek-honey", name: "Yogurt, Honey & Walnuts", slots: ["snack"],
      kcal: 250, p: 20, c: 22, f: 9, skill: 0, mins: 2, equip: [], contains: ["dairy", "nuts"],
      cuisine: "mediterranean", cost: 2, tags: ["quick", "no_cook", "high_protein"],
      ing: [["Greek yogurt 0%", 200, "g", "dairy"], ["Honey", 10, "g", "pantry"], ["Walnuts", 12, "g", "pantry"]],
      steps: ["Spoon, drizzle, scatter."],
    }),
    R({
      id: "beef-jerky-nuts", name: "Jerky & Almonds", slots: ["snack"],
      kcal: 280, p: 24, c: 8, f: 17, skill: 0, mins: 1, equip: [], contains: ["beef", "nuts"],
      cuisine: "general", cost: 3, tags: ["quick", "no_cook", "low_carb", "high_protein"],
      ing: [["Beef jerky", 50, "g", "protein"], ["Almonds", 25, "g", "pantry"]],
      steps: ["Open the packets. Portion them out so you don't eat the lot."],
    }),
    R({
      id: "rice-cakes-tuna", name: "Rice Cakes with Tuna", slots: ["snack"],
      kcal: 230, p: 24, c: 22, f: 5, skill: 0, mins: 3, equip: [], contains: ["fish"],
      cuisine: "general", cost: 1, tags: ["quick", "no_cook", "high_protein"],
      ing: [["Rice cakes", 3, "pc", "grains"], ["Tinned tuna", 100, "g", "protein"], ["Sriracha", 5, "ml", "pantry"]],
      steps: ["Drain the tuna, mash with sriracha.", "Pile onto the rice cakes."],
    }),
    R({
      id: "smoothie-green", name: "Green Recovery Smoothie", slots: ["snack", "breakfast"],
      kcal: 300, p: 26, c: 34, f: 6, skill: 0, mins: 3, equip: ["blender"], contains: ["dairy"],
      cuisine: "general", cost: 2, tags: ["quick", "high_protein"],
      ing: [["Protein powder", 30, "g", "pantry"], ["Spinach", 40, "g", "produce"], ["Frozen mango", 100, "g", "frozen"], ["Milk", 200, "ml", "dairy"]],
      steps: ["Blend until completely smooth, about 45 seconds."],
    }),
  ];

  FF.RECIPE_BY_ID = FF.RECIPES.reduce(function (a, r) { a[r.id] = r; return a; }, {});

  /* ------------------------------------------------------------------------
     Ingredient substitutions — for things that are common in the recipe set
     but not always easy to find everywhere (e.g. turkey, salmon, tahini in
     Bangladesh). Shown as a note under the matching ingredient in the recipe
     modal. First matching row wins; keep entries specific-before-general.
     ------------------------------------------------------------------------ */
  FF.SUBSTITUTES = [
    ["turkey mince", "Chicken mince, or lean beef mince"],
    ["turkey slices", "Chicken slices or roast chicken breast"],
    ["turkey breast", "Chicken breast"],
    ["salmon", "Any firm white fish — rui, tilapia, or basa work well"],
    ["prawns", "Chicken breast, firm tofu, or any local fish"],
    ["tahini", "Peanut butter, or blended sesame (til) seeds"],
    ["quinoa", "Rice, bulgur wheat, or couscous"],
    ["couscous", "Rice or bulgur wheat"],
    ["bulgur wheat", "Cracked wheat (dalia) or rice"],
    ["coconut milk", "Full-fat yogurt thinned with a little water, or cream"],
    ["cottage cheese", "Paneer, or thick strained yogurt (hung curd)"],
    ["parmesan", "Any hard, salty cheese available locally, or nutritional yeast"],
    ["walnuts", "Any available nut — almonds, cashews, or peanuts"],
    ["almonds", "Any available nut — cashews, peanuts, or walnuts"],
    ["hummus", "Mashed chickpeas blended with oil, garlic and lemon, or skip"],
    ["avocado", "Skip it, or use a little extra olive oil for the healthy fat"],
    ["rice cakes", "Toasted bread or plain crackers"],
    ["rice noodles", "Any thin noodle, or vermicelli"],
    ["beef jerky", "Any local dried or cured meat snack, or skip"],
    ["dark chocolate", "Any high-cocoa chocolate available locally"],
    ["edamame", "Boiled green peas or boiled chickpeas"],
    ["pak choi", "Spinach, cabbage, or any leafy green"],
    ["falafel", "Home-fried spiced lentil or chickpea patties"],
    ["sriracha", "Any hot sauce or chilli paste"],
    ["salsa", "Chopped tomato, onion and chilli with a squeeze of lime"],
  ];

  FF.findSubstitute = function (ingredientName) {
    var n = ingredientName.toLowerCase();
    var hit = FF.SUBSTITUTES.filter(function (row) { return n.indexOf(row[0]) !== -1; })[0];
    return hit ? hit[1] : null;
  };

  /* ------------------------------------------------------------------------
     Quick-log foods — single items for the food log, per 100 g / per unit.
     ------------------------------------------------------------------------ */
  function F(name, unit, per, kcal, p, c, f) { return { name, unit, per, kcal, p, c, f }; }

  FF.FOODS = [
    F("Chicken breast, cooked", "g", 100, 165, 31, 0, 3.6),
    F("Chicken thigh, cooked", "g", 100, 209, 26, 0, 11),
    F("Lean beef mince 5%", "g", 100, 137, 21, 0, 5),
    F("Salmon, cooked", "g", 100, 208, 22, 0, 13),
    F("Tinned tuna in water", "g", 100, 116, 26, 0, 1),
    F("Prawns, cooked", "g", 100, 99, 24, 0, 0.3),
    F("Whole egg", "pc", 1, 72, 6.3, 0.4, 4.8),
    F("Egg white", "pc", 1, 17, 3.6, 0.2, 0.1),
    F("Firm tofu", "g", 100, 144, 17, 3, 9),
    F("Tempeh", "g", 100, 192, 20, 8, 11),
    F("Greek yogurt 0%", "g", 100, 59, 10, 3.6, 0.4),
    F("Cottage cheese", "g", 100, 98, 11, 3.4, 4.3),
    F("Whole milk", "ml", 100, 61, 3.2, 4.8, 3.3),
    F("Skimmed milk", "ml", 100, 34, 3.4, 5, 0.1),
    F("Cheddar", "g", 100, 402, 25, 1.3, 33),
    F("Whey protein", "g", 30, 120, 24, 3, 1.5),
    F("Rice, cooked", "g", 100, 130, 2.7, 28, 0.3),
    F("Pasta, cooked", "g", 100, 158, 5.8, 31, 0.9),
    F("Oats, dry", "g", 100, 379, 13, 68, 6.5),
    F("Wholegrain bread", "slice", 1, 82, 4, 14, 1.1),
    F("Potato, boiled", "g", 100, 87, 2, 20, 0.1),
    F("Sweet potato, baked", "g", 100, 90, 2, 21, 0.1),
    F("Banana", "pc", 1, 105, 1.3, 27, 0.4),
    F("Apple", "pc", 1, 95, 0.5, 25, 0.3),
    F("Blueberries", "g", 100, 57, 0.7, 14, 0.3),
    F("Broccoli", "g", 100, 34, 2.8, 7, 0.4),
    F("Spinach", "g", 100, 23, 2.9, 3.6, 0.4),
    F("Avocado", "pc", 1, 240, 3, 13, 22),
    F("Almonds", "g", 100, 579, 21, 22, 50),
    F("Peanut butter", "g", 100, 588, 25, 20, 50),
    F("Olive oil", "ml", 10, 88, 0, 0, 10),
    F("Chickpeas, tinned", "g", 100, 139, 7.4, 22, 2.6),
    F("Black beans, tinned", "g", 100, 91, 6, 16, 0.5),
    F("Red lentils, dry", "g", 100, 352, 24, 60, 1),
    F("Protein bar", "pc", 1, 210, 20, 21, 6),
    F("Dark chocolate 85%", "g", 30, 170, 3, 9, 14),
    F("Beer", "ml", 330, 140, 1.6, 11, 0),
    F("Coffee, black", "cup", 1, 2, 0.3, 0, 0),
  ];
})();
