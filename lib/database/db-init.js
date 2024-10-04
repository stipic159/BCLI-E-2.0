const fs = require('fs');
const path = require('path');

class UserSchema {
  constructor(filePath) {
    this.filePath = filePath;
  }

  // Метод для чтения данных из файла
  _readFile() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      const parsedData = JSON.parse(data);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      return [];
    }
  }
  

  // Метод для записи данных в файл
  _writeFile(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  

  // Найти пользователя по критерию
  findOne(query) {
    const users = this._readFile();
    return users.find(user => Object.keys(query).every(key => user[key] === query[key]));
  }
  

  // Обновить данные пользователя по критерию
    updateOne(query, updateData) {
        const users = this._readFile();
        const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

        if (index !== -1) {
            // Применяем $set (установка параметров)
            if (updateData.$set) {
                Object.keys(updateData.$set).forEach(key => {
                    users[index][key] = updateData.$set[key];
                });
            }

            // Применяем $inc (увеличение или уменьшение значений)
            if (updateData.$inc) {
                Object.keys(updateData.$inc).forEach(key => {
                    if (users[index][key] !== undefined) {
                        users[index][key] += updateData.$inc[key];
                    } else {
                        // Если поле не существует, и вы хотите его создать
                        users[index][key] = updateData.$inc[key];
                    }
                });
            }

            this._writeFile(users);
            return { matched: true, updated: true, user: users[index] };
        } else {
            return { matched: false, updated: false };
        }
    }


  // Добавить нового пользователя
  insertOne(newUser) {
    const users = this._readFile();
    users.push(newUser);
    this._writeFile(users);
    return newUser;
  }

  // Удалить пользователя по критерию
  deleteOne(query) {
    let users = this._readFile();
    const initialLength = users.length;
    users = users.filter(user => !Object.keys(query).every(key => user[key] === query[key]));
    this._writeFile(users);

    return users.length < initialLength;
  }
  // Найти пользователя и обновить данные
    async findOneAndUpdate(query, updateData, options = {}) {
        const users = this._readFile();
        const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));

        if (index !== -1) {
            // Применяем $set (установка параметров)
            if (updateData.$set) {
                Object.keys(updateData.$set).forEach(key => {
                    users[index][key] = updateData.$set[key];
                });
            }

            // Применяем $inc (увеличение или уменьшение значений)
            if (updateData.$inc) {
                Object.keys(updateData.$inc).forEach(key => {
                    if (users[index][key] !== undefined) {
                        users[index][key] += updateData.$inc[key];
                    } else {
                        // Если поле не существует, создаем его
                        users[index][key] = updateData.$inc[key];
                    }
                });
            }

            this._writeFile(users);
            return options.new ? users[index] : null; // Возвращаем обновленного пользователя, если указан флаг new
        } else if (options.upsert) {
            // Если пользователь не найден и upsert равен true, создаем нового пользователя
            const newUser = { ...query, ...updateData.$set, ...updateData.$inc };
            users.push(newUser);
            this._writeFile(users);
            return newUser; // Возвращаем нового пользователя
        } else {
            return null; // Если не найден и upsert равен false
        }
    }
}

class GroupSchema {
    constructor(filePath) {
      this.filePath = filePath;
    }
  
    // Метод для чтения данных из файла
    _readFile() {
      try {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : [];
      } catch (error) {
        return [];
      }
    }
    
  
    // Метод для записи данных в файл
    _writeFile(data) {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }
  
    
  
    // Найти пользователя по критерию
    findOne(query) {
      const users = this._readFile();
      return users.find(user => Object.keys(query).every(key => user[key] === query[key]));
    }
    
  
    // Обновить данные пользователя по критерию
      updateOne(query, updateData) {
          const users = this._readFile();
          const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));
  
          if (index !== -1) {
              // Применяем $set (установка параметров)
              if (updateData.$set) {
                  Object.keys(updateData.$set).forEach(key => {
                      users[index][key] = updateData.$set[key];
                  });
              }
  
              // Применяем $inc (увеличение или уменьшение значений)
              if (updateData.$inc) {
                  Object.keys(updateData.$inc).forEach(key => {
                      if (users[index][key] !== undefined) {
                          users[index][key] += updateData.$inc[key];
                      } else {
                          // Если поле не существует, и вы хотите его создать
                          users[index][key] = updateData.$inc[key];
                      }
                  });
              }
  
              this._writeFile(users);
              return { matched: true, updated: true, user: users[index] };
          } else {
              return { matched: false, updated: false };
          }
      }
  
  
    // Добавить нового пользователя
    insertOne(newUser) {
      const users = this._readFile();
      users.push(newUser);
      this._writeFile(users);
      return newUser;
    }
  
    // Удалить пользователя по критерию
    deleteOne(query) {
      let users = this._readFile();
      const initialLength = users.length;
      users = users.filter(user => !Object.keys(query).every(key => user[key] === query[key]));
      this._writeFile(users);
  
      return users.length < initialLength;
    }
    // Найти пользователя и обновить данные
      async findOneAndUpdate(query, updateData, options = {}) {
          const users = this._readFile();
          const index = users.findIndex(user => Object.keys(query).every(key => user[key] === query[key]));
  
          if (index !== -1) {
              // Применяем $set (установка параметров)
              if (updateData.$set) {
                  Object.keys(updateData.$set).forEach(key => {
                      users[index][key] = updateData.$set[key];
                  });
              }
  
              // Применяем $inc (увеличение или уменьшение значений)
              if (updateData.$inc) {
                  Object.keys(updateData.$inc).forEach(key => {
                      if (users[index][key] !== undefined) {
                          users[index][key] += updateData.$inc[key];
                      } else {
                          // Если поле не существует, создаем его
                          users[index][key] = updateData.$inc[key];
                      }
                  });
              }
  
              this._writeFile(users);
              return options.new ? users[index] : null; // Возвращаем обновленного пользователя, если указан флаг new
          } else if (options.upsert) {
              // Если пользователь не найден и upsert равен true, создаем нового пользователя
              const newUser = { ...query, ...updateData.$set, ...updateData.$inc };
              users.push(newUser);
              this._writeFile(users);
              return newUser; // Возвращаем нового пользователя
          } else {
              return null; // Если не найден и upsert равен false
          }
      }
  }


// Инициализация схемы с файлом для хранения пользователей
const sck1 = new UserSchema(path.join(__dirname, 'data/', 'sck1.json'));

const sck = new GroupSchema(path.join(__dirname, 'data/', 'sck.json'))

module.exports = { sck1, sck } ;
