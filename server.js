
"use strict";

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = 3000;

const publicDir = path.join(__dirname, "public");
const uploadDir = path.join(__dirname, "uploads");

// ========================================
// Middleware and folders
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ========================================
// PDF upload configuration
// ========================================

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDir);
    },

    filename: (req, file, callback) => {
        const safeName = path
            .basename(file.originalname)
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const uniqueName =
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

        callback(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 20
    },
    fileFilter: (req, file, callback) => {
        const isPDF =
            file.mimetype === "application/pdf" &&
            path.extname(file.originalname).toLowerCase() === ".pdf";

        if (!isPDF) {
            return callback(
                new Error("Please upload PDF resumes only.")
            );
        }

        callback(null, true);
    }
});

// ========================================
// Skill detection rules
// ========================================

const skillRules = [
    { name: "Java", pattern: /\bjava\b/i },
    { name: "Python", pattern: /\bpython\b/i },
    { name: "JavaScript", pattern: /\bjavascript\b/i },
    { name: "TypeScript", pattern: /\btypescript\b/i },
    { name: "HTML", pattern: /\bhtml5?\b/i },
    { name: "CSS", pattern: /\bcss3?\b/i },
    { name: "React", pattern: /\breact(?:\.?\s*js)?\b/i },
    { name: "Node.js", pattern: /\bnode(?:\.?\s*js)?\b/i },
    { name: "Express.js", pattern: /\bexpress(?:\.?\s*js)?\b/i },
    { name: "Spring Boot", pattern: /\bspring[\s.-]*boot\b/i },
    { name: "Spring", pattern: /\bspring\b/i },
    { name: "MySQL", pattern: /\bmysql\b/i },
    { name: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
    { name: "MongoDB", pattern: /\bmongodb\b/i },
    { name: "SQL", pattern: /\bsql\b/i },
    { name: "REST API", pattern: /\brest(?:ful)?\s*apis?\b/i },
    { name: "GitHub", pattern: /\bgithub\b/i },
    { name: "Git", pattern: /\bgit\b/i },
    { name: "C++", pattern: /\bc\+\+/i },
    { name: "C#", pattern: /\bc#/i },
    { name: "Data Structures", pattern: /\bdata structures?\b/i },
    { name: "Machine Learning", pattern: /\bmachine learning\b/i },
    { name: "Communication", pattern: /\bcommunication\b/i },
    { name: "Problem Solving", pattern: /\bproblem solving\b/i }
];

// ========================================
// Normalize text before matching
// ========================================

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/node\s*\.?\s*js/g, "node.js")
        .replace(/express\s*\.?\s*js/g, "express.js")
        .replace(/spring\s*[-.]?\s*boot/g, "spring boot")
        .replace(/springboot/g, "spring boot")
        .replace(/restful\s+apis?/g, "rest api")
        .replace(/rest\s+apis?/g, "rest api")
        .replace(/\s+/g, " ")
        .trim();
}

// ========================================
// Extract unique skills from text
// ========================================

function extractSkills(text) {
    const normalized = normalizeText(text);
    const found = [];

    for (const rule of skillRules) {
        if (!rule.pattern.test(normalized)) {
            continue;
        }

        // Do not count Spring separately when Spring Boot is present.
        if (
            rule.name === "Spring" &&
            /\bspring\s+boot\b/i.test(normalized)
        ) {
            continue;
        }

        if (!found.includes(rule.name)) {
            found.push(rule.name);
        }
    }

    return found;
}

// ========================================
// Read PDF text
// Supports common pdf-parse APIs
// ========================================

async function readPdfText(filePath) {
    const buffer = fs.readFileSync(filePath);

    if (typeof pdfParse === "function") {
        const result = await pdfParse(buffer);
        return result.text || "";
    }

    if (pdfParse && typeof pdfParse.PDFParse === "function") {
        const parser = new pdfParse.PDFParse({ data: buffer });

        try {
            const result = await parser.getText();
            return result.text || "";
        } finally {
            if (typeof parser.destroy === "function") {
                await parser.destroy();
            }
        }
    }

    throw new Error(
        "Unsupported pdf-parse version. Check the installed package."
    );
}

// ========================================
// Analyze one candidate
// ========================================

