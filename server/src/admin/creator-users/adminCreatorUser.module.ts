import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { UserModule } from '@verdzie/server/user/user.module';
import { AdminCreatorUserController } from '@verdzie/server/admin/creator-users/adminCreatorUser.controller';
import { AdminCreatorUserService } from '@verdzie/server/admin/creator-users/adminCreatorUser.service';
import { PostModule } from '@verdzie/server/post/post.module';
import { FirebaseAdminModule } from '@verdzie/server/admin/firebase/firebase-admin.module';
import { CreateCreatorAccountWorkerModule } from '@verdzie/server/worker/create-creator-account/createCreatorAccountWorker.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),
    UserModule,
    PostModule,
    CreateCreatorAccountWorkerModule,
    FirebaseAdminModule,
  ],
  controllers: [AdminCreatorUserController],
  providers: [AdminCreatorUserService],
  exports: [AdminCreatorUserService],
})
export class AdminCreatorUserModule {}
