# wildr-website

# Local Environment Setup

## Firebase setup (one time only)

```
asdf plugin add firebase
```

```
npm install -g firebase-tools
firebase login
```

## Frontend Project setup (one time only)

1. Get all packages

```
npm install
```

2. From AWS secrets `website-frontend` add the following files to `root folder`

```
.env.local
.env.development
.env.staging
.env.production
```

## Backend Project setup (one time only)

1. Go to correct directory

```
cd functions
```

2. Get all packages

```
npm install
```

3. From AWS secrets `website-backend` add the following files to `functions folder`

```
dev-env-variables.json
staging-env-variables.json
prod-env-variables.json
```

# Running locally

### Run Frontend (will need backend running for any api requests)

```
npm run serve
```

### Run Backend (will use firebase dev database. There isn't a local database)

In a new terminal

```
cd functions
npm run serve
```

#Deployment

### Deploy Frontend (pick respective environment)

```
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```

### Deploy Backend (pick respective environment)

```
cd functions
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod
```
