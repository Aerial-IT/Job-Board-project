import { EmptyPage } from "@/components/views/EmptyPage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { prisma } from "@/utils/db";
import { requireUser } from "@/utils/requireUser";
import { Book, MoreHorizontalIcon, PenBoxIcon, Users2, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CopyLinks from "@/components/views/CopyLinks";

async function getJobs(userId: string, userType: string, jobSeekerid?: string) {
  const where =
    userType === "JOB_SEEKER"
      ? { AppliedJobPost: { some: { jobSeekerid } } }
      : { Company: { userId } };

  const data = await prisma.jobPost.findMany({
    where,
    select: {
      id: true,
      jobTitle: true,
      status: true,
      createdAt: true,
      Company: {
        select: {
          name: true,
          logo: true,
        },
      },
      AppliedJobPost: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
}

export default async function MyJobPage() {
  const session = await requireUser();
  const data = await getJobs(session.id as string, session.userType);

  if (data.length === 0) {
    return (
      <EmptyPage
        title="No Job Posts Found"
        description="You don't have any jobs yet."
        buttonText="Create a Job Post Now!"
        href="/post-job"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          {session.userType === "JOB_SEEKER" ? "Applied Jobs" : "My Jobs"}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your job listings and applications efficiently.
        </p>
      </header>

      {/* Jobs Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {data.map((job) => {
          // Get the applied job details for job seekers.
          const applied =
            session.userType === "JOB_SEEKER"
              ? job.AppliedJobPost.find((item) => item.jobId === job.id)
              : null;

          const status =
            session.userType === "JOB_SEEKER" ? applied?.status : job.status;

          const statusFormatted =
            (status ?? "").charAt(0).toUpperCase() + (status ?? "").slice(1).toLowerCase();

          const date =
            session.userType === "JOB_SEEKER"
              ? new Date(applied?.createdAt as unknown as string)
              : new Date(job.createdAt);

          return (
            <Card
              key={job.id}
              className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-shadow border-gray-200 dark:border-gray-700"
            >
              {/* Card Header */}
              <CardHeader className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="relative w-12 h-12 mr-4 rounded overflow-hidden">
                    <Image
                      src={job.Company?.logo as string}
                      alt="Company Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {job.jobTitle}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {job.Company?.name}
                    </CardDescription>
                  </div>
                </div>

                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={"ghost"} size={"icon"}>
                        <MoreHorizontalIcon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {session.userType === "Company" ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${job.id}/candidates`}>
                              <Users2 className="mr-2 h-4 w-4" />
                              View Candidatesss
                            </Link>
                          </DropdownMenuItem>


                                       
                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${job.id}/edit`}>
                              <PenBoxIcon className="mr-2 h-4 w-4" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <CopyLinks
                              jobUrl={`${process.env.NEXT_PUBLIC_URL}/job/${job.id}`}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${job.id}/delete`}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete Job
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link href={`/my-jobs/${job.id}/cancel`}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="flex flex-col justify-between p-4 flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        status === "ACCEPTED" || status ===  "ACTIVE"
                          ? "text-green-500"
                          : status ===  "DRAFT" || status ==="PENDING"
                          ? "text-yellow-500" 
                          : "text-red-500"
                      }`}
                    >
                      {statusFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {session.userType === "JOB_SEEKER"
                        ? "Applied On:"
                        : "Created On:"}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {date.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {session.userType === "Company" && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Candidates:
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {job.AppliedJobPost.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
