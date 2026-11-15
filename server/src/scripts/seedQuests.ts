
import 'dotenv/config';
import mongoose from 'mongoose';
import { Stat } from '../models/Stat.js';
import { Quest } from '../models/Quest.js';

type QuestSeed = {
  stat: string;
  name: string;
  description: string;
  xp: number;
  repeatable?: boolean;
};

const library: QuestSeed[] = [
  // INTELLIGENCE — 9 quests
  {
    stat: 'Intelligence',
    name: 'Complete a university class',
    description: 'Finish an important section, module, or assessment in your degree.',
    xp: 500,
    repeatable: true,
  },
  {
    stat: 'Intelligence',
    name: 'Build an N5 vocabulary foundation',
    description: 'Learn and review a collection of approximately 100 beginner Japanese vocabulary words.',
    xp: 150
  },
  {
    stat: 'Intelligence',
    name: 'Build an N5 grammar foundation',
    description: 'Study and practice 10 beginner Japanese grammar patterns.',
    xp: 150
  },
  {
    stat: 'Intelligence',
    name: 'Read a beginner Japanese book',
    description: 'Work through a beginner-friendly Japanese reader, using furigana and a dictionary as needed.',
    xp: 200
  },
  {
    stat: 'Intelligence',
    name: 'Complete a programming project',
    description: 'Bring a personal programming project to a usable, finished state.',
    xp: 250,
    repeatable: true,
  },
  {
    stat: 'Intelligence',
    name: 'Learn a new technical skill',
    description: 'Study a new programming language, framework, tool, or technical concept and put it into practice.',
    xp: 175,
    repeatable: true,
  },

  // CREATIVITY — 2 quests
  {
    stat: 'Creativity',
    name: 'Develop a fictional world',
    description: 'Explore the setting, characters, history, and underlying ideas of an original fictional world.',
    xp: 175
  },
  {
    stat: 'Creativity',
    name: 'Explore a complete creative concept',
    description: 'Spend several creative sessions developing an idea, without requiring a polished finished product.',
    xp: 125
  },

  // PHYSICAL — 3 quests
  {
    stat: 'Physical',
    name: 'Establish a regular walking habit',
    description: 'Complete 10 walks over time, at a pace and distance that feel comfortable.',
    xp: 150
  },
  {
    stat: 'Physical',
    name: 'Explore a consistent movement routine',
    description: 'Find a collection of exercises or movements you enjoy and complete several sessions.',
    xp: 175
  },
  {
    stat: 'Physical',
    name: 'Discover an enjoyable physical activity',
    description: 'Try several different activities and identify one you would genuinely enjoy returning to.',
    xp: 150
  },

  // HEALTH — 3 quests
  {
    stat: 'Health',
    name: 'Establish a sustainable self-care routine',
    description: 'Develop a manageable collection of everyday habits that support your well-being.',
    xp: 150
  },
  {
    stat: 'Health',
    name: 'Improve your meal preparation routine',
    description: 'Find several meals you enjoy and establish a practical way to prepare them regularly.',
    xp: 175
  },
  {
    stat: 'Health',
    name: 'Establish a consistent sleep routine',
    description: 'Experiment with a realistic evening routine and practice following it consistently.',
    xp: 150
  },

  // EXPLORATION — 4 quests
  {
    stat: 'Exploration',
    name: 'Explore Tokyo neighborhoods',
    description: 'Research several Tokyo neighborhoods, their atmosphere, transportation, and everyday amenities.',
    xp: 175
  },
  {
    stat: 'Exploration',
    name: 'Explore Yokohama',
    description: 'Learn about Yokohama neighborhoods, lifestyle, transportation, and places of interest.',
    xp: 175
  },
  {
    stat: 'Exploration',
    name: 'Develop a practical understanding of life in Japan',
    description: 'Explore everyday topics such as housing, transportation, shopping, and local customs.',
    xp: 200
  },
  {
    stat: 'Exploration',
    name: 'Explore Japanese culture in depth',
    description: 'Choose a cultural subject and explore it through books, documentaries, articles, or other resources.',
    xp: 150
  },

  // ENVIRONMENT — 3 quests
  {
    stat: 'Environment',
    name: 'Complete a personal belongings inventory',
    description: 'Organize and account for your belongings so you know what you own and where it is.',
    xp: 175
  },
  {
    stat: 'Environment',
    name: 'Simplify your living space',
    description: 'Review your possessions, remove unnecessary clutter, and create a more intentional living environment.',
    xp: 200
  },
  {
    stat: 'Environment',
    name: 'Establish an organized digital workspace',
    description: 'Organize important files, projects, documents, and digital resources.',
    xp: 150
  },

  // CONNECTION — 2 quests
  {
    stat: 'Connection',
    name: 'Strengthen an important relationship',
    description: 'Invest time and attention in someone whose presence matters in your life.',
    xp: 150
  },
  {
    stat: 'Connection',
    name: 'Expand your social world',
    description: 'Explore opportunities to meet people or connect with others who share your interests.',
    xp: 175
  },

  // MIND — 2 quests
  {
    stat: 'Mind',
    name: 'Develop a sustainable meditation practice',
    description: 'Explore different approaches to meditation and establish a practice that feels natural.',
    xp: 150
  },
  {
    stat: 'Mind',
    name: 'Develop a personal philosophy journal',
    description: 'Spend time recording and exploring your thoughts about life, meaning, acceptance, and personal values.',
    xp: 175
  },

  // FUN — 2 quests
  {
    stat: 'Fun',
    name: 'Explore a new gaming experience',
    description: 'Discover and spend time with a game outside your usual rotation.',
    xp: 125,
    repeatable: true,
  },
  {
    stat: 'Fun',
    name: 'Rediscover an old interest',
    description: 'Return to a hobby, activity, or interest you enjoyed in the past.',
    xp: 125
  }
];

async function seedQuests() {
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

  for (const stat of stats) {
    const matchingQuests = library.filter(
      quest => quest.stat.toLowerCase() === stat.name.trim().toLowerCase()
    );

    for (const quest of matchingQuests) {
      operations.push({
        updateOne: {
          filter: {
            userId: stat.userId,
            statId: stat._id,
            name: quest.name
          },
          update: {
            $setOnInsert: {
                userId: stat.userId,
                statId: stat._id,
                name: quest.name,
                description: quest.description,
                xp: quest.xp,
                repeatable: quest.repeatable ?? false,
                active: false
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

  for (const quest of library) {
    if (!foundStatNames.has(quest.stat.toLowerCase())) {
      missingStats.add(quest.stat);
    }
  }

  if (operations.length) {
    const result = await Quest.bulkWrite(operations, {
      ordered: false
    });

    console.log(`Quest library processed: ${operations.length} entries.`);
    console.log(`New quests inserted: ${result.upsertedCount}.`);
    console.log(
      `Existing quests left unchanged: ${operations.length - result.upsertedCount}.`
    );
  }

  if (missingStats.size) {
    console.warn('Stats not found:', [...missingStats].join(', '));
  }
}

seedQuests()
  .catch(error => {
    console.error('Quest seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
