/**
 * Created by Yuriy Litvin on 2018.09.25.
 */

import {NTreeConfig} from "../lib";
import * as mNTreeConfig from "../lib";

// tests
import { describe, it, before, after } from 'mocha';
import { assert, expect } from 'chai';


describe('NTreeConfig (module)', function() {

    let s: NTreeConfig;

    before(() => {
        s = new NTreeConfig("test/data.json");
    });

    it('nameFullToPath (function)', function () {
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath(".", ["obj1", "obj1.1"]), ["obj1", "obj1.1"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("..", ["obj1", "obj1.1"]), ["obj1"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/", ["obj1", "obj1.1"]), []);

        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("./asd", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("../asd", ["obj1", "obj1.1"]), ["obj1", "asd"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/asd", ["obj1", "obj1.1"]), ["asd"]);

        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("./asd/w2", ["obj1", "obj1.1"]), ["obj1", "obj1.1", "asd", "w2"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("../asd/../w2", ["obj1", "obj1.1"]), ["obj1", "w2"]);
        assert.deepStrictEqual(mNTreeConfig.nameFullToPath("/asd/../w2", ["obj1", "obj1.1"]), ["w2"]);
    });

    it('getValue (function)', function () {
        assert.deepStrictEqual(s.getValue(["postgres", "main", "port"]), 123);
        assert.deepStrictEqual(s.getValue("postgres/main/port"), 123);
        assert.deepStrictEqual(s.getValue("/postgres/main/port"), 123);

        assert.deepStrictEqual(s.getValue("/postgres/local/port"), 123);
        assert.deepStrictEqual(s.getValue("/postgres/pc3/port"), 123);
        assert.deepStrictEqual(s.getValue("pc3/port"), 123);
        assert.deepStrictEqual(s.getValue("pc3/key111"), "value111");

        assert.deepStrictEqual(s.getValue("config2/pc3/port"), 123);
    });

    it('getObject (function)', function () {
        const v = s.getObject("pc3");
        // console.log("v:", v);
        assert.deepStrictEqual(v, {
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

    it('config (function)', function () {
        const config = mNTreeConfig.config(".////test/data.json");
        assert.deepStrictEqual(config.getValue("/postgres/pc3/port"), 123);
    });

    it('loadConfig (function)', async function () {
        const config = await mNTreeConfig.loadConfig(".////test/data.json");
        assert.deepStrictEqual(config.getValue("/postgres/pc3/port"), 123);
    });

    describe('NTreeConfig with basePath', function() {
        let s1: NTreeConfig;

        before(() => {
            s1 = new NTreeConfig("test/data.json", ["postgres", "main"]);
        });

        it('getValue (function)', function () {
            assert.deepStrictEqual(s1.getValue("port"), 123);
            assert.deepStrictEqual(s1.getValue(["port"]), 123);
            assert.deepStrictEqual(s1.getValue("../main/port"), 123);
            assert.deepStrictEqual(s1.getValue("/postgres/main/port"), 123);

            assert.deepStrictEqual(s1.getValue("../local/port"), 123);
            assert.deepStrictEqual(s1.getValue("../pc3/port"), 123);
            assert.deepStrictEqual(s1.getValue("/pc3/port"), 123);
            assert.deepStrictEqual(s1.getValue("/pc3/key111"), "value111");

            assert.deepStrictEqual(s1.getValue("/config2/pc3/port"), 123);
        });

        it('getObject (function)', function () {
            const v = s1.getObject("../../../pc3");
            // console.log("v:", v);
            assert.deepStrictEqual(v, {
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
