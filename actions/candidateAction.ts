/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { prisma } from "@/utils/db";
import { EmailTemplate, InterviewNotificationEmail } from "@/utils/Email-Templates";
import { aj } from "@/utils/protection-rules";
import { requireUser } from "@/utils/requireUser";
import { resend } from "@/utils/ResendClient";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { ReactNode } from "react";

export async function AcceptCandidate(candidateId: string, jobId: string) {
  await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }
  try {
    const candidate_data = await prisma.appliedJobPost.update({
      where: {
        id: candidateId,
      },
      data: {
        status: "ACCEPTED",
        interviewStatus: "NOT_STARTED",
      },
      include: {
        job: {
          select: {
            jobTitle: true,
            interviewTimeLimit: true,
            Company: {
              select: {
                name: true,
              },
            },
          },
        },
        jobseeker: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const { data, error } = await resend.emails.send({
      from: "admin" + process.env.EMAIL_DOMAIN,
      to: [candidate_data.jobseeker.user.email],
      subject: "Application Accepted - Interview Invitation",
      react: InterviewNotificationEmail({
        firstName: candidate_data.jobseeker.user.name as string,
        jobTitle: candidate_data.job.jobTitle,
        companyName: candidate_data.job.Company.name,
        timeLimit: candidate_data.job.interviewTimeLimit,
        applicationId: candidateId,
      }) as ReactNode,
    });

    revalidatePath(`my-jobs/${jobId}/candidates/`);
  } catch {
    throw new Error("Something went wrong");
  }
}

export async function RejectCandidate(candidateId: string, jobId: string) {
  await requireUser();
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }
  try {
    await prisma.appliedJobPost.update({
      where: {
        id: candidateId,
      },
      data: {
        status: "REJECTED",
      },
     
    });

    revalidatePath(`my-jobs/${jobId}/candidates/`);
  } catch {
    throw new Error("Something went wrong");
  }
}
