import axios from "axios";
import { print } from "graphql";
import gql from "graphql-tag";

const RAILWAY_API_BASE_URL = 'https://backboard.railway.app/graphql/v2';

const getEnvironments = async () => {
  const GET_ENVIRONMENTS = gql`
    query ($id: String!) {
      project(id: $id) {
        name
        environments {
          edges {
            node {
              name
              meta {
                branch
              }
            }
          }
        }
      }
    }
  `;
  return await axios.post(
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
};

const createCustomDomain = async (domain, environmentId) => {
  const CREATE_CUSTOM_DOMAIN = gql`
    mutation CustomDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        serviceId
        domain
        environmentId
      }
    }
  `
  return await axios.post(
    RAILWAY_API_BASE_URL,
    {
      query: print(CREATE_CUSTOM_DOMAIN),
      variables: {
        input: {
          serviceId: process.env.RAILWAY_SERVICE_ID,
          environmentId,
          domain,
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
};

const deleteCustomDomain = async (domainId) => {
  const DELETE_CUSTOM_DOMAIN = gql`
    mutation CustomDomainDelete($id: String!) {
      customDomainDelete(id: $id)
    }
  `
  return await axios.post(
    RAILWAY_API_BASE_URL,
    {
      query: print(DELETE_CUSTOM_DOMAIN),
      variables: {
        id: domainId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RAILWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

export default {
  getEnvironments,
  createCustomDomain,
    deleteCustomDomain,
}
