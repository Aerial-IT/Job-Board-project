/* eslint-disable @typescript-eslint/no-explicit-any */
import { deleteSavedJobPost, saveJobPost } from "@/actions/saveJobPostAction";
import { JsonToHtml } from "@/components/views/JsonToHtml";
import { ApplyButton, SaveJobButton } from "@/components/views/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth } from "@/utils/auth";
import { getFlagEmoji } from "@/utils/countryList";
import { prisma } from "@/utils/db";
import { formatCurrency } from "@/utils/formatCurrency";
import { benefits } from "@/utils/listOfBenefits";
import { aj as Arcjet } from "@/utils/protection-rules";
import { detectBot, request, tokenBucket } from "@arcjet/next";
import {
  Ban,
  Circle,
  HandCoinsIcon,
  HeartIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Separator } from "@/components/ui/separator";
import { extractTextFromTiptap } from "@/utils/JsontText";
import geminiGenerate from "@/actions/GoogleGenAi/GoogleGeminiProcess";

type suggestionType = {
  warning?: string;
  keywords?: string;
  ATS_Score?: string;
};

const aj = Arcjet.withRule(
  detectBot({
    mode: "LIVE",
    allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
  })
);

function getClient(session: boolean) {
  if (session) {
    return aj.withRule(
      tokenBucket({
        mode: "LIVE",
        capacity: 100,
        interval: 60,
        refillRate: 30,
      })
    );
  } else {
    return aj.withRule(
      tokenBucket({
        mode: "LIVE",
        capacity: 100,
        interval: 60,
        refillRate: 10,
      })
    );
  }
}

