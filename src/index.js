'use strict';

const vm = require('vm');
const Entities = require('./entities');
const Utils = require('./utils');
const fs = require('fs');


async function buildContext() {
  const context = Entities.createContext();

  const files = await Utils.getFilesFromInput();
  for (const file of files) {
    const contents = await Utils.parse(file);
    Entities.include({ context, entities: contents.Entities });
  }

  Entities.compile(context);

  return context;
}


async function run() {
  const context = await buildContext();

  vm.createContext(context);

  const entry = await fs.promises.readFile(process.argv[3]);
  vm.runInContext(entry, context);
}


(async () => {
  console.time('run');
  try {
    await run();
  } catch (err) {
    console.log(err);
  } finally {
    console.log('finished');
  }
  console.timeEnd('run');
})();