# Deploy preview

(still a WIP as we figure out ways to optimize it)

This is a script to connect to Vercel and Railway PR previews for a full-stack experiences. 

## How it works

1. When a PR is opened, Vercel and Railway will create a preview environment
2. You'll run the script - you'll need to pass in the branch name. 
3. The script will pull the Railway environments and then parse them to find the one that matches the branch name
4. ...create a new Cloudflare DNS record for the branch name point to the Railway preview url
5. ...create a custom domain for the Railway preview
6. ...add environment variables to the Vercel project for the branch name
7. ...add custom domain in Vercel for the branch name

```
yarn install
npx ts-node ./deploy-preview
```

## Required params (see .env.example)

```
INTERNAL_BASE_URL # The base URL that the app will run on (e.g. cheese.dev)
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID
RAILWAY_API_KEY
RAILWAY_PROJECT_ID
RAILWAY_SERVICE_ID
VERCEL_API_TOKEN 
VERCEL_PROJECT_ID
VERCEL_TEAM_ID 
```

## Notes

- This only works for changes where there is a Vercel PR
- This assumes both frontend and backend are using the same branch name
- This is built off the idea of Linear branching and issues - notice lib/utils which will take the branch name and parse out the issue id
- You'll need to have PR Environments enabled on Railway
- Currently, it's also using Cloudflare to set the DNS but in the future Railway should support wildcard domains like Vercel and that'll remove a few steps.
