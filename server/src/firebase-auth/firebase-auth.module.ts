import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseAuthStrategy } from './firebase-auth.strategy';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [PassportModule, FirebaseModule],
  providers: [FirebaseAuthService, FirebaseAuthStrategy, FirebaseAuthGuard],
  exports: [FirebaseAuthGuard, FirebaseAuthService],
})
export class FirebaseAuthModule {}
