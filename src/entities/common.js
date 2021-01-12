'use strict';

const vm = require('vm');
// const babel = require('@babel/core');
const makeSynchronous = require('make-synchronous');

const {
  iterate
} = require('../utils');

const {
  BASE_URL,
  APP_KEY
} = process.env;

const ENTITIES = Symbol('entities');

const ATTRIBUTE_TYPES = {
  PROPERTY: 'Property',
  SERVICE: 'Service'
};

const ENTITY_TYPES = {
  APPLICATIONKEY: 'ApplicationKeys',
  DATASHAPE: 'DataShapes',
  THING: 'Things',
  THINGTEMPLATE: 'ThingTemplates',
  THINGSHAPE: 'ThingShapes',
  LOCALIZATIONTABLE: 'LocalizationTables',
  MASHUP: 'Mashups',
  MENU: 'Menus',
  STYLEDEFINITION: 'StyleDefinitions',
  STATEDEFINITION: 'StateDefinitions',
  ORGANIZATION: 'Organizations',
  PROJECT: 'Projects',
  NETWORK: 'Networks',
  GROUP: 'Groups',
  USER: 'Users',
  MEDIAENTITY: 'MediaEntities',
  MODELTAGVOCABULARY: 'ModelTagVocabularies',
  MODELTAGVOCABULARYTERM: 'VocabularyTerms'
};

// const ENTITY_TYPES = {
//   APPLICATIONKEY: 'ApplicationKey',
//   DATASHAPE: 'DataShape',
//   THING: 'Thing',
//   THINGTEMPLATE: 'ThingTemplate',
//   THINGSHAPE: 'ThingShape',
//   LOCALIZATIONTABLE: 'LocalizationTable',
//   MASHUP: 'Mashup',
//   MENU: 'Menu',
//   STYLEDEFINITION: 'StyleDefinition',
//   STATEDEFINITION: 'StateDefinition',
//   ORGANIZATION: 'Organization',
//   PROJECT: 'Project',
//   NETWORK: 'Network',
//   GROUP: 'Group',
//   USER: 'User',
//   MEDIAENTITY: 'MediaEntity',
//   MODELTAGVOCABULARY: 'ModelTagVocabulary',
//   MODELTAGVOCABULARYTERM: 'VocabularyTerm'
// };


function getEntityID(type, name) {
  return `${type}:${name}`;
}

function addEntityToContext(context, type, entity) {
  const id = getEntityID(type, entity.$.name);
  if (context[ENTITIES].has(id)) {
    throw new Error(`Already exists in context: ${id}`);
  }
  context[ENTITIES].set(id, {
    type,
    entity
  });
}

function getEntityFromContextByType(context, type, name) {
  const id = getEntityID(type, name);
  const def = context[ENTITIES].get(id);
  if (!def) {
    throw new Error(`Entity not found in context: ${id}`);
  }
  return def.entity;
}


// function registerPropertyAttribute(register, propertyDefinition) {
//   register({
//     type: ATTRIBUTE_TYPES.PROPERTY,
//     definition: propertyDefinition
//   });
// }


function applyImplementedThingShapes({ context, entityType, entity, register, proxy }) {
  iterate(entity.ImplementedShapes, ImplementedShapes => {
    iterate(ImplementedShapes.ImplementedShape, ImplementedShape => {
      const thingShape = getEntityFromContextByType(context, ENTITY_TYPES.THINGSHAPE, ImplementedShape.$.name);
      __applyThingShape({
        context, register, proxy,
        // entityType: ENTITY_TYPES.THINGSHAPE,
        entityType,
        entity,
        thingShape
      });
    });
  });
}

function applyThingShape({ context, entityType, entity, register, proxy }) {
  iterate(entity.ThingShape, thingShape => {
    __applyThingShape({ context, entityType, entity, thingShape, register, proxy });
  });
}


