export interface PostDeleteStats {
  hasDeletedComments: boolean;
  hasBeenDeletedFromOpenSearch: boolean;
}

export const emptyPostDeleteStats = (): PostDeleteStats => {
  return {
    hasDeletedComments: false,
    hasBeenDeletedFromOpenSearch: false,
  };
};
