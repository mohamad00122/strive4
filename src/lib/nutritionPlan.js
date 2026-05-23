export function calculateMacros(intakeForm) {
  if (!intakeForm) return null
  const { age, weight, height, fitness_goal } = intakeForm

  const weightLbs = parseFloat(weight) || 0
  const weightKg = weightLbs * 0.453592

  let feet = 0, inches = 0
  if (height && typeof height === 'string') {
    const parts = height.split("'")
    feet = parseFloat(parts[0]) || 0
    inches = parseFloat(parts[1]) || 0
  }
  const heightCm = (feet * 30.48) + (inches * 2.54)

  const ageNum = parseInt(age) || 25
  const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5
  const tdee = bmr * 1.375

  let calories, protein, fat, deficit

  switch (fitness_goal) {
    case 'build_muscle':
      calories = weightLbs > 200 ? tdee + 300 : tdee + 400
      protein = weightLbs * 1.0
      fat = (calories * 0.25) / 9
      break
    case 'lose_weight':
      deficit = weightLbs > 220 ? 600 : weightLbs > 180 ? 500 : 350
      calories = Math.max(tdee - deficit, 1200)
      protein = weightLbs * 1.0
      fat = (calories * 0.25) / 9
      break
    case 'endurance':
      calories = tdee + 150
      protein = weightLbs * 0.75
      fat = (calories * 0.20) / 9
      break
    case 'general_fitness':
    default:
      calories = tdee
      protein = weightLbs * 0.85
      fat = (calories * 0.25) / 9
      break
  }

  calories = Math.max(Math.round(calories), 1200)
  protein = Math.round(protein)
  fat = Math.round(fat)
  const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4)

  return { calories, protein, carbs, fats: fat, bmr: Math.round(bmr), tdee: Math.round(tdee) }
}

