document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const titleInput = document.getElementById("titleInput");
    const categorySelect = document.getElementById("categorySelect");
    const tagsInput = document.getElementById("tagsInput");
    const tagsInputField = tagsInput.querySelector("input");
    const pasteArea = document.getElementById("pasteArea");
    const saveButton = document.getElementById("saveButton");
    const clearButton = document.getElementById("clearButton");
    const copyButton = document.getElementById("copyButton");
    const searchInput = document.getElementById("searchInput");
    const filterCategory = document.getElementById("filterCategory");
    const notesList = document.getElementById("notesList");
    const themeToggle = document.getElementById("themeToggle");
    const modal = document.getElementById("noteModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalTags = document.getElementById("modalTags");
    const modalContent = document.getElementById("modalContent");
    const closeModalBtn = document.querySelector(".close-btn");
    const searchOptions = document.querySelectorAll('.search-option');
    const exportBtn = document.getElementById('exportBtn');

    let currentTags = new Set();

    // Custom Alert Function
    function showAlert(message, duration = 3000) {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = 'custom-alert';
        alert.textContent = message;
        document.body.appendChild(alert);

        // Remove alert after duration
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => alert.remove(), 300);
        }, duration);
    }

    // Theme Management
    function initializeTheme() {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
            themeToggle.textContent = "☀️";
        }
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    // Tags Management
    function addTag(tagText) {
        if (tagText.length === 0 || currentTags.has(tagText) || currentTags.size >= 5) return;
        
        currentTags.add(tagText);
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.innerHTML = `${escapeHtml(tagText)}<span class="tag-remove">×</span>`;
        
        tag.querySelector(".tag-remove").addEventListener("click", () => {
            currentTags.delete(tagText);
            tag.remove();
        });

        tagsInput.insertBefore(tag, tagsInputField);
    }

    tagsInputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
            e.preventDefault();
            addTag(e.target.value.trim());
            e.target.value = "";
        }
    });

    // Note Management
    function saveNote() {
        const title = titleInput.value.trim();
        const category = categorySelect.value;
        const content = pasteArea.value.trim();
        const tags = Array.from(currentTags);

        if (!title || !content) {
            showAlert("Please enter both title and content!");
            return;
        }

        const noteObj = {
            id: Date.now(),
            title,
            category,
            content,
            tags,
            timestamp: new Date().toISOString()
        };

        saveNoteToLocalStorage(noteObj);
        addNoteToDOM(noteObj);
        clearInputs();
        showAlert("Note saved successfully!");
    }

    function clearInputs() {
        titleInput.value = "";
        categorySelect.value = "";
        pasteArea.value = "";
        currentTags.clear();
        const tags = tagsInput.querySelectorAll(".tag");
        tags.forEach(tag => tag.remove());
    }

    // Local Storage Operations
    function saveNoteToLocalStorage(noteObj) {
        let notes = JSON.parse(localStorage.getItem("notes")) || [];
        notes = notes.filter(note => note.id !== noteObj.id);
        notes.push(noteObj);
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    function deleteNoteFromStorage(id) {
        let notes = JSON.parse(localStorage.getItem("notes")) || [];
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    // DOM Operations
    function addNoteToDOM(noteObj) {
        const noteItem = document.createElement("div");
        noteItem.className = "saved-item";
        noteItem.dataset.note = JSON.stringify(noteObj);

        const date = new Date(noteObj.timestamp).toLocaleDateString();
        
        noteItem.innerHTML = `
            <h3>${escapeHtml(noteObj.title)}</h3>
            ${noteObj.category ? `<span class="note-category">${escapeHtml(noteObj.category)}</span>` : ''}
            <p class="note-preview">${escapeHtml(noteObj.content)}</p>
            <div class="note-tags">
                ${noteObj.tags.map(tag => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="note-date">${date}</div>
            <button class="delete-btn">Delete</button>
        `;

        noteItem.querySelector(".delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteNote(noteObj.id, noteItem);
        });

        noteItem.addEventListener("click", () => openNoteInModal(noteObj));
        notesList.insertBefore(noteItem, notesList.firstChild);
    }

    function deleteNote(id, element) {
        if (confirm("Are you sure you want to delete this note?")) {
            deleteNoteFromStorage(id);
            element.remove();
            showAlert("Note deleted successfully!");
        }
    }

    // Modal Operations
    function openNoteInModal(noteObj) {
        modalTitle.textContent = noteObj.title;
        modalCategory.textContent = noteObj.category || "No category";
        modalTags.innerHTML = noteObj.tags
            .map(tag => `<span class="modal-tag">${escapeHtml(tag)}</span>`)
            .join('');
        modalContent.innerHTML = `<pre>${escapeHtml(noteObj.content)}</pre>`;
        modal.style.display = "flex";
    }

    // Search and Filter Operations
    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = filterCategory.value;
        const searchType = document.querySelector('.search-option.active').dataset.search;
        const notes = document.querySelectorAll(".saved-item");
        let hasResults = false;

        notes.forEach(note => {
            const noteObj = JSON.parse(note.dataset.note);
            let matchesSearch = false;

            switch(searchType) {
                case 'title':
                    matchesSearch = noteObj.title.toLowerCase().includes(searchTerm);
                    break;
                case 'content':
                    matchesSearch = noteObj.content.toLowerCase().includes(searchTerm);
                    break;
                case 'tags':
                    matchesSearch = noteObj.tags.some(tag => 
                        tag.toLowerCase().includes(searchTerm)
                    );
                    break;
                default: // 'all'
                    matchesSearch = noteObj.title.toLowerCase().includes(searchTerm) ||
                                  noteObj.content.toLowerCase().includes(searchTerm) ||
                                  noteObj.tags.some(tag => 
                                      tag.toLowerCase().includes(searchTerm)
                                  );
            }

            const matchesCategory = !categoryFilter || noteObj.category === categoryFilter;
            const shouldShow = matchesSearch && matchesCategory;
            note.style.display = shouldShow ? "block" : "none";
            if (shouldShow) hasResults = true;
        });

        updateNoResultsMessage(hasResults);
    }

    function updateNoResultsMessage(hasResults) {
        let noResultsMsg = document.querySelector('.no-results');
        if (!hasResults) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results';
                noResultsMsg.textContent = 'No matching notes found';
                notesList.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }

    // Export Functionality
    function exportNotes() {
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const dataStr = "data:text/json;charset=utf-8," + 
            encodeURIComponent(JSON.stringify(notes, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "snippetsync_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showAlert("Notes exported successfully!");
    }

    // Utility Functions
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Event Listeners
    saveButton.addEventListener("click", saveNote);
    clearButton.addEventListener("click", clearInputs);
    copyButton.addEventListener("click", () => {
        pasteArea.select();
        document.execCommand("copy");
        showAlert("Copied to clipboard!");
    });
    closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));
    searchInput.addEventListener("input", filterNotes);
    filterCategory.addEventListener("change", filterNotes);
    searchOptions.forEach(option => 
        option.addEventListener('click', function() {
            searchOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            filterNotes();
        })
    );
    exportBtn.addEventListener("click", exportNotes);

    // Initialize
    initializeTheme();
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    savedNotes.forEach(note => addNoteToDOM(note));
});
