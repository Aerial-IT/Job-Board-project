"use server";

import { prisma } from "@/utils/db";
import { aj } from "@/utils/protection-rules";
import { requireUser } from "@/utils/requireUser";
import { jobSeekerSchema } from "@/utils/zodschemas";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateResumeKeywords } from "./GoogleGenAi/GoogleGeminiProcess";

export async function editJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const validatedData = jobSeekerSchema.parse(data);
  console.log(validatedData);
  let ats_keywords: string[] = [];
  try {
    ats_keywords = await generateResumeKeywords(validatedData.resume);
  } catch (error) {
    console.error("Failed to generate resume keywords:", error);
    ats_keywords = [];
  }

  await prisma.user.update({
    where: {
      id: user.id as string,
    },
    data: {
      image: validatedData.image,
      JobSeeker: {
        update: {
          about: validatedData.about,  
          resume: validatedData.resume,
          name: validatedData.name,
          ats_keywords,
        },
      },
    },
  });

  return redirect("/main");
}
