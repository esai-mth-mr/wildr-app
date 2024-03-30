import { Module } from '@nestjs/common';
import { FirebaseAdminService } from '@verdzie/server/admin/firebase/firebase-admin.service';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';

@Module({
  imports: [FirebaseAuthModule],
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class FirebaseAdminModule {}
