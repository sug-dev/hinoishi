
import 'dotenv/config';
import mongoose from 'mongoose';
import { Stat } from '../models/Stat.js';
import { Task } from '../models/Task.js';

type TaskSeed = {
  stat: string;
  name: string;
  description: string;
  xp: number;
  minLevel: number;
};

const library: TaskSeed[] = [
  // HEALTH — 15 tasks
  { stat: 'Health', name: 'Drink a glass of water', description: 'Take a moment to hydrate.', xp: 10, minLevel: 1 },
  { stat: 'Health', name: 'Prepare a proper meal', description: 'Prepare and enjoy a reasonably balanced meal.', xp: 20, minLevel: 1 },
  { stat: 'Health', name: 'Eat some fruit', description: 'Include a piece of fruit in your day.', xp: 10, minLevel: 1 },
  { stat: 'Health', name: 'Eat some vegetables', description: 'Include vegetables in one of your meals.', xp: 10, minLevel: 1 },
  { stat: 'Health', name: 'Take a screen break', description: 'Spend at least 15 minutes away from screens.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Practice good oral hygiene', description: 'Brush and floss your teeth.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Take a refreshing shower', description: 'Take some time to freshen up.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Prepare a meal in advance', description: 'Make something that can be eaten later.', xp: 25, minLevel: 2 },
  { stat: 'Health', name: 'Spend time outdoors', description: 'Get some fresh air and natural light.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Have a consistent bedtime', description: 'Make an effort to go to bed around your intended time.', xp: 20, minLevel: 2 },
  { stat: 'Health', name: 'Take a proper rest break', description: 'Step away from responsibilities and genuinely rest.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Prepare a healthy snack', description: 'Make a snack rather than skipping a meal or grabbing whatever is nearby.', xp: 15, minLevel: 1 },
  { stat: 'Health', name: 'Change your bedsheets', description: 'Refresh your sleeping environment.', xp: 20, minLevel: 2 },
  { stat: 'Health', name: 'Have a screen-free meal', description: 'Enjoy a meal without watching or scrolling.', xp: 20, minLevel: 2 },
  { stat: 'Health', name: 'Complete an evening wind-down', description: 'Spend 20 minutes relaxing before bed.', xp: 25, minLevel: 3 },

  // INTELLIGENCE — 25 tasks
  { stat: 'Intelligence', name: 'Review coursework', description: 'Review notes or material from your degree.', xp: 20, minLevel: 1 },
  { stat: 'Intelligence', name: 'Complete a practice problem', description: 'Work through one problem from your current coursework.', xp: 15, minLevel: 1 },
  { stat: 'Intelligence', name: 'Study a class concept', description: 'Give your coursework one focused study session.', xp: 25, minLevel: 1 },
  { stat: 'Intelligence', name: 'Practice Japanese vocabulary', description: 'Review or learn a small set of Japanese words.', xp: 15, minLevel: 1 },
  { stat: 'Intelligence', name: 'Practice Japanese grammar', description: 'Review a grammar pattern and make example sentences.', xp: 20, minLevel: 1 },
  { stat: 'Intelligence', name: 'Study Japanese kanji', description: 'Review a few kanji, their readings, and meanings.', xp: 20, minLevel: 2 },
  { stat: 'Intelligence', name: 'Read a Japanese passage', description: 'Work through a short passage, looking up unfamiliar words.', xp: 25, minLevel: 2 },
  { stat: 'Intelligence', name: 'Write Japanese sentences', description: 'Practice constructing a few sentences in Japanese.', xp: 20, minLevel: 2 },
  { stat: 'Intelligence', name: 'Study a programming concept', description: 'Spend time understanding one technical concept.', xp: 20, minLevel: 1 },
  { stat: 'Intelligence', name: 'Learn something unfamiliar', description: 'Explore a subject you know very little about.', xp: 20, minLevel: 1 },
  { stat: 'Intelligence', name: 'Read a chapter of a book', description: 'Spend time reading a nonfiction or educational book.', xp: 25, minLevel: 1 },
  { stat: 'Intelligence', name: 'Review a previous mistake', description: 'Understand why you got a problem wrong and how to solve it.', xp: 20, minLevel: 2 },
  { stat: 'Intelligence', name: 'Practice mental arithmetic', description: 'Work through a few calculations without a calculator.', xp: 15, minLevel: 1 },
  { stat: 'Intelligence', name: 'Research a topic in depth', description: 'Follow a question and explore it beyond a quick search.', xp: 30, minLevel: 3 },
  { stat: 'Intelligence', name: 'Explain a concept from memory', description: 'Try to explain something you learned without looking at your notes.', xp: 25, minLevel: 2 },
  { stat: 'Intelligence', name: 'Review your study progress', description: 'Identify what you understand and what needs more attention.', xp: 15, minLevel: 1 },

  // PHYSICAL — 15 tasks
  { stat: 'Physical', name: 'Take a short walk', description: 'Walk for at least 10 minutes.', xp: 15, minLevel: 1 },
  { stat: 'Physical', name: 'Take a longer walk', description: 'Go for a walk of at least 30 minutes.', xp: 30, minLevel: 2 },
  { stat: 'Physical', name: 'Stretch for 10 minutes', description: 'Give your muscles and joints some gentle movement.', xp: 15, minLevel: 1 },
  { stat: 'Physical', name: 'Do a mobility routine', description: 'Work through a short full-body mobility session.', xp: 20, minLevel: 1 },
  { stat: 'Physical', name: 'Do a bodyweight workout', description: 'Complete a short workout using your body weight.', xp: 30, minLevel: 2 },
  { stat: 'Physical', name: 'Practice balance', description: 'Spend a few minutes practicing balance and stability.', xp: 15, minLevel: 1 },
  { stat: 'Physical', name: 'Go for a brisk walk', description: 'Walk at a pace that gets your body moving.', xp: 25, minLevel: 2 },
  { stat: 'Physical', name: 'Do a core exercise session', description: 'Spend some time on gentle core-strengthening exercises.', xp: 25, minLevel: 2 },
  { stat: 'Physical', name: 'Practice posture and movement', description: 'Take a few breaks to move and change position.', xp: 15, minLevel: 1 },
  { stat: 'Physical', name: 'Try a new exercise', description: 'Experiment with a movement or exercise you have not tried before.', xp: 25, minLevel: 2 },
  { stat: 'Physical', name: 'Do a longer exercise session', description: 'Spend 30–45 minutes on an activity you enjoy.', xp: 40, minLevel: 3 },
  { stat: 'Physical', name: 'Go outside for a walk without your phone', description: 'Take a walk without using your phone for entertainment.', xp: 25, minLevel: 2 },
  { stat: 'Physical', name: 'Practice gentle recovery movement', description: 'Do light movement on a day when you need something easy.', xp: 15, minLevel: 1 },

  // CREATIVITY — 10 tasks
  { stat: 'Creativity', name: 'Freewrite for 10 minutes', description: 'Write whatever comes to mind without editing yourself.', xp: 15, minLevel: 1 },
  { stat: 'Creativity', name: 'Develop a fictional idea', description: 'Explore a character, setting, theme, or story concept.', xp: 20, minLevel: 1 },
  { stat: 'Creativity', name: 'Explore a philosophical question', description: 'Spend time considering a question without needing to resolve it.', xp: 20, minLevel: 1 },
  { stat: 'Creativity', name: 'Sketch something', description: 'Draw an object, scene, character, or abstract idea.', xp: 20, minLevel: 1 },
  { stat: 'Creativity', name: 'Listen to music intentionally', description: 'Give an album or collection of songs your full attention.', xp: 15, minLevel: 1 },
  { stat: 'Creativity', name: 'Write a short scene', description: 'Write a small moment of dialogue, atmosphere, or action.', xp: 25, minLevel: 2 },
  { stat: 'Creativity', name: 'Collect creative inspiration', description: 'Save images, sounds, writing, or ideas that interest you.', xp: 15, minLevel: 1 },
  { stat: 'Creativity', name: 'Revisit an old creative idea', description: 'Look at something you previously started, with no pressure to continue it.', xp: 15, minLevel: 1 },

  // EXPLORATION — 15 tasks
  { stat: 'Exploration', name: 'Discover a new Japanese artist', description: 'Listen to or learn about an artist you have not explored before.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Explore a Japanese city', description: 'Learn about a neighborhood, city, or region in Japan.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Learn about Japanese daily life', description: 'Explore an aspect of everyday life in Japan.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Discover a new genre', description: 'Explore a genre of music, film, literature, or art.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Visit somewhere new', description: 'Go somewhere nearby that you have not visited before.', xp: 30, minLevel: 2 },
  { stat: 'Exploration', name: 'Take a different route', description: 'Change up a familiar walk or journey.', xp: 15, minLevel: 1 },
  { stat: 'Exploration', name: 'Try a new food', description: 'Try a dish or ingredient that is unfamiliar to you.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Learn about Japanese history', description: 'Explore a historical period, event, or figure.', xp: 25, minLevel: 2 },
  { stat: 'Exploration', name: 'Explore a new subject', description: 'Follow your curiosity into an unfamiliar topic.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Watch an international film', description: 'Watch a film from a country or culture you know little about.', xp: 25, minLevel: 2 },
  { stat: 'Exploration', name: 'Discover a new author', description: 'Explore an author and read about their work.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Explore a local area', description: 'Spend time noticing places and details in your surroundings.', xp: 20, minLevel: 1 },
  { stat: 'Exploration', name: 'Research a possible Japan destination', description: 'Look into a place you might want to visit or live.', xp: 25, minLevel: 2 },
  { stat: 'Exploration', name: 'Try an unfamiliar activity', description: 'Give something new a chance, even if only briefly.', xp: 30, minLevel: 3 },

  // ENVIRONMENT — 15 tasks
  { stat: 'Environment', name: 'Clear your desk', description: 'Remove clutter and leave your workspace usable.', xp: 15, minLevel: 1 },
  { stat: 'Environment', name: 'Make your bed', description: 'Straighten your sleeping area.', xp: 10, minLevel: 1 },
  { stat: 'Environment', name: 'Wash the dishes', description: 'Clean the dishes that have accumulated.', xp: 15, minLevel: 1 },
  { stat: 'Environment', name: 'Take out the trash', description: 'Empty the trash and replace the liner if needed.', xp: 10, minLevel: 1 },
  { stat: 'Environment', name: 'Do a load of laundry', description: 'Wash, dry, or put away a load of clothing.', xp: 20, minLevel: 1 },
  { stat: 'Environment', name: 'Vacuum or sweep a room', description: 'Clean the floor in one area.', xp: 20, minLevel: 1 },
  { stat: 'Environment', name: 'Clean the bathroom', description: 'Take care of the sink, toilet, or shower.', xp: 25, minLevel: 2 },
  { stat: 'Environment', name: 'Organize one small area', description: 'Tidy one drawer, shelf, or surface.', xp: 20, minLevel: 1 },
  { stat: 'Environment', name: 'Put away misplaced items', description: 'Return belongings to their proper locations.', xp: 15, minLevel: 1 },
  { stat: 'Environment', name: 'Clean your computer workspace', description: 'Organize your desktop, downloads, or digital files.', xp: 20, minLevel: 1 },
  { stat: 'Environment', name: 'Change your towels', description: 'Replace used towels with clean ones.', xp: 10, minLevel: 1 },
  { stat: 'Environment', name: 'Review unused belongings', description: 'Identify items you no longer need or use.', xp: 25, minLevel: 2 },
  { stat: 'Environment', name: 'Organize a category of belongings', description: 'Bring order to one category, such as cables, clothes, or documents.', xp: 30, minLevel: 3 },
  { stat: 'Environment', name: 'Reset your living space', description: 'Spend 30 minutes returning your space to a comfortable baseline.', xp: 35, minLevel: 3 },

  // CONNECTION — 12 tasks
  { stat: 'Connection', name: 'Message a friend', description: 'Reach out to someone you have not spoken to recently.', xp: 15, minLevel: 1 },
  { stat: 'Connection', name: 'Check in with family', description: 'Ask someone in your family how they are doing.', xp: 15, minLevel: 1 },
  { stat: 'Connection', name: 'Have a meaningful conversation', description: 'Make time for a conversation beyond small talk.', xp: 25, minLevel: 2 },
  { stat: 'Connection', name: 'Share something interesting', description: 'Send someone an article, song, video, or thought they might enjoy.', xp: 15, minLevel: 1 },
  { stat: 'Connection', name: 'Express appreciation', description: 'Tell someone something you appreciate about them.', xp: 15, minLevel: 1 },
  { stat: 'Connection', name: 'Spend time with someone', description: 'Share some time with another person, in person or remotely.', xp: 25, minLevel: 2 },
  { stat: 'Connection', name: 'Make plans with someone', description: 'Arrange a future activity or conversation.', xp: 20, minLevel: 1 },
  { stat: 'Connection', name: 'Do something considerate', description: 'Make a small effort to make someone else’s day easier.', xp: 20, minLevel: 1 },

  // MIND — 15 tasks
  { stat: 'Mind', name: 'Meditate for 5 minutes', description: 'Sit quietly and observe your breathing.', xp: 10, minLevel: 1 },
  { stat: 'Mind', name: 'Meditate for 15 minutes', description: 'Spend a little longer practicing meditation.', xp: 20, minLevel: 2 },
  { stat: 'Mind', name: 'Write a short journal entry', description: 'Write about what is on your mind without judging it.', xp: 15, minLevel: 1 },
  { stat: 'Mind', name: 'Reflect on your day', description: 'Consider what went well and what you experienced.', xp: 15, minLevel: 1 },
  { stat: 'Mind', name: 'Practice mindful breathing', description: 'Spend a few minutes paying attention to your breath.', xp: 10, minLevel: 1 },
  { stat: 'Mind', name: 'Spend time in silence', description: 'Take a short break without media or distractions.', xp: 15, minLevel: 1 },
  { stat: 'Mind', name: 'Write down three things you appreciate', description: 'Notice a few things, large or small, that you value.', xp: 10, minLevel: 1 },
  { stat: 'Mind', name: 'Read a philosophical passage', description: 'Read and reflect on a passage from a philosophical text.', xp: 20, minLevel: 1 },
  { stat: 'Mind', name: 'Practice letting go of a worry', description: 'Notice a worry and give yourself permission to set it aside for now.', xp: 15, minLevel: 1 },
  { stat: 'Mind', name: 'Write a future-self journal entry', description: 'Write about the life you hope to build, without turning it into a checklist.', xp: 20, minLevel: 2 },
  { stat: 'Mind', name: 'Take a mindful walk', description: 'Walk while paying attention to your surroundings.', xp: 20, minLevel: 1 },
  { stat: 'Mind', name: 'Reflect on a personal value', description: 'Consider what matters to you and why.', xp: 20, minLevel: 2 },
  { stat: 'Mind', name: 'Practice non-judgmental observation', description: 'Notice your thoughts and feelings without trying to fix them.', xp: 20, minLevel: 2 },
  { stat: 'Mind', name: 'Read about Buddhist or Daoist ideas', description: 'Explore a teaching or passage and consider its meaning.', xp: 20, minLevel: 2 },
  { stat: 'Mind', name: 'Take a deliberate rest period', description: 'Give yourself time to rest without needing to earn it.', xp: 15, minLevel: 1 },

  // FUN — 13 tasks
  { stat: 'Fun', name: 'Play a video game', description: 'Spend some time playing something you enjoy.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Watch an episode of a show', description: 'Enjoy an episode without multitasking.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Watch a movie', description: 'Set aside time to enjoy a film.', xp: 25, minLevel: 2 },
  { stat: 'Fun', name: 'Listen to a favorite song', description: 'Enjoy a song you already love.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Read for pleasure', description: 'Read something purely because you enjoy it.', xp: 20, minLevel: 1 },
  { stat: 'Fun', name: 'Play a puzzle game', description: 'Enjoy a puzzle, strategy game, or brain teaser.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Enjoy a favorite comfort activity', description: 'Make time for something familiar that makes you happy.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Explore a game you have never played', description: 'Try something new without needing to finish it.', xp: 25, minLevel: 2 },
  { stat: 'Fun', name: 'Watch something purely entertaining', description: 'Enjoy something without needing it to be educational or productive.', xp: 15, minLevel: 1 },
  { stat: 'Fun', name: 'Spend time on a hobby', description: 'Enjoy a hobby with no particular goal or outcome.', xp: 20, minLevel: 1 },
  { stat: 'Fun', name: 'Have an intentionally lazy hour', description: 'Give yourself an hour with no expectations.', xp: 20, minLevel: 1 },
  { stat: 'Fun', name: 'Discover something fun to look forward to', description: 'Find an activity, game, film, or experience you are excited about.', xp: 15, minLevel: 1 }
];

