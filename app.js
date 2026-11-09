(() => {
  'use strict';

  const STORAGE_KEY = 'liftlog.v1';

  const USERS = {
    dan: { name: 'Dan' },
    jena: { name: 'Jena' },
  };

  const WORKOUTS = [
    {
      id: 'push1',
      name: 'Push Day 1',
      short: 'Push 1',
      focus: 'Chest · Shoulders · Triceps · Quads · Glutes',
      exercises: [
        { id: 'ohp', name: 'Barbell overhead press', sets: 3, setsLabel: '3–4', reps: '6–8', note: 'At least one warm-up set.' },
        { id: 'hip-thrust', name: 'Barbell hip thrust', sets: 3, reps: '8–10', note: 'Use a glute band.' },
        { id: 'lateral-raise', name: 'Dumbbell lateral raises', sets: 3, reps: '10–12' },
        { id: 'reverse-lunge', name: 'Front elevated reverse lunge (smith machine)', sets: 3, reps: '6–8', note: 'Alt: dumbbell, barbell, or swap for Bulgarian split squat.' },
        { id: 'tricep-pushdown', name: 'Tricep pushdown', sets: 3, reps: '10–12', note: 'Rope attachment.' },
        { id: 'abductor', name: 'Standing abductor machine', sets: 3, reps: '10', note: 'Alt: seated abductor or hip/glute raise machine.' },
      ],
    },
    {
      id: 'push2',
      name: 'Push Day 2',
      short: 'Push 2',
      focus: 'Chest · Shoulders · Triceps · Quads · Glutes',
      exercises: [
        { id: 'seated-db-press', name: 'Seated dumbbell overhead press', sets: 3, setsLabel: '3–4', reps: '8–10' },
        { id: 'machine-hip-thrust', name: 'Machine hip thrust', sets: 3, reps: '8–10', note: 'Use a glute band.' },
        { id: 'iso-incline-press', name: 'Iso-lateral incline chest press', sets: 3, reps: '8–10', note: 'Alt: dumbbell incline chest press.' },
        { id: 'belt-squat', name: 'Belt squat', sets: 3, reps: '8–10', note: 'Alt: barbell squat or goblet squat.' },
        { id: 'tricep-pushdown-2', name: 'Tricep pushdown', sets: 3, reps: '10–12', note: 'Rope attachment.' },
        { id: 'cable-kickback', name: 'Cable kickbacks (glute)', sets: 3, reps: '8–10' },
      ],
    },
    {
      id: 'pull1',
      name: 'Pull Day 1',
      short: 'Pull 1',
      focus: 'Back · Biceps · Rear delts · Glutes · Hamstrings',
      exercises: [
        { id: 'pull-up', name: 'Neutral grip pull up', sets: 3, reps: 'AMRAP', note: 'Alt: wide grip, banded, or assisted pull up machine.' },
        { id: 'sumo-deadlift', name: 'Sumo deadlift', sets: 3, reps: '6–8', note: 'Alt: conventional deadlift.' },
        { id: 'seated-row', name: 'Seated row machine', sets: 3, reps: '8–10', note: 'Alt: cable seated row.' },
        { id: 'rdl-barbell', name: 'Romanian deadlift (barbell)', sets: 3, reps: '8–10', note: 'Use hook grips.' },
        { id: 'bicep-curl', name: 'Bicep curl (dumbbell)', sets: 3, reps: '8–10' },
        { id: 'nordic-curl', name: 'Assisted nordic hamstring curl', sets: 3, reps: '8–10', note: 'Alt: lying or seated leg curl.' },
      ],
    },
    {
      id: 'pull2',
      name: 'Pull Day 2',
      short: 'Pull 2',
      focus: 'Back · Biceps · Rear delts · Glutes · Hamstrings',
      exercises: [
        { id: 'pull-up-2', name: 'Neutral grip pull up', sets: 3, reps: 'AMRAP', note: 'Alt: wide grip, banded, or assisted pull up machine.' },
        { id: 'sumo-deadlift-2', name: 'Sumo deadlift', sets: 3, reps: '6–8', note: 'Alt: conventional deadlift.' },
        { id: 'lat-pulldown', name: 'Lat pulldown', sets: 3, reps: '8–10', note: 'Machine or cable.' },
        { id: 'rdl-dumbbell', name: 'Romanian deadlift (dumbbell)', sets: 3, reps: '8–10', note: 'Use hook grips.' },
        { id: 'face-pulls', name: 'Face pulls', sets: 3, reps: '10–12', note: 'Alt: rear delt machine.' },
        { id: 'leg-curl', name: 'Kneeling unilateral leg curl machine', sets: 3, reps: '8–10', note: 'Alt: lying or seated leg curl.' },
      ],
    },
  ];

  const WORKOUT_BY_ID = Object.fromEntries(WORKOUTS.map((w) => [w.id, w]));
  // Suggested rotation: alternate push and pull days.
  const SUGGESTION_ORDER = ['push1', 'pull1', 'push2', 'pull2'];

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  // ---------- storage ----------

  function isValidSession(session) {
    return Boolean(
      session &&
        typeof session.id === 'string' &&
        USERS[session.user] &&
        WORKOUT_BY_ID[session.workoutId] &&
        typeof session.date === 'string' &&
        session.entries &&
        typeof session.entries === 'object'
    );
  }

  function readDB() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && Array.isArray(raw.sessions)) {
        return { sessions: raw.sessions.filter(isValidSession) };
      }
    } catch (_) {
      // Corrupt or unavailable storage — start fresh.
    }
    return { sessions: [] };
  }

  let db = readDB();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      return true;
    } catch (_) {
      toast("Couldn't save — this browser blocked storage.");
      return false;
    }
  }

  // ---------- helpers ----------

  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

  const uid = () =>
    (window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function relDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((today - then) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function sessionsFor(user) {
    return db.sessions
      .filter((session) => session.user === user)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function lastFor(user, workoutId) {
    return sessionsFor(user).find((session) => session.workoutId === workoutId) || null;
  }

  function lastAny(user) {
    return sessionsFor(user)[0] || null;
  }

  function suggestedWorkout(user) {
    const lastDone = {};
    for (const session of db.sessions) {
      if (session.user !== user) continue;
      const time = new Date(session.date).getTime();
      if (!(session.workoutId in lastDone) || time > lastDone[session.workoutId]) {
        lastDone[session.workoutId] = time;
      }
    }
    let best = SUGGESTION_ORDER[0];
    let bestTime = Infinity;
    for (const id of SUGGESTION_ORDER) {
      const time = lastDone[id] ?? -Infinity;
      if (time < bestTime) {
        bestTime = time;
        best = id;
      }
    }
    return best;
  }

  function sessionSummary(session) {
    let sets = 0;
    for (const list of Object.values(session.entries)) {
      if (Array.isArray(list)) sets += list.filter(Boolean).length;
    }
    return sets + (sets === 1 ? ' set' : ' sets');
  }

  const brandMark = `
    <svg class="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1.5" y="9" width="2.6" height="6" rx="1.1" fill="currentColor"/>
      <rect x="5" y="6.8" width="3" height="10.4" rx="1.3" fill="currentColor"/>
      <rect x="8" y="10.4" width="8" height="3.2" rx="1.6" fill="currentColor"/>
      <rect x="16" y="6.8" width="3" height="10.4" rx="1.3" fill="currentColor"/>
      <rect x="19.9" y="9" width="2.6" height="6" rx="1.1" fill="currentColor"/>
    </svg>`;

  function targetText(exercise) {
    const reps = exercise.reps === 'AMRAP' ? 'AMRAP' : exercise.reps + ' reps';
    return `${exercise.setsLabel || exercise.sets} sets · ${reps}`;
  }

  // ---------- views ----------

  function render() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const user = parts[0];

    if (!user) {
      document.body.dataset.user = '';
      app.classList.remove('has-save');
      renderUsers();
      return;
    }

    if (!USERS[user]) {
      location.replace('#/');
      return;
    }

    document.body.dataset.user = user;

    if (parts.length === 1) {
      app.classList.remove('has-save');
      renderWorkouts(user);
      return;
    }

    const workoutId = parts[1];
    if (!WORKOUT_BY_ID[workoutId]) {
      location.replace('#/' + user);
      return;
    }

    app.classList.add('has-save');
    renderLog(user, workoutId);
  }

  function renderUsers() {
    const cards = Object.entries(USERS).map(([id, user]) => {
      const last = lastAny(id);
      const meta = last
        ? `Last: ${WORKOUT_BY_ID[last.workoutId].short} · ${relDate(last.date)}`
        : 'No workouts yet';
      return `
        <a class="user-card" data-user="${id}" href="#/${id}">
          <span class="avatar">${esc(user.name[0])}</span>
          <span class="user-text">
            <span class="user-name">${esc(user.name)}</span>
            <span class="user-meta">${meta}</span>
          </span>
          <span class="chev" aria-hidden="true">→</span>
        </a>`;
    }).join('');

    app.innerHTML = `
      <header class="topbar">
        <div class="brand">${brandMark}<span>Lift Log</span></div>
        <span class="pill">2025 Plan</span>
      </header>

      <section class="hero">
        <p class="eyebrow">Kathryn Mueller's 2025 routine</p>
        <h1>Who's<br><span class="accent">lifting?</span></h1>
        <p class="hero-sub">Push &amp; pull, three days a week. Pick yourself, then pick your workout.</p>
      </section>

      <div class="user-grid">${cards}</div>

      <p class="foot">
        Logs stay on this device. <button class="link-btn" id="reset-data" type="button">Reset all data</button>
      </p>`;

    document.getElementById('reset-data').addEventListener('click', () => {
      if (!confirm('Delete all saved workouts for Dan and Jena on this device?')) return;
      db = { sessions: [] };
      persist();
      render();
      toast('All data cleared');
    });
  }

  function renderWorkouts(user) {
    const person = USERS[user];
    const last = lastAny(user);
    const next = suggestedWorkout(user);
    const recent = sessionsFor(user).slice(0, 4);

    const workoutCards = WORKOUTS.map((workout) => {
      const lastSession = lastFor(user, workout.id);
      const isNext = workout.id === next;
      return `
        <a class="workout-card${isNext ? ' suggested' : ''}" href="#/${user}/${workout.id}">
          <div class="wc-top">
            <span class="wc-name">${esc(workout.name)}</span>
            ${isNext ? '<span class="badge">Next up</span>' : ''}
          </div>
          <p class="wc-focus">${esc(workout.focus)}</p>
          <div class="wc-foot">
            <span>${workout.exercises.length} exercises</span>
            <span class="wc-last">${lastSession
              ? `Last: ${relDate(lastSession.date)} · ${sessionSummary(lastSession)}`
              : 'Not done yet'}</span>
          </div>
        </a>`;
    }).join('');

    const recentList = recent.length
      ? `<ul class="recent-list">
          ${recent.map((session) => `
            <li>
              <div class="recent-main">
                <span class="recent-name">${esc(WORKOUT_BY_ID[session.workoutId].name)}</span>
                <span class="recent-meta">${relDate(session.date)} · ${sessionSummary(session)}</span>
              </div>
              <button class="recent-del" type="button" data-del="${esc(session.id)}" aria-label="Delete this session">×</button>
            </li>`).join('')}
        </ul>`
      : '<p class="empty">Nothing logged yet. Your recent sessions will show up here.</p>';

    app.innerHTML = `
      <header class="topbar">
        <a class="back" href="#/" aria-label="Switch user">←</a>
        <div class="brand">${brandMark}<span>Lift Log</span></div>
        <span class="pill">${esc(person.name)}</span>
      </header>

      <section class="screen-head">
        <p class="eyebrow">${esc(person.name)}'s log</p>
        <h1>Pick a workout</h1>
        ${last
          ? `<p class="last-line"><span class="dot"></span> Last session: <b>${esc(WORKOUT_BY_ID[last.workoutId].short)}</b> · ${relDate(last.date)}</p>`
          : '<p class="last-line muted">No sessions yet — start with any workout.</p>'}
      </section>

      <div class="workout-list">${workoutCards}</div>

      <section class="recent">
        <div class="recent-head">
          <h2>Recent</h2>
          ${recent.length ? '<span>tap × to delete</span>' : ''}
        </div>
        ${recentList}
      </section>

      <p class="foot">Saved on this device only.</p>`;

    app.querySelectorAll('[data-del]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = db.sessions.find((item) => item.id === button.dataset.del);
        if (!session) return;
        const label = `${WORKOUT_BY_ID[session.workoutId].short} (${relDate(session.date)})`;
        if (!confirm(`Delete ${label}?`)) return;
        db.sessions = db.sessions.filter((item) => item.id !== session.id);
        persist();
        render();
        toast('Session deleted');
      });
    });
  }

  function setRowHTML(exercise, index, lastSet) {
    const setNumber = index + 1;
    const weightPlaceholder = lastSet && lastSet.weight != null ? fmtNum(lastSet.weight) : '—';
    const repsPlaceholder = lastSet && lastSet.reps != null ? fmtNum(lastSet.reps) : '—';
    return `
      <div class="set-row">
        <span class="set-n">${setNumber}</span>
        <input class="in-weight" type="number" inputmode="decimal" step="2.5" min="0"
          placeholder="${weightPlaceholder}" aria-label="${esc(exercise.name)}, set ${setNumber}, weight in pounds">
        <input class="in-reps" type="number" inputmode="numeric" step="1" min="0"
          placeholder="${repsPlaceholder}" aria-label="${esc(exercise.name)}, set ${setNumber}, reps">
        <button class="row-del" type="button" aria-label="Remove set ${setNumber}">×</button>
      </div>`;
  }

  function exerciseCard(exercise, index, lastSets) {
    const rows = Math.max(exercise.sets, lastSets ? lastSets.length : 0);
    return `
      <article class="exercise" data-ex="${esc(exercise.id)}" data-name="${esc(exercise.name)}">
        <div class="exercise-head">
          <span class="ex-num">${String(index + 1).padStart(2, '0')}</span>
          <div class="ex-info">
            <h2>${esc(exercise.name)}</h2>
            <p class="ex-target">${targetText(exercise)}</p>
          </div>
        </div>
        ${exercise.note ? `<p class="ex-note">${esc(exercise.note)}</p>` : ''}
        <div class="sets">
          <div class="set-head"><span>Set</span><span>Weight (lb)</span><span>Reps</span><span></span></div>
          ${Array.from({ length: rows }, (_, rowIndex) =>
            setRowHTML(exercise, rowIndex, lastSets ? lastSets[rowIndex] : null)).join('')}
        </div>
        <button class="add-set" type="button">+ Add set</button>
      </article>`;
  }

  function refreshRows(card) {
    const rows = Array.from(card.querySelectorAll('.set-row'));
    const name = card.dataset.name;
    rows.forEach((row, index) => {
      row.querySelector('.set-n').textContent = index + 1;
      const remove = row.querySelector('.row-del');
      remove.disabled = rows.length <= 1;
      remove.setAttribute('aria-label', `Remove set ${index + 1}`);
      row.querySelector('.in-weight').setAttribute('aria-label', `${name}, set ${index + 1}, weight in pounds`);
      row.querySelector('.in-reps').setAttribute('aria-label', `${name}, set ${index + 1}, reps`);
    });
  }

  function renderLog(user, workoutId) {
    const person = USERS[user];
    const workout = WORKOUT_BY_ID[workoutId];
    const last = lastFor(user, workoutId);
    const lastEntries = last ? last.entries : {};

    app.innerHTML = `
      <header class="log-top">
        <a class="back" href="#/${user}" aria-label="Back to workouts">←</a>
        <span class="pill">${esc(person.name)}</span>
      </header>

      <section class="screen-head">
        <p class="eyebrow">${esc(person.name)} · ${esc(workout.short)}</p>
        <h1>${esc(workout.name)}</h1>
        <p class="hero-sub">${esc(workout.focus)}</p>
        ${last
          ? `<p class="last-line"><span class="dot"></span> Last done ${relDate(last.date)} · <button class="link-btn" id="prefill" type="button">use those numbers</button></p>`
          : '<p class="last-line muted">First time logging this workout.</p>'}
      </section>

      <div class="exercise-list">
        ${workout.exercises.map((exercise, index) =>
          exerciseCard(exercise, index, lastEntries[exercise.id])).join('')}
      </div>

      <div class="save-bar">
        <div class="inner">
          <button class="save-btn" id="save-workout" type="button">Save workout</button>
        </div>
      </div>`;

    app.querySelectorAll('.exercise').forEach((card) => {
      const exercise = workout.exercises.find((item) => item.id === card.dataset.ex);
      const lastSets = lastEntries[exercise.id] || [];

      refreshRows(card);

      card.querySelector('.add-set').addEventListener('click', () => {
        const sets = card.querySelector('.sets');
        const index = sets.querySelectorAll('.set-row').length;
        sets.insertAdjacentHTML('beforeend', setRowHTML(exercise, index, lastSets[index]));
        refreshRows(card);
        const rows = card.querySelectorAll('.set-row');
        rows[rows.length - 1].querySelector('.in-weight').focus();
      });
    });

    const prefill = document.getElementById('prefill');
    if (prefill) {
      prefill.addEventListener('click', () => {
        let filled = 0;
        app.querySelectorAll('.exercise').forEach((card) => {
          const lastSets = lastEntries[card.dataset.ex] || [];
          card.querySelectorAll('.set-row').forEach((row, index) => {
            const previous = lastSets[index];
            if (!previous) return;
            const weightInput = row.querySelector('.in-weight');
            const repsInput = row.querySelector('.in-reps');
            if (weightInput.value === '' && previous.weight != null) {
              weightInput.value = previous.weight;
              filled += 1;
            }
            if (repsInput.value === '' && previous.reps != null) {
              repsInput.value = previous.reps;
              filled += 1;
            }
          });
        });
        toast(filled ? "Filled in last session's numbers" : 'Nothing left to fill');
      });
    }

    const saveButton = document.getElementById('save-workout');
    saveButton.addEventListener('click', () => {
      const entries = {};
      let problem = null;

      app.querySelectorAll('.exercise').forEach((card) => {
        const name = card.dataset.name;
        const values = [];

        card.querySelectorAll('.set-row').forEach((row, index) => {
          const weightRaw = row.querySelector('.in-weight').value.trim();
          const repsRaw = row.querySelector('.in-reps').value.trim();
          if (weightRaw === '' && repsRaw === '') return;

          const weight = weightRaw === '' ? null : Number(weightRaw);
          const reps = repsRaw === '' ? null : Number(repsRaw);

          if (weight != null && reps == null) {
            problem = problem || `Add reps for ${name}, set ${index + 1}`;
          }
          if (reps != null && (!Number.isFinite(reps) || reps <= 0)) {
            problem = problem || `Check reps for ${name}, set ${index + 1}`;
          }
          if (weight != null && (!Number.isFinite(weight) || weight < 0)) {
            problem = problem || `Check weight for ${name}, set ${index + 1}`;
          }

          values.push({ weight, reps });
        });

        if (values.length) entries[card.dataset.ex] = values;
      });

      if (problem) {
        toast(problem);
        return;
      }
      if (!Object.keys(entries).length) {
        toast('Log at least one set to save');
        return;
      }

      saveButton.disabled = true;
      db.sessions.push({
        id: uid(),
        user,
        workoutId,
        date: new Date().toISOString(),
        entries,
      });
      if (!persist()) {
        db.sessions.pop();
        saveButton.disabled = false;
        return;
      }

      location.hash = '#/' + user;
      toast(workout.name + ' saved');
    });
  }

  // ---------- events ----------

  app.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.row-del');
    if (!removeButton) return;

    const card = removeButton.closest('.exercise');
    if (!card || card.querySelectorAll('.set-row').length <= 1) return;

    removeButton.closest('.set-row').remove();
    refreshRows(card);
  });

  window.addEventListener('hashchange', render);

  // ---------- boot ----------

  render();

  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Offline support is a bonus; the app still works without it.
      });
    });
  }
})();
