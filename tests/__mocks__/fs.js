// @flow

const fs = jest.genMockFromModule('fs');

const file = [];
const mockedError = new Error('mock failed on purpose');
function appendFile(path: string, data: string, cb: Function) {
  if (path === 'fail') {
    cb(mockedError);
    return;
  }

  file.push({ path, data });
  cb();
}

fs.appendFile = appendFile;
fs.__mockedFile = file;
fs.__mockedError = mockedError;

module.exports = fs;