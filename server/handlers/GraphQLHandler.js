import { graphql } from 'graphql';
import { getMetadata } from '../../db/queries/simpleQueries';

import getGraphQLContext from '../../graphQL/getGraphQLContext';

async function handler(request, reply) {
  try {
    const query = request.payload.query;
    const variables = request.payload.variables || {};

    const conn = await request.rethinkDBConnection;
    const credentials = request.auth.credentials;

    const context = getGraphQLContext(conn, await getMetadata(conn), {
      credentials,
    });
    const result = await graphql(context.schema, query, context, variables);
    if (result.errors) {
      console.error({
        error: 'GraphQL Error',
        query,
        variables,
        errors: result.errors,
      });
    }
    reply(JSON.stringify(result)).type('application/json');
  } catch (error) {
    console.error(error);
    console.error(error.stack);
    reply(error);
  }
}

const GraphQLHandler = {
  config: {
    auth: 'token',
  },
  handler,
  method: 'POST',
  path: '/graphql',
};

export default GraphQLHandler;
