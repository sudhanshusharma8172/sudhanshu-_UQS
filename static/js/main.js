/**
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
            setLoadingState(false);
        }
    });

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
});
