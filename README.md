## NTreeConfig
Configuration file with multiple inheritance of group properties and using relative Unix paths

## Quick Start
```shell
$ npm install ntreeconfig
$ cd node_modules/ntreeconfig
$ npm install
$ npm test
``` 

## Example
File "config1.json":
```javascript
{
  postgres: {
    main: {
      port: 123,
      user: "user1",
      password: "pass1",
      key4: 4
    },
    local: {
      inherit: "../main",
      host: "localhost",
      database: "db1"
    },
    remote: {
      inherit: "../main",
      database: "db2",
      key3: 3
    },
    pc3: {
      inherit: "../remote",
      host: "ip2",
      key1: 1
    }
  },
  pc3: {
    inherit: ["..//postgres/pc3"],
    key0: 0
  }
}
```

Using the file "config1.json":
```javascript
import { loadConfig } from "ntreeconfig";

//...
const config = await loadConfig("config1.json");

config.getValue("/postgres/pc3/port"); // -> 123
config.getValue("pc3/port"); // -> 123

config.getObject("pc3");
// -> 
{
  key0: 0,
  host: 'ip2',
  key1: 1,
  database: 'db2',
  key3: 3,
  port: 123,
  user: 'user1',
  password: 'pass1',
  key4: 4
}
```

## API
```typescript
import { loadConfig } from "ntreeconfig";

function loadConfig(fileName: string, pathBase?: OneOrArray<string>): Promise<NTreeConfig>;

NTreeConfig:getValue(keys: PathUnix | OneOrArray<ObjectKeyType>, valueDefault?: any): any;
NTreeConfig:getObject(keys: OneOrArray<ObjectKeyType>): object;
```

## Advanced
[Full config file](https://github.com/WorldBalance/NTreeConfig/blob/master/test/data.json) (*.json)

[Full module tests](http://localhost/ "link title") (*.ts)
