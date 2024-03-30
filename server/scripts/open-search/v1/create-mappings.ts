import { client, logAxiosError } from '../open-search-client';

async function addOSUserMappings() {
  await client.put('/users', {
    settings: {
      analysis: {
        analyzer: {
          handle_analyzer: {
            type: 'custom',
            tokenizer: 'handle_tokenizer',
            filter: ['lowercase'],
          },
        },
        tokenizer: {
          handle_ngram: {
            type: 'ngram',
            min_gram: 2,
            max_gram: 3,
          },
          handle_tokenizer: {
            type: 'char_group',
            tokenize_on_chars: ['whitespace', '-', '_'],
          },
        },
      },
    },
    mappings: {
      properties: {
        handle: {
          type: 'text',
          analyzer: 'handle_analyzer',
          search_analyzer: 'handle_analyzer',
        },
        name: {
          type: 'text',
        },
        imageUrl: {
          type: 'keyword',
          index: false,
        },
        wallet_address: {
          type: 'keyword',
        },
        updated_at: {
          type: 'date',
          format: 'date_time',
        },
      },
    },
  });
  console.log('Created users index');
}

async function addOSPostContentMappings() {
  await client.put('/post_content', {
    mappings: {
      properties: {
        content: {
          type: 'text',
        },
        users: {
          type: 'keyword',
        },
        categories: {
          type: 'text',
        },
        thumbUrl: {
          type: 'keyword',
          index: false,
        },
        post_type: {
          type: 'keyword',
          index: false,
        },
        updated_at: {
          type: 'date',
          format: 'date_time',
        },
      },
    },
  });
  console.log('Created post_content index');
}

async function addOSPostMappings() {
  await client.put('/hashtags', {
    settings: {
      analysis: {
        analyzer: {
          hashtag_analyzer: {
            type: 'custom',
            tokenizer: 'hashtag_tokenizer',
          },
        },
        tokenizer: {
          hashtag_ngram: {
            type: 'ngram',
            min_gram: 2,
            max_gram: 3,
          },
          hashtag_tokenizer: {
            type: 'char_group',
            tokenize_on_chars: ['_'],
          },
        },
      },
    },
    mappings: {
      properties: {
        tag_name: {
          type: 'text',
          analyzer: 'hashtag_analyzer',
          search_analyzer: 'hashtag_analyzer',
        },
        updated_at: {
          type: 'date',
          format: 'date_time',
        },
      },
    },
  });
  console.log('Created posts index');
}

async function createOSMappings() {
  try {
    console.log('Creating Open Search Indexes...');
    await addOSUserMappings();
    await addOSPostContentMappings();
    await addOSPostMappings();

    console.log('Successfully created Open Search indexes');
  } catch (error: any) {
    logAxiosError(error);
  }
}

async function main() {
  createOSMappings();
}

main();
