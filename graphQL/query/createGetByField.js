import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { chain } from 'lodash';

import { UserError } from '../UserError';
import ReindexID from '../builtins/ReindexID';
import checkPermission from '../permissions/checkPermission';
import { getUniqueFieldQueryName } from '../derivedNames';

export default function createGetByField({ type }, typeRegistry) {
  return extractUniqueFields(type, typeRegistry).map(({
    name: fieldName,
    type: fieldType,
    prefix,
  }) => {
    const nameChain = prefix.concat([fieldName]);
    return {
      name: getUniqueFieldQueryName(type.name, nameChain),
      description:
`Get an object of type \`${type.name}\` by \`${nameChain.join('.')}\``,
      type,
      args: {
        [fieldName]: {
          name: fieldName,
          description: `\`${nameChain.join('.')}\` of \`${type.name}\``,
          type: new GraphQLNonNull(fieldType),
        },
      },
      async resolve(parent, args, context) {
        const { db } = context;
        const value = args[fieldName];
        if (fieldType === ReindexID && !db.isValidID(type.name, value)) {
          throw new UserError(`id: Invalid ID for type ${type.name}`);
        }
        const result = await db.getByField(
          type.name,
          nameChain,
          value,
        );
        await checkPermission(type.name, 'read', {}, result, context);
        return result;
      },
    };
  });
}

function extractUniqueFields(type, typeRegistry, prefix = []) {
  const node = typeRegistry.getInterface('Node');
  return chain(type.getFields())
    .map((field) => {
      const fieldType = field.type.ofType || field.type;
      if (fieldType instanceof GraphQLObjectType &&
          !fieldType.getInterfaces().includes(node)) {
        return extractUniqueFields(
          fieldType,
          typeRegistry,
          prefix.concat([field.name]
        ));
      } else if (field.metadata && field.metadata.unique) {
        return [{
          name: field.name,
          type: fieldType,
          prefix,
        }];
      } else {
        return [];
      }
    })
    .flatten()
    .value();
}
