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
        "Step 1: Get environments from Railway and filter to find the PR preview environment"
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

      console.log("Step 2: Ceate a DNS entry in Cloudflare pointing to the PR preview in Railway");
      const destinationUrl = `backend-${previewEnvironment.node.name}.up.railway.app`;
      await cloudflare.createDnsRecord(issueId, destinationUrl);

      console.log(
        "Step 3: Create a custom domain in Railway with the new DNS entry"
      );
      const domain = `${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
      await railway.createCustomDomain(domain, destinationUrl);
    }

    console.log(
      "Step 4: Add env variables to Vercel for the new app and API urls"
    );
    // TODO: move these to .env so they can be part of the config
    for (let env in ["NEXTAUTH_URL", "NEXT_PUBLIC_BASE_URL"]) {
      const domain = `https://${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
      await vercel.createEnvironmentVariables(gitBranch, env, domain);
    }
    if (hasBackendPR === "true") {
      // TODO: move these to .env so they can be part of the config
      for (let env in ["NEXT_PUBLIC_API_URL"]) {
        const domain = `https://${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
        await vercel.createEnvironmentVariables(gitBranch, env, domain);
      }
    }

    console.log(
      "Step 5: Add a custom domain to Vercel for the preview"
    );
    const domain = `${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
    await vercel.createCustomDomain(gitBranch, domain);
  } catch (error) {
    console.error(error.response);
  }
}

yargs(hideBin(process.argv))
  .command(
    "run",
    "Run the script to set up the preview environments",
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
