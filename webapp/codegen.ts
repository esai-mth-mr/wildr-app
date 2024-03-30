import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../server/src/graphql/schema/schema.graphql',
  documents: 'app/**/*.{tsx,ts}',
  generates: {
    'types/graphql_generated/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;
