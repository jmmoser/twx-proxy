'use strict';

const { v4: uuidv4 } = require('uuid');

const {
  iterate
} = require('../utils');

const {
  ENTITIES,
  ENTITY_TYPES,
  addEntityToContext
} = require('./common');

const chalk = require('chalk');

// const ApplicationKey = require('./applicationKey');
const Thing = require('./thing');
// const ThingTemplate = require('./thingTemplate');
// const ThingShape = require('./thingShape');
// const DataShape = require('./dataShape');
// const Project = require('./project');
// const Organization = require('./organization');
// const Group = require('./group');
// const User = require('./user');
// const StyleDefinition = require('./styleDefinition');
// const StateDefinition = require('./stateDefintion');
// const LocalizationTable = require('./localizationTable');
// const Mashup = require('./mashup');
// const MediaEntity = require('./mediaEntity');
// const Menu = require('./menu');
// const ModelTagVocabulary = require('./modelTagVocabulary');

const logError = chalk.bold.red('ERROR>');
const logWarn = chalk.bold.keyword('orange')('WARN>');
const logInfo = chalk.bold.green('INFO>');
const logDebug = chalk.bold.white('DEBUG>');

function createContext() {
  return {
    [ENTITIES]: new Map(),
    Things: {},
    ThingTemplates: {},
    ThingShapes: {},
    DataShapes: {},
    Resources: {},
    generateGUID: uuidv4,
    principal: 'TODO',
    logger: {
      // error: (msg) => console.log('ERROR>', msg),
      // warn: (msg) => console.log('WARN>', msg),
      // info: (msg) => console.log('INFO>', msg),
      // debug: (msg) => console.log('DEBUG>', msg)
      error: (msg) => console.log(logError, msg),
      warn: (msg) => console.log(logWarn, msg),
      info: (msg) => console.log(logInfo, msg),
      debug: (msg) => console.log(logDebug, msg)
    }
  };
}


function include({ context, entities }) {
  // iterate(entities.ApplicationKeys, entityType => {
  //   iterate(entityType.ApplicationKey, entity => {
  //     ApplicationKey(store, entity);
  //   });
  // });

  iterate(entities.Things, entityType => {
    iterate(entityType.Thing, entity => {
      addEntityToContext(context, ENTITY_TYPES.THING, entity);
      // Thing.create({ context, entity });
    });
  });

  iterate(entities.ThingTemplates, entityType => {
    iterate(entityType.ThingTemplate, entity => {
      addEntityToContext(context, ENTITY_TYPES.THINGTEMPLATE, entity);
      // ThingTemplate(store, entity);
    });
  });

  iterate(entities.ThingShapes, entityType => {
    iterate(entityType.ThingShape, entity => {
      addEntityToContext(context, ENTITY_TYPES.THINGSHAPE, entity);
      // ThingShape(store, entity);
    });
  });

  // iterate(entities.DataShapes, entityType => {
  //   iterate(entityType.DataShape, entity => {
  //     DataShape(store, entity);
  //   });
  // });

  // iterate(entities.Projects, entityType => {
  //   iterate(entityType.Project, entity => {
  //     Project(store, entity);
  //   });
  // });

  // iterate(entities.Organizations, entityType => {
  //   iterate(entityType.Organization, entity => {
  //     Organization(store, entity);
  //   });
  // });

  // iterate(entities.Groups, entityType => {
  //   iterate(entityType.Group, entity => {
  //     Group(store, entity);
  //   });
  // });

  // iterate(entities.Users, entityType => {
  //   iterate(entityType.User, entity => {
  //     User(store, entity);
  //   });
  // });

  // iterate(entities.StyleDefinitions, entityType => {
  //   iterate(entityType.StyleDefinition, entity => {
  //     StyleDefinition(store, entity);
  //   });
  // });

  // iterate(entities.StateDefinitions, entityType => {
  //   iterate(entityType.StateDefinition, entity => {
  //     StateDefinition(store, entity);
  //   });
  // });

  // iterate(entities.LocalizationTables, entityType => {
  //   iterate(entityType.LocalizationTable, entity => {
  //     LocalizationTable(store, entity);
  //   });
  // });

  // iterate(entities.Mashups, entityType => {
  //   iterate(entityType.Mashup, entity => {
  //     Mashup(store, entity);
  //   });
  // });

  // iterate(entities.MediaEntities, entityType => {
  //   iterate(entityType.MediaEntity, entity => {
  //     MediaEntity(store, entity);
  //   });
  // });

  // iterate(entities.Menus, entityType => {
  //   iterate(entityType.Menu, entity => {
  //     Menu(store, entity);
  //   });
  // });

  // iterate(entities.ModelTags, entityType => {
  //   iterate(entityType.ModelTagVocabulary, entity => {
  //     ModelTagVocabulary(store, entity);
  //   });
  // });
};


async function compile(context) {
  context[ENTITIES].forEach(({ type, entity }, entityID) => {
    switch (type) {
      case ENTITY_TYPES.THING:
        Thing.create({ context, entity });
        break;
      default:
        break;
    }
  });
}


module.exports = {
  createContext,
  include,
  compile
};