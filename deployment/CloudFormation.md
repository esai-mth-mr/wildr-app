# Current Stacks

## wildr-dev-2

This stack is used for development. It includes everything needed to run the application including networking configs, the primary database config, the server, worker, and admin.

## wildr-prod-1

This stack is used for production. It includes the server, worker, and admin but the networking config and database config are passed as parameters. This is because they were created before cloud formation was used.

## bi-db

This stack is used for the BI database in production and dev depending on the parameters passed. It includes the database and the networking config. It relies on the some outputs from the primary dev and prod stacks.

## prod-shim

This stack is used to export existing resources from prod that are not in cloud formation. This allows us to use the same template for the bi db in prod and dev.

# Quick Deploy

## wildr-dev-2

To deploy `wildr-dev-2` update the `AdminServerContainerImageTag` and `ServerContainerImageTag` parameters in `cloud-formation-parameters-wildr-dev-2.json` and run the following command:

```shell
bash deploy-wildr-dev-2.sh
```

## wildr-prod-1

To deploy `wildr-prod-1` update the `AdminServerContainerImageTag` in `cloud-formation-parameters-wildr-prod-1.json` and run the following command:

```shell
bash deploy-wildr-prod-1.sh
```

# Useful Commands

## Create Stack

You can use the `create-stack.sh` script to create new stacks. It requires the following environment variables:

- `STACK_NAME`: The name of the stack to create (e.g. `wildr-dev-2`)
- `ENV`: The environment to create the stack in (e.g. `dev`)
- `TEMPLATE_NAME`: The name of the template to use (e.g. `wildr-dev-2`) the template name should match the directory that the template `.yml` file is in as well as the post fix of the parameter file (e.g. `cloud-formation-parameters-wildr-dev-2.json`)

```shell
STACK_NAME='wildr-dev-2' ENV='dev' TEMPLATE_NAME='wildr-dev-2' bash create-stack.sh
```

## Lint Template

Install Linter

```
brew install cfn-lint
```

Run Linter

```shell
cfn-lint <template>.yml
```

## Update Stack

You can use the `update-stack.sh` script to create new stacks. It requires the following environment variables:

- `STACK_NAME`: The name of the stack to watch (e.g. `wildr-dev-2`)
- `ENV`: The `WildrEnv` of the stack (e.g. `dev`)
- `TEMPLATE_NAME`: The name of the template to use (e.g. `wildr-dev-2`) the template name should match the directory that the template `.yml` file is in as well as the post fix of the parameter file (e.g. `cloud-formation-parameters-wildr-dev-2.json`)

```shell
STACK_NAME='wildr-dev-2' ENV='dev' TEMPLATE_NAME='wildr-dev-2' bash update-stack.sh
```

## Watch Stack

You may want to watch the cloud formation update or creation status. This can be done with the following command. It requires the following environment variables:

- `STACK_NAME`: The name of the stack to watch (e.g. `wildr-dev-2`)

```shell
STACK_NAME='wildr-dev-2' bash watch-stack.sh
```

## Delete Stack

You can delete a stack using the `delete-stack.sh` script. It requires the following environment variables:

- `STACK_NAME`: The name of the stack to delete (e.g. `wildr-dev-2`)

```shell
STACK_NAME='wildr-dev-2' bash delete-stack.sh
```

# Notes

- Currently, the secrets stored in parameter store including bucket name and cloudformation params need to be updated by hand. These should be moved out of that config to avoid this.
