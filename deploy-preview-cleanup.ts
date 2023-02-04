const prompt = require("prompt-sync")({ sigint: true });

import railway from "./lib/railway";
import cloudflare from "./lib/cloudflare";
import vercel from "./lib/vercel";

async function deployPreviewEnv(gitBranch, hasBackendPR) {
  try {
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
      // {
      //     type: 'CNAME',
      //     name: `${issueId}.preview-api.${INTERNAL_BASE_URL}`,
      //     content: `backend-${previewEnvironment.node.name}.up.railway.app`,
      // },
      await cloudflare.deleteDnsRecord();

      // Step 3: Make a request to railway.app api to delete the custom domain
      console.log('Step 3: Make a request to railway.app api to delete the custom domain');
      await railway.deleteCustomDomain("");
    }

    // Step 4: Get all the Vercel env variables and delete the ones that are for this branch
    console.log('Step 4: Get all the Vercel env variables and delete the ones that are for this branch');
    vercel.deleteEnvironmentVariables(gitBranch);
   
    // Step 5: Make a request to add a custom domain to vercel via their api
    console.log('Step 5: Make a request to add a custom domain to vercel via their api');
    // const vercelGetDomains = await axios.get(
    //   `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    //     },
    //   },
    // );
    // console.log(vercelGetDomains.data);
    // // Can add query to the get request above
    // const domain = vercelGetDomains.data.find(d => d.gitBranch === branch);
    // const vercelCustomDomain = await axios.delete(
    //   `${VERCEL_API_BASE_URL}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain.id}?teamId=${process.env.VERCEL_TEAM_ID}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    //     },
    //   },
    // );
    // console.log(vercelCustomDomain.data)
  } catch (error) {
    console.error(error.response);
  }
}

const branch = prompt('What is the "branch"? ');

deployPreviewEnv(branch, "true");
