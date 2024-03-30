'use strict';

require('dotenv').config();

const autocannon = require('autocannon');
const { faker } = require('@faker-js/faker');

async function test() {
  const tweets = {};

  for (let index = 0; index < 100; index++) {
    tweets[faker.datatype.number()] = faker.lorem.paragraph();
  }

  const result = await autocannon({
    url: process.env.TROLL_SERVER_URL,
    connections: 50,
    pipelining: 1,
    duration: 120,
    timeout: 120,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweets),
  });

  console.log(result);

  console.log(
    autocannon.printResult(result, {
      renderLatencyTable: true,
    })
  );
}

test();
