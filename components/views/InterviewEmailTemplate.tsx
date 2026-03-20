import * as React from "react";

interface InterviewEmailProps {
  candidateName: string;
  companyName: string;
  jobTitle: string;
  score: number;
  recommendation: string;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export const InterviewResultEmail: React.FC<Readonly<InterviewEmailProps>> = ({
  candidateName,
  companyName,
  jobTitle,
  score,
  recommendation,
  strengths,
  improvements,
  summary,
}) => (
  <div>
    <h1 className="text-xl">Interview Results</h1>
    <p>Hi {candidateName},</p>
    <p>Your interview evaluation for {jobTitle} at {companyName} is complete.</p>
    
    <div style={{ margin: "20px 0", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Overall Score: {score}/100</h2>
      <p><strong>Recommendation:</strong> {recommendation}</p>
    </div>

    <h3>Strengths:</h3>
    <ul>
      {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
    </ul>

    <h3>Areas for Improvement:</h3>
    <ul>
      {improvements.map((i, idx) => <li key={idx}>{i}</li>)}
    </ul>

    <p><strong>Summary:</strong> {summary}</p>
  </div>
);
