import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { FCMService } from './fcm.service';

@Module({
  imports: [FirebaseModule],
  providers: [FCMService],
  exports: [FCMService],
})
export class FCMModule {}