async function getJob(jobId: string, userId?: string) {
  const [jobData, savedJob] = await Promise.all([
    prisma.jobPost.findUnique({
      where: {
        id: jobId,
        status: "ACTIVE",
      },
      select: {
        jobTitle: true,
        jobDescription: true,

        location: true,

        AppliedJobPost: true,
        employmentType: true,
        benefits: true,
        salaryFrom: true,
        salaryTo: true,
        createdAt: true,
        listingDuration: true,
        Company: {
          select: {
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
    }),
    userId
      ? prisma.savedJobPost.findUnique({
          where: {
            userId_jobId: {
              userId,
              jobId,
            },
          },
          select: {
            id: true,
          },
        })
      : null,
  ]);

  if (!jobData) {
    return notFound();
  }

  return {
    jobData,
    savedJob,
  };
}

async function applyForJob(
  jobSeekerID: string,
  jobId: string,
  candidates: unknown[],
  ATS_Score: number
) {
  "use server";

  candidates.push({ id: jobSeekerID });

  await prisma.$transaction([
    prisma.appliedJobPost.create({
      data: {
        jobId: jobId,
        jobSeekerid: jobSeekerID,
        ATS_Score: ATS_Score,
      },
    }),
  ]);

  console.log("job applied...");
  revalidatePath(`/job/${jobId}`);
}

type Params = Promise<{ jobId: string }>;

export default async function JobIdPage({ params }: { params: Params }) {
  const { jobId } = await params;

  const session = await auth();

  const req = await request();
  const decision = await getClient(!!session).protect(req, { requested: 10 });

  if (decision.isDenied()) {
    throw new Error("forbidden");
  }

  const { jobData: data, savedJob } = await getJob(jobId, session?.user?.id);
  const { AppliedJobPost: candidates } = data;
  const isAlreadyApplied = session?.user.jobseekerId
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidates.filter(
        (job: any) => job.jobSeekerid === session.user.jobseekerId
      ).length > 0
    : false;

  const text = extractTextFromTiptap(JSON.parse(data.jobDescription));
  
  let resultContent: suggestionType = {};
  try {
    const aiResponse = await geminiGenerate(
      data.jobTitle,
      text,
      session?.user.jobseekerResume as string
    );
    resultContent = JSON.parse(aiResponse);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    resultContent = {};
  }

  const ATS_Score = resultContent.ATS_Score
    ? parseInt(resultContent.ATS_Score.split("%")[0])
    : 0;
  console.log("suggestion text", resultContent);

  console.log("candidates", candidates);
  console.log("appled jobs user", candidates);

  const locationFlag = getFlagEmoji(data.location);
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="space-y-8 col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.jobTitle}</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="font-medium ">{data.Company?.name}</p>
              <span className="hidden md:inline text-muted-foreground ">•</span>
              <Badge variant={"secondary"} className="rounded-md p-2">
                {data.employmentType}
              </Badge>

              <span className="hidden md:inline text-muted-foreground ">•</span>

              <Badge variant={"secondary"} className="rounded-md p-2   ">
                {locationFlag && <span className="mr-1">{locationFlag}</span>}
                {data.location}
              </Badge>
              <span className="hidden md:inline text-muted-foreground ">
                {" "}
                •
              </span>

              <Badge variant={"default"} className="  p-2  ">
                <HandCoinsIcon size={20} />
                <span className="  px-2 ">
                  {formatCurrency(data.salaryFrom)}-{" "}
                  {formatCurrency(data.salaryTo)}
                </span>
              </Badge>
            </div>
          </div>

          {session?.user ? (
            <form
              action={
                savedJob?.id
                  ? deleteSavedJobPost.bind(null, savedJob.id)
                  : saveJobPost.bind(null, jobId)
              }
            >
              <SaveJobButton savedJob={!!savedJob} />{" "}
            </form>
          ) : (
            <Link
              href={"/login"}
              className={buttonVariants({ variant: "default" })}
            >
              {" "}
              <HeartIcon className="size-4" /> Save Job
            </Link>
          )}
        </div>
        <Separator />
        <section>
          <JsonToHtml json={JSON.parse(data.jobDescription)} />
        </section>
        <Separator />
        {/* <section>
          <h3 className="font-semibold mb-4">
            Benefits
            <span className="text-sm text-muted-foreground font-normal">
              {" "}
              (purple is offered)
            </span>
          </h3>

          <div className="flex flex-wrap gap-3">
            {benefits.map((benefit) => {
              const isOffered = data.benefits.includes(benefit.id);
              return (
                <Badge
                  className={cn(
                    isOffered ? "" : "opacity-75 cursor-not-allowed",
                    "text-sm px-4 py-1.5 rounded-full"
                  )}
                  key={benefit.id}
                  variant={isOffered ? "default" : "outline"}
                >
                  <span className="flex items-center gap-2">
                    {benefit.icon}

                    {benefit.label}
                  </span>
                </Badge>
              );
            })}
          </div>
        </section> */}
      </div>
      <div className="space-y-6">
        <div className="bg-gradient-to-l from-primary   to-slate-400 p-[3px] rounded-xl ">
          <Card className="p-   ">
            <CardHeader className="flex items-center justify-between">
              <div>
                <div className="my-1">
                  <Badge className="rouned-full space-x-2 p-1">
                    <SparklesIcon className="animate-pulse" />{" "}
                    <span className="font-semibold   text-md">
                      AI Generated
                    </span>
                  </Badge>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This result was generated by our AI based on your uploaded
                  resume.
                </p>
              </div>
              {/* AI generated badge */}
            </CardHeader>
            <CardContent className="mt-1 flex flex-col gap-2   ">
              {" "}
              {resultContent.keywords ? (
                <div>
                  <div className="text-center mb-4">
                    <p className="text-md font-semibold">You Resume Got</p>

                    <div className="text-3xl font-bold text-yellow-400 ">
                      {resultContent.ATS_Score}
                    </div>

                    <p>Ats Score For this Job</p>
                    <p className="text-sm ">
                      * ats score below 80% indicates there are room for
                      improvement *
                    </p>
                  </div>
                  <div className="mb-4 text-center font-semibold text-sm">
                    We believe Your Resume Lacks Below Keywords{" "}
                  </div>
                  <div className="grid grid-cols-2  justify-self-center   gap-3">
                    {resultContent.keywords.split(",").map((text, idx) => (
                      <div
                        key={idx}
                        className="inline-flex gap-2 text-nowrap  justify-start items-start "
                      >
                        {" "}
                        <Circle className=" fill-primary" />{" "}
                        <p className="  text-sm truncate whitespace-nowrap">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : resultContent.ATS_Score ? (
                <div className="text-balance text-center">
                  <h1 className="text-2xl font-semibold ">Great !!</h1>

                  <p className="text-md font-semibold">You Resume Got</p>

                  <div className="text-3xl font-bold text-green-500 ">
                    {resultContent.ATS_Score}
                  </div>

                  <p>Ats Score For this Job</p>
                  <p className="text-sm text-gray-600 dark:text-muted">
                    *higher ats score increase the probability of the
                    acceptence*
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 ">
                  <Ban size={50} className="text-red-500" />
                  <p className="font-semibold text-destructive text-balance text-center">
                    {resultContent.warning}
                  </p>{" "}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="p-6 ">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Apply Now </h3>
              <p className="text-sm text-muted-foreground">
                Please let {data.Company?.name} Know you found this job on Job
                Board. This help us grow
              </p>
            </div>

            <form
              action={applyForJob.bind(
                null,
                session?.user.jobseekerId as string,
                jobId,
                candidates,
                ATS_Score
              )}
            >
              <ApplyButton isAlreadyApplied={isAlreadyApplied}  />
              {/* <Button
                type="submit"
                className={"w-full "}
                variant={isAlreadyApplied ? "secondary" : "default"}
                disabled={isAlreadyApplied}
              >
                {isAlreadyApplied ? "Applied" : "Apply Now"}
              </Button> */}
            </form>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold">About this Job</h3>
          <div className="space-y">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Apply Before
              </span>
              <span className="text-sm">
                {new Date(
                  data.createdAt.getTime() +
                    data.listingDuration * 24 * 60 * 60 * 1000
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Posted On</span>
              <span className="text-sm">
                {data.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Employment Type
              </span>
              <span className="text-sm">{data.employmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm">
                {locationFlag && <span className="mr-1">{locationFlag}</span>}{" "}
                {data.location}
              </span>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                alt="company Logo"
                src={data.Company?.logo as string}
                width={48}
                height={48}
                className="rounded-full size-12"
              />
              <div className="flex flex-col">
                <h3 className="font-semibold">{data.Company?.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {data.Company?.about}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <section>
          <h3 className="font-semibold mb-4">
            Benefits
            <span className="text-sm text-muted-foreground font-normal">
              {" "}
              (purple is offered)
            </span>
          </h3>

          <div className="flex flex-wrap gap-3">
            {benefits.map((benefit) => {
              const isOffered = data.benefits.includes(benefit.id);
              return (
                <Badge
                  className={cn(
                    isOffered ? "" : "opacity-75 cursor-not-allowed",
                    "text-sm px-4 py-1.5 rounded-full"
                  )}
                  key={benefit.id}
                  variant={isOffered ? "default" : "outline"}
                >
                  <span className="flex items-center gap-2">
                    {benefit.icon}

                    {benefit.label}
                  </span>
                </Badge>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
