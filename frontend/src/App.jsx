import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/notes";

const starterNotes = [
  {
    id: "welcome-1",
    title: "Welcome to NoteSpace",
    content:
      "This is your personal notebook connected directly to MongoDB.\n\nClick 'Save Note' (or press Ctrl+S) to store your notes into MongoDB Compass in real-time.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
];

function formatTime(timestamp) {
  if (!timestamp) return "Just now";
  const time = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  if (isNaN(time)) return "Just now";

  const delta = Date.now() - time;
  const minutes = Math.max(1, Math.round(delta / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}

function wordCount(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

const getNoteId = (note) => note?._id || note?.id;

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [saveMessage, setSaveMessage] = useState("");
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all notes from MongoDB on load
  const loadNotesFromDB = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDbConnected(true);
      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
        setSelectedNoteId(data[0]._id);
      } else {
        setNotes([]);
        setSelectedNoteId(null);
      }
    } catch (err) {
      console.warn("Backend not available, using starter notes:", err.message);
      setDbConnected(false);
      setNotes(starterNotes);
      setSelectedNoteId(starterNotes[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotesFromDB();
  }, [loadNotesFromDB]);

  const currentNote = useMemo(
    () => notes.find((note) => getNoteId(note) === selectedNoteId),
    [notes, selectedNoteId]
  );

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        const titleMatch = (note.title || "").toLowerCase().includes(query);
        const contentMatch = (note.content || "").toLowerCase().includes(query);
        return titleMatch || contentMatch;
      }),
    [notes, search]
  );

  function createNote() {
    const newDraft = {
      id: `draft-${Date.now()}`,
      title: "Untitled Note",
      content: "",
      updatedAt: new Date().toISOString(),
      isDraft: true,
    };

    setNotes([newDraft, ...notes]);
    setSelectedNoteId(newDraft.id);
    setSearch("");
    setSaveState("idle");
    setSaveMessage("");
  }

  function updateCurrentNote(field, value) {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        getNoteId(note) === selectedNoteId
          ? { ...note, [field]: value, updatedAt: new Date().toISOString() }
          : note
      )
    );
  }

  // Save current note to Backend & MongoDB
  const handleSaveNote = useCallback(async () => {
    if (!currentNote || saveState === "saving") return;

    setSaveState("saving");
    setSaveMessage("Saving to MongoDB...");

    try {
      const isExistingInDb = Boolean(currentNote._id);
      const url = isExistingInDb ? `${API_URL}/${currentNote._id}` : API_URL;
      const method = isExistingInDb ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentNote.title || "Untitled Note",
          content: currentNote.content || "",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const savedNote = await res.json();

      // Update in state
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          getNoteId(n) === getNoteId(currentNote) ? savedNote : n
        )
      );
      setSelectedNoteId(savedNote._id);
      setDbConnected(true);
      setSaveState("saved");
      setSaveMessage("Saved in MongoDB Compass! ✓");

      setTimeout(() => {
        setSaveState("idle");
        setSaveMessage("");
      }, 2500);
    } catch (err) {
      console.error("Failed to save note:", err);
      setSaveState("error");
      setSaveMessage("Could not save to backend");
      setTimeout(() => {
        setSaveState("idle");
        setSaveMessage("");
      }, 3500);
    }
  }, [currentNote, saveState]);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveNote]);

  // Delete note from DB and state
  async function deleteNote(id) {
    const noteToDelete = notes.find((n) => getNoteId(n) === id);

    if (noteToDelete && noteToDelete._id) {
      try {
        await fetch(`${API_URL}/${noteToDelete._id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Error deleting from backend:", err);
      }
    }

    const remainingNotes = notes.filter((note) => getNoteId(note) !== id);
    setNotes(remainingNotes);
    setSelectedNoteId(
      remainingNotes.length ? getNoteId(remainingNotes[0]) : null
    );
  }

  const words = currentNote ? wordCount(currentNote.content) : 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <div>
            <h1 className="logo">
              NoteSpace<span>.</span>
            </h1>
            <p className="brand-tag">A quiet place to think</p>
            <div
              className={`db-badge ${dbConnected ? "connected" : "disconnected"}`}
              title={
                dbConnected
                  ? "Connected to MongoDB (Compass)"
                  : "Backend disconnected - check backend terminal"
              }
            >
              <span className="db-dot" />
              <span>{dbConnected ? "MongoDB Compass" : "Offline"}</span>
            </div>
          </div>
        </div>

        <button className="new-note" onClick={createNote}>
          <span className="plus" aria-hidden="true">
            +
          </span>
          New note
        </button>

        <label className="search-wrap">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="search"
            placeholder="Search notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="section-row">
          <p className="section-title">Notes</p>
          <span className="note-count">{filteredNotes.length}</span>
        </div>

        <div className="notes-list">
          {loading ? (
            <p className="list-empty">Loading notes from MongoDB…</p>
          ) : filteredNotes.length === 0 ? (
            <p className="list-empty">
              {search.trim()
                ? "No notes match that search."
                : "No notes yet. Create one to begin."}
            </p>
          ) : (
            filteredNotes.map((note) => {
              const noteId = getNoteId(note);
              const isActive = selectedNoteId === noteId;
              return (
                <button
                  key={noteId}
                  className={`note-item ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedNoteId(noteId)}
                >
                  <span className="note-item-title">
                    {note.title || "Untitled Note"}
                  </span>
                  <span className="note-item-preview">
                    {note.content?.trim() || "Empty page"}
                  </span>
                  <span className="note-item-meta">
                    {formatTime(note.updatedAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="editor">
        {currentNote ? (
          <div className="page">
            <header className="editor-header">
              <div className="crumb">
                <span>Notebook</span>
                <span className="crumb-sep">/</span>
                <span className="crumb-current">
                  {currentNote.title || "Untitled Note"}
                </span>
              </div>

              <div className="editor-actions">
                {saveMessage && (
                  <span className={`save-pill ${saveState}`}>
                    {saveMessage}
                  </span>
                )}

                <button
                  className={`save-button ${saveState}`}
                  onClick={handleSaveNote}
                  disabled={saveState === "saving"}
                  title="Save note to MongoDB Compass (Ctrl+S)"
                >
                  {saveState === "saving" ? (
                    <>
                      <span className="spinner" /> Saving...
                    </>
                  ) : saveState === "saved" ? (
                    <>
                      <span>✓</span> Saved
                    </>
                  ) : (
                    <>
                      <span className="save-icon">💾</span> Save Note
                    </>
                  )}
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteNote(getNoteId(currentNote))}
                  title="Delete note"
                >
                  Delete
                </button>
              </div>
            </header>

            <input
              className="title-input"
              value={currentNote.title || ""}
              placeholder="Give this page a title"
              onChange={(e) => updateCurrentNote("title", e.target.value)}
            />

            <textarea
              className="content-input"
              value={currentNote.content || ""}
              placeholder="Start writing…"
              onChange={(e) => updateCurrentNote("content", e.target.value)}
            />

            <footer className="status">
              <span>
                {words} {words === 1 ? "word" : "words"}
              </span>
              <span className="dot" aria-hidden="true" />
              <span>Edited {formatTime(currentNote.updatedAt)}</span>
              {currentNote._id && (
                <>
                  <span className="dot" aria-hidden="true" />
                  <span style={{ opacity: 0.7 }}>Synced with MongoDB</span>
                </>
              )}
            </footer>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">
              ✦
            </span>
            <h2>Your notebook is empty</h2>
            <p>Create a page and start writing. Nothing has to be finished.</p>
            <button className="new-note" onClick={createNote}>
              <span className="plus" aria-hidden="true">
                +
              </span>
              Create note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
