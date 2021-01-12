'use strict';

const {
  ENTITY_TYPES,
  getEntityFromContextByType,
  applyThingShape,
  applyImplementedThingShapes,
  initializeEntity
} = require('./common');


function create({ context, entity }) {
  const { register, proxy } = initializeEntity(context);

  applyThingShape({ context, register, proxy, entityType: ENTITY_TYPES.THING, entity });
  applyImplementedThingShapes({ context, register, proxy, entityType: ENTITY_TYPES.THING, entity });

  let baseThingTemplateName = entity.$.thingTemplate;
  while (baseThingTemplateName !== 'GenericThing') {
    const template = getEntityFromContextByType(context, ENTITY_TYPES.THINGTEMPLATE, baseThingTemplateName);
    if (template) {
      applyThingShape({ context, register, proxy, entityType: ENTITY_TYPES.THINGTEMPLATE, entity: template });
      applyImplementedThingShapes({ context, register, proxy, entityType: ENTITY_TYPES.THINGTEMPLATE, entity: template });
    } else {
      throw new Error('stop');
    }
    break;
  }

  context.Things[entity.$.name] = proxy;
}


module.exports = {
  create
};