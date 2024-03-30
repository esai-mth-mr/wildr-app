import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { generateId } from '@verdzie/server/common/generateId';
import { Gender } from '@verdzie/server/generated-graphql';
import { PassFailState } from '@verdzie/server/data/common';
import fs from 'fs';
import { FirebaseAdminService } from '@verdzie/server/admin/firebase/firebase-admin.service';
import { UserService } from '@verdzie/server/user/user.service';
import { Job } from 'bull';
import _ from 'lodash';
import { join } from 'path';
import { FileUpload } from 'graphql-upload';
import axios from 'axios';
import sharp from 'sharp';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Creator } from '@verdzie/server/admin/creator-users/creator';
import {
  CREATE_CREATOR_JOB,
  CREATE_CREATOR_QUEUE_NAME,
} from '@verdzie/server/admin/creator-users/creator-user-queue-constants';

const CREATE_CREATOR_ACCOUNT_FILES = 'create-creator-account-temp-files';

const SLACK_ADMIN_COMMS_URL =
  'https://hooks.slack.com/services/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';

@Processor(CREATE_CREATOR_QUEUE_NAME)
export class CreateCreatorAccountConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private firebaseAdminService: FirebaseAdminService,
    private userService: UserService
  ) {
    this.logger = this.logger.child({
      context: this.constructor.name,
    });
    this.checkAndPrepareNecessaryDirs();
  }

  private convertToValidHandle(handle: string): string {
    return handle.trim().replace(/[ .!@#$%^&*]/g, '_');
  }

  @Process(CREATE_CREATOR_JOB)
  async createCreatorAccount(job: Job<Creator>) {
    const creator = job.data;
    let user: UserEntity | undefined;
    try {
      const firebaseUserRecord =
        await this.firebaseAdminService.createCreatorAccount(creator);
      const handles = creator.topThreeHandles
        .split(',')
        .map(handle => this.convertToValidHandle(handle));
      //Default handle is taken from user's name by replacing special characters and/or spaces with '_'
      let handle: string = this.convertToValidHandle(creator.name);
      const usersWithExistingHandles = await this.userService.findByHandles(
        handles
      );
      if (!usersWithExistingHandles || usersWithExistingHandles.length === 0) {
        handle = handles[0];
        const userWithHandle = await this.userService.findByHandle(handle);
        if (userWithHandle) {
          handle = handle + '_' + generateId(3);
        }
      } else {
        for (const h of handles) {
          const usersWithHandle = usersWithExistingHandles.filter(
            user => user.handle === h
          );
          if (usersWithHandle.length === 0) {
            handle = h;
            break;
          }
        }
      }
      this.logger.info('Using handle', { handle });
      const result = await this.userService.firebaseSignup({
        gender: Gender.NOT_SPECIFIED,
        handle,
        language: '',
        email: creator.email,
        name: creator.name,
        uid: firebaseUserRecord.uid,
      });
      if (typeof result === 'boolean') return;
      user = result.user;
      if (creator.bio) {
        await this.userService.updateBio(user.firebaseUID, creator.bio);
      }
      await this.userService.update(result.user.id, { score: 4.1 });
      await this.sendCreatorAccountCreatedCom(creator, handle);
    } catch (e) {
      this.logger.error('Failed to create creator', {
        e,
        creatorName: creator.name,
      });
      await this.sendFailedToCreateCreatorAccountCom(creator);
    }
    if (user) {
      try {
        if (
          creator.wildrVerifiedSelfie &&
          creator.wildrVerifiedSelfie.length > 0
        ) {
          this.logger.info(
            'Updating realId status',
            creator.wildrVerifiedSelfie
          );
          await this.userService.updateRealIdStatus(
            user,
            PassFailState.PASS,
            this.prepareImageFileUpload(creator.wildrVerifiedSelfie, true),
            { faceSignature: [] }
          );
        }
      } catch (e) {
        this.logger.error(e);
        await this.sendCreatorAccountCom(
          creator,
          '‼️failed to update RealIdStatus, potential issue with WildrVerifiedSelfie,'
        );
      }
      try {
        if (creator.profilePicture && creator.profilePicture.length > 0) {
          await this.userService.updateAvatar(
            user.firebaseUID,
            this.prepareImageFileUpload(creator.profilePicture, true)
          );
        }
      } catch (e) {
        this.logger.error(e);
        await this.sendCreatorAccountCom(
          creator,
          '‼️failed to update profile picture, potential issue with profilePicture,'
        );
      }
    }
    //Deleting the files
    try {
      if (
        creator.wildrVerifiedSelfie &&
        creator.wildrVerifiedSelfie.length > 0
      ) {
        fs.unlinkSync(this.getImageFilePath(creator.wildrVerifiedSelfie));
        fs.unlinkSync(
          this.getCompressedImageFilePath(creator.wildrVerifiedSelfie)
        );
      }
      if (creator.profilePicture && creator.profilePicture.length > 0) {
        fs.unlinkSync(this.getImageFilePath(creator.profilePicture));
        fs.unlinkSync(this.getCompressedImageFilePath(creator.profilePicture));
      }
    } catch (e) {
      this.logger.error('failed to unlink file', { e });
    }
  }

  async sendCreatorAccountCreatedCom(creator: Creator, handle: string) {
    const text =
      '🎉 Successfully created creator account for ' +
      creator.name +
      ', @' +
      handle +
      '; ' +
      creator.email;
    await axios.post(SLACK_ADMIN_COMMS_URL, { text });
  }

  async sendCreatorAccountCom(creator: Creator, message: string) {
    const text =
      message + '\n for the user' + creator.name + '; ' + creator.email;
    await axios.post(SLACK_ADMIN_COMMS_URL, { text });
  }

  async sendFailedToCreateCreatorAccountCom(creator: Creator) {
    const text =
      '‼️Failed to create creator account for' +
      creator.name +
      '; ' +
      creator.email;
    await axios.post(SLACK_ADMIN_COMMS_URL, { text });
  }

  getFullFilePath(fileName: string): string {
    return join('.', CREATE_CREATOR_ACCOUNT_FILES, fileName);
  }

  getCompressedImageFilePath(url: string) {
    const fileName = url.split('/').pop()!;
    return this.getFullFilePath(_.first(fileName.split('.')) + '.webp');
  }

  getImageFilePath(url: string) {
    const fileName = url.split('/').pop()!;
    return this.getFullFilePath(fileName);
  }

  checkAndPrepareNecessaryDirs() {
    try {
      if (fs.existsSync(join('.', CREATE_CREATOR_ACCOUNT_FILES))) {
        this.logger.info('Directory exists', {
          dirName: CREATE_CREATOR_ACCOUNT_FILES,
        });
      } else {
        this.logger.info('Directory does not exist ', {
          dirName: CREATE_CREATOR_ACCOUNT_FILES,
        });
        fs.mkdirSync(join('.', CREATE_CREATOR_ACCOUNT_FILES));
      }
    } catch (e) {
      this.logger.error('failed to create the directory', {
        dirName: CREATE_CREATOR_ACCOUNT_FILES,
      });
      return;
    }
  }

  async prepareImageFileUpload(
    url: string,
    isForAvatar?: boolean | undefined
  ): Promise<FileUpload> {
    try {
      new URL(url);
    } catch (e) {
      throw e;
    }
    const fileName = url.split('/').pop();
    if (!fileName) throw Error('could not retrieve filename');
    const fullFilePath = this.getFullFilePath(fileName);
    const request = await axios.get(url, { responseType: 'stream' });
    const writeStream = fs.createWriteStream(fullFilePath);
    request.data.pipe(writeStream);
    await new Promise(resolve => {
      writeStream.on('finish', () => {
        writeStream.close();
        console.log('Download finished');
        resolve(true);
      });
    });
    const compressedFilePath = this.getCompressedImageFilePath(url);
    await sharp(fullFilePath)
      .resize({
        width: isForAvatar === true ? 150 : 720,
        height: isForAvatar === true ? 150 : 1280,
      })
      .webp({
        lossless: false,
        effort: 6,
        quality: isForAvatar === true ? undefined : 50,
      })
      .toFile(compressedFilePath);
    return {
      filename: fileName,
      mimetype: 'image/webp',
      encoding: '7bit',
      createReadStream: () => fs.createReadStream(compressedFilePath),
    };
  }
}
