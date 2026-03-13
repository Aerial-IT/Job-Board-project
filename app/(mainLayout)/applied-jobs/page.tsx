import { EmptyPage } from "@/components/views/EmptyPage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/utils/db";
import { requireUser } from "@/utils/requireUser";
import { MoreHorizontalIcon, PenBoxIcon, Users2, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CopyLinks from "@/components/views/CopyLinks";

async function getJobs(userId: string, userType: string, jobSeekerid?: string) {
  const where = {
    ...(userType === "JOB_SEEKER"
      ? {
          AppliedJobPost: {
            some: { jobSeekerid },
          },
        }
      : {
          Company: {
            userId,
          },
        }),
  };
  const data = await prisma.jobPost.findMany({
    where: where,
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
  const userType = session.userType || session.role;
  const data = await getJobs(session.id as string, userType);

  console.log("found users", data);

  return (
    <>
      {data.length === 0 ? (
        <EmptyPage
          title="No Job Posts found"
          description="You dont have any jobs.."
          buttonText="Create a job post now!"
          href="/post-job"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {userType === "JOB_SEEKER" ? "Applied Jobs" : "My Jobs"}
            </CardTitle>

            <CardDescription>
              Manage your job listings and applications here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    {userType === "JOB_SEEKER"
                      ? "Applied On"
                      : "Created at"}
                  </TableHead>
                 {userType==="Company" && <TableHead className=" text-center ">Candidates</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <Image
                        src={listing.Company?.logo as string}
                        alt="company-logo"
                        width={40}
                        height={40}
                        className="rounded-md size-10"
                      />
                    </TableCell>
                    <TableCell>{listing.Company?.name}</TableCell>
                    <TableCell>{listing.jobTitle}</TableCell>
                    <TableCell>
                      {userType === "JOB_SEEKER" && listing.AppliedJobPost.filter((item)=>item.jobId ===listing.id)[0]. status.charAt(0).toUpperCase() +
                       listing.AppliedJobPost.filter((item)=>item.jobId ===listing.id)[0]. status.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell>
                      {userType === "JOB_SEEKER" ?  listing.AppliedJobPost.filter(
                        (item) => item.jobId === listing.id
                      )[0].createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                          
                      }) : listing. createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                          
                      })} 
                    </TableCell >
                    {userType === "Company"  && <TableCell className="text-center">
                       
                      {listing.AppliedJobPost.length} 

                    </TableCell> }
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={"ghost"} size={"icon"}>
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {session.userType==="Company" ? <> <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${listing.id}/candidates`}>
                              <Users2 />
                              View Candidates
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${listing.id}/edit`}>
                              <PenBoxIcon />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <CopyLinks
                              jobUrl={`${process.env.NEXT_PUBLIC_URL}/job/${listing.id}`}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${listing.id}/delete`}>
                              <XCircle />
                              Delete Job
                            </Link>
                          </DropdownMenuItem> </> : <>
                          <DropdownMenuItem asChild>
                            <Link href={`/my-jobs/${listing.id}/delete`}>
                              <XCircle />
                             Cancel 
                            </Link>
                          </DropdownMenuItem>
                          </> }

                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
