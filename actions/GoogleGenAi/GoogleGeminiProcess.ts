"use server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import fetchPdf from "./fetchFile";
import { unstable_cache } from "next/cache";
import { request } from "@arcjet/next";
import { aj } from "@/utils/protection-rules";

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "openai/gpt-oss-120b";

export default async function geminiGenerate(
  jobTitle: string,
  jobDescription: string,
  resumeUrl: string
) {
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }
  const cachedGeneration = unstable_cache(async () => {
    const fileBuffer = await fetchPdf(resumeUrl);

    const { text: resumeText } = await pdfParse(fileBuffer);

    const prompt = `
    You are an expert career advisor and ATS (Applicant Tracking System) evaluator.
    
    Analyze the candidate's resume and compare it to the job post description.
    
    Return a JSON object with the following structure (NO markdown, just pure JSON):
    
    1. If the resume does NOT sufficiently match the job description:
    {"warning": "Your resume does not sufficiently match the job posting. Please review and update the resume to align better with the job requirements."}
    
    2. If the resume is a reasonable match, calculate the ATS score based on keyword matching, skills alignment, and job requirements:
    {"ATS_Score": "85%"}
    
    3. If the ATS score is below 80%, also include suggested keywords:
    {"ATS_Score": "60%", "keywords": "keyword1, keyword2, keyword3"}
    
    ---
    #### Inputs:
    **Candidate's Resume:**  
    ${resumeText}

    **Title of the Job Post:**  
    ${jobTitle}
    
    **Job Description:**  
    ${jobDescription}
    
    Return ONLY valid JSON, no other text.
    `;

    console.log("expensive groq api run.....");

    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const suggestions = completion.choices[0]?.message?.content || "";

    console.log(suggestions);
    return suggestions;
  }, [jobDescription, resumeUrl]);

  return await cachedGeneration();
}

export async function generateResumeKeywords(resumeUrl: string) {
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }
  const cachedGeneration = unstable_cache(async () => {
    const fileBuffer = await fetchPdf(resumeUrl);

    const { text: resumeText } = await pdfParse(fileBuffer);

    const prompt = `
    Extract the most relevant skills and keywords from the following resume text.
    Return ONLY a JSON array of strings with the keywords. Nothing else.
    ${resumeText}
    
    Return format: ["keyword1", "keyword2", "keyword3"]
    `;

    console.log("expensive groq api run.....");

    const completion = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const suggestions = completion.choices[0]?.message?.content || "[]";

    console.log("relevant keywords", JSON.parse(suggestions));
    return JSON.parse(suggestions);
  }, [resumeUrl]);

  return await cachedGeneration();
}

export async function generateJobDescription(
  jobTitle: string,
  jobLocation: string,
  employementType: string,
  companyName: string
) {
  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }
  const cachedGeneration = unstable_cache(async () => {
    const prompt = `
    You are a professional HR copywriter skilled at crafting engaging and detailed job descriptions. Generate a job description in rich text format using the following parameters:

    - **jobTitle:** ${jobTitle}
    - **jobLocation:** ${jobLocation}
    - **employementType:** ${employementType}
    - **companyName:** ${companyName}

    The job description should include these sections(no need to include a title as already the title will be displayed from the data):

    1. **Job Overview:**(style:h1 bold text title only)  
       Provide a concise summary of the role, including its key purpose and impact within the company.

    2. **Key Responsibilities:** (style: h3 bold text title only)  
       List the main duties and responsibilities associated with the position in a clear, bullet-point format.

    3. **Qualifications:**  (style: h3 bold text title 
       Outline the required skills, experiences, and educational background. Include any preferred qualifications that would make a candidate stand out.

    4. **Company Overview:**  (style: h3 bold text title only) 
       Describe ${companyName} in a way that highlights its culture, mission, and unique qualities. Explain why this company is a great place to work.

    5. **Benefits & Perks:**  (style: h3 bold text title only) 
       Detail any benefits, perks, or incentives that the company offers, such as health insurance, remote work options, career development opportunities, etc.

    6. **Application Process:**  (style: h3 bold text title only) 
       Provide instructions on how candidates can apply, along with any relevant deadlines or additional steps.

    Ensure the tone is professional, inviting, and tailored to attract high-quality candidates. The rich text format should include clear headings and should be compatible for the tip-tap rich text editor , bullet points, and appropriate emphasis where necessary.

    Make sure the description includes these:
    --good rich text format and stucture
    --Ats friendly words for the relevant job
    --emoji's and other word styling if needed
    --ensure the it matches the tiptap compatible rich text

    IMPORTANT: Return ONLY a JSON object with a single key "content" containing the job description as HTML string. No other text or markdown.

    Return format: {"content": "<p>Job Description HTML here...</p>"}
    `;

    console.log("expensive groq api run.....");

    try {
      const completion = await groqClient.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      let description = completion.choices[0]?.message?.content || "{}";

      console.log("raw generated description", description);

      // Clean up markdown code blocks if present
      description = description.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/```$/g, '').trim();

      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(description);
        return parsed.content || description;
      } catch {
        // If not valid JSON, return as-is (it might be plain HTML)
        return description;
      }
    } catch (error) {
      console.error("Error generating job description:", error);
      return "Error Occured";
    }
  }, [jobTitle + jobLocation + companyName]);

  return await cachedGeneration();
}
