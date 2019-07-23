"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath(".", ["obj1", "obj1.1"]), ["obj1", "obj1.1"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("..", ["obj1", "obj1.1"]), ["obj1"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/", ["obj1", "obj1.1"]), []);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("./asd", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("../asd", ["obj1", "obj1.1"]), ["obj1", "asd"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/asd", ["obj1", "obj1.1"]), ["asd"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("./asd/w2", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd", "w2"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("../asd/../w2", ["obj1", "obj1.1"]), ["obj1", "w2"]);
        chai_1.assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/asd/../w2", ["obj1", "obj1.1"]), ["w2"]);
    });
    mocha_1.it('getValue (function)', function () {
        chai_1.assert.deepStrictEqual(s.getValue(["postgres", "main", "port"]), 123);
        chai_1.assert.deepStrictEqual(s.getValue("postgres/main/port"), 123);
        chai_1.assert.deepStrictEqual(s.getValue("/postgres/main/port"), 123);
        chai_1.assert.deepStrictEqual(s.getValue("/postgres/local/port"), 123);
        chai_1.assert.deepStrictEqual(s.getValue("/postgres/pc3/port"), 123);
        chai_1.assert.deepStrictEqual(s.getValue("pc3/port"), 123);
        chai_1.assert.deepStrictEqual(s.getValue("pc3/key111"), "value111");
        chai_1.assert.deepStrictEqual(s.getValue("config2/pc3/port"), 123);
    });
    mocha_1.it('getObject (function)', function () {
        const v = s.getObject("pc3");
        chai_1.assert.deepStrictEqual(v, {
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
        chai_1.assert.deepStrictEqual(config.getValue("/postgres/pc3/port"), 123);
    });
    mocha_1.it('loadConfig (function)', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield mNTreeConfig.loadConfig(".////test/data.json");
            chai_1.assert.deepStrictEqual(config.getValue("/postgres/pc3/port"), 123);
        });
    });
    mocha_1.describe('NTreeConfig with basePath', function () {
        let s1;
        mocha_1.before(() => {
            s1 = new lib_1.NTreeConfig("test/data.json", ["postgres", "main"]);
        });
        mocha_1.it('getValue (function)', function () {
            chai_1.assert.deepStrictEqual(s1.getValue("port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue(["port"]), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("../main/port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("/postgres/main/port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("../local/port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("../pc3/port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("/pc3/port"), 123);
            chai_1.assert.deepStrictEqual(s1.getValue("/pc3/key111"), "value111");
            chai_1.assert.deepStrictEqual(s1.getValue("/config2/pc3/port"), 123);
        });
        mocha_1.it('getObject (function)', function () {
            const v = s1.getObject("../../../pc3");
            chai_1.assert.deepStrictEqual(v, {
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
