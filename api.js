const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let isRequestRunning = false;

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
  const title = document.createElement("h3");
  title.textContent = note.title;
  const body = document.createElement("p");
  body.textContent = note.body;
  content.append(title, body);

  const deleteButton = document.createElement("button");
  deleteButton.className = "button button-danger";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${note.title}`);
  deleteButton.addEventListener("click", () => deleteNote(note.id, item));

  item.append(content, deleteButton);
  return item;
}

function renderNotes(notes) {
  if (notes.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No notes found. Create your first note.";
    notesList.replaceChildren(emptyState);
    return;
  }

  notesList.replaceChildren(...notes.map(makeNoteElement));
}

async function loadNotes() {
  if (isRequestRunning) {
    return;
  }

  setBusy(true);
  setStatus("Loading notes...");
  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    renderNotes(notes);
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
    const emptyState = notesList.querySelector(".empty-state");
    if (emptyState) {
      emptyState.remove();
    }
    notesList.prepend(makeNoteElement(note));
    setStatus(`Note created (status ${status}, id ${note.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteNote(noteId, item) {
  if (isRequestRunning) {
    return;
  }

  setBusy(true);
  setStatus("Deleting note…");
  try {
    await request(`${API_URL}/${encodeURIComponent(noteId)}`, { method: "DELETE" });
    item.remove();
    // JSONPlaceholder simulates deletes, so this change lasts only in the current page until notes are reloaded.
    if (notesList.children.length === 0) {
      renderNotes([]);
    }
    setStatus(
      notesList.querySelector(".empty-state") ? "No notes yet. Create one to get started." : "Note deleted successfully.",
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
}

loadButton.addEventListener("click", loadNotes);

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
