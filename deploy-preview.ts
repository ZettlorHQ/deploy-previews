const prompt = require("prompt-sync")({ sigint: true });

import cloudflare from "./lib/cloudflare";
import railway from "./lib/railway";
import vercel from "./lib/vercel";
import utils from "./lib/utils";

async function deployPreviewEnv(gitBranch, hasBackendPR) {
  try {
    const issueId = utils.getIssueIdFromBranchName(gitBranch);
    
    if (hasBackendPR === 'true') { 
      // Step 1: Make a request to the Railway to get PR env environment
      console.log('Step 1: Make a request to the Railway to get PR env environment');
      const railwayEnvironmentsResponse = await railway.getEnvironments();
      const railwayEnvironments = railwayEnvironmentsResponse.data.data.project.environments.edges;
      // Assumes there is only one PR environment - could pass PR number to be more specific
      const previewEnvironment = railwayEnvironments.find((e) => e.node.isEphemeral);
      if (!previewEnvironment) {
          throw new Error('No preview environment found');
      }

      // Step 2: Make a request to cloudflare to create a dns entry
      console.log('Step 2: Make a request to cloudflare to create a dns entry');
      const destinationUrl = `backend-${previewEnvironment.node.name}.up.railway.app`;
      await cloudflare.createDnsRecord(issueId, destinationUrl);

      // Step 3: Make a request to railway.app api to create a custom domain
      console.log('Step 3: Make a request to railway.app api to create a custom domain');
      const domain = `${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
      await railway.createCustomDomain(domain, destinationUrl);
    }

    // Step 4: Make a request to add env variable to vercel via their api
    console.log('Step 4: Make a request to add env variable to vercel via their api');
    for (let env in ['NEXTAUTH_URL', 'NEXT_PUBLIC_BASE_URL']) {
      const domain = `https://${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
      await vercel.createEnvironmentVariables(gitBranch, env, domain);
    }
    if (hasBackendPR === 'true') {
      for (let env in ['NEXT_PUBLIC_API_URL']) {
        const domain = `https://${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`;
        await vercel.createEnvironmentVariables(gitBranch, env, domain);
      }
    }
    
    // Step 5: Make a request to add a custom domain to vercel via their api
    console.log('Step 5: Make a request to add a custom domain to vercel via their api');
    const domain = `${issueId}.preview.${process.env.INTERNAL_BASE_URL}`;
    await vercel.createCustomDomain(gitBranch, domain);
  } catch (error) {
    console.error(error.response);
  }
}

const branch = prompt('What is the "branch"? ');
const hasBackendPR = prompt('Does the change have a backend PR? ("true" or "false") ');

deployPreviewEnv(branch, hasBackendPR);