const MEAL_PLANS = {
  build_muscle: {
    A: [
      {
        name: 'Breakfast',
        foods: ['4 scrambled eggs', 'Oatmeal with banana', 'Greek yogurt (200g)', 'Orange juice'],
        calories: 680
      },
      {
        name: 'Lunch',
        foods: ['Grilled chicken breast (200g)', 'Brown rice (1.5 cups cooked)', 'Steamed broccoli', 'Olive oil dressing'],
        calories: 720
      },
      {
        name: 'Dinner',
        foods: ['Salmon fillet (200g)', 'Sweet potato (large)', 'Mixed vegetables', 'Avocado (half)'],
        calories: 700
      }
    ],
    B: [
      {
        name: 'Breakfast',
        foods: ['Protein pancakes (3)', 'Fresh berries', 'Almond butter (2 tbsp)', 'Milk (250ml)'],
        calories: 620
      },
      {
        name: 'Lunch',
        foods: ['Tuna wrap (whole wheat)', 'Cottage cheese (150g)', 'Apple', 'Mixed nuts (30g)'],
        calories: 650
      },
      {
        name: 'Dinner',
        foods: ['Lean beef mince (200g)', 'Pasta (2 cups cooked)', 'Tomato sauce', 'Parmesan (30g)'],
        calories: 780
      }
    ],
    C: [
      {
        name: 'Breakfast',
        foods: ['Overnight oats with protein powder', 'Banana', 'Peanut butter (2 tbsp)'],
        calories: 580
      },
      {
        name: 'Lunch',
        foods: ['Turkey and rice bowl', 'Roasted vegetables', 'Hummus (50g)'],
        calories: 620
      },
      {
        name: 'Dinner',
        foods: ['Baked chicken thighs (2)', 'Quinoa (1 cup)', 'Stir-fried greens', 'Teriyaki sauce'],
        calories: 660
      }
    ]
  },
  lose_weight: {
    A: [
      {
        name: 'Breakfast',
        foods: ['Egg white omelette (4 whites, 1 yolk)', 'Spinach and mushrooms', 'Whole grain toast (1 slice)', 'Black coffee'],
        calories: 300
      },
      {
        name: 'Lunch',
        foods: ['Grilled chicken salad (large)', 'Cherry tomatoes, cucumber', 'Feta cheese (30g)', 'Balsamic vinaigrette'],
        calories: 420
      },
      {
        name: 'Dinner',
        foods: ['Baked white fish (200g)', 'Steamed vegetables (large portion)', 'Brown rice (0.5 cup cooked)'],
        calories: 380
      }
    ],
    B: [
      {
        name: 'Breakfast',
        foods: ['Greek yogurt (200g)', 'Mixed berries', 'Flaxseeds (1 tbsp)'],
        calories: 260
      },
      {
        name: 'Lunch',
        foods: ['Turkey lettuce wraps (4)', 'Sliced veggies', 'Mustard dipping sauce'],
        calories: 350
      },
      {
        name: 'Dinner',
        foods: ['Shrimp stir-fry (200g)', 'Cauliflower rice', 'Soy-ginger sauce'],
        calories: 380
      }
    ],
    C: [
      {
        name: 'Breakfast',
        foods: ['Smoothie: spinach, protein powder, almond milk, berries'],
        calories: 280
      },
      {
        name: 'Lunch',
        foods: ['Tuna salad (large)', 'Celery sticks', 'Apple (small)'],
        calories: 320
      },
      {
        name: 'Dinner',
        foods: ['Lean beef steak (150g)', 'Roasted asparagus', 'Side salad'],
        calories: 400
      }
    ]
  },
  endurance: {
    A: [
      {
        name: 'Breakfast',
        foods: ['Oatmeal with banana and honey', 'Whole grain toast (2 slices)', 'Almond butter', 'Orange juice (small)'],
        calories: 580
      },
      {
        name: 'Lunch',
        foods: ['Whole wheat pasta (2 cups cooked)', 'Lean turkey mince', 'Marinara sauce', 'Side salad'],
        calories: 650
      },
      {
        name: 'Dinner',
        foods: ['Grilled salmon (180g)', 'Brown rice (1.5 cups)', 'Roasted vegetables', 'Lemon-herb dressing'],
        calories: 620
      }
    ],
    B: [
      {
        name: 'Breakfast',
        foods: ['Banana smoothie bowl', 'Granola (50g)', 'Mixed seeds', 'Honey drizzle'],
        calories: 530
      },
      {
        name: 'Lunch',
        foods: ['Chicken and rice bowl', 'Sweet corn', 'Black beans', 'Salsa'],
        calories: 660
      },
      {
        name: 'Dinner',
        foods: ['Baked potato (large)', 'Cottage cheese (150g)', 'Steamed broccoli'],
        calories: 500
      }
    ],
    C: [
      {
        name: 'Breakfast',
        foods: ['Whole grain waffles (2)', 'Fresh fruit', 'Maple syrup (1 tbsp)'],
        calories: 480
      },
      {
        name: 'Lunch',
        foods: ['Pita with chicken and tzatziki', 'Tabbouleh salad', 'Fruit juice (200ml)'],
        calories: 580
      },
      {
        name: 'Dinner',
        foods: ['Grilled chicken (200g)', 'Quinoa and vegetable medley', 'Pesto drizzle'],
        calories: 590
      }
    ]
  },
  general_fitness: {
    A: [
      {
        name: 'Breakfast',
        foods: ['2 whole eggs + 2 egg whites', 'Avocado toast (1 slice)', 'Fresh fruit'],
        calories: 420
      },
      {
        name: 'Lunch',
        foods: ['Grilled chicken (150g)', 'Mixed greens salad', 'Whole grain roll', 'Olive oil + lemon'],
        calories: 520
      },
      {
        name: 'Dinner',
        foods: ['Baked salmon (150g)', 'Roasted sweet potato', 'Steamed green beans'],
        calories: 500
      }
    ],
    B: [
      {
        name: 'Breakfast',
        foods: ['Greek yogurt parfait', 'Granola (40g)', 'Mixed berries'],
        calories: 380
      },
      {
        name: 'Lunch',
        foods: ['Turkey and veggie sandwich (whole grain)', 'Side of fruit', 'Sparkling water'],
        calories: 460
      },
      {
        name: 'Dinner',
        foods: ['Stir-fried tofu (200g)', 'Brown rice (1 cup)', 'Mixed vegetables'],
        calories: 480
      }
    ],
    C: [
      {
        name: 'Breakfast',
        foods: ['Smoothie: banana, oats, protein powder, almond milk'],
        calories: 400
      },
      {
        name: 'Lunch',
        foods: ['Chicken wrap', 'Side salad', 'Apple'],
        calories: 480
      },
      {
        name: 'Dinner',
        foods: ['Baked white fish (180g)', 'Quinoa pilaf', 'Roasted vegetables'],
        calories: 480
      }
    ]
  }
}

export function getMealPlan(goal, dayGroup) {
  const g = goal || 'general_fitness'
  const plans = MEAL_PLANS[g] || MEAL_PLANS.general_fitness
  return plans[dayGroup] || plans.A
}

export function scaleMealPlan(meals, targetCalories) {
  const totalCals = meals.reduce((sum, m) => sum + m.calories, 0)
  if (totalCals === 0) return meals
  const ratio = targetCalories / totalCals
  return meals.map(m => ({
    ...m,
    calories: Math.round(m.calories * ratio)
  }))
}

export function getDayGroup(dayIndex) {
  if ([1, 3, 5].includes(dayIndex)) return 'A'
  if ([2, 4].includes(dayIndex)) return 'B'
  return 'C'
}
