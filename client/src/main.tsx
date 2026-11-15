import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route,Navigate,useNavigate}from'react-router-dom';import'./styles.css';
const API=import.meta.env.VITE_API_URL||'http://localhost:4000/api';
async function api(path:string,opts:RequestInit={}){const token=localStorage.getItem('token');const res=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}});if(res.status===401){localStorage.removeItem('token');location.href='/login';throw new Error('Unauthorized')}if(!res.ok)throw new Error((await res.json()).error||'Request failed');return res.status===204?null:res.json()}
function Protected({children}:{children:React.ReactNode}){return localStorage.getItem('token')?<>{children}</>:<Navigate to="/login" replace/>}
function Layout({children}:{children:React.ReactNode}){const nav=useNavigate();return <div className="app"><header><b>Will of Fire</b><nav><button onClick={()=>nav('/')}>Today</button><button onClick={()=>nav('/tasks')}>Tasks</button><button onClick={()=>nav('/quests')}>Quests</button><button onClick={()=>nav('/history')}>History</button><button onClick={()=>{localStorage.removeItem('token');nav('/login')}}>Log out</button></nav></header><main>{children}</main></div>}
function Login(){const nav=useNavigate();const[register,setRegister]=useState(false);const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[err,setErr]=useState('');async function submit(e:React.FormEvent){e.preventDefault();try{const d=await api(`/auth/${register?'register':'login'}`,{method:'POST',body:JSON.stringify({email,password:pw})});localStorage.setItem('token',d.token);nav('/')}catch(e){setErr((e as Error).message)}}return <div className="auth"><form onSubmit={submit}><h1>The Will of Fire</h1><p>Protect your Nindo by taking care of your life.</p>{err&&<div className="error">{err}</div>}<input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password (8+ characters)" value={pw} onChange={e=>setPw(e.target.value)} required minLength={8}/><button className="primary">{register?'Create account':'Log in'}</button><button type="button" className="link" onClick={()=>setRegister(!register)}>{register?'Already have an account? Log in':'Need an account? Register'}</button></form></div>}

function findNewAchievements(before: any[], after: any[]) {
  const newlyUnlocked: any[] = [];

  for (const stat of after) {
    const previousStat = before.find(
      s => s._id === stat._id
    );

    const previousIds = new Set(
      (previousStat?.unlockedMilestones || []).map(
        (m: any) => m.id
      )
    );

    for (const milestone of stat.unlockedMilestones || []) {
      if (!previousIds.has(milestone.id)) {
        const definition = (stat.milestones || []).find(
          (m: any) => m.id === milestone.id
        );

        newlyUnlocked.push({
          id: `${stat._id}-${milestone.id}`,
          title: definition?.title || milestone.id,
          level: definition?.level,
          statName: stat.name,
          statIcon: stat.icon
        });
      }
    }
  }

  return newlyUnlocked;
}

function AchievementToast({
  achievements,
  onDismiss
}: {
  achievements: any[];
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!achievements.length) return;

    const timer = window.setTimeout(onDismiss, 7000);

    return () => window.clearTimeout(timer);
  }, [achievements, onDismiss]);

  if (!achievements.length) return null;

  return (
    <div className="achievement-toast-container">
      {achievements.map(a => (
        <div className="achievement-toast" key={a.id}>
          <div className="achievement-toast-icon">🏆</div>

          <div className="achievement-toast-info">
            <span className="achievement-toast-eyebrow">
              Achievement unlocked!
            </span>

            <strong>{a.title}</strong>

            <small>
              {a.statIcon} {a.statName} · Level {a.level}
            </small>
          </div>

          <button
            className="achievement-toast-close"
            onClick={onDismiss}
            aria-label="Dismiss achievement notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function localDate() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function localDateFromTimestamp(value: string) {
  const d = new Date(value);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function Dashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [assign, setAssign] = useState<any[]>([]);
  const [date] = useState(localDate);
  const [modal, setModal] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
const [activeQuests, setActiveQuests] = useState<any[]>([]);
const [achievementNotices, setAchievementNotices] = useState<any[]>([]);

  async function load() {
  setError('');

  const s = await api('/stats');
  setStats(s);

  await api('/assignments/generate', {
    method: 'POST',
    body: JSON.stringify({ date })
  });

  const todayAssignments = await api('/assignments/' + date);
  setAssign(todayAssignments);

  const [histories, quests] = await Promise.all([
    Promise.all(
      s.map((stat: any) => api('/history/' + stat._id))
    ),
    api('/quests')
  ]);

  setWeeklyData(
    s.map((stat: any, index: number) => ({
      stat,
      assignments: histories[index].assignments || [],
      quests: histories[index].quests || []
    }))
  );

  setActiveQuests(
    quests.filter((q: any) => !q.completedAt && q.active !== false)
  );
}

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, []);

  const completed = assign.filter(
    a => a.status === 'success'
  ).length;

  const skipped = assign.filter(
  a => a.status === 'fail'
).length;

const resting = assign.filter(
  a => a.status === 'rest'
).length;

const pending = assign.filter(
  a => a.status === 'pending'
).length;

// Calculate the seven-day period using local calendar dates.
function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12);

  d.setDate(d.getDate() + amount);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

const weekStart = shiftDate(date, -6);

const weeklyStats = weeklyData.map(item => {
  const assignments = item.assignments.filter(
    (a: any) => a.date >= weekStart && a.date <= date
  );

  const quests = item.quests.filter((q: any) => {
    const questDate = q.completedAt
      ? localDateFromTimestamp(q.completedAt)
      : '';

    return questDate >= weekStart && questDate <= date;
  });

  const successful = assignments.filter(
    (a: any) => a.status === 'success'
  );

  const taskXp = successful.reduce(
    (sum: number, a: any) => sum + (a.xpEarned || 0),
    0
  );

  const questXp = quests.reduce(
    (sum: number, q: any) => sum + (q.xpEarned || 0),
    0
  );

  return {
    stat: item.stat,
    completed: successful.length,
    xp: taskXp + questXp
  };
});

const weeklyCompleted = weeklyStats.reduce(
  (sum, s) => sum + s.completed,
  0
);

const weeklyXp = weeklyStats.reduce(
  (sum, s) => sum + s.xp,
  0
);

const totalMilestones = stats.length * 6;

const unlockedMilestones = stats.reduce(
  (sum, stat) => sum + (stat.unlockedMilestones?.length || 0),
  0
);

  async function status(id: string, s: string) {
  setBusy(id);
  setError('');

  try {
    const before = s === 'success'
      ? await api('/stats')
      : [];

    await api('/assignments/' + id + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: s })
    });

    if (s === 'success') {
      const after = await api('/stats');

      setAchievementNotices(
        findNewAchievements(before, after)
      );
    }

    await load();
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setBusy(null);
  }
}

  async function reroll(id: string) {
    setBusy(id);
    setError('');
    setMessage('');

    try {
      await api('/assignments/' + id + '/reroll', {
        method: 'POST'
      });

      setMessage('New task selected.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function choose(stat: any, taskId: string) {
    setError('');

    try {
      await api('/assignments', {
        method: 'POST',
        body: JSON.stringify({
          statId: stat._id,
          taskId,
          date
        })
      });

      setModal(null);
      setMessage('Task assigned.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Layout>
        <AchievementToast
        achievements={achievementNotices}
        onDismiss={() => setAchievementNotices([])}
        />
      <section className="hero">
        <div>
          <span className="eyebrow">{date}</span>
          <h1>Today's Quest Sheet</h1>
          <p>One small task for each stat.</p>
        </div>

        <div className="progress">
          <div style={{
            width: `${stats.length ? completed / stats.length * 100 : 0}%`
          }} />
        </div>

        <span>{completed} / {stats.length} complete</span>
      </section>

      {error && <div className="error dashboard-message">{error}</div>}
      {message && <div className="notice dashboard-message">{message}</div>}

      {/* MAIN TASK CARDS */}
      <div className="grid" id="tasks">
        {stats.map(s => {
          const a = assign.find(
            x => x.statId?._id === s._id || x.statId === s._id
          );

          return (
            <article className="card" key={s._id}>
              <div className="stat-head">
                <span className="icon">{s.icon}</span>

                <div>
                  <h2>{s.name}</h2>
                  <small>Lv. {s.level} · {s.xp} total XP</small>

                  <div className="stat-xp">
                    <div className="stat-xp-track">
                      <span style={{ width: `${s.progress || 0}%` }} />
                    </div>

                    <small>
                      {s.level >= 100
                        ? 'Maximum level'
                        : `${s.xpIntoLevel || 0} / ${s.xpToNextLevel || 100} XP to next level`}
                    </small>
                  </div>
                </div>
              </div>

              {a ? (
                <>
                  <div className="task">
                    {a.taskId?.name}
                    <small className="task-reward">
                      +{a.taskId?.xp ?? 0} XP
                    </small>
                  </div>

                  {a.status === 'pending' ? (
                    <div className="actions">
                      <button
                        className="complete"
                        disabled={busy === a._id}
                        onClick={() => status(a._id, 'success')}
                      >
                        ✓ Complete
                      </button>

                      <button
                        className="skip"
                        disabled={busy === a._id}
                        onClick={() => status(a._id, 'fail')}
                      >
                        × Skip
                      </button>

                      <button
                        disabled={busy === a._id}
                        onClick={() => reroll(a._id)}
                      >
                        ↻ Reroll
                      </button>
                    </div>
                  ) : (
                    <div className={`assignment-status ${a.status}`}>
                      {a.status === 'success'
                        ? '✓ Completed'
                        : a.status === 'fail'
                          ? 'Skipped'
                          : 'Rest day'}
                    </div>
                  )}
                </>
              ) : (
                <div className="unavailable">
                  <p>No eligible task available yet.</p>
                  <button onClick={() => setModal(s)}>
                    Choose a task
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Today's overview */}
{/* <section className="overview-section">
  <div className="section-heading">
    <h2>Today's Progress</h2>
    <span className="muted">{date}</span>
  </div>

  <div className="overview-cards">
    <div className="overview-card">
      <strong>{completed}</strong>
      <span>Completed</span>
    </div>

    <div className="overview-card">
      <strong>{pending}</strong>
      <span>Remaining</span>
    </div>

    <div className="overview-card">
      <strong>{skipped}</strong>
      <span>Skipped</span>
    </div>

    <div className="overview-card">
      <strong>{resting}</strong>
      <span>Resting</span>
    </div>
  </div>
</section> */}

{/* Weekly overview */}
{/* <section className="overview-section">
  <div className="section-heading">
    <h2>Last 7 Days</h2>
    <span className="muted">
      {weekStart} – {date}
    </span>
  </div>

  <div className="weekly-summary">
    <div>
      <strong>{weeklyCompleted}</strong>
      <span>Tasks completed</span>
    </div>

    <div>
      <strong>{weeklyXp}</strong>
      <span>XP earned</span>
    </div>
  </div>

  <h3>Progress by stat</h3>

  <div className="weekly-stat-list">
    {weeklyStats.map(item => (
      <div className="weekly-stat" key={item.stat._id}>
        <span className="weekly-stat-icon">
          {item.stat.icon}
        </span>

        <div className="weekly-stat-info">
          <strong>{item.stat.name}</strong>
          <small>
            {item.completed} tasks completed
          </small>
        </div>

        <span className="weekly-stat-xp">
          +{item.xp} XP
        </span>
      </div>
    ))}
  </div>
</section> */}



{/* Active quests */}
<section className="overview-section">
  <div className="section-heading">
    <h2>Active Quests</h2>
    <span className="muted">
      {activeQuests.length} in progress
    </span>
  </div>

  {activeQuests.length === 0 ? (
    <p className="muted">
      No active quests. You can create one on the Quests page.
    </p>
  ) : (
    <div className="active-quest-list">
      {activeQuests.map(q => (
        <div className="active-quest" key={q._id}>
          <div>
            <strong>{q.name}</strong>

            {q.description && (
              <small>{q.description}</small>
            )}
          </div>

          <span>+{q.xp} XP</span>
        </div>
      ))}
    </div>
  )}
</section>

{/* <section className="achievements-section">
  <div className="achievements-heading">
    <div>
      <h2>Achievements</h2>
      <p className="muted">
        Milestones earned through developing your stats.
      </p>
    </div>

    <div className="achievement-count">
      {unlockedMilestones} / {totalMilestones}
    </div>
  </div>

  <div className="achievement-progress-track">
    <span
      style={{
        width: `${
          totalMilestones
            ? unlockedMilestones / totalMilestones * 100
            : 0
        }%`
      }}
    />
  </div>

  {stats.map(stat => {
    const milestones = stat.milestones || [];
    const unlocked = stat.unlockedMilestones || [];

    return (
      <div className="achievement-stat" key={stat._id}>
        <h3>
          {stat.icon} {stat.name}
          <small>Level {stat.level}</small>
        </h3>

        <div className="achievement-grid">
          {milestones.map((milestone: any) => {
            const earned = unlocked.find(
              (m: any) => m.id === milestone.id
            );

            return (
              <div
                className={`achievement ${
                  earned ? 'unlocked' : 'locked'
                }`}
                key={milestone.id}
              >
                <div className="achievement-icon">
                  {earned ? '🏆' : '🔒'}
                </div>

                <div className="achievement-info">
                  <strong>{milestone.title}</strong>

                  <small>
                    {earned
                      ? `Unlocked ${new Date(
                          earned.unlockedAt
                        ).toLocaleDateString()}`
                      : `Reach Level ${milestone.level}`}
                  </small>
                </div>

                {earned && (
                  <span className="achievement-check">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</section> */}

      {modal && (
        <TaskPicker
          stat={modal}
          onClose={() => setModal(null)}
          onChoose={choose}
        />
      )}
    </Layout>
  );
}
function TaskPicker({stat,onClose,onChoose}:{stat:any,onClose:()=>void,onChoose:(s:any,t:string)=>void}){const[tasks,setTasks]=useState<any[]>([]);useEffect(()=>{api('/tasks').then(d=>setTasks(d.filter((t:any)=>t.statId===stat._id&&t.active&&t.minLevel<=stat.level)))},[stat]);return <div className="overlay"><div className="modal"><button className="close" onClick={onClose}>×</button><h2>{stat.icon} {stat.name}</h2><p>Choose today's task.</p>{tasks.map(t=><button className="choice" key={t._id} onClick={()=>onChoose(stat,t._id)}>{t.name}<span>+{t.xp} XP</span></button>)}{!tasks.length&&<p>No tasks unlocked yet. Add one on the Tasks page.</p>}</div></div>}
function Tasks(){
  const[stats,setStats]=useState<any[]>([]);
  const[tasks,setTasks]=useState<any[]>([]);
  const[editing,setEditing]=useState<string|null>(null);
  const[name,setName]=useState('');
  const[description,setDescription]=useState('');
  const[statId,setStatId]=useState('');
  const[xp,setXp]=useState(10);
  const[minLevel,setMinLevel]=useState(1);
  const[active,setActive]=useState(true);
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  async function load(){const [s,t]=await Promise.all([api('/stats'),api('/tasks')]);setStats(s);setTasks(t);if(!statId&&s.length)setStatId(s[0]._id)}
  useEffect(()=>{load().catch(e=>setError(e.message))},[]);
  function reset(){setEditing(null);setName('');setDescription('');setXp(10);setMinLevel(1);setActive(true);setError('')}
  function edit(t:any){setEditing(t._id);setName(t.name);setDescription(t.description||'');setStatId(t.statId);setXp(t.xp);setMinLevel(t.minLevel);setActive(t.active);setError('');window.scrollTo({top:0,behavior:'smooth'})}
  async function save(e:React.FormEvent){e.preventDefault();setError('');setNotice('');const body={name:name.trim(),description,statId,xp,minLevel,active};try{if(editing){await api('/tasks/'+editing,{method:'PATCH',body:JSON.stringify(body)});setNotice('Task updated.')}else{await api('/tasks',{method:'POST',body:JSON.stringify(body)});setNotice('Task added.')}reset();await load()}catch(e){setError((e as Error).message)}}
  async function toggle(t:any){setError('');try{await api('/tasks/'+t._id,{method:'PATCH',body:JSON.stringify({active:!t.active})});setNotice(t.active?'Task archived.':'Task reactivated.');await load()}catch(e){setError((e as Error).message)}}
  async function remove(t:any){if(!window.confirm(`Permanently delete “${t.name}”? This is only possible if it has never been assigned.`))return;setError('');try{await api('/tasks/'+t._id,{method:'DELETE'});setNotice('Task deleted.');await load()}catch(e){setError((e as Error).message)}}
  const activeTasks=tasks.filter(t=>t.active);const archivedTasks=tasks.filter(t=>!t.active);
  return <Layout><h1>Task Library</h1><p className="muted">Reusable activities that train a stat. Set a minimum level to control when a task becomes available.</p>
    <form className="task-editor" onSubmit={save}><div className="editor-heading"><h2>{editing?'Edit task':'Create a task'}</h2>{editing&&<button type="button" onClick={reset}>Cancel edit</button>}</div>
      <label>Task name<input placeholder="Walk for 10 minutes" value={name} onChange={e=>setName(e.target.value)} required maxLength={120}/></label>
      <label>Description <span className="muted">(optional)</span><textarea placeholder="A little fresh air and movement." value={description} onChange={e=>setDescription(e.target.value)} maxLength={500}/></label>
      <div className="editor-fields"><label>Stat<select value={statId} onChange={e=>setStatId(e.target.value)} required><option value="">Choose a stat…</option>{stats.map(s=><option value={s._id} key={s._id}>{s.icon} {s.name}</option>)}</select></label>
      <label>XP reward<input type="number" min="0" max="1000" value={xp} onChange={e=>setXp(Number(e.target.value))}/></label>
      <label>Minimum level<input type="number" min="1" max="100" value={minLevel} onChange={e=>setMinLevel(Number(e.target.value))}/></label></div>
      <label className="check-label"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Available for daily assignments</label>
      {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
      <button className="primary" disabled={!stats.length}>{editing?'Save changes':'Add task'}</button>
    </form>
    <section className="task-section"><div className="section-heading"><h2>Active tasks</h2><span>{activeTasks.length}</span></div>
      {!activeTasks.length&&<p className="empty">No active tasks yet. Create one above to get started.</p>}
      <div className="task-list">{activeTasks.map(t=><TaskRow key={t._id} task={t} stat={stats.find(s=>s._id===t.statId)} onEdit={edit} onToggle={toggle} onDelete={remove}/>)}</div>
    </section>
    {!!archivedTasks.length&&<section className="task-section"><div className="section-heading"><h2>Archived tasks</h2><span>{archivedTasks.length}</span></div><div className="task-list">{archivedTasks.map(t=><TaskRow key={t._id} task={t} stat={stats.find(s=>s._id===t.statId)} onEdit={edit} onToggle={toggle} onDelete={remove}/>)}</div></section>}
  </Layout>
}
function TaskRow({task,stat,onEdit,onToggle,onDelete}:{task:any,stat:any,onEdit:(t:any)=>void,onToggle:(t:any)=>void,onDelete:(t:any)=>void}){return <article className={`task-row ${task.active?'':'archived'}`}><div className="task-info"><div className="task-title">{task.name}{!task.active&&<span className="archived-tag">Archived</span>}</div>{task.description&&<p>{task.description}</p>}<small>{stat?.icon} {stat?.name||'Unknown stat'} · +{task.xp} XP · Level {task.minLevel}+</small></div><div className="task-controls"><button onClick={()=>onEdit(task)}>Edit</button><button onClick={()=>onToggle(task)}>{task.active?'Archive':'Reactivate'}</button><button className="danger" onClick={()=>onDelete(task)}>Delete</button></div></article>}

function Quests() {
  const [quests, setQuests] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statId, setStatId] = useState('');
  const [xp, setXp] = useState(15);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
const [editName, setEditName] = useState('');
const [editDescription, setEditDescription] = useState('');
const [editStatId, setEditStatId] = useState('');
const [editXp, setEditXp] = useState(15);
const [achievementNotices, setAchievementNotices] = useState<any[]>([]);
const [repeatable, setRepeatable] = useState(false);
const [editRepeatable, setEditRepeatable] = useState(false);

  async function load() {
    const [q, s] = await Promise.all([
      api('/quests'),
      api('/stats')
    ]);

    setQuests(q);
    setStats(s);

    if (!statId && s.length) {
      setStatId(s[0]._id);
    }
  }

  useEffect(() => {
    load().catch(e => setError(e.message));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');

    try {
      await api('/quests', {
        method: 'POST',
        body: JSON.stringify({
            name: name.trim(),
            description,
            statId,
            xp,
            active: true,
            repeatable
        })
      });

      setName('');
      setDescription('');
      setXp(15);
      setRepeatable(false);
      setNotice('Quest added to your board.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function complete(q: any, completed: boolean) {
  setBusy(q._id);
  setError('');
  setNotice('');

  try {
    // Capture achievements before the XP change.
    const before = completed
      ? await api('/stats')
      : [];

    await api('/quests/' + q._id + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ completed })
    });

    if (completed) {
      // Check which achievements were unlocked by this quest.
      const after = await api('/stats');

      const newlyUnlocked = findNewAchievements(
        before,
        after
      );

      setAchievementNotices(newlyUnlocked);
    } else {
      setAchievementNotices([]);
    }

    setNotice(
    completed
        ? `Quest completed! +${q.xp} XP earned.`
        : q.repeatable
        ? 'Last completion undone. Its XP reward was reversed.'
        : 'Quest reopened. Its XP reward was reversed.'
    );

    await load();
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setBusy(null);
  }
}

  async function assignStat(q: any, nextStatId: string) {
    if (!nextStatId) return;

    setError('');

    try {
      await api('/quests/' + q._id, {
        method: 'PATCH',
        body: JSON.stringify({ statId: nextStatId })
      });

      setNotice('Quest stat updated.');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleActive(q: any, active: boolean) {
  setError('');
  setBusy(q._id);

  try {
    await api('/quests/' + q._id + '/active', {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });

    setNotice(
      active
        ? 'Quest added to your active quests.'
        : 'Quest returned to your library.'
    );

    await load();
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setBusy(null);
  }
}

  function startEdit(q: any) {
  setEditing(q._id);
  setEditName(q.name);
  setEditDescription(q.description || '');
  setEditStatId(q.statId?._id || q.statId || '');
  setEditXp(q.xp);
  setEditRepeatable(!!q.repeatable);
}

async function saveEdit() {
  if (!editing) return;

  setError('');
  setNotice('');

  try {
    await api('/quests/' + editing, {
      method: 'PATCH',
      body: JSON.stringify({
    name: editName.trim(),
    description: editDescription,
    statId: editStatId,
    xp: editXp,
    repeatable: editRepeatable
    })
    });

    setEditing(null);
    setNotice('Quest updated.');
    await load();
  } catch (e) {
    setError((e as Error).message);
  }
}

async function removeQuest(q: any) {
  if (!window.confirm(`Delete "${q.name}"? This cannot be undone.`)) {
    return;
  }

  setError('');
  setNotice('');

  try {
    await api('/quests/' + q._id, {
      method: 'DELETE'
    });

    setNotice('Quest deleted.');
    await load();
  } catch (e) {
    setError((e as Error).message);
  }
}

  const active = quests.filter(
  q => q.active && (!q.completedAt || q.repeatable)
);

const libraryQuests = quests.filter(
  q => !q.active && !q.completedAt
);

const completed = quests.filter(
  q => !!q.completedAt && !q.repeatable
);

  return (
    <Layout>
        <AchievementToast
        achievements={achievementNotices}
        onDismiss={() => setAchievementNotices([])}
        />
      <h1>Quest Board</h1>
      <p className="muted">
        Optional one-off adventures. Completing one grants XP to its
        chosen stat. No deadlines or penalties.
      </p>

      <form className="task-editor" onSubmit={add}>
        <h2>Create a quest</h2>

        <label>
          Quest name
          <input
            placeholder="Take a photo of something unusual"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={120}
          />
        </label>

        <label>
          Description <span className="muted">(optional)</span>
          <textarea
            placeholder="What makes this worth doing?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
          />
        </label>

        <div className="editor-fields quest-fields">
          <label>
            Reward stat
            <select
              value={statId}
              onChange={e => setStatId(e.target.value)}
              required
            >
              <option value="">Choose a stat…</option>
              {stats.map(s => (
                <option value={s._id} key={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            XP reward
            <input
              type="number"
              min="0"
              max="1000"
              value={xp}
              onChange={e => setXp(Number(e.target.value))}
            />
          </label>
          <label className="checkbox-label">
            <input
                type="checkbox"
                checked={repeatable}
                onChange={e => setRepeatable(e.target.checked)}
            />
            Repeatable quest
            </label>
        </div>

        {error && <div className="error">{error}</div>}
        {notice && <div className="notice">{notice}</div>}

        <button className="primary" disabled={!stats.length}>
          Add quest
        </button>
      </form>

      <section className="task-section">
        <div className="section-heading">
          <h2>Active quests</h2>
          <span>{active.length}</span>
        </div>

        {!active.length && (
          <p className="empty">
            No quests waiting. Add one whenever something sounds interesting.
          </p>
        )}

        <div className="quest-list">
          {active.map(q => (
  <article className="quest-row" key={q._id}>
    {editing === q._id ? (
      <div className="quest-edit">
        <label>
          Quest name
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
        </label>

        <label>
          Description
          <textarea
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
          />
        </label>

        <div className="editor-fields quest-fields">
          <label>
            Reward stat
            <select
              value={editStatId}
              onChange={e => setEditStatId(e.target.value)}
            >
              {stats.map(s => (
                <option value={s._id} key={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            XP reward
            <input
              type="number"
              min="0"
              max="1000"
              value={editXp}
              onChange={e => setEditXp(Number(e.target.value))}
            />
          </label>
          <label className="checkbox-label">
  <input
    type="checkbox"
    checked={editRepeatable}
    onChange={e => setEditRepeatable(e.target.checked)}
    disabled={(quests.find(q => q._id === editing)?.completionHistory?.length ?? 0) > 0}
  />
  Repeatable quest
</label>
        </div>

        <div className="actions">
          <button className="primary" onClick={saveEdit}>
            Save changes
          </button>
          <button onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="quest-info">
          <b>🗺️ {q.name}</b>

          {q.description && <p>{q.description}</p>}

          {q.repeatable && (
            <small>
                Completed {q.completionHistory?.length ?? 0} times
            </small>
            )}

          {q.statId ? (
            <small>
              {q.statId.icon} {q.statId.name} · +{q.xp} XP
            </small>
          ) : (
            <select
              defaultValue=""
              onChange={e => assignStat(q, e.target.value)}
            >
              <option value="" disabled>
                Choose a reward stat…
              </option>
              {stats.map(s => (
                <option value={s._id} key={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        

        <div className="actions">
            <button
  disabled={busy === q._id}
  onClick={() => toggleActive(q, false)}
>
  Deactivate
</button>
          <button onClick={() => startEdit(q)}>Edit</button>
          <button
  className="success"
  disabled={!q.statId || busy === q._id}
  onClick={() => complete(q, true)}
>
  {q.repeatable ? '✓ Complete again' : '✓ Complete'}
</button>

{q.repeatable && (q.completionHistory?.length ?? 0) > 0 && (
  <button
    disabled={busy === q._id}
    onClick={() => complete(q, false)}
  >
    Undo last
  </button>
)}
          <button className="fail" onClick={() => removeQuest(q)}>
            Delete
          </button>
        </div>
      </>
    )}
  </article>
))}
        </div>
      </section>


<section className="task-section">
  <div className="section-heading">
    <h2>Quest Library</h2>
    <span>{libraryQuests.length}</span>
  </div>

  <p className="muted">
    Quests waiting for you whenever you feel like taking them on.
  </p>

  {!libraryQuests.length && (
    <p className="empty">
      Your library is empty. Add quests to build your collection.
    </p>
  )}

  <div className="quest-list">
    {libraryQuests.map(q => (
      <article className="quest-row" key={q._id}>
        <div className="quest-info">
          <b>🗺️ {q.name}</b>

          {q.description && <p>{q.description}</p>}

          <small>
            {q.statId?.icon} {q.statId?.name || 'Unassigned'} ·
            +{q.xp} XP
            {q.repeatable ? ' · Repeatable' : ''}
          </small>

          {q.repeatable && (
            <small>
              Completed {q.completionHistory?.length ?? 0} times
            </small>
          )}
        </div>

        <div className="actions">
          <button
            className="success"
            disabled={busy === q._id}
            onClick={() => toggleActive(q, true)}
          >
            + Activate
          </button>

          <button onClick={() => startEdit(q)}>
            Edit
          </button>

          <button
            className="fail"
            onClick={() => removeQuest(q)}
          >
            Delete
          </button>
        </div>
      </article>
    ))}
  </div>
</section>


      {!!completed.length && (
        <section className="task-section">
          <div className="section-heading">
            <h2>Completed quests</h2>
            <span>{completed.length}</span>
          </div>

          <div className="quest-list">
            {completed.map(q => (
              <article
                className="quest-row completed-quest"
                key={q._id}
              >
                <div className="quest-info">
                  <b>✓ {q.name}</b>

                  {q.description && <p>{q.description}</p>}

                  {q.repeatable && (
                    <small>
                        Completed {q.completionHistory?.length ?? 0} times
                    </small>
                    )}

                  <small>
                    {q.statId?.icon} {q.statId?.name || 'Stat'} ·
                    +{q.xpEarned ?? q.xp} XP earned
                  </small>
                </div>

                <div className="actions">
                <button
                    disabled={busy === q._id}
                    onClick={() => complete(q, false)}
                >
                    Reopen
                </button>

                <button
                    className="fail"
                    onClick={() => removeQuest(q)}
                >
                    Delete
                </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
function historyDate(value: string) {
  const d = new Date(value);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function History() {
  const [stats, setStats] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [data, setData] = useState<any>({
    assignments: [],
    quests: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/stats')
      .then(d => {
        setStats(d);
        if (d.length) setSelected(d[0]);
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selected) return;

    let cancelled = false;

    setLoading(true);
    setError('');

    api('/history/' + selected._id)
      .then(d => {
        if (!cancelled) setData(d);
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Generate the most recent 84 calendar days.
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (83 - i));
    return historyDate(d.toISOString());
  });

  const assignments = data.assignments || [];
  const quests = data.quests || [];

  const recentAssignments = assignments.filter(
    (a: any) => days.includes(a.date)
  );

  const recentQuests = quests.filter(
    (q: any) => days.includes(historyDate(q.completedAt))
  );

  const successfulTasks = recentAssignments.filter(
    (a: any) => a.status === 'success'
  );

  const earnedTaskXp = successfulTasks.reduce(
    (sum: number, a: any) => sum + (a.xpEarned || 0),
    0
  );

  const earnedQuestXp = recentQuests.reduce(
    (sum: number, q: any) => sum + (q.xpEarned || 0),
    0
  );

  const totalXp = earnedTaskXp + earnedQuestXp;

  const activities = [
    ...recentAssignments
      .filter((a: any) => a.status !== 'pending')
      .map((a: any) => ({
        id: a._id,
        date: a.date,
        timestamp: a.completedAt || `${a.date}T12:00:00`,
        name: a.taskId?.name || 'Daily task',
        type: 'task',
        status: a.status,
        xp: a.xpEarned || 0
      })),

    ...recentQuests.map((q: any) => ({
      id: q._id,
      date: historyDate(q.completedAt),
      timestamp: q.completedAt,
      name: q.name,
      type: 'quest',
      status: 'success',
      xp: q.xpEarned || 0
    }))
  ].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime()
  );

  return (
    <Layout>
      <h1>Character History</h1>
      <p className="muted">
        A record of the things you've done to develop your character.
      </p>

      {error && <div className="error">{error}</div>}

      <div className="history-tabs">
        {stats.map(s => (
          <button
            className={selected?._id === s._id ? 'active' : ''}
            onClick={() => setSelected(s)}
            key={s._id}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <section className="history">
            <div className="history-heading">
              <div>
                <h2>
                  {selected.icon} {selected.name}
                </h2>
                <p className="muted">
                  Level {selected.level} · {selected.xp} lifetime XP
                </p>
              </div>

              <div className="history-period">
                Last 12 weeks
              </div>
            </div>

            <div className="history-summary">
              <div>
                <strong>{successfulTasks.length}</strong>
                <span>Tasks completed</span>
              </div>

              <div>
                <strong>{recentQuests.length}</strong>
                <span>Quests completed</span>
              </div>

              <div>
                <strong>{totalXp}</strong>
                <span>XP earned</span>
              </div>
            </div>

            <h3>Activity calendar</h3>

            {loading ? (
              <p className="muted">Loading history…</p>
            ) : (
              <>
                <div className="heatmap">
                  {days.map(day => {
                    const a = recentAssignments.find(
                      (x: any) => x.date === day
                    );

                    const hasQuest = recentQuests.some(
                      (q: any) => historyDate(q.completedAt) === day
                    );

                    const status = a?.status || 'none';

                    return (
                      <div
                        key={day}
                        title={`${day}: ${status}${
                          hasQuest ? ' + completed quest' : ''
                        }`}
                        className={`cell ${status} ${
                          hasQuest ? 'has-quest' : ''
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="history-legend">
                  <span><i className="legend-success" /> Completed task</span>
                  <span><i className="legend-fail" /> Skipped task</span>
                  <span><i className="legend-quest" /> Quest completed</span>
                  <span><i className="legend-none" /> No activity</span>
                </div>
              </>
            )}
          </section>

          <section className="history activity-section">
            <h2>Recent activity</h2>

            {!activities.length ? (
              <p className="muted">
                Nothing recorded yet. Your completed tasks and quests
                will appear here.
              </p>
            ) : (
              <div className="activity-list">
                {activities.map(a => (
                  <article className="activity-row" key={a.id}>
                    <div className="activity-icon">
                      {a.type === 'quest'
                        ? '🗺️'
                        : a.status === 'success'
                        ? '✓'
                        : a.status === 'fail'
                        ? '×'
                        : '—'}
                    </div>

                    <div className="activity-info">
                      <strong>{a.name}</strong>
                      <small>
                        {a.date} · {a.type === 'quest' ? 'Quest' : 'Daily task'}
                        {a.status === 'fail' && ' · Skipped'}
                        {a.status === 'rest' && ' · Rest day'}
                      </small>
                    </div>

                    {a.xp > 0 && (
                      <span className="activity-xp">
                        +{a.xp} XP
                      </span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/" element={<Protected><Dashboard/></Protected>}/><Route path="/tasks" element={<Protected><Tasks/></Protected>}/><Route path="/quests" element={<Protected><Quests/></Protected>}/><Route path="/history" element={<Protected><History/></Protected>}/></Routes>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
