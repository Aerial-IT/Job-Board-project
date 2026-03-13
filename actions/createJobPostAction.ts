"use server";

import { prisma } from "@/utils/db";
import { inngest } from "@/utils/inngest/client";
import { jobListingDurationSelector } from "@/utils/jobListingDurationPricing";
import { aj } from "@/utils/protection-rules";

import { requireUser } from "@/utils/requireUser";
import { stripe } from "@/utils/stripe";
import { jobSchema } from "@/utils/zodschemas";
import { request } from "@arcjet/next";

import { redirect } from "next/navigation";
 
import { vectorStore } from "./VectorStore/recommendation";

const ENABLE_PAYMENT = false; // Set to false to skip payment (testing mode)

export async function createJob(data: unknown) {
  try {
    const user = await requireUser();

    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      throw new Error("Forbidden");
    }

    const validatedata = jobSchema.parse(data);

    const company = await prisma.company.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        user: {
          select: {
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!company?.id) {
      return redirect("/");
    }

    // Skip Stripe customer creation in testing mode
    let stripeCustomerid = company.user.stripeCustomerId;

    if (!stripeCustomerid && ENABLE_PAYMENT) {
      const customer = await stripe.customers.create({
        email: user.email as string,
        name: user.name as string,
      });

      stripeCustomerid = customer.id;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId: stripeCustomerid,
        },
      });
    }

    console.log("from create job action-befo-prisma", data);

    const jobPost = await prisma.jobPost.create({
      data: {
        jobDescription: validatedata.jobDescription,
        jobTitle: validatedata.jobTitle,
        employmentType: validatedata.employmentType,
        location: validatedata.location,
        salaryFrom: validatedata.salaryFrom,
        salaryTo: validatedata.salaryTo,
        listingDuration: validatedata.listingDuration,
        benefits: validatedata.benefits,
        companyId: company.id,
      },
    });

    // Skip vector store in testing mode if it causes issues
    if (validatedata.VectorStore_plaitext) {
      try {
        await vectorStore.addDocuments([
          {
            metadata: { "job-title": validatedata.jobTitle },
            pageContent: validatedata.VectorStore_plaitext,
          },
        ], { ids: [jobPost.id] });
      } catch (vectorError) {
        console.error("Vector store error:", vectorError);
      }
    }

    const pricingTier = jobListingDurationSelector.find(
      (tier) => tier.days === validatedata.listingDuration
    );

    if (!pricingTier) {
      throw new Error("invalid Listing duration selected");
    }

    // Skip inngest in testing mode if it causes issues
    try {
      await inngest.send({
        name: "job/created",
        data: {
          jobId: jobPost.id,
          expirationDays: validatedata.listingDuration,
        },
      });
    } catch (inngestError) {
      console.error("Inngest error:", inngestError);
    }

    // Skip payment in testing mode
    if (!ENABLE_PAYMENT) {
      console.log("Payment skipped - Testing mode enabled");
      return redirect("/my-jobs");
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerid,
      line_items: [
        {
          price_data: {
            product_data: {
              name: `Job Posting -${pricingTier.days} Days`,
              description: pricingTier.description,
              images: [
                "https://7eupqxv3k3.ufs.sh/f/nuRybcTrVpHbDbJBJEIBGSdCXtT3IRxK0ZqUMvaQLpeoJAjh",
              ],
            },
            currency: "USD",
            unit_amount: pricingTier.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        jobId: jobPost.id,
      },
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
    });
    return redirect(session.url!);
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}
