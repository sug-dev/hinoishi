
import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { Stat } from '../models/Stat.js';
import { Task } from '../models/Task.js';
import { DailyAssignment } from '../models/DailyAssignment.js';
import { Quest } from '../models/Quest.js';
import {
  levelForXp,
  progressionForXp,
  unlockMilestones,
  STAT_MILESTONES
} from '../utils/progression.js';

const r = Router();
r.use(auth);

const id = z.string().refine(
  v => /^[a-f\d]{24}$/i.test(v),
  'Invalid id'
);

const taskInput = z.object({
  statId: id,
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  xp: z.number().int().min(0).max(1000).default(10),
  minLevel: z.number().int().min(1).max(100).default(1),
  active: z.boolean().default(true)
});


const questInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  statId: id.optional(),
  xp: z.number().int().min(0).max(1000).default(10),
  active: z.boolean().default(false),
  repeatable: z.boolean().default(false)
});


const uid = (req: any) => req.userId;

// Stats and progression

r.get('/stats', async (req, res) => {
  const stats = await Stat.find({
    userId: uid(req)
  }).sort({ name: 1 });

  await Promise.all(stats.map(async stat => {
    const level = levelForXp(stat.xp);

    if (stat.level !== level) {
      stat.level = level;
    }

    const milestonesChanged = unlockMilestones(stat);

    if (stat.isModified() || milestonesChanged) {
      await stat.save();
    }
  }));

  res.json(stats.map(stat => ({
    ...stat.toObject(),
    ...progressionForXp(stat.xp),
    milestones: STAT_MILESTONES
  })));
});


// Task library
r.get('/tasks', async (req, res) => {
  res.json(
    await Task.find({ userId: uid(req) }).sort({ createdAt: -1 })
  );
});

r.post('/tasks', async (req, res) => {
  try {
    const data = taskInput.parse(req.body);

    if (!await Stat.exists({
      _id: data.statId,
      userId: uid(req)
    })) {
      return res.status(404).json({ error: 'Stat not found' });
    }

    res.status(201).json(
      await Task.create({ ...data, userId: uid(req) })
    );
  } catch {
    res.status(400).json({ error: 'Invalid task' });
  }
});

r.patch('/tasks/:id', async (req, res) => {
  try {
    const data = taskInput.partial().parse(req.body);

    if (
      data.statId &&
      !await Stat.exists({
        _id: data.statId,
        userId: uid(req)
      })
    ) {
      return res.status(404).json({ error: 'Stat not found' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: uid(req) },
      data,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch {
    res.status(400).json({ error: 'Invalid task' });
  }
});

r.delete('/tasks/:id', async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    userId: uid(req)
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const hasHistory = await DailyAssignment.exists({
    userId: uid(req),
    taskId: task._id
  });

  if (hasHistory) {
    return res.status(409).json({
      error: 'This task has assignment history. Archive it instead.'
    });
  }

  await task.deleteOne();
  res.status(204).send();
});


// Generate one pending assignment for each stat with an eligible task.
r.post('/assignments/generate', async (req, res) => {
  try {
    const { date } = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }).parse(req.body);

    const stats = await Stat.find({ userId: uid(req) });

    for (const stat of stats) {
      // Never overwrite an existing daily assignment.
      if (await DailyAssignment.exists({
        userId: uid(req),
        date,
        statId: stat._id
      })) continue;

      const eligible = await Task.find({
        userId: uid(req),
        statId: stat._id,
        active: true,
        minLevel: { $lte: stat.level }
      });

      if (!eligible.length) continue;

      const selected = eligible[
        Math.floor(Math.random() * eligible.length)
      ];

      try {
        await DailyAssignment.create({
          userId: uid(req),
          statId: stat._id,
          taskId: selected._id,
          date,
          status: 'pending',
          xpEarned: 0
        });
      } catch (error: any) {
        // Another request may have generated this assignment.
        if (error?.code !== 11000) throw error;
      }
    }

    const assignments = await DailyAssignment.find({
      userId: uid(req),
      date
    }).populate('statId taskId');

    res.json({ assignments });
  } catch {
    res.status(400).json({
      error: 'Could not generate daily assignments'
    });
  }
});

// Reroll a pending assignment.
r.post('/assignments/:id/reroll', async (req, res) => {
  const assignment = await DailyAssignment.findOne({
    _id: req.params.id,
    userId: uid(req)
  });

  if (!assignment) {
    return res.status(404).json({
      error: 'Assignment not found'
    });
  }

  if (assignment.status !== 'pending') {
    return res.status(409).json({
      error: 'Only pending assignments can be rerolled'
    });
  }

  const stat = await Stat.findOne({
    _id: assignment.statId,
    userId: uid(req)
  });

  if (!stat) {
    return res.status(404).json({ error: 'Stat not found' });
  }

  const alternatives = await Task.find({
    userId: uid(req),
    statId: assignment.statId,
    active: true,
    minLevel: { $lte: stat.level },
    _id: { $ne: assignment.taskId }
  });

  if (!alternatives.length) {
    return res.status(409).json({
      error: 'No other eligible tasks to choose from'
    });
  }

  const selected = alternatives[
    Math.floor(Math.random() * alternatives.length)
  ];

  assignment.taskId = selected._id;

  await assignment.save();
  await assignment.populate('statId taskId');

  res.json(assignment);
});


