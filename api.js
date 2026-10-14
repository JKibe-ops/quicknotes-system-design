const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const searchInput = document.querySelector("#search-input");
const notesCount = document.querySelector("#notes-count");
const sectionCount = document.querySelector("#section-count");

let isRequestRunning = false;
let notes = [];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  return {
    data: response.status === 204 ? null : await response.json(),
    status: response.status,
  };
}

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  statusMessage.className = state ? `status status-${state}` : "status";
}

function setBusy(isBusy) {
  isRequestRunning = isBusy;
  loadButton.disabled = isBusy;
  submitButton.disabled = isBusy;
  notesList.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
}

function makeNoteElement(note) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.noteId = String(note.id);

  const content = document.createElement("div");
  content.className = "note-content";
  const meta = document.createElement("div");
  meta.className = "note-meta";
  const metaDot = document.createElement("span");
  const metaText = document.createElement("span");
  metaText.textContent = "NOTE";
  meta.append(metaDot, metaText);
  const title = document.createElement("h3");
  title.textContent = note.title;
  const body = document.createElement("p");
  body.textContent = note.body;
  content.append(meta, title, body);

  const deleteButton = document.createElement("button");
  deleteButton.className = "button button-danger";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", "Delete note");
  deleteButton.addEventListener("click", () => deleteNote(note.id));

  const footer = document.createElement("div");
  footer.className = "note-footer";
  const noteId = document.createElement("span");
  noteId.className = "note-id";
  noteId.textContent = `NOTE-${String(note.id).padStart(3, "0")}`;
  footer.append(noteId, deleteButton);
  item.append(content, footer);
  return item;
}

function renderNotes() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleNotes = notes.filter((note) =>
    `${note.title} ${note.body}`.toLocaleLowerCase().includes(query),
  );
  notesCount.textContent = String(notes.length);
  sectionCount.textContent = notes.length === 0 ? "Ready when you are" : `${notes.length} notes`;

  if (visibleNotes.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent =
      notes.length === 0
        ? "Your workspace is clear. Load notes or capture a thought to get started."
        : "No notes match your search.";
    notesList.replaceChildren(emptyState);
    return;
  }

  notesList.replaceChildren(...visibleNotes.map(makeNoteElement));
}

async function loadNotes() {
  if (isRequestRunning) {
    return;
  }

  setBusy(true);
  setStatus("Loading notes...");
  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    notes = data;
    renderNotes();
    setStatus(notes.length === 0 ? "No notes found." : "Loaded 10 notes from the server.", "success");
  } catch (error) {
    setStatus(
      error instanceof Error && error.message.startsWith("Request failed")
        ? `Could not load notes. ${error.message}`
        : "Could not load notes. Please check your connection and try again.",
      "error",
    );
  } finally {
    setBusy(false);
  }
}

async function createNote(title, body) {
  if (isRequestRunning) {
    return;
  }

  setBusy(true);
  setStatus("Creating note…");
  try {
    const { data: note, status } = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    notes.unshift(note);
    renderNotes();
    setStatus(`Note created (status ${status}, id ${note.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteNote(noteId) {
  if (isRequestRunning) {
    return;
  }

  setBusy(true);
  setStatus("Deleting note…");
  try {
    await request(`${API_URL}/${encodeURIComponent(noteId)}`, { method: "DELETE" });
    notes = notes.filter((note) => String(note.id) !== String(noteId));
    // JSONPlaceholder simulates deletes, so this change lasts only in the current page until notes are reloaded.
    renderNotes();
    setStatus(
      notes.length === 0 ? "Note deleted. Your workspace is clear." : "Note deleted successfully.",
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

loadButton.addEventListener("click", loadNotes);
searchInput.addEventListener("input", renderNotes);
document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLElement && (
    target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
  }
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (title.length === 0) {
    setStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  createNote(title, body);
});
