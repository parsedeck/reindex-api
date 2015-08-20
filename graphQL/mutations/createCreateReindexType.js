import { Map } from 'immutable';
import { GraphQLString, GraphQLNonNull, GraphQLInputObjectType } from 'graphql';
import createRootField from '../createRootField';
import { createType } from '../../db/queries/mutationQueries';

export default function createCreateReindexType(typeSets) {
  const ReindexTypeSet = typeSets.get('ReindexType');
  const input = new GraphQLInputObjectType({
    name: '_CreateReindexTypeInput',
    fields: {
      clientMutationId: {
        type: new GraphQLNonNull(GraphQLString),
      },
      ReindexType: {
        type: ReindexTypeSet.inputObject,
      },
    },
  });
  return createRootField({
    name: 'createReindexType',
    args: Map({
      input: {
        type: input,
      },
    }),
    returnType: ReindexTypeSet.payload,
    async resolve(
      parent,
      { input: { clientMutationId, ReindexType: type } },
      { rootValue: { conn } }
    ) {
      const result = await createType(conn, type);
      return {
        clientMutationId,
        ReindexType: result,
      };
    },
  });
}
