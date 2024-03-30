import { Inject, Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { TagEntity } from '@verdzie/server/tag/tag.entity';
import { ESItemType } from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';

const k_ES_USER_INDEX = 'users';
const k_USER_INDEX_IMAGE_URL = 'imageUrl';
const k_USER_INDEX_NAME = 'name';
const k_USER_INDEX_HANDLE = 'handle';
const k_ES_POST_CONTENT_INDEX = 'post_content';
const k_POST_CONTENT_CONTENT = 'content';
const k_POST_CONTENT_THUMB_URL = 'thumbUrl';
const k_POST_CATEGORIES_URL = 'categories';
const k_POST_CONTENT_POST_TYPE = 'post_type';
const k_ES_HASHTAGS_INDEX = 'hashtags';
const k_HASHTAGS_TAG_NAME = 'tag_name';
const k_UPDATED_AT = 'updated_at';

export interface index {
  index: {
    _index: string;
    _id: string;
  };
}

@Injectable()
export class OpenSearchIndexService {
  private readonly region: string = '';
  private readonly esMaster: string = '';
  private readonly esPassword: string = '';
  private readonly esEndpoint: string = '';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    if (!process.env.AWS_REGION || process.env.AWS_REGION === '') {
      throw Error('Specify the AWS_DOMAIN environment variable');
    }
    if (!process.env.ES_MASTER || process.env.ES_MASTER === '') {
      throw Error('Specify the ES_MASTER environment variable');
    }
    if (!process.env.ES_PASSWORD || process.env.ES_PASSWORD === '') {
      throw Error('Specify the ES_PASSWORD environment variable');
    }
    if (!process.env.ES_ENDPOINT || process.env.ES_ENDPOINT === '') {
      throw Error('Specify the ES_ENDPOINT environment variable');
    }
    this.region = process.env.AWS_REGION.toString();
    this.esMaster = process.env.ES_MASTER.toString();
    this.esPassword = process.env.ES_PASSWORD.toString();
    this.esEndpoint = process.env.ES_ENDPOINT.toString();
    this.logger = this.logger.child({ context: ['OpenSearchIndexService'] });
  }

  /// Indexing
  async indexPostContent(
    id: string,
    content: string,
    thumbUrl: string,
    postType: string
  ) {
    await this.indexDocument(
      `{
        "${k_POST_CONTENT_CONTENT}": "${content.toString().trim()}",
        "${k_POST_CONTENT_THUMB_URL}": "${thumbUrl}",
        "${k_POST_CONTENT_POST_TYPE}": "${postType}",
        "${k_UPDATED_AT}": "${new Date().toISOString()}"
      }`,
      k_ES_POST_CONTENT_INDEX,
      id
    );
  }

  async indexUser(id: string, handle: string, name: string, imageUrl: string) {
    await this.indexDocument(
      `{
        "${k_USER_INDEX_HANDLE}": "${handle}",
        "${k_USER_INDEX_NAME}": "${name}",
        "${k_UPDATED_AT}": "${new Date().toISOString()}"
      }`,
      k_ES_USER_INDEX,
      id
    );
  }

  async indexHashTag(id: string, hashtag: string) {
    await this.indexDocument(
      `{ "${k_HASHTAGS_TAG_NAME}": "${hashtag}" }`,
      k_ES_HASHTAGS_INDEX,
      id
    );
  }

  async indexMultipleHashTags(tags: TagEntity[]) {
    this.debugLog('Indexing multiple hashtags');
    let json = '';
    tags.forEach(tag => {
      json += `{ "index":{ "_index": "${k_ES_HASHTAGS_INDEX}", "_id": "${tag.id}"} }`;
      json += '\n';
      json += `{ "${k_HASHTAGS_TAG_NAME}": "${
        tag.name
      }", "${k_UPDATED_AT}": "${new Date().toISOString()}"}`;
      json += '\n';
    });
    await this.indexDocument(json, '', '', true);
  }

  private async indexDocument(
    jsonDoc: string,
    index: string,
    id: string,
    isBulk = false
  ) {
    this.debugLog(`Indexing ${index}`);
    this.debugLog(`Doc ${jsonDoc}`);
    const request = this.getRequestObj();
    request.method = 'POST';
    if (isBulk) {
      request.path += '_bulk';
    } else {
      request.path += index + '/' + '_doc' + '/' + id;
    }
    request.body = jsonDoc;
    // @ts-ignore
    const client = new AWS.HttpClient();

    const consoleLog = (arg: any) => this.consoleLog(arg);
    //this.debugLog(`REQUEST = ${request} \n JSON -> ${JSON.stringify(request)}`);
    await client.handleRequest(
      request,
      null,
      async function (response: AWS.HttpResponse) {
        consoleLog(response.statusCode + ' ' + response.statusMessage);
        let responseBody = '';
        // @ts-ignore
        response.on('data', function (chunk) {
          responseBody += chunk;
        });
        // @ts-ignore
        response.on('end', function (chunk) {
          consoleLog('Response body: ' + responseBody);
        });
        ///TODO: Parse the response
        if (response.statusCode === 200 || response.statusCode === 201) {
          consoleLog('Indexing successful');
          ///TODO: set the status "indexed" = true
        } else {
          consoleLog('Indexing failed');
        }
      },
      function (error: AWS.AWSError) {
        consoleLog(error);
      }
    );
  }

  //Update
  async updateUserHandle(id: string, handle: string) {
    await this.updateDocument(
      `{ "${k_USER_INDEX_HANDLE}": "${handle}", "${k_UPDATED_AT}": "${new Date().toISOString()}"}`,
      k_ES_USER_INDEX,
      id
    );
  }

  async updateUserName(id: string, name: string) {
    await this.updateDocument(
      `{ "${k_USER_INDEX_NAME}": "${name}", "${k_UPDATED_AT}": "${new Date().toISOString()}"}`,
      k_ES_USER_INDEX,
      id
    );
  }

  async updateUserHandleAndName(id: string, handle: string, name: string) {
    await this.updateDocument(
      `{ "${k_USER_INDEX_HANDLE}": "${handle}", "${k_USER_INDEX_NAME}": "${name}", "${k_UPDATED_AT}": "${new Date().toISOString()}"}`,
      k_ES_USER_INDEX,
      id
    );
  }

  async updateUserImageUrl(id: string, imageUrl: string) {
    await this.updateDocument(
      `{ "${k_USER_INDEX_IMAGE_URL}": "${imageUrl}", "${k_UPDATED_AT}": "${new Date().toISOString()}"}`,
      k_ES_USER_INDEX,
      id
    );
  }

  async updatePostContent(content: string, id: string) {
    await this.updateDocument(
      `{ "${k_POST_CONTENT_THUMB_URL}": "${content}", "${k_UPDATED_AT}": "${new Date().toISOString()}}`,
      k_ES_POST_CONTENT_INDEX,
      id
    );
  }

  async addCategoriesToPost(categories: string[], id: string) {
    await this.updateDocument(
      JSON.stringify({ categories, updated_at: new Date().toISOString() }),
      k_ES_POST_CONTENT_INDEX,
      id
    );
  }

  private async updateDocument(jsonDoc: string, index: string, id: string) {
    this.debugLog(`Updating Doc ${index}, DOC -> ${jsonDoc}, id => ${id}`);
    const request = this.getRequestObj();
    jsonDoc = `{"doc":${jsonDoc}}`;
    request.method = 'POST';
    request.path += index + '/_update/' + id;
    request.body = jsonDoc;

    // @ts-ignore
    const client = new AWS.HttpClient();
    const consoleLog = (arg: any) => this.consoleLog(arg);
    await client.handleRequest(
      request,
      null,
      async function (response: AWS.HttpResponse) {
        consoleLog(response.statusCode + ' ' + response.statusMessage);
        let responseBody = '';
        // @ts-ignore
        response.on('data', function (chunk) {
          responseBody += chunk;
        });
        // @ts-ignore
        response.on('end', function (chunk) {
          consoleLog('Response body: ' + responseBody);
        });
        //TODO: Parse the response
        if (response.statusCode == 200) {
          //TODO: set the status "indexed" = true
        }
      },
      function (error: AWS.AWSError) {
        consoleLog(error);
      }
    );
  }

  async updateUsersInBulk(userEntities: UserEntity[]) {
    let jsonDoc = '';
    for (const user of userEntities) {
      const index = JSON.stringify({
        update: { _index: k_ES_USER_INDEX, _id: user.id },
      });
      const userUpdate = JSON.stringify({
        doc: {
          [k_USER_INDEX_NAME]: user.name,
          [k_USER_INDEX_HANDLE]: user.handle,
          [k_UPDATED_AT]: new Date().toISOString(),
        },
      });
      jsonDoc += index;
      jsonDoc += '\n';
      jsonDoc += userUpdate;
      jsonDoc += '\n';
    }
    await this.updateDocumentInBatch(jsonDoc);
  }

  private async updateDocumentInBatch(jsonDoc: string) {
    this.debugLog(`Updating Doc in batches DOC -> ${jsonDoc}`);
    const request = this.getRequestObj();
    request.method = 'POST';
    request.path += '_bulk';
    request.body = jsonDoc;

    // @ts-ignore
    const client = new AWS.HttpClient();
    const consoleLog = (arg: any) => this.consoleLog(arg);
    await client.handleRequest(
      request,
      null,
      async function (response: AWS.HttpResponse) {
        consoleLog(response.statusCode + ' ' + response.statusMessage);
        let responseBody = '';
        // @ts-ignore
        response.on('data', function (chunk) {
          responseBody += chunk;
        });
        // @ts-ignore
        response.on('end', function (chunk) {
          consoleLog('Response body: ' + responseBody);
        });
        //TODO: Parse the response
        if (response.statusCode == 200) {
          //TODO: set the status "indexed" = true
        }
      },
      function (error: AWS.AWSError) {
        consoleLog(error);
      }
    );
  }

  /// Misc.
  private debugLog(content: string) {
    this.logger.debug(content);
    // console.log(`[OpenSearchService]: ${content}`);
  }

  private consoleLog(content: string) {
    console.log(`[OpenSearchService]: ${content}`);
  }

  private getRequestObj(): AWS.HttpRequest {
    const endpoint = new AWS.Endpoint(this.esEndpoint);
    const request = new AWS.HttpRequest(endpoint, this.region);
    request.headers['Content-Type'] = 'application/json';
    request.headers['Authorization'] =
      'Basic ' +
      Buffer.from(this.esMaster + ':' + this.esPassword).toString('base64');
    return request;
  }

  private getESItemTypeEnum(index: string): ESItemType {
    if (index == k_ES_USER_INDEX) {
      return ESItemType.USER;
    } else if (index == k_ES_HASHTAGS_INDEX) {
      return ESItemType.TAG;
    } else {
      return ESItemType.POST;
    }
  }
}
