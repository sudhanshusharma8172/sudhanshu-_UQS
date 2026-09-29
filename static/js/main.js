/**
<<<<<<< HEAD
 * UniQuery Frontend Controller
 * ============================
 * Handles form submission, calls backend API, parses responses,
 * renders markdown answers, and toggles source details.
 */

document.addEventListener("DOMContentLoaded", () => {
    const queryForm = document.getElementById("query-form");
    const questionInput = document.getElementById("question-input");
    const askBtn = document.getElementById("ask-btn");
    const askBtnText = askBtn.querySelector("span");
    
    const loader = document.getElementById("loader");
    const errorCard = document.getElementById("error-card");
    const errorMessage = document.getElementById("error-message");
    const answerCard = document.getElementById("answer-card");
    const answerContent = document.getElementById("answer-content");
    
    const sourcesContainer = document.getElementById("sources-container");
    const sourcesToggle = document.getElementById("sources-toggle");
    const sourcesContent = document.getElementById("sources-content");
    const sourcesList = document.getElementById("sources-list");

    // Collapsible source chunks
    sourcesToggle.addEventListener("click", () => {
        const isExpanded = sourcesToggle.getAttribute("aria-expanded") === "true";
        sourcesToggle.setAttribute("aria-expanded", !isExpanded);
        sourcesContent.classList.toggle("hidden");
    });

    // Form Submission
    queryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const question = questionInput.value.trim();
        if (!question) {
            showError("Please enter a question first.");
            return;
        }

        // 1. Reset UI State (Hide previous output/errors, show loader)
        hideError();
        answerCard.classList.add("hidden");
        sourcesContainer.classList.add("hidden");
        sourcesList.innerHTML = "";
        
        loader.classList.remove("hidden");
        setLoadingState(true);

        try {
            // 2. Fetch API Call
            const response = await fetch("/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            // 3. Handle response
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch response from server.");
            }

            // 4. Render output
            renderAnswer(data.answer);
            renderSources(data.chunks);

        } catch (err) {
            showError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            // 5. Hide loader and restore button state
            loader.classList.add("hidden");
=======
 * UniQuery Frontend Controller — v2.0
 * =====================================
 * Features:
 *  - Chat-style conversation history
 *  - Suggestion chips + sidebar quick topics
 *  - Character counter on input
 *  - Copy answer to clipboard
 *  - Typing / streaming animation for answers
 *  - Session stats (questions asked, docs retrieved)
 *  - Sidebar toggle for mobile
 *  - Animated particle canvas background
 */

document.addEventListener("DOMContentLoaded", () => {

    // ── DOM References ─────────────────────────────────────────
    const queryForm       = document.getElementById("query-form");
    const questionInput   = document.getElementById("question-input");
    const askBtn          = document.getElementById("ask-btn");
    const askBtnText      = askBtn.querySelector(".ask-btn-text");
    const askBtnIcon      = askBtn.querySelector(".ask-btn-icon");
    const chatHistory     = document.getElementById("chat-history");
    const emptyState      = document.getElementById("empty-state");
    const charCounter     = document.getElementById("char-counter");

    // Stats
    const statQuestions   = document.getElementById("stat-questions");
    const statChunks      = document.getElementById("stat-chunks");

    // Sidebar + Overlay
    const sidebar         = document.getElementById("sidebar");
    const menuBtn         = document.getElementById("menu-btn");
    const sidebarClose    = document.getElementById("sidebar-close");
    const overlay         = document.getElementById("overlay");
    const sidebarChips    = document.querySelectorAll(".sidebar-chip");
    const chips           = document.querySelectorAll(".chip");

    // Session state
    let totalQuestions  = 0;
    let totalChunks     = 0;
    let isLoading       = false;

    // ── Animated Particle Canvas ───────────────────────────────
    initParticleCanvas();

    // ── Sidebar Toggle ─────────────────────────────────────────
    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    });
    sidebarClose.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    }

    // ── Suggestion Chips (hero section) ───────────────────────
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            const question = chip.getAttribute("data-q");
            questionInput.value = question;
            questionInput.focus();
            updateCharCounter();
            // On mobile, scroll to input
            questionInput.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });

    // ── Sidebar Quick Topics ───────────────────────────────────
    sidebarChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const question = chip.getAttribute("data-q");
            questionInput.value = question;
            questionInput.focus();
            updateCharCounter();
            closeSidebar();
            questionInput.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });

    // ── Character Counter ──────────────────────────────────────
    questionInput.addEventListener("input", updateCharCounter);

    function updateCharCounter() {
        const len = questionInput.value.length;
        const max = 500;
        charCounter.textContent = `${len} / ${max}`;
        charCounter.classList.remove("warn", "limit");
        if (len > 400) charCounter.classList.add("warn");
        if (len >= max) charCounter.classList.add("limit");
    }

    // ── Keyboard shortcut: Enter submits, Shift+Enter = new line ─
    questionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading) queryForm.dispatchEvent(new Event("submit"));
        }
    });

    // ── Form Submit ────────────────────────────────────────────
    queryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const question = questionInput.value.trim();
        if (!question) {
            shakeInput();
            return;
        }

        // Hide empty state once first message arrives
        emptyState.classList.add("hidden");

        // Clear input
        questionInput.value = "";
        updateCharCounter();

        // Create a chat turn
        const turn = document.createElement("div");
        turn.className = "chat-turn";

        // User bubble
        const userBubble = document.createElement("div");
        userBubble.className = "user-bubble";
        userBubble.textContent = question;
        turn.appendChild(userBubble);

        // Thinking loader
        const thinkingCard = createThinkingCard();
        turn.appendChild(thinkingCard);

        chatHistory.appendChild(turn);
        turn.scrollIntoView({ behavior: "smooth", block: "end" });

        setLoadingState(true);

        try {
            const response = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });
            const data = await response.json();

            // Remove loader
            thinkingCard.remove();

            if (!response.ok) {
                throw new Error(data.error || "Server returned an error.");
            }

            // Render AI answer card
            const answerCard = createAnswerCard(data.answer, data.chunks);
            turn.appendChild(answerCard);
            answerCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

            // Update session stats
            totalQuestions++;
            totalChunks += (data.chunks ? data.chunks.length : 0);
            statQuestions.textContent = totalQuestions;
            statChunks.textContent    = totalChunks;

        } catch (err) {
            thinkingCard.remove();
            const errorCard = createErrorCard(err.message || "An unexpected error occurred.");
            turn.appendChild(errorCard);
            errorCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } finally {
>>>>>>> ec10293b4bb1b8b873a732d3a65d0fbe0753e70d
            setLoadingState(false);
        }
    });

