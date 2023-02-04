import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as dotenv from "dotenv";

import cloudflare from "./lib/cloudflare";
import railway from "./lib/railway";
import vercel from "./lib/vercel";
import utils from "./lib/utils";

dotenv.config();

async function deployPreviewEnv(gitBranch, hasBackendPR) {
  try {
    const issueId = utils.getIssueIdFromBranchName(gitBranch);

    if (hasBackendPR === "true") {
      console.log(
        "Step 1: Make a request to the Railway to get PR env environment"
      );
      const railwayEnvironmentsResponse = await railway.getEnvironments();
      const railwayEnvironments =
        railwayEnvironmentsResponse.data.data.project.environments.edges;
      const previewEnvironment = railwayEnvironments.find(
        (e) => e.node.meta.branch === gitBranch
      );
      if (!previewEnvironment) {
        throw new Error("No preview environment found");
      }

      console.log("Step 2: Make a request to cloudflare to create a dns entry");
      const destinationUrl = `backend-${previewEnvironment.node.name}.up.railway.app`;
      await cloudflare.createDnsRecord(issueId, destinationUrl);

      console.log(
        "Step 3: Make a request to railway.app api to create a custom domain"
      );
      const domain = `${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
      await railway.createCustomDomain(domain, destinationUrl);
    }

    console.log(
      "Step 4: Make a request to add env variable to vercel via their api"
    );
    // todo move these to .env so they can be part of the config
    for (let env in ["NEXTAUTH_URL", "NEXT_PUBLIC_BASE_URL"]) {
      const domain = `https://${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
      await vercel.createEnvironmentVariables(gitBranch, env, domain);
    }
    if (hasBackendPR === "true") {
      // todo move these to .env so they can be part of the config
      for (let env in ["NEXT_PUBLIC_API_URL"]) {
        const domain = `https://${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
        await vercel.createEnvironmentVariables(gitBranch, env, domain);
      }
    }

    console.log(
      "Step 5: Make a request to add a custom domain to vercel via their api"
    );
    const domain = `${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
    await vercel.createCustomDomain(gitBranch, domain);
  } catch (error) {
    console.error(error.response);
  }
}

yargs(hideBin(process.argv))
  .command(
    "setup",
    "setup the preview environments",
    () => {},
    (argv) => {
      deployPreviewEnv(argv.branch, argv.hasBackendPr);
    }
  )
  .option("branch", {
    type: "string",
    description: "The branch for the for changes",
  })
  .option("has-backend-pr", {
    type: "boolean",
    description: "The changes have a backend PR",
  })
  .demandCommand(1)
  .parse();
