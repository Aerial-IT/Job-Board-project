 
import SearchBar from "@/components/SearchBar";
import { Separator } from "@/components/ui/separator";
//import CompanyJobPage from "@/components/views/CompanyJobPage";
import { JobFilter } from "@/components/views/JobFilters";
import JobListingLoading from "@/components/views/JobListingLoading";
import { JobListings } from "@/components/views/JobListings";
import MainPageWrapper from "@/components/views/MainPageWrapper";
import { prisma } from "@/utils/db";

import { requireUser } from "@/utils/requireUser";
import { redirect } from "next/navigation";
import { Suspense  } from "react";

type SearchParams = {
  searchParams: Promise<{
    page?: string;
    jobTypes?: string;
    location?: string;
    search?:string |null 
  }>;
};

async function GetAllJobPosts(){
  const data=await prisma.jobPost.findMany({
    select:{
      jobTitle:true,
      location:true,
      id:true
    }
  })

   

  return data 
}

export default async function Home({ searchParams }: SearchParams) {
  const params = await searchParams;

  const currenPage = Number(params.page) || 1;

  const user = await requireUser();

  const jobTypes = params.jobTypes?.split(",") || [];

  const location = params.location || "";
   const SearchQuery = params.search || null;

  const filterKey = `page=${currenPage};types=${jobTypes.join(
    ","
  )};location=${location}`;

  const jobPosts=await GetAllJobPosts()
  const userRole = user.role || user.userType;
  if(userRole && userRole.toLowerCase() === "company" ){
    redirect("/my-jobs")
  }

 
  return (
    <MainPageWrapper>
      <div className=" flex flex-col gap-4">
        {/* {user.role && user.role.toLowerCase() === "company" ? (
          <div className="col-span-3 flex flex-col gap-6">
            <CompanyJobPage />
          </div>
        ) : ( */}
          <>
            {" "}
            <div className="my-4">
            <SearchBar jobPosts={jobPosts} /> 
            </div>
            <JobFilter />
            <Separator className="w-full" />
            <div className="col-span-2 flex flex-col gap-6">
              <Suspense fallback={<JobListingLoading />} key={filterKey}>
                <JobListings
                  location={location}
                  jobTypes={jobTypes}
                  currentPage={currenPage}
                  SearchQuery={SearchQuery}
                />
              </Suspense>
            </div>{" "}
          </>
        {/* )} */}
      </div>
    </MainPageWrapper>
  );
}
