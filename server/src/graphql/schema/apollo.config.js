module.exports = {
  client: {
    includes: ['./*.graphql'],
    service: {
      name: 'Verdize Local',
      url: 'https://localhost:4000/graphql',
    },
  },
};
