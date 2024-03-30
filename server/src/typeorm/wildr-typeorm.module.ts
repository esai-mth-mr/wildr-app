import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeORMConfigWildr from './typeormconfig-wildr';
import typeORMConfigWildrBI, { BI_CONNECTION_NAME } from './typeormconfig-bi';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return typeORMConfigWildr;
      },
    }),
    TypeOrmModule.forRootAsync({
      name: BI_CONNECTION_NAME,
      useFactory: async () => {
        return typeORMConfigWildrBI;
      },
    }),
  ],
})
export class WildrTypeormModule {}