async function seedTasks() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from your environment.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const stats = await Stat.find({}).lean();

  if (!stats.length) {
    console.log('No stats found. Nothing to seed.');
    return;
  }

  
const operations: any[] = [];
const missingStats = new Set<string>();

// Process each user's stats independently.
for (const stat of stats) {
  const matchingTasks = library.filter(
    task => task.stat.toLowerCase() === stat.name.trim().toLowerCase()
  );

  for (const task of matchingTasks) {
    operations.push({
      updateOne: {
        filter: {
          userId: stat.userId,
          statId: stat._id,
          name: task.name
        },
        update: {
          $setOnInsert: {
            userId: stat.userId,
            statId: stat._id,
            name: task.name,
            description: task.description,
            xp: task.xp,
            minLevel: task.minLevel,
            active: true
          }
        },
        upsert: true
      }
    });
  }
}

const foundStatNames = new Set(
  stats.map(stat => stat.name.trim().toLowerCase())
);

for (const task of library) {
  if (!foundStatNames.has(task.stat.toLowerCase())) {
    missingStats.add(task.stat);
  }
}


  if (operations.length) {
    const result = await Task.bulkWrite(operations, { ordered: false });

    console.log(`Task library processed: ${operations.length} entries.`);
    console.log(`New tasks inserted: ${result.upsertedCount}.`);
    console.log(`Existing tasks left unchanged: ${operations.length - result.upsertedCount}.`);
  }

  if (missingStats.size) {
    console.warn('Stats not found:', [...missingStats].join(', '));
  }
}

seedTasks()
  .catch(error => {
    console.error('Task seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
