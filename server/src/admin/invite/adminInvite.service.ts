import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCodeSchema } from '@verdzie/server/invite-code/inviteCode.schema';
import { InviteCodeEntity } from '@verdzie/server/invite-code/inviteCode.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { InviteCodeService } from '@verdzie/server/invite-code/inviteCode.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { GoogleApiService } from '@verdzie/server/google-api/google-api.service';

@Injectable()
export class AdminInviteService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(InviteCodeSchema)
    private repo: Repository<InviteCodeEntity>,
    private userService: UserService,
    private inviteCodeService: InviteCodeService,
    private googleApiService: GoogleApiService
  ) {
    this.logger = this.logger.child({ context: 'AdminInviteService' });
  }

  async getAllInvitesByUser(userId: string): Promise<InviteCodeEntity[]> {
    return await this.repo.find({
      where: {
        inviterId: userId,
      },
    });
  }

  async getInviteCodeDetailsByHandle(handle: string) {
    const user = await this.userService.findByHandle(handle);
    if (!user) return;
    const allInvites = await this.getAllInvitesByUser(user.id);
    const allInvitesWithHandles = [];
    for (const i of allInvites) {
      const temp: any = { ...i };
      if (i.redeemedByUserId) {
        temp.redeemedByUserHandle = (
          await this.userService.findById(i.redeemedByUserId)
        )?.handle;
      }
      allInvitesWithHandles.push(temp);
    }
    return {
      invites: allInvitesWithHandles,
      remainingUserInvites: user.inviteCount,
      userId: user.id,
    };
  }

  async addInvites(userId: string, numOfInvites: number) {
    const user = await this.userService.findById(userId);
    if (!user) return;
    const newInviteCount = (user.inviteCount ?? 0) + numOfInvites;
    const response = await this.userService.repo.update(userId, {
      inviteCount: newInviteCount,
    });
    return { status: response.affected === 1 ? 'OK' : 'ERROR' };
  }

  async generateReferralInvite(
    handle: string,
    utmName: string,
    sourceName: string
  ): Promise<GenericResponse> {
    let inviterId: string | undefined = undefined;
    const user: UserEntity | undefined = await this.userService.findByHandle(
      handle
    );
    if (user) inviterId = user.id;
    else return { status: 'ERROR', errorMessage: 'User not found' };
    let response = await this.inviteCodeService.findByUTMName(utmName);
    if (!response) {
      response = await this.inviteCodeService.createInviteCode({
        inviterId,
        utmName,
      });
    }
    if (!response)
      return { status: 'ERROR', errorMessage: 'unable to create invite code' };
    if (response.code) {
      const generatedDynamicLinkResponse =
        await this.googleApiService.generateReferralDynamicLink(
          response.code,
          utmName,
          sourceName
        );
      if (generatedDynamicLinkResponse.statusText == 'OK') {
        if (generatedDynamicLinkResponse.data.managedShortLink.link) {
          return {
            status: 'OK',
            data: {
              ...response,
              url: generatedDynamicLinkResponse.data.managedShortLink.link,
            },
          };
        } else {
          return { status: 'ERROR', errorMessage: 'Link null' };
        }
      } else {
        return { status: 'OK', data: generatedDynamicLinkResponse };
      }
    }
    return { status: 'ERROR', errorMessage: 'Code null' };
  }
}
