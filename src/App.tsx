import { useEffect, useState, type FormEvent } from 'react';
import {
  BookOpen, CalendarDays, Check, CheckCheck, ChevronLeft, Circle, ClipboardList,
  Cloud, CloudDrizzle, CloudRain, CloudSun, Plus, Search, Sparkles, Sun, Tag, Trash2,
} from 'lucide-react';

type Section = 'journal' | 'todo';
type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';
type Entry = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  date: string;
  status: 'draft' | 'logged';
  mood: Mood | '';
  tags: string[];
  gratitude: string;
  intention: string;
};
type Task = { id: string; text: string; done: boolean; createdAt: string };
type TaskFilter = 'all' | 'open' | 'done';
type EntryFilter = 'all' | 'drafts';

const moodOptions = [
  { id: 'great', label: 'Great', Icon: Sun },
  { id: 'good', label: 'Good', Icon: CloudSun },
  { id: 'okay', label: 'Okay', Icon: Cloud },
  { id: 'low', label: 'Low', Icon: CloudDrizzle },
  { id: 'rough', label: 'Rough', Icon: CloudRain },
] as const;
const entryTags = ['Reflection', 'Gratitude', 'Work', 'Personal'];

const starterEntries: Entry[] = [
  {
    id: 'entry-1', title: 'A little more room', updatedAt: '2026-10-22T09:30:00.000Z',
    body: 'I have been trying to leave a little space between things. Not every quiet moment needs to be filled.\n\nA slower morning, a walk without a destination, lunch away from my desk. Small permissions, but they change the shape of a day.',
    date: '2026-10-22', status: 'logged', mood: 'good', tags: ['Reflection'], gratitude: 'An unhurried breakfast.', intention: 'Leave more room between plans.',
  },
  {
    id: 'entry-2', title: 'Notes from the weekend', updatedAt: '2026-10-20T15:10:00.000Z',
    body: 'The light was golden all afternoon. Picked up a book from the little shop on the corner and made soup for dinner.\n\nRemember to do more ordinary things with your full attention.',
    date: '2026-10-20', status: 'logged', mood: 'great', tags: ['Personal', 'Gratitude'], gratitude: 'A long afternoon in the sun.', intention: '',
  },
];

const starterTasks: Task[] = [
  { id: 'task-1', text: 'Send the updated notes to Maya', done: false, createdAt: '2026-10-23' },
  { id: 'task-2', text: 'Pick up a few things for dinner', done: false, createdAt: '2026-10-23' },
  { id: 'task-3', text: 'Water the plants', done: true, createdAt: '2026-10-22' },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...options }).format(new Date(value));
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatEntryDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...options }).format(new Date(year, month - 1, day));
}

function readEntries() {
  const saved = readStored<Partial<Entry>[] | null>('daymark-entries', null);
  if (!saved) return starterEntries;
  return saved.map((entry) => ({
    id: entry.id ?? crypto.randomUUID(),
    title: entry.title ?? '',
    body: entry.body ?? '',
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
    date: entry.date ?? entry.updatedAt?.slice(0, 10) ?? localDateValue(),
    status: entry.status ?? 'logged',
    mood: entry.mood ?? '',
    tags: entry.tags ?? [],
    gratitude: entry.gratitude ?? '',
    intention: entry.intention ?? '',
  }));
}