// Daily assignments
r.get('/assignments/:date', async (req, res) => {
  res.json(
    await DailyAssignment.find({
      userId: uid(req),
      date: req.params.date
    }).populate('statId taskId')
  );
});

r.post('/assignments', async (req, res) => {
  try {
    const body = z.object({
      statId: id,
      taskId: id,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }).parse(req.body);

    const task = await Task.findOne({
      _id: body.taskId,
      userId: uid(req),
      statId: body.statId,
      active: true
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let assignment = await DailyAssignment.findOne({
      userId: uid(req),
      date: body.date,
      statId: body.statId
    });

    if (assignment) {
      // Selecting the same task must not reset its completion.
      if (String(assignment.taskId) === String(task._id)) {
        return res.json(assignment);
      }

      // Remove the previous XP award before replacing the task.
      if ((assignment.xpEarned || 0) > 0) {
        const stat = await Stat.findOneAndUpdate(
          {
            _id: assignment.statId,
            userId: uid(req)
          },
          { $inc: { xp: -(assignment.xpEarned || 0) } },
          { new: true }
        );

        if (stat) {
          stat.xp = Math.max(0, stat.xp);
          stat.level = levelForXp(stat.xp);
          await stat.save();
        }
      }

      assignment.taskId = task._id;
      assignment.status = 'pending';
      assignment.xpEarned = 0;
      assignment.completedAt = undefined;

      await assignment.save();
    } else {
      assignment = await DailyAssignment.create({
        ...body,
        userId: uid(req),
        status: 'pending',
        xpEarned: 0
      });
    }

    res.json(assignment);
  } catch {
    res.status(400).json({ error: 'Invalid assignment' });
  }
});

r.patch('/assignments/:id/status', async (req, res) => {
  try {
    const status = z.enum([
      'success',
      'fail',
      'rest',
      'pending'
    ]).parse(req.body.status);

    const assignment = await DailyAssignment.findOne({
      _id: req.params.id,
      userId: uid(req)
    });

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    const task = await Task.findOne({
      _id: assignment.taskId,
      userId: uid(req)
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Use the XP recorded on the assignment, not the task's
    // current reward. This preserves historical XP if a task
    // is edited later.
    const previousEarned = assignment.xpEarned || 0;

    const nextEarned = status === 'success'
      ? (
          assignment.status === 'success'
            ? previousEarned
            : task.xp
        )
      : 0;

    const xpDelta = nextEarned - previousEarned;

    assignment.status = status;
    assignment.xpEarned = nextEarned;
    assignment.completedAt = status === 'pending'
      ? undefined
      : new Date();

    await assignment.save();

    if (xpDelta !== 0) {
      const stat = await Stat.findOneAndUpdate(
        {
          _id: assignment.statId,
          userId: uid(req)
        },
        { $inc: { xp: xpDelta } },
        { new: true }
      );

      if (stat) {
        stat.xp = Math.max(0, stat.xp);
        stat.level = levelForXp(stat.xp);

        unlockMilestones(stat);

        await stat.save();
      }
    }

    res.json(assignment);
  } catch {
    res.status(400).json({ error: 'Invalid status' });
  }
});

// Quests
r.get('/quests', async (req, res) =>
  res.json(
    await Quest.find({ userId: uid(req) })
      .populate('statId')
      .sort({ createdAt: -1 })
  )
);

r.post('/quests', async (req, res) => {
  try {
    const data = questInput.parse(req.body);
    res.status(201).json(
      await Quest.create({ ...data, userId: uid(req) })
    );
  } catch {
    res.status(400).json({ error: 'Invalid quest' });
  }
});

// Complete or reopen a quest.

r.patch('/quests/:id/status', async (req, res) => {
  try {
    const { completed } = z.object({
      completed: z.boolean()
    }).parse(req.body);

    const q = await Quest.findOne({
      _id: req.params.id,
      userId: uid(req)
    });

    if (!q) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Repeatable quests: every completion earns XP independently.
    if (q.repeatable) {
      if (completed) {
        if (!q.statId) {
          return res.status(400).json({
            error: 'Assign this quest to a stat before completing it'
          });
        }

        const stat = await Stat.findOne({
          _id: q.statId,
          userId: uid(req)
        });

        if (!stat) {
          return res.status(404).json({ error: 'Stat not found' });
        }

        // Record this individual completion.
        q.completionHistory.push({
          completedAt: new Date(),
          xpEarned: q.xp,
          awardedStatId: stat._id
        });

        await q.save();

        stat.xp += q.xp;
        stat.level = levelForXp(stat.xp);
        unlockMilestones(stat);
        await stat.save();

      } else {
        // Undo only the most recent completion.
        const lastCompletion = q.completionHistory[
          q.completionHistory.length - 1
        ];

        if (!lastCompletion) {
          return res.json(q);
        }

        const stat = await Stat.findOne({
          _id: lastCompletion.awardedStatId,
          userId: uid(req)
        });

        if (stat) {
          stat.xp = Math.max(
            0,
            stat.xp - lastCompletion.xpEarned
          );
          stat.level = levelForXp(stat.xp);
          await stat.save();
        }

        q.completionHistory.pop();
        await q.save();
      }

      await q.populate('statId');
      return res.json(q);
    }

    // Non-repeatable quests: retain the original behavior.
    const wasCompleted = !!q.completedAt;

    if (wasCompleted === completed) {
      return res.json(q);
    }

    if (completed) {
      if (!q.statId) {
        return res.status(400).json({
          error: 'Assign this quest to a stat before completing it'
        });
      }

      const stat = await Stat.findOne({
        _id: q.statId,
        userId: uid(req)
      });

      if (!stat) {
        return res.status(404).json({ error: 'Stat not found' });
      }

      q.completedAt = new Date();
      q.xpEarned = q.xp;
      q.awardedStatId = stat._id;
      await q.save();

      stat.xp += q.xpEarned;
      stat.level = levelForXp(stat.xp);
      unlockMilestones(stat);
      await stat.save();

    } else {
      const awarded = q.xpEarned || 0;

      const stat = q.awardedStatId
        ? await Stat.findOne({
            _id: q.awardedStatId,
            userId: uid(req)
          })
        : null;

      if (stat) {
        stat.xp = Math.max(0, stat.xp - awarded);
        stat.level = levelForXp(stat.xp);
        await stat.save();
      }

      q.completedAt = undefined;
      q.xpEarned = 0;
      q.awardedStatId = undefined;
      await q.save();
    }

    await q.populate('statId');
    res.json(q);

  } catch {
    res.status(400).json({ error: 'Invalid quest status' });
  }
});



r.patch('/quests/:id', async (req, res) => {
  try {
    const data = questInput.partial().parse(req.body);

    const q = await Quest.findOne({
      _id: req.params.id,
      userId: uid(req)
    });

    if (!q) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const hasCompletions =
      !!q.completedAt ||
      (q.completionHistory?.length ?? 0) > 0;

    if (
      data.repeatable !== undefined &&
      data.repeatable !== q.repeatable &&
      hasCompletions
    ) {
      return res.status(400).json({
        error: 'Repeatability cannot be changed after a quest has been completed'
      });
    }

    Object.assign(q, data);
    await q.save();

    res.json(q);
  } catch {
    res.status(400).json({ error: 'Invalid quest' });
  }
});


r.patch('/quests/:id/active', async (req, res) => {
  try {
    const { active } = z.object({
      active: z.boolean()
    }).parse(req.body);

    const q = await Quest.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: uid(req)
      },
      { active },
      { new: true }
    ).populate('statId');

    if (!q) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json(q);
  } catch {
    res.status(400).json({ error: 'Invalid activation status' });
  }
});


r.delete('/quests/:id', async (req, res) => {
  const q = await Quest.findOne({
    _id: req.params.id,
    userId: uid(req)
  });

  if (!q) {
    return res.status(404).json({ error: 'Quest not found' });
  }

  await q.deleteOne();

  res.status(204).send();
});


// History

r.get('/history/:statId', async (req, res) => {
  const statId = req.params.statId;
  const userId = uid(req);

  const statExists = await Stat.exists({
    _id: statId,
    userId
  });

  if (!statExists) {
    return res.status(404).json({ error: 'Stat not found' });
  }

  const [assignments, quests] = await Promise.all([
    DailyAssignment.find({
      userId,
      statId
    })
      .populate('taskId', 'name')
      .sort({ date: 1 }),

    Quest.find({
      userId,
      $or: [
        {
          awardedStatId: statId,
          completedAt: { $exists: true }
        },
        {
          'completionHistory.awardedStatId': statId
        }
      ]
    })
      .select(
        'name description completedAt xpEarned awardedStatId completionHistory'
      )
  ]);

  // Keep legacy, non-repeatable quest history entries.
  const legacyQuestHistory = quests
    .filter(q => q.completedAt && String(q.awardedStatId) === String(statId))
    .map(q => ({
      _id: q._id,
      name: q.name,
      description: q.description,
      completedAt: q.completedAt,
      xpEarned: q.xpEarned
    }));

  // Add one history entry for each repeatable quest completion.
  const repeatableQuestHistory = quests.flatMap(q =>
    q.completionHistory
      .filter(entry => String(entry.awardedStatId) === String(statId))
      .map(entry => ({
        _id: entry._id,
        questId: q._id,
        name: q.name,
        description: q.description,
        completedAt: entry.completedAt,
        xpEarned: entry.xpEarned
      }))
  );

  
const questHistory = [
  ...legacyQuestHistory,
  ...repeatableQuestHistory
]
  .filter(
    q => q.completedAt != null
  )
  .sort(
    (a, b) =>
      new Date(a.completedAt!).getTime() -
      new Date(b.completedAt!).getTime()
  );


  res.json({
    assignments,
    quests: questHistory
  });
});


export default r;
