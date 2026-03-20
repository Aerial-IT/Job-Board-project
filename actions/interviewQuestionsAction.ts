"use server";
import { prisma } from "@/utils/db";
import { aj } from "@/utils/protection-rules";
import { requireUser } from "@/utils/requireUser";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

export async function getInterviewQuestions(jobId: string, userId: string) {
  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      Company: {
        userId: userId,
      },
    },
    include: {
      interviewQuestions: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return job?.interviewQuestions || [];
}

export async function setInterviewTimeLimit(formData: FormData) {
  const jobId = formData.get("jobId") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string, 10);
  
  const user = await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      Company: {
        userId: user.id,
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  await prisma.jobPost.update({
    where: {
      id: jobId,
    },
    data: {
      interviewTimeLimit: timeLimit,
    },
  });

  revalidatePath(`/my-jobs/${jobId}/interview-questions`);
}

export async function addInterviewQuestion(formData: FormData) {
  const jobId = formData.get("jobId") as string;
  const question = formData.get("question") as string;
  
  const user = await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      Company: {
        userId: user.id,
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  await prisma.interviewQuestion.create({
    data: {
      question,
      jobPostId: jobId,
    },
  });

  revalidatePath(`/my-jobs/${jobId}/interview-questions`);
}

export async function deleteInterviewQuestion(formData: FormData) {
  const questionId = formData.get("questionId") as string;
  const jobId = formData.get("jobId") as string;
  
  const user = await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      Company: {
        userId: user.id,
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  await prisma.interviewQuestion.delete({
    where: {
      id: questionId,
    },
  });

  revalidatePath(`/my-jobs/${jobId}/interview-questions`);
}

export async function updateInterviewQuestion(
  questionId: string,
  question: string,
  jobId: string,
  userId: string
) {
  await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      Company: {
        userId: userId,
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  await prisma.interviewQuestion.update({
    where: {
      id: questionId,
    },
    data: {
      question,
    },
  });

  revalidatePath(`/my-jobs/${jobId}/interview-questions`);
}
