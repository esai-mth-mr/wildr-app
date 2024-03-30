import { Test, TestingModuleBuilder, MockFactory } from '@nestjs/testing';
import { InstanceToken } from '@nestjs/core/injector/module';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import {
  Provider,
  Type,
  DynamicModule,
  ForwardReference,
} from '@nestjs/common';
import { OpenTelemetryMetricsModule } from '../opentelemetry/openTelemetry.module';
import './test-env';
import { BI_CONNECTION_NAME } from '@verdzie/server/typeorm/typeormconfig-bi';
import { Connection, QueryFailedError } from 'typeorm';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';

export const moduleMocker = new ModuleMocker(global);

export interface BaseTestingModuleOptions {
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
  controllers?: Type<any>[];
  providers?: Provider[];
}

export const getBaseTestingModule = (
  options: BaseTestingModuleOptions
): TestingModuleBuilder => {
  return Test.createTestingModule({
    imports: [
      OpenTelemetryMetricsModule,
      WinstonBeanstalkModule.forRoot(),
      ...(options.imports ?? []),
    ],
    providers: [...(options.providers ?? [])],
  });
};

export const BI_CONN_INSTANCE_TOKEN_NAME = BI_CONNECTION_NAME + 'DataSource';

/**
 * Creates a `MockFactory` using `jest-mock` that automatically mocks all
 * dependencies that are not provided in the mockMap.
 */
const createAutoMocker = (
  tokenMockMap?: Map<InstanceToken, any>
): MockFactory => {
  return (token: InstanceToken | undefined) => {
    if (!token) return {};

    // If the token is in the mockMap, return the mock object.
    if (tokenMockMap && tokenMockMap.has(token)) return tokenMockMap.get(token);

    // Retrieve the schema of an object constructor or function to be mocked.
    if (typeof token === 'function') {
      const mockMetadata = moduleMocker.getMetadata(
        token
      ) as MockFunctionMetadata<any, any>;
      // Create a mock constructor or function derived from the schema.
      const Mock = moduleMocker.generateFromMetadata(mockMetadata);

      return new Mock();
    } else if (typeof token === 'string' && token.includes('DataSource')) {
      // "DataSource" is the identifier used by nest typeorm so this will mock
      // all injected data sources.
      return {};
    }
  };
};

/**
 * Creates a testing module with the given module metadata and mocks all
 * dependencies that are not provided in the sourceMap. For example, when
 * testing the `PostService`, we want to mock the `PostRepository` with a simple
 * object that has a findByIds method. This can be done with the following code:
 *
 * ```ts
 * const module = createMockedTestingModule(
 *   { providers: [PostService] },
 *   new Map([[PostRepository, { findByIds: () => fakePosts }]])
 * );
 * ```
 *
 * @param moduleMetadata The module metadata to use for the testing module. It
 * should contain all providers, controllers, and imports that are needed for
 * the test.
 * @param tokenMockMap A map of `InstanceTokens` to mock objects. The token is
 * the class that should be mocked, and the mock object is the object that
 * should be used to mock the class.
 */
export const createMockedTestingModule = (
  moduleMetadata: BaseTestingModuleOptions,
  tokenMockMap?: Map<InstanceToken, any>
) => {
  return getBaseTestingModule(moduleMetadata)
    .useMocker(createAutoMocker(tokenMockMap))
    .compile();
};

/**
 * Clear the object keys of a mock so that changes do not effect other tests.
 * Note that keys are preserved as opposed to using `delete` as using `delete`
 * breaks the prototype chain causing potentially expensive memory allocation
 * changes. Further, the reference to the original object is also preserved to
 * reduce the need for garbage collection and creating a new testing module.
 */
export const resetMock = (mock: any) => {
  Object.keys(mock).forEach(key => {
    mock[key] = undefined;
  });
};

type RepositoryMocks = {
  [name: string]: Record<string, any>;
};

export const createMockQueryRunner = ({
  repositories,
}: {
  repositories: RepositoryMocks;
}) => {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn().mockImplementation(entity => {
        const repo = repositories[entity.name];
        if (!repo) {
          throw new Error(
            `Repository for ${entity.name} not found in repository mocks`
          );
        }
        return repo;
      }),
      increment: jest.fn().mockResolvedValue(undefined),
      decrement: jest.fn().mockResolvedValue(undefined),
    },
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  };
};

export const createMockRepo = ({
  entities = [],
  createQueryRunner = () => ({}),
}: {
  entities?: any[];
  createQueryRunner?: () => any;
}) => {
  const entitiesCopy = [...entities];
  const repo = {
    findOne: jest.fn().mockImplementation(async (id: string) => {
      return entitiesCopy.find(e => e.id === id);
    }),
    find: jest.fn().mockImplementation(async (ids?: any) => {
      return entitiesCopy.filter(e => ids.includes(e.id));
    }),
    findByIds: jest.fn().mockImplementation(async (ids: string[]) => {
      return entitiesCopy.filter(e => ids.includes(e.id));
    }),
    insert: jest.fn().mockImplementation(async (entity: any) => {
      const conflict = entitiesCopy.find(e => e.id === entity.id);
      if (conflict) {
        throw new QueryFailedError('Postgres unique violation', [], {
          code: POSTGRES_UNIQUE_VIOLATION_CODE,
        });
      }
      entitiesCopy.push(entity);
    }),
    update: jest.fn().mockImplementation(async (id: string, entity: any) => {
      const index = entitiesCopy.findIndex(e => e.id === id);
      if (index !== -1) {
        entitiesCopy[index] = {
          ...entitiesCopy[index],
          ...entity,
        };
      } else {
        throw new QueryFailedError('Entity not found', [], {});
      }
    }),
    delete: jest.fn().mockImplementation(async (id: string) => {
      const index = entitiesCopy.findIndex(e => e.id === id);
      if (index !== -1) {
        entitiesCopy.splice(index, 1);
      } else {
        throw new QueryFailedError('Entity not found', [], {});
      }
    }),
    createQueryBuilder: jest.fn().mockImplementation(() => {
      return {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(entitiesCopy),
        getOne: jest.fn().mockResolvedValue(entitiesCopy[0]),
        delete: jest.fn().mockResolvedValue(undefined),
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue(undefined),
      };
    }),
    manager: {},
  };
  return repo;
};

export const createMockConnection = ({
  repositories = {},
}: {
  repositories?: RepositoryMocks;
}): Connection => {
  const mockMetadata = moduleMocker.getMetadata(
    Connection
  ) as MockFunctionMetadata<any, any>;
  // Create a mock constructor or function derived from the schema.
  const Mock = moduleMocker.generateFromMetadata(mockMetadata);
  const connectionMock = new Mock();
  connectionMock.getRepository = jest.fn().mockImplementation(entity => {
    const repo = repositories[entity.name];
    if (!repo) {
      throw new Error(
        `Repository for ${entity.name} not found in repository mocks`
      );
    }
    return repo;
  });
  return connectionMock;
};
