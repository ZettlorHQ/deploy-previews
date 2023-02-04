import axios from "axios";

const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

const createDnsRecord = async (issueId, destinationUrl) => {
  return await axios.post(
    `${CLOUDFLARE_API_BASE_URL}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
    {
      type: 'CNAME',
      name: `${issueId}.preview-api.${process.env.INTERNAL_BASE_URL}`,
      content: destinationUrl,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
};

// TODO figure out how to delete a dns record
const deleteDnsRecord = async () => {
  return await axios.delete(
    `${process.env.CLOUDFLARE_API_BASE_URL}/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
};

export default {
  createDnsRecord,
  deleteDnsRecord,
}
