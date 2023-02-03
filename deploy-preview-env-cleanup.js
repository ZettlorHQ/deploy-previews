const prompt = require("prompt-sync")({ sigint: true });
const axios = require('axios');
const { print } = require('graphql');
const gql = require('graphql-tag');

const RAILWAY_API_BASE_URL = 'https://backboard.railway.app/graphql/v2';
const VERCEL_API_BASE_URL = 'https://api.vercel.com';
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

async function deployPreviewEnv(branch) {
    try {
        if (hasBackendPR === 'true') { 
            // Step 1: Make a request to the Railway to get PR env environment
            console.log('Step 1: Make a request to the Railway to get PR env environment');
            const GET_ENVIRONMENTS = gql`
                query ($id: String!) {
                    project(id: $id) {
                        name
                        environments {
                            edges {
                                node {
                                    name
                                    isEphemeral
                                }
                            }
                        }
                    }
                }
            `;
            const railwayEnvironmentsResponse = await axios.post(
                RAILWAY_API_BASE_URL,
                {
                    query: print(GET_ENVIRONMENTS),
                    variables: {
                        id: process.env.RAILWAY_PROJECT_ID,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.RAILWAY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(railwayEnvironmentsResponse.data);
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
            const cloudflareDnsCreateResponse = await axios.delete(
                `${CLOUDFLARE_API_BASE_URL}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            console.log(cloudflareDnsCreateResponse.data)
    
            // Step 3: Make a request to railway.app api to delete the custom domain
            console.log('Step 3: Make a request to railway.app api to delete the custom domain');
            const DELETE_CUSTOM_DOMAIN = gql`
                mutation CustomDomainDelete($id: String!) {
                    customDomainDelete(id: $id)
                }
            `
            const railwayCreateDomain = await axios.post(
                RAILWAY_API_BASE_URL,
                {
                    query: print(DELETE_CUSTOM_DOMAIN),
                    variables: {
                        id: "",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.RAILWAY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(railwayCreateDomain.data);
        }

        // Step 4: Get all the Vercel env variables and delete the ones that are for this branch
        console.log('Step 4: Get all the Vercel env variables and delete the ones that are for this branch');
        const vercelGetEnvVariables = await axios.delete(
            `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelGetEnvVariables.data);
        // Can add query to the get request above
        for (e in vercelGetEnvVariables.data.filter(e => e.branch === branch)) {
            const vercelDeleteEnvVariable = await axios.delete(
                `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env/${e.id}?teamId=${process.env.VERCEL_TEAM_ID}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                    },
                },
            );
            console.log(vercelDeleteEnvVariable.data);
        }

        // Step 5: Make a request to add a custom domain to vercel via their api
        console.log('Step 5: Make a request to add a custom domain to vercel via their api');
        const vercelGetDomains = await axios.delete(
            `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelGetDomains.data);
        // Can add query to the get request above
        const domain = vercelGetDomains.data.find(d => d.gitBranch === branch);
        const vercelCustomDomain = await axios.delete(
            `${VERCEL_API_BASE_URL}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain.id}?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelCustomDomain.data)
    } catch (error) {
        console.error(error.response);
    }
}

const branch = prompt('What is the "branch"? ');

deployPreviewEnv(branch);
