"use server";
import { prisma } from "@/utils/db";
import { aj } from "@/utils/protection-rules";
import { requireUser } from "@/utils/requireUser";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { resend } from "@/utils/ResendClient";
import { ReactNode } from "react";
import OpenAI from "openai";
import { InterviewResultEmail } from "@/components/views/InterviewEmailTemplate";

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "openai/gpt-oss-120b";

async function evaluateAnswersWithAI(
  questions: { id: string; question: string }[],
  answers: { questionId: string; answer: string }[],
  jobTitle: string,
  companyName: string
) {
  const qaPairs = questions.map((q) => {
    const ans = answers.find((a) => a.questionId === q.id);
    return {
      question: q.question,
      answer: ans?.answer || "",
    };
  });

  const prompt = `
You are an expert interviewer and career evaluator. Evaluate the following interview answers for the position of ${jobTitle} at ${companyName}.

For each question, provide:
1. A score from 0-100 based on the quality of the answer
2. Brief feedback (1-2 sentences)

Questions and Answers:
${qaPairs.map((pair, idx) => `
${idx + 1}. Question: ${pair.question}
   Answer: ${pair.answer}
`).join("\n")}

Return a JSON array with the following structure for each answer:
[{"questionId": "id1", "score": 85, "evaluation": "Good answer because..."}, ...]

Return ONLY valid JSON array, no other text.
`;

  const completion = await groqClient.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const result = completion.choices[0]?.message?.content || "[]";
  return JSON.parse(result);
}

async function generateOverallEvaluation(
  questions: { id: string; question: string }[],
  answers: { questionId: string; answer: string }[],
  individualResults: { score: number; evaluation: string }[],
  jobTitle: string,
  candidateName: string,
  companyName: string
) {
  const totalScore = individualResults.reduce((sum, r) => sum + r.score, 0);
  const avgScore = Math.round(totalScore / individualResults.length);

  const prompt = `
You are an expert HR professional. Provide an overall interview evaluation summary.

Job Position: ${jobTitle}
Company: ${companyName}
Candidate: ${candidateName}
Overall Score: ${avgScore}/100

Individual Question Scores:
${individualResults.map((r, idx) => `${idx + 1}. Score: ${r.score}/100 - ${r.evaluation}`).join("\n")}

Provide:
1. Overall strengths (2-3 bullet points)
2. Areas for improvement (2-3 bullet points)
3. Final recommendation (Strong Hire / Hire / No Hire / Strong No Hire)
4. Brief summary comment (2-3 sentences)

Return a JSON object with the following structure:
{
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "recommendation": "Hire",
  "summary": "Overall summary text"
}

Return ONLY valid JSON, no other text.
`;

  const completion = await groqClient.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const result = completion.choices[0]?.message?.content || "{}";
  return { ...JSON.parse(result), overallScore: avgScore };
}

export async function evaluateInterview(applicationId: string) {
  const user = await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const application = await prisma.appliedJobPost.findFirst({
    where: {
      id: applicationId,
      jobseeker: {
        userId: user.id,
      },
    },
    include: {
      job: {
        include: {
          interviewQuestions: true,
          Company: true,
        },
      },
      jobseeker: {
        include: {
          user: true,
        },
      },
      interviewSession: {
        include: {
          answers: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (!application.interviewSession) {
    throw new Error("Interview session not found");
  }

  if (application.interviewStatus !== "COMPLETED") {
    throw new Error("Interview not yet completed");
  }

  if (application.interviewSession.evaluation) {
    throw new Error("Interview already evaluated");
  }

  const questions = application.job.interviewQuestions;
  const answers = application.interviewSession.answers;

  const individualResults = await evaluateAnswersWithAI(
    questions,
    answers.map((a) => ({ questionId: a.questionId, answer: a.answer })),
    application.job.jobTitle,
    application.job.Company.name
  );

  for (const result of individualResults) {
    const answer = answers.find((a) => a.questionId === result.questionId);
    if (answer) {
      await prisma.interviewAnswer.update({
        where: { id: answer.id },
        data: {
          evaluation: result.evaluation,
          score: result.score,
        },
      });
    }
  }

  const overallEvaluation = await generateOverallEvaluation(
    questions,
    answers.map((a) => ({ questionId: a.questionId, answer: a.answer })),
    individualResults,
    application.job.jobTitle,
    application.jobseeker.name,
    application.job.Company.name
  );

  const evaluationJson = JSON.stringify(overallEvaluation);

  await prisma.interviewSession.update({
    where: { id: application.interviewSession.id },
    data: {
      evaluation: evaluationJson,
      score: overallEvaluation.overallScore,
    },
  });

  const candidateEmail = application.jobseeker.user.email;
  const companyEmail = application.job.Company.user.email;

  const emailProps = {
    candidateName: application.jobseeker.name,
    companyName: application.job.Company.name,
    jobTitle: application.job.jobTitle,
    score: overallEvaluation.overallScore,
    recommendation: overallEvaluation.recommendation,
    strengths: overallEvaluation.strengths,
    improvements: overallEvaluation.improvements,
    summary: overallEvaluation.summary,
  };

  await Promise.all([
    resend.emails.send({
      from: "admin" + process.env.EMAIL_DOMAIN,
      to: [candidateEmail],
      subject: `Interview Results for ${application.job.jobTitle}`,
      react: InterviewResultEmail(emailProps) as ReactNode,
    }),
    resend.emails.send({
      from: "admin" + process.env.EMAIL_DOMAIN,
      to: [companyEmail],
      subject: `Interview Completed - ${application.jobseeker.name}`,
      react: InterviewResultEmail(emailProps) as ReactNode,
    }),
  ]);

  revalidatePath(`/applied-jobs/interview/${applicationId}`);
  revalidatePath(`/applied-jobs`);

  return overallEvaluation;
}
