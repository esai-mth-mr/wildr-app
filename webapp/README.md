# Getting Started

### Install dependencies via command:

`yarn`

### Add a local env file

Add the following to `.env.local`

```env
GRAPHQL_URL=https://wildr-dev-2-new.api.dev.wildr.com/graphql
RECAPTCHA_SITE_KEY=6LcsQx4pAAAAAIEGFiFG5Up7chti-Uvm0sAMolFs
```

### Run the development server:

`yarn run dev`

Find the working server on this address:

http://localhost:3000

## Deploying

### Deploying to dev.wildr.com

Add `.env.production.wildr-dev` add the following variables:

```env
GRAPHQL_URL=https://wildr-dev-2-new.api.dev.wildr.com/graphql
RECAPTCHA_SITE_KEY=6LcsQx4pAAAAAIEGFiFG5Up7chti-Uvm0sAMolFs
```

Then run the following command:

`yarn deploy:dev`

### Deploying to wildr.com

Add `.env.production.wildr-prod` add the following variables:

```env
GRAPHQL_URL=https://api.wildr.com/graphql
RECAPTCHA_SITE_KEY=6Lc65TopAAAAAFO4koQarIQKfp-NsNrNQIms_hXN
```

Then run the following command:

`yarn deploy:dev`
