
const VERCEL_API_BASE_URL = 'https://api.vercel.com';

const createEnvironmentVariables = async (gitBranch, key, value) => {
  return await axios.post(
    `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env?teamId=${process.env.VERCEL_TEAM_ID}`,
    {
        target: ["preview"],
        type: "plain",
        key,
        value,
        gitBranch,
    },
    {
        headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        },
    },
  );
}

const createCustomDomain = async (gitBranch) => {
  return await axios.post(
    `${VERCEL_API_BASE_URL}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
    {
        name: `${issueId}.preview.${process.env.INTERNAL_BASE_URL}`,
        gitBranch,
    },
    {
        headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        },
    },
  );
}