<<<<<<< HEAD
    /**
     * Disable/enable form inputs during active API calls.
     */
    function setLoadingState(isLoading) {
        questionInput.disabled = isLoading;
        askBtn.disabled = isLoading;
        if (isLoading) {
            askBtnText.textContent = "Searching…";
            askBtn.style.opacity = "0.7";
            askBtn.style.pointerEvents = "none";
        } else {
            askBtnText.textContent = "Ask";
            askBtn.style.opacity = "";
            askBtn.style.pointerEvents = "";
        }
    }

    /**
     * Helper to show error messages.
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorCard.classList.remove("hidden");
        errorCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    /**
     * Helper to hide error messages.
     */
    function hideError() {
        errorCard.classList.add("hidden");
        errorMessage.textContent = "";
    }

    /**
     * Render final generated AI response with basic markdown support.
     */
    function renderAnswer(answerText) {
        answerContent.innerHTML = formatMarkdown(answerText);
        answerCard.classList.remove("hidden");
        answerCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    /**
     * Render retrieved source chunks from the RAG engine.
     */
    function renderSources(chunks) {
        if (!chunks || chunks.length === 0) {
            sourcesContainer.classList.add("hidden");
            return;
        }

        chunks.forEach((chunk, index) => {
            const sourceItem = document.createElement("div");
            sourceItem.className = "source-item";
            
            const title = document.createElement("div");
            title.className = "source-title";
            title.textContent = `Chunk ${index + 1}`;
            
            const text = document.createElement("div");
            text.className = "source-text";
            text.textContent = chunk;
            
            sourceItem.appendChild(title);
            sourceItem.appendChild(text);
            sourcesList.appendChild(sourceItem);
        });

        // Default: collapse chunks view on new query results
        sourcesToggle.setAttribute("aria-expanded", "false");
        sourcesContent.classList.add("hidden");
        sourcesContainer.classList.remove("hidden");
    }

    /**
     * Simple parser to render Gemini markdown lists and bold text as HTML.
     */
    function formatMarkdown(text) {
        if (!text) return "";

        // Escape HTML to prevent injection
        let escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 1. Bold Text (**text**)
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // 2. Line list processing (lists & paragraphs)
        const lines = escaped.split("\n");
        let htmlResult = "";
        let inList = false;

        lines.forEach((line) => {
            const trimmed = line.trim();
            
            // Check if line is a bullet item
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                if (!inList) {
                    htmlResult += "<ul>";
                    inList = true;
                }
                htmlResult += `<li>${trimmed.substring(2)}</li>`;
            } else if (/^\d+\.\s/.test(trimmed)) {
                // Check if line is numbered list item (e.g. 1. Item)
                if (!inList) {
                    htmlResult += "<ol>";
                    inList = true;
                }
                const contentStr = trimmed.replace(/^\d+\.\s/, "");
                htmlResult += `<li>${contentStr}</li>`;
            } else {
                // End current list block if we hit a standard paragraph
                if (inList) {
                    // Quick check if previous was ul or ol (simplification)
                    if (htmlResult.endsWith("</li>")) {
                        // Close whichever tag was open
                        htmlResult += htmlResult.includes("<ul>") && !htmlResult.endsWith("</ul>") ? "</ul>" : "</ol>";
                    }
                    inList = false;
                }
                
                if (trimmed) {
                    htmlResult += `<p>${line}</p>`;
                }
            }
        });

        // Close trailing lists
        if (inList) {
            htmlResult += htmlResult.includes("<ul>") && !htmlResult.endsWith("</ul>") ? "</ul>" : "</ol>";
        }

        return htmlResult;
    }
