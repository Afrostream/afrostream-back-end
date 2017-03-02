const express = require('express');
const router = express.Router();

const graphqlHTTP = require('express-graphql');

const graphqlSchema = rootRequire('sqldb/graphql').schema;

router.use('/graphql', graphqlHTTP(() => {
  const startTime = Date.now();

  return {
    schema: graphqlSchema,
    graphiql: true,
    extensions: (/*{ document, variables, operationName, result }*/) => {
      return { runTime: Date.now() - startTime };
    }
  };
}));

module.exports.router = router;
