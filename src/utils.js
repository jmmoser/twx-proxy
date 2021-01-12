'use strict';

const path = require('path');
const fs = require('fs').promises;
const xml2js = require('xml2js');


function iterate(arr, cb) {
  if (Array.isArray(arr)) {
    arr.forEach(cb);
    return true;
  }
  return false;
}


async function parse(file) {
  try {
    const contents = await fs.readFile(file, { encoding: 'utf8' });
    switch (path.extname(file)) {
      case '.json':
        return JSON.parse(contents);
      case '.xml':
        return xml2js.parseStringPromise(contents);
      // case '.yaml':
      // case '.yml':
      //   return yaml.safeLoad(contents);
      default:

      // throw new Error(`Unsupported file type: ${file}`);
    }
  } catch (err) {
    console.log(file);
    throw err;
  }
}


async function getAllFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await fs.stat(res)).isDirectory() ? getAllFiles(res) : [res];
  }));
  // return files.reduce((a, f) => a.concat(f), []).filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
  return files.reduce((a, f) => a.concat(f), []);
}

async function getFilesFromInput() {
  const inputPath = process.argv[2] || process.env.SOURCE;
  const stat = await fs.stat(inputPath);
  let files;
  if (stat.isDirectory()) {
    files = await getAllFiles(inputPath);
  } else if (stat.isFile()) {
    files = [inputPath];
  } else {
    throw new Error(`Invalid inputPath: ${inputPath}`);
  }
  const acceptedFileExtensions = ['.json', '.xml'];

  return files.filter(file => {
    return acceptedFileExtensions.indexOf(path.extname(file)) >= 0;
  });
}


module.exports = {
  iterate,
  parse,
  getAllFiles,
  getFilesFromInput
};