function analyzeCandidate(filename, resumeText, jobSkills) {
    const resumeSkills = extractSkills(resumeText);

    const matchedSkills = jobSkills.filter(skill =>
        resumeSkills.includes(skill)
    );

    const missingSkills = jobSkills.filter(skill =>
        !resumeSkills.includes(skill)
    );

    const matchScore = jobSkills.length > 0
        ? Math.round(
            (matchedSkills.length / jobSkills.length) * 100
        )
        : 0;

    return {
        name: filename,
        filename,
        resume: filename,
        score: matchScore,
        matchScore,
        resumeSkills,
        matchedSkills,
        missingSkills
    };
}

// ========================================
// Homepage
// ========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

// ========================================
// Backend health check
// ========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SmartMatch Backend is running!"
    });
});

// ========================================
// Analyze uploaded resumes
// ========================================

app.post(
    "/api/match",
    (req, res, next) => {
        upload.array("resumes", 20)(req, res, err => {
            if (err) {
                const isLimitError =
                    err instanceof multer.MulterError;

                return res.status(400).json({
                    success: false,
                    error: isLimitError
                        ? err.code === "LIMIT_FILE_SIZE"
                            ? "Each PDF must be 5 MB or smaller."
                            : err.code === "LIMIT_FILE_COUNT"
                                ? "Upload no more than 20 PDF resumes."
                                : err.message
                        : err.message
                });
            }

            next();
        });
    },

    async (req, res) => {
        const files = req.files || [];

        try {
            const jobDescription = req.body.jobDescription;

            if (
                typeof jobDescription !== "string" ||
                !jobDescription.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Please provide a job description."
                });
            }

            if (files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Please upload at least one PDF resume."
                });
            }

            const jobSkills = extractSkills(jobDescription);

            if (jobSkills.length === 0) {
                return res.status(400).json({
                    success: false,
                    error:
                        "No supported skills detected. Try Java, SQL, MySQL or Spring Boot."
                });
            }

            const candidates = [];
            const failedFiles = [];

            for (const file of files) {
                try {
                    const resumeText = await readPdfText(file.path);

                    if (!resumeText.trim()) {
                        failedFiles.push({
                            filename: file.originalname,
                            resume: file.originalname,
                            error:
                                "No readable text found in this PDF. It may be scanned."
                        });

                        continue;
                    }

                    candidates.push(
                        analyzeCandidate(
                            file.originalname,
                            resumeText,
                            jobSkills
                        )
                    );
                } catch (error) {
                    console.error(
                        `Failed to analyze ${file.originalname}:`,
                        error.message
                    );

                    failedFiles.push({
                        filename: file.originalname,
                        resume: file.originalname,
                        error: "Could not read this PDF."
                    });
                }
            }

            // Rank candidates from highest to lowest score.
            candidates.sort(
                (a, b) => b.matchScore - a.matchScore
            );

            candidates.forEach((candidate, index) => {
                candidate.rank = index + 1;
            });

            const averageMatchScore = candidates.length
                ? Math.round(
                    candidates.reduce(
                        (sum, candidate) =>
                            sum + candidate.matchScore,
                        0
                    ) / candidates.length
                )
                : 0;

            return res.json({
                success: true,
                message: "Candidate analysis completed!",
                totalUploaded: files.length,
                totalAnalyzed: candidates.length,
                averageMatchScore,
                jobSkills,
                candidates,
                failedFiles,
                note:
                    "Rule-based skill matching is a preliminary screening aid, not an AI hiring decision."
            });
        } catch (error) {
            console.error("Analysis error:", error);

            return res.status(500).json({
                success: false,
                error: "Could not analyze the resumes."
            });
        } finally {
            // Remove temporary uploaded files after processing.
            for (const file of files) {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (error) {
                    console.error(
                        "Temporary file cleanup failed:",
                        error.message
                    );
                }
            }
        }
    }
);

// ========================================
// General error handler
// ========================================

app.use((err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        success: false,
        error: "Unexpected server error."
    });
});

// ========================================
// Start server
// ========================================

app.listen(PORT, () => {
    console.log(
        `SmartMatch server running at http://localhost:${PORT}`
    );
});
