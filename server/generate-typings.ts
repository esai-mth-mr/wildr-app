import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();

try {
  definitionsFactory.generate({
    typePaths: ['src/**/*schema.graphql'],
    path: join(process.cwd(), 'src/generated-graphql.ts'),
    outputAs: 'class',
    emitTypenameField: true,
    watch: false,
  });
} catch (err) {
  console.error('Unable to generate schema: ', err);
}
