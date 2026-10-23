
"use strict";

// ========================================
// SmartMatch - Candidate Matching Platform
// ========================================

// Form elements
const matchForm = document.getElementById("matchForm");
const jobDescriptionInput = document.getElementById("jobDescription");
const resumesInput = document.getElementById("resumes");
const fileCount = document.getElementById("fileCount");
const matchButton = document.getElementById("matchButton");
const demoButton = document.getElementById("demoButton");
const statusMessage = document.getElementById("statusMessage");

// Dashboard elements
const dashboard = document.getElementById("dashboard");
const totalCandidatesElement = document.getElementById("totalCandidates");
const averageScoreElement = document.getElementById("averageScore");
const topScoreElement = document.getElementById("topScore");
const candidateList = document.getElementById("candidateList");
const jobSkillsContainer = document.getElementById("jobSkills");
const failedSection = document.getElementById("failedSection");
const failedList = document.getElementById("failedList");
const downloadButton = document.getElementById("downloadButton");
const demoNotice = document.getElementById("demoNotice");

// Search and filter elements
const candidateSearch = document.getElementById("candidateSearch");
const minimumScore = document.getElementById("minimumScore");
const resetFiltersButton = document.getElementById("resetFilters");
const filterSummary = document.getElementById("filterSummary");
const noCandidatesMessage = document.getElementById("noCandidatesMessage");

// Application state
let latestResults = null;
let isDemoResults = false;

// ========================================
// General helpers
// ========================================

function showStatus(message, type = "info") {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
}

function createElement(tagName, className, text = "") {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;
    return element;
}

function normalizeSkillList(skills) {
    if (!Array.isArray(skills)) {
        return [];
    }

    return skills.map((skill) => {
        if (typeof skill === "string") {
            return skill;
        }

        if (skill && typeof skill === "object") {
            return skill.name || skill.skill || String(skill);
        }

        return String(skill);
    });
}

function getCandidateName(candidate) {
    return (
        candidate.name ||
        candidate.filename ||
        candidate.fileName ||
        candidate.resumeName ||
        candidate.resume ||
        candidate.candidateName ||
        "Unknown Candidate"
    );
}

function getCandidateScore(candidate) {
    const rawScore =
        candidate.score ??
        candidate.matchScore ??
        candidate.matchPercentage ??
        candidate.percentage ??
        0;

    const score = Number(rawScore);

    if (!Number.isFinite(score)) {
        return 0;
    }

    const percentage =
        score > 0 && score <= 1 ? score * 100 : score;

    return Math.max(0, Math.min(100, Math.round(percentage)));
}

function getMatchedSkills(candidate) {
    return normalizeSkillList(
        candidate.matchedSkills ||
        candidate.matched_skills ||
        candidate.matched ||
        []
    );
}

function getMissingSkills(candidate) {
    return normalizeSkillList(
        candidate.missingSkills ||
        candidate.missing_skills ||
        candidate.missing ||
        candidate.skillsToDevelop ||
        []
    );
}

function getJobSkills(data) {
    return normalizeSkillList(
        data.jobSkills ||
        data.job_skills ||
        data.requiredSkills ||
        data.skills ||
        []
    );
}

function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

// ========================================
// Resume file selection
// ========================================

resumesInput.addEventListener("change", () => {
    const files = Array.from(resumesInput.files || []);
    const pdfFiles = files.filter((file) =>
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
        fileCount.textContent = "No PDF files selected";
    } else {
        fileCount.textContent =
            `${pdfFiles.length} PDF resume(s) selected`;
    }
});

// ========================================
// Skill display
// ========================================

function renderSkills(container, skills, className = "skill") {
    container.replaceChildren();

    if (!skills || skills.length === 0) {
        container.appendChild(
            createElement("span", "muted-text", "None detected")
        );
        return;
    }

    skills.forEach((skill) => {
        container.appendChild(
            createElement("span", className, skill)
        );
    });
}

// ========================================
// Candidate Insights and Skill Gap Analysis
// ========================================

