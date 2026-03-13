import { prisma } from "@/utils/db";
import { NomicEmbeddings } from "@langchain/nomic";

const embedding = new NomicEmbeddings({
  model: "nomic-embed-text-v1.5",
  dimensionality: 768,
});

import { PineconeStore } from "@langchain/pinecone";

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { unstable_cache } from "next/cache";

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

export const vectorStore = await PineconeStore.fromExistingIndex(embedding, {
  pineconeIndex,
});

export async function getRecommendedJob(queryString: string) {
  const CachecdRelevancScorefun = unstable_cache(async () => {
    const jobsByRelevanceScore = await vectorStore.similaritySearch(
      queryString,
      3
    );

    console.log("expensive function ran...");
    const Jobdata = await prisma.jobPost.findMany({
      select: {
        jobTitle: true,
        id: true,
        salaryFrom: true,
        salaryTo: true,
        employmentType: true,
        location: true,
        createdAt: true,
        Company: {
          select: {
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
    });

    console.log("jobs by relavance score", jobsByRelevanceScore)

    const jobMap = new Map(Jobdata.map((job) => [job.id, job]));
    return (
      jobsByRelevanceScore
        .flat()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((id: any) => jobMap.get(id.id))
        .filter((job) => job)
    );
  }, [queryString]);

  const jobRecomendations = await CachecdRelevancScorefun();

  console.log(jobRecomendations);

  return jobRecomendations;
}
