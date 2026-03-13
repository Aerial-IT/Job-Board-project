"use server";

  
import { prisma } from "@/utils/db";
import { aj } from "@/utils/protection-rules";
import { requireUser } from "@/utils/requireUser";
import { jobSeekerSchema } from "@/utils/zodschemas";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateResumeKeywords } from "./GoogleGenAi/GoogleGeminiProcess";


  

export async function createJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
  try {
    const user = await requireUser();

    const req=await request()

    const decision=await aj.protect(req)

    if(decision.isDenied()){
      console.log("Arcjet blocked request:", decision)
    }


    const validatedData = jobSeekerSchema.parse(data);
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
        onboardingCompleted: true,
        userType: "JOB_SEEKER",
        JobSeeker: {
          create: {
            ...validatedData, ats_keywords
          },
        },
      },
    });

    return redirect("/main");
  } catch (error) {
    console.error("Error creating job seeker:", error);
    throw error;
  }
}