function createMatchExplanation(candidate) {
    const explanation = createElement(
        "div",
        "candidate-explanation"
    );

    const matchedSkills = getMatchedSkills(candidate);
    const missingSkills = getMissingSkills(candidate);
    const score = getCandidateScore(candidate);

    const heading = createElement(
        "h4",
        "",
        "Candidate Insights"
    );

    const summary = createElement(
        "p",
        "",
        `Match score: ${score}%. The system detected ` +
        `${matchedSkills.length} matching skill(s) and ` +
        `${missingSkills.length} skill gap(s).`
    );

    const strengthHeading = createElement(
        "h4",
        "",
        "Candidate Strengths"
    );

    const strengthText = createElement(
        "p",
        "",
        matchedSkills.length > 0
            ? `Relevant skills found: ${matchedSkills.join(", ")}.`
            : "No matching skills detected. Review the resume manually."
    );

    const matchedHeading = createElement(
        "p",
        "",
        "Matched job requirements:"
    );

    const matchedContainer = createElement(
        "div",
        "skill-list"
    );

    renderSkills(matchedContainer, matchedSkills);

    const gapHeading = createElement(
        "h4",
        "",
        "Skill Gap Analysis"
    );

    const gapText = createElement(
        "p",
        "",
        missingSkills.length > 0
            ? `Skills to verify or develop: ${missingSkills.join(", ")}.`
            : "All detected job skills matched. Verify practical experience."
    );

    const missingContainer = createElement(
        "div",
        "skill-list"
    );

    renderSkills(missingContainer, missingSkills);

    const recommendationHeading = createElement(
        "h4",
        "",
        "Suggested Next Step"
    );

    let recommendation;

    if (score >= 80) {
        recommendation =
            "Consider a technical interview to verify practical skills.";
    } else if (score >= 50) {
        recommendation =
            "Review the skill gaps and consider a focused technical assessment.";
    } else {
        recommendation =
            "Review the resume manually before deciding on next steps.";
    }

    const recommendationText = createElement(
        "p",
        "",
        recommendation
    );

    const note = createElement(
        "p",
        "muted-text",
        "These insights are generated from rule-based skill matching, " +
        "not an AI assessment. Scores do not prove ability or determine " +
        "suitability. Verify skills fairly through human review."
    );

    explanation.append(
        heading,
        summary,
        strengthHeading,
        strengthText,
        matchedHeading,
        matchedContainer,
        gapHeading,
        gapText,
        missingContainer,
        recommendationHeading,
        recommendationText,
        note
    );

    return explanation;
}

// ========================================
// Candidate card
// ========================================

function renderCandidate(candidate, rank) {
    const card = createElement("article", "candidate-card");

    const header = createElement("div", "candidate-header");
    const nameGroup = createElement("div", "candidate-name-group");

    const rankLabel = createElement(
        "p",
        "candidate-rank",
        `Rank #${rank}`
    );

    const name = createElement(
        "h3",
        "candidate-name",
        getCandidateName(candidate)
    );

    nameGroup.append(rankLabel, name);

    const score = getCandidateScore(candidate);

    const scoreLabel = createElement(
        "span",
        "score-label",
        `${score}%`
    );

    header.append(nameGroup, scoreLabel);

    const progressTrack = createElement("div", "score-track");
    const progressBar = createElement("div", "score-fill");

    progressBar.style.width = `${score}%`;
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuenow", String(score));
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute(
        "aria-label",
        `Match score: ${score}%`
    );

    progressTrack.appendChild(progressBar);

    const matchedHeading = createElement(
        "h4",
        "skills-heading",
        "Matched Skills"
    );

    const matchedContainer = createElement("div", "skill-list");

    renderSkills(matchedContainer, getMatchedSkills(candidate));

    const missingHeading = createElement(
        "h4",
        "skills-heading",
        "Skills to Develop / Missing"
    );

    const missingContainer = createElement("div", "skill-list");

    renderSkills(missingContainer, getMissingSkills(candidate));

    const explanationButton = createElement(
        "button",
        "view-details-button",
        "View Candidate Insights"
    );

    explanationButton.type = "button";
    explanationButton.setAttribute("aria-expanded", "false");

    let explanation = null;

    explanationButton.addEventListener("click", () => {
        if (explanation) {
            explanation.remove();
            explanation = null;

            explanationButton.textContent = "View Candidate Insights";
            explanationButton.setAttribute("aria-expanded", "false");
        } else {
            explanation = createMatchExplanation(candidate);

            explanationButton.insertAdjacentElement(
                "afterend",
                explanation
            );

            explanationButton.textContent = "Hide Candidate Insights";
            explanationButton.setAttribute("aria-expanded", "true");
        }
    });

    card.append(
        header,
        progressTrack,
        matchedHeading,
        matchedContainer,
        missingHeading,
        missingContainer,
        explanationButton
    );

    return card;
}

// ========================================
// Candidate Search and Filter
// ========================================

function getVisibleCandidates() {
    if (!latestResults || !Array.isArray(latestResults.candidates)) {
        return [];
    }

    const searchText = candidateSearch.value.trim().toLowerCase();
    const minScore = Number(minimumScore.value) || 0;

    return latestResults.candidates.filter((candidate) => {
        const name = getCandidateName(candidate).toLowerCase();

        const matchesName = name.includes(searchText);
        const matchesScore = getCandidateScore(candidate) >= minScore;

        return matchesName && matchesScore;
    });
}

