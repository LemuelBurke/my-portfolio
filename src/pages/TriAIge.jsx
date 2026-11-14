const TriAIge = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue" alt="Frontend: React and TypeScript" draggable={false} />
      <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green" alt="Backend: Node.js and Express" draggable={false} />
      <img src="https://img.shields.io/badge/Microservice-Python%20FastAPI-16a39a" alt="Microservice: Python FastAPI" draggable={false} />
      <img src="https://img.shields.io/badge/NLP-spaCy%20NER-09a3d5" alt="NLP: spaCy named entity recognition" draggable={false} />
      <img src="https://img.shields.io/badge/Database-MongoDB-brightgreen" alt="Database: MongoDB" draggable={false} />
    </p>
    <p><em>Software Engineering dissertation · Cardiff University · 2026</em></p>
    <hr />
    <h2>Overview</h2>
    <p>
      <strong>Tri-AI-ge</strong> is an artificial intelligence triaging system, and my final-year dissertation project.
      It's a full-stack web application with integrated microservices that reads a patient's own free-text description
      of their symptoms and triages them to the right specialist clinician.
    </p>
    <hr />
    <h2>What I built</h2>
    <ul>
      <li><strong>Symptom extraction:</strong> designed, trained and implemented a bespoke Named Entity Recognition (NER) model, paired with a normalisation pipeline, to pull symptoms out of free text.</li>
      <li><strong>Python microservice:</strong> a FastAPI service plus an orchestrator layer that processes what the user types and routes it through the pipeline.</li>
      <li><strong>Patient intake:</strong> a validated intake form that collects patient demographic data.</li>
      <li><strong>Secure access:</strong> role-based access and session management using Microsoft Azure, the Microsoft Authentication Library (MSAL) and Microsoft Entra ID.</li>
      <li><strong>End to end:</strong> I worked across the frontend, backend and microservices.</li>
    </ul>
    <hr />
    <h2>Tech Stack</h2>
    <ul>
      <li><strong>Frontend:</strong> React, TypeScript, Vite, HTML5, CSS</li>
      <li><strong>Backend:</strong> Node.js, Express.js, JWT</li>
      <li><strong>AI and NLP:</strong> Python, FastAPI, spaCy NER</li>
      <li><strong>Data:</strong> MongoDB</li>
      <li><strong>Identity:</strong> Microsoft Azure, MSAL, Entra ID</li>
      <li><strong>Testing:</strong> Jest</li>
    </ul>
  </div>
);

export default TriAIge;
