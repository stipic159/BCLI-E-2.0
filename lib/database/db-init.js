const fs = require('fs');
const path = require('path');

class UserSchema {
  constructor(filePath) {
    this.filePath = filePath;
  }

  _readFile() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data) || [];
    } catch {
      return [];
    }
  }

  _writeFile(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  findOne(query) {
    const users = this._readFile();
    return users.find(user => Object.keys(query).every(key => user[key] === query[key]));
  }

  updateOne(query, updateData) {
    const users = this._readFile();
    const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

    if (index !== -1) {
      if (updateData.$set) {
        Object.keys(updateData.$set).forEach(key => users[index][key] = updateData.$set[key]);
      }
      if (updateData.$inc) {
        Object.keys(updateData.$inc).forEach(key => {
          users[index][key] = users[index][key] !== undefined 
            ? users[index][key] + updateData.$inc[key]
            : updateData.$inc[key];
        });
      }
      this._writeFile(users);
      return { matched: true, updated: true, user: users[index] };
    }
    return { matched: false, updated: false };
  }

  insertOne(newUser) {
    const users = this._readFile();
    users.push(newUser);
    this._writeFile(users);
    return newUser;
  }

  deleteOne(query) {
    let users = this._readFile();
    const initialLength = users.length;
    users = users.filter(user => !Object.keys(query).every(key => user[key] === query[key]));
    this._writeFile(users);
    return users.length < initialLength;
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    const users = this._readFile();
    const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

    if (index !== -1) {
      if (updateData.$set) {
        Object.keys(updateData.$set).forEach(key => users[index][key] = updateData.$set[key]);
      }
      if (updateData.$inc) {
        Object.keys(updateData.$inc).forEach(key => {
          users[index][key] = users[index][key] !== undefined 
            ? users[index][key] + updateData.$inc[key]
            : updateData.$inc[key];
        });
      }
      this._writeFile(users);
      return options.new ? users[index] : null;
    }

    if (options.upsert) {
      const newUser = { ...query, ...updateData.$set, ...updateData.$inc };
      users.push(newUser);
      this._writeFile(users);
      return newUser;
    }
    return null;
  }
}

class GroupSchema {
  constructor(filePath) {
    this.filePath = filePath;
  }

  _readFile() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data) || [];
    } catch {
      return [];
    }
  }

  _writeFile(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  findOne(query) {
    const users = this._readFile();
    return users.find(user => Object.keys(query).every(key => user[key] === query[key]));
  }

  updateOne(query, updateData) {
    const users = this._readFile();
    const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

    if (index !== -1) {
      if (updateData.$set) {
        Object.keys(updateData.$set).forEach(key => users[index][key] = updateData.$set[key]);
      }
      if (updateData.$inc) {
        Object.keys(updateData.$inc).forEach(key => {
          users[index][key] = users[index][key] !== undefined 
            ? users[index][key] + updateData.$inc[key]
            : updateData.$inc[key];
        });
      }
      this._writeFile(users);
      return { matched: true, updated: true, user: users[index] };
    }
    return { matched: false, updated: false };
  }

  insertOne(newUser) {
    const users = this._readFile();
    users.push(newUser);
    this._writeFile(users);
    return newUser;
  }

  deleteOne(query) {
    let users = this._readFile();
    const initialLength = users.length;
    users = users.filter(user => !Object.keys(query).every(key => user[key] === query[key]));
    this._writeFile(users);
    return users.length < initialLength;
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    const users = this._readFile();
    const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

    if (index !== -1) {
      if (updateData.$set) {
        Object.keys(updateData.$set).forEach(key => users[index][key] = updateData.$set[key]);
      }
      if (updateData.$inc) {
        Object.keys(updateData.$inc).forEach(key => {
          users[index][key] = users[index][key] !== undefined 
            ? users[index][key] + updateData.$inc[key]
            : updateData.$inc[key];
        });
      }
      this._writeFile(users);
      return options.new ? users[index] : null;
    }

    if (options.upsert) {
      const newUser = { ...query, ...updateData.$set, ...updateData.$inc };
      users.push(newUser);
      this._writeFile(users);
      return newUser;
    }

    return null;
  }
}

const sck1 = new UserSchema(path.join(__dirname, 'data/', 'sck1.json'));
const sck = new GroupSchema(path.join(__dirname, 'data/', 'sck.json'));

module.exports = { sck1, sck };