function renderFilteredCandidates() {
    if (!latestResults) {
        return;
    }

    const visibleCandidates = getVisibleCandidates();

    candidateList.replaceChildren();

    visibleCandidates.forEach((candidate) => {
        const originalRank =
            latestResults.candidates.indexOf(candidate) + 1;

        candidateList.appendChild(
            renderCandidate(candidate, originalRank)
        );
    });

    filterSummary.textContent =
        `Showing ${visibleCandidates.length} of ` +
        `${latestResults.candidates.length} candidates`;

    noCandidatesMessage.hidden = visibleCandidates.length !== 0;
}

candidateSearch.addEventListener("input", renderFilteredCandidates);
minimumScore.addEventListener("change", renderFilteredCandidates);

resetFiltersButton.addEventListener("click", () => {
    candidateSearch.value = "";
    minimumScore.value = "0";
    renderFilteredCandidates();
});

// ========================================
// Dashboard rendering
// ========================================

function renderDashboard(data) {
    const candidates =
        data.candidates ||
        data.results ||
        data.rankedCandidates ||
        [];

    if (!Array.isArray(candidates)) {
        throw new Error(
            "The server response does not contain a valid candidate list."
        );
    }

    const sortedCandidates = candidates.slice().sort(
        (a, b) => getCandidateScore(b) - getCandidateScore(a)
    );

    latestResults = {
        ...data,
        candidates: sortedCandidates
    };

    const scores = sortedCandidates.map(getCandidateScore);

    const averageScore = scores.length
        ? Math.round(
            scores.reduce((total, score) => total + score, 0) /
            scores.length
        )
        : 0;

    const topScore = scores.length ? Math.max(...scores) : 0;

    totalCandidatesElement.textContent = String(scores.length);
    averageScoreElement.textContent = `${averageScore}%`;
    topScoreElement.textContent = `${topScore}%`;

    renderSkills(jobSkillsContainer, getJobSkills(data));

    candidateSearch.value = "";
    minimumScore.value = "0";

    renderFilteredCandidates();

    const failedFiles =
        data.failedFiles ||
        data.failed ||
        data.errors ||
        [];

    failedList.replaceChildren();

    if (Array.isArray(failedFiles) && failedFiles.length > 0) {
        failedFiles.forEach((file) => {
            const message = typeof file === "string"
                ? file
                : (
                    file.filename ||
                    file.fileName ||
                    file.name ||
                    file.resume ||
                    file.message ||
                    "A file could not be analyzed"
                );

            failedList.appendChild(
                createElement("p", "failed-file", message)
            );
        });

        failedSection.hidden = false;
    } else {
        failedSection.hidden = true;
    }

    demoNotice.hidden = !isDemoResults;
    dashboard.hidden = false;

    dashboard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ========================================
// Real PDF Resume Matching
// ========================================

matchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const jobDescription = jobDescriptionInput.value.trim();
    const files = Array.from(resumesInput.files || []);

    if (!jobDescription) {
        showStatus("Please enter a job description.", "error");
        return;
    }

    if (files.length === 0) {
        showStatus("Please select at least one PDF resume.", "error");
        return;
    }

    if (files.length > 20) {
        showStatus(
            "Please select no more than 20 PDF resumes.",
            "error"
        );
        return;
    }

    const invalidFiles = files.filter(
        (file) => !file.name.toLowerCase().endsWith(".pdf")
    );

    if (invalidFiles.length > 0) {
        showStatus("Please upload PDF files only.", "error");
        return;
    }

    const formData = new FormData();

    formData.append("jobDescription", jobDescription);

    files.forEach((file) => {
        formData.append("resumes", file);
    });

    matchButton.disabled = true;
    demoButton.disabled = true;
    matchButton.textContent = "Analyzing Resumes...";

    showStatus("Analyzing resumes. Please wait...", "info");

    isDemoResults = false;

    try {
        const response = await fetch("/api/match", {
            method: "POST",
            body: formData
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server returned an invalid response. Check the backend terminal."
            );
        }

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message ||
                data.error ||
                "Resume analysis failed."
            );
        }

        renderDashboard(data);

        showStatus(
            `Analysis completed! ${latestResults.candidates.length} candidate(s) processed.`,
            "success"
        );
    } catch (error) {
        console.error("Resume matching error:", error);

        showStatus(
            error.message ||
            "Unable to analyze resumes. Please try again.",
            "error"
        );
    } finally {
        matchButton.disabled = false;
        demoButton.disabled = false;
        matchButton.textContent = "Analyze & Rank Candidates";
    }
});

// ========================================
// Demo Mode
// ========================================

