import axios from "axios";

const VERCEL_API_BASE_URL = "https://api.vercel.com";

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
    }
  );
};

const deleteEnvironmentVariables = async (environmentVariableId) => {
  return await axios.delete(
    `${VERCEL_API_BASE_URL}/v10/projects/${process.env.VERCEL_PROJECT_ID}/env/${environmentVariableId}?teamId=${process.env.VERCEL_TEAM_ID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      },
    }
  );
};

const createCustomDomain = async (gitBranch, domain) => {
  return await axios.post(
    `${VERCEL_API_BASE_URL}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains?teamId=${process.env.VERCEL_TEAM_ID}`,
    {
      name: domain,
      gitBranch,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      },
    }
  );
};

export default {
  createEnvironmentVariables,
  deleteEnvironmentVariables,
  createCustomDomain,
};
