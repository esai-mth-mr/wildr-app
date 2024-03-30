import { adminClient } from '../../admin/util/admin-client';

const main = async () => {
  try {
    const { data } = await adminClient.post('/open-search/construct-index', {
      entityName: 'PostEntity',
      indexVersionName: 'post_explore_v1',
      indexVersionAlias: 'production',
    });
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

main();
