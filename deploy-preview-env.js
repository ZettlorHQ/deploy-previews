const prompt = require("prompt-sync")({ sigint: true });
const axios = require('axios');
const { print } = require('graphql');
const gql = require('graphql-tag');

const RAILWAY_API_BASE_URL = 'https://backboard.railway.app/graphql/v2';
const VERCEL_API_BASE_URL = 'https://api.vercel.com';
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

async function deployPreviewEnv(issueId, branch, hasBackendPR) {
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
                        id: RAILWAY_PROJECT_ID,
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
            const cloudflareDnsCreateResponse = await axios.post(
                `${CLOUDFLARE_API_BASE_URL}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
                {
                    type: 'CNAME',
                    name: `${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`,
                    content: `backend-${previewEnvironment.node.name}.up.railway.app`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            console.log(cloudflareDnsCreateResponse.data)
    
            // Step 3: Make a request to railway.app api to create a custom domain
            console.log('Step 3: Make a request to railway.app api to create a custom domain');
            const CREATE_CUSTOM_DOMAIN = gql`
                mutation CustomDomainCreate($input: CustomDomainCreateInput!) {
                        customDomainCreate(input: $input) {
                        serviceId
                        domain
                        environmentId
                    }
                }
            `
            const railwayCreateDomain = await axios.post(
                RAILWAY_API_BASE_URL,
                {
                    query: print(CREATE_CUSTOM_DOMAIN),
                    variables: {
                        input: {
                            serviceId: RAILWAY_SERVICE_ID,
                            environmentId: "006de7f2-3393-450a-a85e-fc5c2c4db3ea",
                            domain: `${issueId}.preview-api.${INTERNAL_BASE_URL}`
                        }
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

        // Step 4: Make a request to add env variable to vercel via their api
        console.log('Step 4: Make a request to add env variable to vercel via their api');
        const vercelAddEnvVariable1 = await axios.post(
            `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                target: ["preview"],
                type: "sensitive",
                key: "NEXTAUTH_URL",
                value: `https://${issueId}.preview.${process.env.INTERNAL_BASE_URL}`,
                gitBranch: branch,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelAddEnvVariable1.data)
        const vercelAddEnvVariable2 = await axios.post(
            `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                target: ["preview"],
                type: "sensitive",
                key: "NEXT_PUBLIC_BASE_URL",
                value: `https://${issueId}.preview.${process.env.INTERNAL_BASE_URL}`,
                gitBranch: branch,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelAddEnvVariable2.data)
        const vercelAddEnvVariable3 = await axios.post(
            `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                target: ["preview"],
                type: "sensitive",
                key: "NEXT_PUBLIC_ZETTLOR_API_URL",
                value: `https://${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`,
                gitBranch: branch,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
                },
            },
        );
        console.log(vercelAddEnvVariable3.data)

        // Step 5: Make a request to add a custom domain to vercel via their api
        console.log('Step 5: Make a request to add a custom domain to vercel via their api');
        const vercelCustomDomain = await axios.post(
            `${VERCEL_API_BASE_URL}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
            {
                name: `${issueId}.preview.${process.env.INTERNAL_BASE_URL}`,
                gitBranch: branch,
            },
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

const issueId = prompt('What is the "issueId"? ');
const branch = prompt('What is the "branch"? ');
const hasBackendPR = prompt('Does the change have a backend PR? ("true" or "false") ');

deployPreviewEnv(issueId, branch, hasBackendPR);