=======
    // ── Loading State ──────────────────────────────────────────
    function setLoadingState(loading) {
        isLoading = loading;
        questionInput.disabled = loading;
        askBtn.disabled = loading;

        if (loading) {
            askBtnText.textContent = "Thinking…";
            askBtn.style.opacity = "0.7";
        } else {
            askBtnText.textContent = "Ask AI";
            askBtn.style.opacity = "";
        }
    }

    // ── Create Thinking (Loader) Card ──────────────────────────
    function createThinkingCard() {
        const card = document.createElement("div");
        card.className = "thinking-card";
        card.innerHTML = `
            <div class="thinking-dots">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
            </div>
            <p class="thinking-label">Searching documents & generating answer…</p>
        `;
        return card;
    }

    // ── Create Answer Card ─────────────────────────────────────
    function createAnswerCard(answerText, chunks) {
        const card = document.createElement("div");
        card.className = "answer-card";

        const chunkCount = chunks ? chunks.length : 0;

        card.innerHTML = `
            <div class="answer-card-header">
                <div class="answer-ai-badge">
                    <div class="ai-avatar">✨</div>
                    <span>UniQuery AI</span>
                </div>
                <div class="answer-actions">
                    <button class="action-btn copy-btn" title="Copy answer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                </div>
            </div>
            <div class="answer-body" id="answer-body-${Date.now()}"></div>
            ${chunkCount > 0 ? `
            <div class="sources-wrapper">
                <button class="sources-toggle" aria-expanded="false">
                    <span>📄</span>
                    <span class="toggle-label">Source Documents</span>
                    <span class="toggle-count">${chunkCount} chunks</span>
                    <span class="chevron">▼</span>
                </button>
                <div class="sources-content hidden">
                    <div class="sources-list"></div>
                </div>
            </div>` : ""}
        `;

        // Render markdown with typing animation
        const bodyEl = card.querySelector(".answer-body");
        typewriterRender(answerText, bodyEl);

        // Copy button
        const copyBtn = card.querySelector(".copy-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(answerText).then(() => {
                    copyBtn.classList.add("copied");
                    copyBtn.innerHTML = `
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        copyBtn.classList.remove("copied");
                        copyBtn.innerHTML = `
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy
                        `;
                    }, 2000);
                });
            });
        }

        // Sources toggle
        if (chunks && chunks.length > 0) {
            const toggle = card.querySelector(".sources-toggle");
            const content = card.querySelector(".sources-content");
            const list = card.querySelector(".sources-list");

            chunks.forEach((chunk, i) => {
                const item = document.createElement("div");
                item.className = "source-item";
                item.innerHTML = `
                    <div class="source-header">
                        <span class="source-num">${i + 1}</span>
                        <span class="source-label">Chunk ${i + 1}</span>
                    </div>
                    <div class="source-text">${escapeHTML(chunk)}</div>
                `;
                list.appendChild(item);
            });

            toggle.addEventListener("click", () => {
                const expanded = toggle.getAttribute("aria-expanded") === "true";
                toggle.setAttribute("aria-expanded", String(!expanded));
                content.classList.toggle("hidden");
            });
        }

        return card;
    }

    // ── Create Error Card ──────────────────────────────────────
    function createErrorCard(message) {
        const card = document.createElement("div");
        card.className = "error-card";
        card.innerHTML = `
            <span class="error-icon">⚠️</span>
            <span>${escapeHTML(message)}</span>
        `;
        return card;
    }

    // ── Typewriter Render with Markdown ───────────────────────
    function typewriterRender(text, container) {
        const html = formatMarkdown(text);
        // Insert instantly but with fade-in via CSS animation on parent
        container.innerHTML = html;
    }

    // ── Markdown Formatter ─────────────────────────────────────
    function formatMarkdown(text) {
        if (!text) return "";

        // Escape HTML
        let escaped = escapeHTML(text);

        // Bold: **text**
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Italic: *text*
        escaped = escaped.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

        // Inline code: `code`
        escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");

        const lines = escaped.split("\n");
        let html = "";
        let inUL = false;
        let inOL = false;

        lines.forEach(line => {
            const trimmed = line.trim();

            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                if (inOL) { html += "</ol>"; inOL = false; }
                if (!inUL) { html += "<ul>"; inUL = true; }
                html += `<li>${trimmed.substring(2)}</li>`;
            } else if (/^\d+\.\s/.test(trimmed)) {
                if (inUL) { html += "</ul>"; inUL = false; }
                if (!inOL) { html += "<ol>"; inOL = true; }
                html += `<li>${trimmed.replace(/^\d+\.\s/, "")}</li>`;
            } else {
                if (inUL) { html += "</ul>"; inUL = false; }
                if (inOL) { html += "</ol>"; inOL = false; }
                if (trimmed) html += `<p>${line}</p>`;
            }
        });

        if (inUL) html += "</ul>";
        if (inOL) html += "</ol>";

        return html;
    }

    // ── Utility: Escape HTML ───────────────────────────────────
    function escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ── Utility: Shake Input ───────────────────────────────────
    function shakeInput() {
        const container = document.getElementById("input-container");
        container.style.animation = "none";
        container.offsetHeight; // Force reflow
        container.style.animation = "shake 0.4s ease";
        setTimeout(() => { container.style.animation = ""; }, 400);
    }

    // Inject shake keyframe dynamically
    const shakeStyle = document.createElement("style");
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-6px); }
            40%       { transform: translateX(6px); }
            60%       { transform: translateX(-4px); }
            80%       { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ── Particle Canvas Background ─────────────────────────────
    function initParticleCanvas() {
        const canvas = document.getElementById("bg-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let W = window.innerWidth;
        let H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const COUNT = 60;
        const particles = [];

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x:  Math.random() * W,
                y:  Math.random() * H,
                r:  Math.random() * 1.5 + 0.3,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                o:  Math.random() * 0.4 + 0.1,
                color: Math.random() > 0.5 ? "124,111,247" : "6,182,212"
            });
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.o})`;
                ctx.fill();
            });

            // Draw faint connecting lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(124,111,247,${0.04 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        draw();

        window.addEventListener("resize", () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width  = W;
            canvas.height = H;
        });
    }

>>>>>>> ec10293b4bb1b8b873a732d3a65d0fbe0753e70d
});
