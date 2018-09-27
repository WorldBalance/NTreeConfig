"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const mNTreeConfig = require("../lib");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
mocha_1.describe('NTreeConfig (module)', function () {
    let s;
    mocha_1.before(() => {
        s = new lib_1.NTreeConfig("test/data.json");
    });
    mocha_1.it('nameFullToPath (function)', function () {
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath(".", ["obj1", "obj1.1"]), ["obj1", "obj1.1"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("..", ["obj1", "obj1.1"]), ["obj1"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("/", ["obj1", "obj1.1"]), []);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("./asd", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("../asd", ["obj1", "obj1.1"]), ["obj1", "asd"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("/asd", ["obj1", "obj1.1"]), ["asd"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("./asd/w2", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd", "w2"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("../asd/../w2", ["obj1", "obj1.1"]), ["obj1", "w2"]);
        chai_1.assert.deepEqual(mNTreeConfig.nameFullToPath("/asd/../w2", ["obj1", "obj1.1"]), ["w2"]);
    });
    mocha_1.it('getValue (function)', function () {
        chai_1.assert.deepEqual(s.getValue(["postgres", "config", "main", "port"]), 123);
        chai_1.assert.deepEqual(s.getValue("postgres/config/main/port"), 123);
        chai_1.assert.deepEqual(s.getValue("/postgres/config/main/port"), 123);
        chai_1.assert.deepEqual(s.getValue("/postgres/config/local/port"), 123);
        chai_1.assert.deepEqual(s.getValue("/postgres/config/pc3/port"), 123);
        chai_1.assert.deepEqual(s.getValue("pc3/port"), 123);
        chai_1.assert.deepEqual(s.getValue("pc3/key111"), "value111");
        chai_1.assert.deepEqual(s.getValue("config2/pc3/port"), 123);
    });
    mocha_1.it('getObject (function)', function () {
        const v = s.getObject("pc3");
        chai_1.assert.deepEqual(v, {
            key0: 0,
            host: 'ip2',
            key1: 1,
            key111: 'value111',
            key2: 2,
            database: 'db2',
            key3: 3,
            port: 123,
            user: 'user1',
            password: 'pass1',
            key4: 4
        });
    });
    mocha_1.it('config (function)', function () {
        const config = mNTreeConfig.config(".////test/data.json");
        chai_1.assert.deepEqual(config.getValue("/postgres/config/pc3/port"), 123);
    });
    mocha_1.describe('NTreeConfig with basePath', function () {
        let s1;
        mocha_1.before(() => {
            s1 = new lib_1.NTreeConfig("test/data.json", ["postgres", "config", "main"]);
        });
        mocha_1.it('getValue (function)', function () {
            chai_1.assert.deepEqual(s1.getValue("port"), 123);
            chai_1.assert.deepEqual(s1.getValue(["port"]), 123);
            chai_1.assert.deepEqual(s1.getValue("../main/port"), 123);
            chai_1.assert.deepEqual(s1.getValue("/postgres/config/main/port"), 123);
            chai_1.assert.deepEqual(s1.getValue("../local/port"), 123);
            chai_1.assert.deepEqual(s1.getValue("../pc3/port"), 123);
            chai_1.assert.deepEqual(s1.getValue("/pc3/port"), 123);
            chai_1.assert.deepEqual(s1.getValue("/pc3/key111"), "value111");
            chai_1.assert.deepEqual(s1.getValue("/config2/pc3/port"), 123);
        });
        mocha_1.it('getObject (function)', function () {
            const v = s1.getObject("../../../pc3");
            chai_1.assert.deepEqual(v, {
                key0: 0,
                host: 'ip2',
                key1: 1,
                key111: 'value111',
                key2: 2,
                database: 'db2',
                key3: 3,
                port: 123,
                user: 'user1',
                password: 'pass1',
                key4: 4
            });
        });
    });
});
