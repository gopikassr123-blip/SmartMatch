
# SmartMatch - Resume Screening and Job Matching System

SmartMatch is a web-based application that helps recruiters compare candidate resumes with job requirements. It analyzes uploaded PDF resumes, identifies matching skills and skill gaps, calculates match scores, and ranks candidates.

## Features

- Upload multiple PDF resumes.
- Enter job descriptions and required skills.
- Extract text from PDF resumes.
- Identify matching skills and missing skills.
- Calculate candidate match percentages.
- Rank candidates based on match scores.
- Search and filter candidates.
- View candidate insights and skill-gap analysis.
- Download candidate results as a CSV report.
- Try the application using demo candidates.

## Technology Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Libraries
- Multer - PDF file upload handling
- pdf-parse - PDF text extraction
- CORS - Cross-origin request handling

## Project Structure

```text
SmartMatch/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── uploads/
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- A modern web browser

### 1. Open the project folder

Open the SmartMatch folder in VS Code.

### 2. Install dependencies

Open the VS Code terminal and run:

```bash
npm install
```

### 3. Start the server

Run:

```bash
node server.js
```

### 4. Open the application

Open this address in your browser:

http://localhost:3000

## How to Use

1. Open SmartMatch in your browser.
2. Enter the job description.
3. Upload one or more PDF resumes.
4. Click the matching button.
5. Review candidate rankings and match scores.
6. Explore matched skills, missing skills, and candidate insights.
7. Download the results as a CSV file.

You can also use the demo option to explore the dashboard without uploading resumes.

## Matching Logic

SmartMatch uses rule-based skill matching.

1. The system extracts text from each PDF resume.
2. It identifies skills using predefined skill-matching rules.
3. It compares the detected resume skills with the job requirements.
4. It calculates a match percentage based on matched job skills.
5. It ranks candidates and displays matching skills and skill gaps.

The matching score is based on detected skills, not a complete evaluation of a candidate's abilities.

## Limitations

- Resume matching depends on the text successfully extracted from the PDF.
- The system may not identify every skill if it is written differently from the configured matching rules.
- A match score does not guarantee that a candidate is suitable for a role.
- Candidate results should be reviewed by a recruiter before making hiring decisions.

## Future Enhancements

- Database integration for storing candidate profiles.
- User authentication for recruiters.
- Advanced semantic resume matching.
- Job-specific skill configuration.
- More detailed reporting and analytics.
- Automated testing and deployment.

## Project Disclaimer

SmartMatch is a resume-screening support tool. Its scores and recommendations are intended to assist human review and should not be used as the sole basis for hiring decisions.