function detectDemoSkills(jobDescription) {
    const patterns = [
        ["Spring Boot", /\bspring[\s.-]*boot\b/i],
        ["REST API", /\brest\s*(?:api|apis)?\b|\brestful\b/i],
        ["JavaScript", /\bjavascript\b/i],
        ["Java", /\bjava\b/i],
        ["Python", /\bpython\b/i],
        ["MySQL", /\bmysql\b/i],
        ["SQL", /\bsql\b/i],
        ["MongoDB", /\bmongodb\b/i],
        ["Express.js", /\bexpress\.?js\b/i],
        ["Node.js", /\bnode\.?js\b/i],
        ["React", /\breact\.?js\b/i],
        ["HTML", /\bhtml\b/i],
        ["CSS", /\bcss\b/i],
        ["GitHub", /\bgithub\b/i],
        ["Git", /\bgit\b/i]
    ];

    return patterns
        .filter(([, pattern]) => pattern.test(jobDescription))
        .map(([skill]) => skill);
}

function calculateDemoScore(jobSkills, candidateSkills) {
    if (jobSkills.length === 0) {
        return 0;
    }

    const matched = jobSkills.filter((skill) =>
        candidateSkills.includes(skill)
    );

    return Math.round((matched.length / jobSkills.length) * 100);
}

demoButton.addEventListener("click", () => {
    const sampleCandidates = [
        {
            name: "Sample_Candidate_A.pdf",
            skills: [
                "Java",
                "Spring Boot",
                "SQL",
                "REST API",
                "Git",
                "MySQL"
            ]
        },
        {
            name: "Sample_Candidate_B.pdf",
            skills: [
                "Java",
                "SQL",
                "REST API",
                "HTML",
                "CSS"
            ]
        },
        {
            name: "Sample_Candidate_C.pdf",
            skills: [
                "Java",
                "HTML",
                "CSS",
                "JavaScript",
                "MongoDB"
            ]
        }
    ];

    const jobDescription = jobDescriptionInput.value.trim();

    const demoJobDescription = jobDescription ||
        "Java Spring Boot REST API MySQL SQL HTML CSS GitHub Git";

    const jobSkills = detectDemoSkills(demoJobDescription);

    const effectiveJobSkills = jobSkills.length > 0
        ? jobSkills
        : ["Java", "SQL", "Spring Boot", "REST API"];

    const candidates = sampleCandidates.map((sample) => {
        const matchedSkills = effectiveJobSkills.filter((skill) =>
            sample.skills.includes(skill)
        );

        const missingSkills = effectiveJobSkills.filter((skill) =>
            !sample.skills.includes(skill)
        );

        return {
            name: sample.name,
            score: calculateDemoScore(
                effectiveJobSkills,
                sample.skills
            ),
            matchedSkills,
            missingSkills
        };
    });

    candidates.sort(
        (a, b) => getCandidateScore(b) - getCandidateScore(a)
    );

    isDemoResults = true;

    renderDashboard({
        candidates,
        jobSkills: effectiveJobSkills,
        failedFiles: [],
        success: true
    });

    showStatus(
        "Demo loaded! These are fictional sample results, not real resume analysis.",
        "success"
    );
});

// ========================================
// CSV Report Download
// ========================================

downloadButton.addEventListener("click", () => {
    if (!latestResults || latestResults.candidates.length === 0) {
        showStatus("There are no candidates to export.", "error");
        return;
    }

    const headers = [
        "Rank",
        "Resume",
        "Match Score (%)",
        "Matched Skills",
        "Missing Skills",
        "Candidate Strengths",
        "Skill Gap Summary",
        "Suggested Next Step"
    ];

    const rows = latestResults.candidates.map((candidate, index) => {
        const score = getCandidateScore(candidate);
        const matched = getMatchedSkills(candidate);
        const missing = getMissingSkills(candidate);

        let recommendation;

        if (score >= 80) {
            recommendation =
                "Consider a technical interview to verify practical skills";
        } else if (score >= 50) {
            recommendation =
                "Review skill gaps and consider a technical assessment";
        } else {
            recommendation =
                "Review the resume manually before deciding on next steps";
        }

        return [
            index + 1,
            getCandidateName(candidate),
            score,
            matched.join("; "),
            missing.join("; "),
            matched.length
                ? `Relevant skills found: ${matched.join(", ")}`
                : "No matching skills detected",
            missing.length
                ? `Skills to verify: ${missing.join(", ")}`
                : "All detected job skills matched",
            recommendation
        ];
    });

    const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(","))
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = isDemoResults
        ? "SmartMatch_Demo_Report.csv"
        : "SmartMatch_Candidate_Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showStatus("CSV report downloaded successfully.", "success");
});
