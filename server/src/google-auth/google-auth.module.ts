import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleAuthService } from './google-auth.service';

@Module({
  imports: [PassportModule],
  providers: [GoogleAuthService, GoogleAuthGuard],
  exports: [GoogleAuthGuard, GoogleAuthService],
})
export class GoogleAuthModule {}