export default function App() {
  const [section, setSection] = useState<Section>('journal');
  const [entries, setEntries] = useState<Entry[]>(readEntries);
  const [selectedId, setSelectedId] = useState(() => readStored('daymark-selected-entry', 'entry-1'));
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  const [tasks, setTasks] = useState<Task[]>(() => readStored('daymark-tasks', starterTasks));
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [search, setSearch] = useState('');
  const [newTask, setNewTask] = useState('');

  useEffect(() => localStorage.setItem('daymark-entries', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('daymark-selected-entry', JSON.stringify(selectedId)), [selectedId]);
  useEffect(() => localStorage.setItem('daymark-tasks', JSON.stringify(tasks)), [tasks]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? entries[0];
  const draftCount = entries.filter((entry) => entry.status === 'draft').length;
  const remaining = tasks.filter((task) => !task.done).length;
  const visibleEntries = entries
    .filter((entry) => entryFilter === 'all' || entry.status === 'draft')
    .filter((entry) => `${entry.title} ${entry.body} ${entry.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .sort((first, second) => second.date.localeCompare(first.date) || second.updatedAt.localeCompare(first.updatedAt));
  const visibleTasks = tasks.filter((task) =>
    filter === 'all' ? true : filter === 'open' ? !task.done : task.done,
  );
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date());

  function updateEntry(changes: Partial<Entry>) {
    if (!selectedEntry) return;
    setEntries((current) => current.map((entry) => entry.id === selectedEntry.id
      ? { ...entry, ...changes, updatedAt: new Date().toISOString() }
      : entry));
  }

  function createEntry() {
    const entry: Entry = {
      id: crypto.randomUUID(), title: '', body: '', updatedAt: new Date().toISOString(),
      date: localDateValue(), status: 'draft', mood: '', tags: [], gratitude: '', intention: '',
    };
    setEntries((current) => [entry, ...current]);
    setSelectedId(entry.id);
    setSearch('');
    setEntryFilter('all');
  }

  function toggleTag(tag: string) {
    if (!selectedEntry) return;
    const tags = selectedEntry.tags.includes(tag)
      ? selectedEntry.tags.filter((item) => item !== tag)
      : [...selectedEntry.tags, tag];
    updateEntry({ tags });
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    setTasks((current) => [{
      id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString(),
    }, ...current]);
    setNewTask('');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={1.8} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </div>
        <div className="side-label">YOUR SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={`nav-item ${section === 'journal' ? 'active' : ''}`} onClick={() => setSection('journal')}>
            <BookOpen size={18} strokeWidth={1.8} /><span>Journal</span><span className="nav-count">{entries.length}</span>
          </button>
          <button className={`nav-item ${section === 'todo' ? 'active' : ''}`} onClick={() => setSection('todo')}>
            <ClipboardList size={18} strokeWidth={1.8} /><span>To-do</span>
            {remaining > 0 && <span className="nav-count">{remaining}</span>}
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="note-rule" />
          <p>Make a little space<br />for what matters.</p>
          <span>ONE DAY AT A TIME</span>
        </div>
        <div className="sidebar-footer"><span className="status-dot" />Saved on this device</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Sparkles size={17} /></span>daymark<span className="brand-period">.</span></div>
          <div className="breadcrumbs"><span>My space</span><ChevronLeft size={14} /><strong>{section === 'journal' ? 'Journal' : 'To-do list'}</strong></div>
          <div className="topbar-date"><span className="today-dot" />{today}</div>
        </header>

        {section === 'journal' ? (
          <section className="journal-layout" aria-label="Journal">
            <div className="journal-list-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">YOUR THOUGHTS</p><h1>Journal</h1></div>
                <button className="icon-button" onClick={createEntry} aria-label="Create journal entry" title="New entry"><Plus size={18} /></button>
              </div>
              <div className="journal-summary">
                <span>{entries.filter((entry) => entry.status === 'logged').length} logged entries</span>
                <span className="summary-separator" />
                <span>{draftCount} {draftCount === 1 ? 'draft' : 'drafts'}</span>
              </div>
              <div className="entry-filters" role="tablist" aria-label="Filter journal entries">
                <button className={entryFilter === 'all' ? 'chosen' : ''} onClick={() => setEntryFilter('all')} role="tab" aria-selected={entryFilter === 'all'}>All entries</button>
                <button className={entryFilter === 'drafts' ? 'chosen' : ''} onClick={() => { setEntryFilter('drafts'); const firstDraft = entries.find((entry) => entry.status === 'draft'); if (firstDraft) setSelectedId(firstDraft.id); }} role="tab" aria-selected={entryFilter === 'drafts'}>Drafts <span>{draftCount}</span></button>
              </div>
              <label className="search-field">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an entry" aria-label="Find an entry" />
                <kbd>/</kbd>
              </label>
              <div className="entry-list">
                {visibleEntries.length ? visibleEntries.map((entry) => (
                  <button key={entry.id} className={`entry-preview ${selectedEntry?.id === entry.id ? 'selected' : ''}`} onClick={() => setSelectedId(entry.id)}>
                    <span className="entry-date">{formatEntryDate(entry.date, { year: 'numeric' })}<span className={`entry-status status-${entry.status}`}>{entry.status}</span></span>
                    <strong>{entry.title || 'Untitled entry'}</strong>
                    <span className="entry-excerpt">{entry.body || 'No writing yet...'}</span>
                    <span className="entry-preview-meta">
                      {entry.mood && <span className={`mood-label mood-${entry.mood}`}>{moodOptions.find((mood) => mood.id === entry.mood)?.label}</span>}
                      {entry.tags.slice(0, 1).map((tag) => <span className="entry-tag" key={tag}>{tag}</span>)}
                    </span>
                  </button>
                )) : <p className="empty-search">{entryFilter === 'drafts' ? 'No drafts yet. Start a new entry to save a thought for later.' : 'No entries found.'}</p>}
              </div>
              <button className="new-entry-link" onClick={createEntry}><Plus size={15} />New entry</button>
            </div>

            <article className="journal-editor">
              {selectedEntry && !(entryFilter === 'drafts' && selectedEntry.status !== 'draft') ? <>
                <div className="editor-topline">
                  <label className="date-picker"><CalendarDays size={15} /><span>Entry date</span><input type="date" value={selectedEntry.date} onChange={(event) => updateEntry({ date: event.target.value })} aria-label="Entry date" /></label>
                  <span className={`status-badge status-${selectedEntry.status}`}>{selectedEntry.status === 'draft' ? 'Draft' : 'Logged'}</span>
                </div>
                <input className="entry-title" value={selectedEntry.title} onChange={(event) => updateEntry({ title: event.target.value })} placeholder="Give this day a title" aria-label="Entry title" />
                <div className="editor-divider"><span /><span /><span /></div>
                <textarea className="entry-body" value={selectedEntry.body} onChange={(event) => updateEntry({ body: event.target.value })} placeholder="What would you like to remember about today?" aria-label="Journal entry text" />

                <section className="entry-details" aria-label="Entry details">
                  <div className="detail-heading"><span className="eyebrow">CHECK IN</span><span className="detail-prompt">How are you feeling?</span></div>
                  <div className="mood-options" role="group" aria-label="Choose a mood">
                    {moodOptions.map(({ id, label, Icon }) => (
                      <button key={id} className={`mood-option mood-${id} ${selectedEntry.mood === id ? 'selected' : ''}`} onClick={() => updateEntry({ mood: selectedEntry.mood === id ? '' : id })} aria-pressed={selectedEntry.mood === id}>
                        <Icon size={17} strokeWidth={1.7} /><span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="tag-section">
                    <div className="detail-heading"><span className="eyebrow">ADD CONTEXT</span><span className="detail-prompt">What was this day about?</span></div>
                    <div className="tag-options">
                      {entryTags.map((tag) => (
                        <button key={tag} className={`tag-option ${selectedEntry.tags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleTag(tag)} aria-pressed={selectedEntry.tags.includes(tag)}><Tag size={12} />{tag}</button>
                      ))}
                    </div>
                  </div>
                  <div className="reflection-fields">
                    <label><span>One thing I’m grateful for</span><input value={selectedEntry.gratitude} onChange={(event) => updateEntry({ gratitude: event.target.value })} placeholder="A small thing counts" /></label>
                    <label><span>Tomorrow, I want to</span><input value={selectedEntry.intention} onChange={(event) => updateEntry({ intention: event.target.value })} placeholder="Set a gentle intention" /></label>
                  </div>
                </section>

                <div className="editor-footer">
                  <span>{selectedEntry.body.trim() ? selectedEntry.body.trim().split(/\s+/).length : 0} words <span className="saved-label"><Check size={12} />Saved on this device</span></span>
                  {selectedEntry.status === 'draft' ? (
                    <button className="log-entry-button" onClick={() => updateEntry({ status: 'logged' })} disabled={!selectedEntry.title.trim() && !selectedEntry.body.trim()}><Check size={15} />Log entry</button>
                  ) : (
                    <button className="draft-entry-button" onClick={() => updateEntry({ status: 'draft' })}>Move to drafts</button>
                  )}
                </div>
              </> : <div className="empty-editor"><BookOpen size={24} /><h2>A page for today</h2><p>Start with one small thought.</p><button className="primary-button" onClick={createEntry}><Plus size={16} />Write an entry</button></div>}
            </article>
          </section>
        ) : (
          <section className="todo-page" aria-label="To-do list">
            <div className="todo-heading-row">
              <div><p className="eyebrow">A CLEARER HEADSPACE</p><h1>To-do list</h1><p className="page-subtitle">A few things at a time is plenty.</p></div>
              <div className="task-progress"><div className="progress-icon"><CheckCheck size={19} /></div><div><strong>{remaining}</strong><span>{remaining === 1 ? 'thing left' : 'things left'}</span></div></div>
            </div>
            <form className="add-task-form" onSubmit={addTask}>
              <Plus size={19} />
              <input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task to your list..." aria-label="New task" />
              <button type="submit" disabled={!newTask.trim()}>Add task <span>↵</span></button>
            </form>
            <div className="task-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
                {(['all', 'open', 'done'] as TaskFilter[]).map((option) => (
                  <button key={option} className={filter === option ? 'chosen' : ''} role="tab" aria-selected={filter === option} onClick={() => setFilter(option)}>
                    {option === 'all' ? 'All tasks' : option === 'open' ? 'To do' : 'Completed'}
                    {option === 'all' && <span>{tasks.length}</span>}
                  </button>
                ))}
              </div>
              <span className="task-summary">{tasks.filter((task) => task.done).length} completed</span>
            </div>
            <div className="task-list">
              {visibleTasks.length ? visibleTasks.map((task) => (
                <div className={`task-row ${task.done ? 'is-done' : ''}`} key={task.id}>
                  <button className="task-check" onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={task.done ? `Mark ${task.text} as to do` : `Complete ${task.text}`}>
                    {task.done ? <span className="checked-circle"><Check size={13} /></span> : <Circle size={19} strokeWidth={1.6} />}
                  </button>
                  <span className="task-text">{task.text}</span>
                  <span className="task-created">{formatDate(task.createdAt)}</span>
                  <button className="icon-button delete-task" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`Delete ${task.text}`} title="Delete task"><Trash2 size={16} /></button>
                </div>
              )) : <div className="empty-tasks"><CheckCheck size={23} /><strong>{filter === 'done' ? 'Nothing completed yet' : 'All clear for now'}</strong><span>{filter === 'done' ? 'Finished tasks will find a home here.' : 'Add a task when something comes to mind.'}</span></div>}
            </div>
            <div className="todo-bottom-note"><span className="note-rule" />Small steps still move you forward.</div>
          </section>
        )}

        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button className={section === 'journal' ? 'active' : ''} onClick={() => setSection('journal')}><BookOpen size={18} />Journal</button>
          <button className={section === 'todo' ? 'active' : ''} onClick={() => setSection('todo')}><ClipboardList size={18} />To-do{remaining > 0 && <span>{remaining}</span>}</button>
        </nav>
      </main>
    </div>
  );
}