function __applyThingShape({ context, entityType, entity, thingShape, register, proxy }) {
  iterate(thingShape.PropertyDefinitions, PropertyDefinitions => {
    iterate(PropertyDefinitions.PropertyDefinition, PropertyDefinition => {
      register.property({
        entityType, entity,
        definition: PropertyDefinition
      });
    });
  });

  iterate(thingShape.ServiceImplementations, ServiceImplementations => {
    iterate(ServiceImplementations.ServiceImplementation, ServiceImplementation => {
      register.service({
        entityType, entity,
        implementation: ServiceImplementation,
        proxy
      })
    });
  });
}


function createPropertyGetter(entityType, entityName, propertyName) {
  return () => {
    const input = {
      appKey: APP_KEY,
      url: `${BASE_URL}/Thingworx/${entityType}/${entityName}/Properties/${propertyName}`
    };

    const result = (makeSynchronous(async ({ url, appKey }) => {
      const res = await require('node-fetch')(url, {
        headers: {
          appKey: appKey,
          accept: 'application/json'
        }
      });
      // const result = await res.text();
      // console.log(result);
      // return JSON.parse(result);

      const result = await res.json();
      return result;
    }))(input);

    return result.rows[0][propertyName];
  }
}


function createProxy({ attributes }) {
  return new Proxy({}, {
    get(target, key, receiver) {
      const attribute = attributes.get(key);
      if (attribute) {
        switch (attribute.type) {
          case ATTRIBUTE_TYPES.PROPERTY:
            if (target[key]) {
              return target[key].value;
            } else {
              const value = attribute.getterFn();
              target[key] = {
                value,
                timestamp: new Date(),
                quality: 'GOOD'
              };
              return value;
            }
          case ATTRIBUTE_TYPES.SERVICE:
            return attribute.fn;
          default:
            break;
        }
      }
      throw new Error(`Attribute does not exist: ${key}`);
    },
    set(target, key, value, receiver) {
      const attribute = attributes.get(key);
      if (attribute) {
        if (attribute.type !== ATTRIBUTE_TYPES.PROPERTY) {
          throw new Error(`Attribute '${key}' is not a property (${attribute.type})`);
        }
        target[key] = {
          value,
          timestamp: new Date(),
          quality: 'GOOD'
        };
        return true;
      } else {
        throw new Error(`Attribute does not exist: ${key}`);
      }
    }
  });
}


function initializeEntity(context) {
  const attributes = new Map();

  const proxy = createProxy({ attributes });

  const register = {
    property({ entityType, entity, definition }) {
      attributes.set(definition.$.name, {
        type: ATTRIBUTE_TYPES.PROPERTY,
        definition,
        getterFn: createPropertyGetter(entityType, entity.$.name, definition.$.name)
      });
    },
    service({ implementation, proxy }) {
      let code = implementation?.ConfigurationTables?.[0]?.ConfigurationTable?.[0]?.Rows?.[0]?.Row?.[0]?.code?.[0];
      if (code) {
        let script;
        try {
          script = new vm.Script(code);
          // const transform = babel.transform(code, {
          //   comments: false
          // });
          // code = transform.code;
        } catch (err) { 
          // console.log(err);
        }

        if (script) {
          attributes.set(implementation.$.name, {
            type: ATTRIBUTE_TYPES.SERVICE,
            implementation,
            // script: new vm.Script(code)
            fn: (input = {}) => {
              const inputContext = vm.createContext({
                ...context,
                ...input,
                me: proxy
              });
              script.runInContext(inputContext);
              return inputContext.result;
            }
          });
        }
      }
      // else {
      //   console.log(implementation, implementation.ConfigurationTables[0].ConfigurationTable[0].Rows[0].Row);
      //   throw new Error(`No code`);
      // }
    }
  };
  return { attributes, register, proxy };
}


const SubscriptionChanges = {
  DataChange() {

  }
};


module.exports = {
  ENTITIES,
  ATTRIBUTE_TYPES,
  ENTITY_TYPES,
  getEntityID,
  addEntityToContext,
  getEntityFromContextByType,
  applyThingShape,
  applyImplementedThingShapes,
  initializeEntity,
  createProxy
};