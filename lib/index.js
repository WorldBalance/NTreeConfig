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
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const normalizePath = require("normalize-path");
const Utils = require("./utils");
const pathSep = '/';
exports.keyInherit = "inherit";
const mapFileDataLoaded = {};
class NTreeConfig {
    constructor(fileName, pathBase, opt) {
        this.pathBase = [];
        this.inherit = Utils.Inherit(exports.keyInherit, (id, context) => this.idToObject(id, context));
        this.getValueInheritedEnergyL = this.inherit.getValueInherited;
        this.fileName = normalizePath(fileName);
        this.pathBaseL1 = (typeof (pathBase) === 'string') ? nameFullToPath(pathBase, []) : pathBase;
        this.loadLater = (opt && opt.loadLater);
        if (this.loadLater)
            return;
        this.loadSync();
        this.parsePathBaseL1();
    }
    getValue(keys, valueDefault) {
        const keysIsPath = (typeof (keys) === 'string');
        const arrayKeys1 = keysIsPath ? nameFullToPath(keys, this.pathBase) : keys;
        if (this.pathBase.length === 0 && !Array.isArray(arrayKeys1))
            return this.getValueInheritedEnergyL(this.rootWrapped[0], arrayKeys1);
        const arrayKeys2 = keysIsPath ? arrayKeys1 : this.pathBase.concat(Utils.toArray(arrayKeys1));
        let next = this.rootWrapped[0];
        for (const key of arrayKeys2) {
            if (Utils.getType(next) !== "object")
                return valueDefault;
            next = this.getValueInheritedEnergyL(next, key);
        }
        return next;
    }
    getObject(keys) {
        const objTarget = this.getValue(keys);
        if (!objTarget)
            throw new Error("Target object not found! Ext:" + JSON.stringify(keys));
        const nonExistentKey = Symbol();
        const array = this.getValueInheritedEnergyL(objTarget, nonExistentKey, { getArrayObjects: true });
        const target = {}, opt = { skip: true };
        for (let o of array)
            Utils.copyObject(o, target, opt);
        delete target[exports.keyInherit];
        return target;
    }
    loadSync() {
        const filePathAbsolute = path.resolve(this.fileName);
        const rootWrappedCached = Utils.getPropertyWithSetDefault(mapFileDataLoaded, filePathAbsolute, [null, 0]);
        const fileStat = fs.statSync(this.fileName);
        const needUpdate = (fileStat.mtimeMs > rootWrappedCached[1]);
        this.rootWrapped = rootWrappedCached;
        if (!needUpdate)
            return;
        const raw = fs.readFileSync(this.fileName, 'utf8');
        const parsed = JSON.parse(raw);
        indexObjects(parsed);
        rootWrappedCached[0] = parsed;
        rootWrappedCached[1] = fileStat.mtimeMs;
    }
    loadAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePathAbsolute = path.resolve(this.fileName);
            const rootWrappedCached = Utils.getPropertyWithSetDefault(mapFileDataLoaded, filePathAbsolute, [null, 0]);
            const fileStat = yield fse.stat(this.fileName);
            const needUpdate = (fileStat.mtimeMs > rootWrappedCached[1]);
            this.rootWrapped = rootWrappedCached;
            if (!needUpdate)
                return;
            const objectParsed = yield fse.readJson(this.fileName, { encoding: 'utf8' });
            indexObjects(objectParsed);
            rootWrappedCached[0] = objectParsed;
            rootWrappedCached[1] = fileStat.mtimeMs;
            if (this.pathBaseL1)
                this.parsePathBaseL1();
        });
    }
    idToObject(nameFullOrObject, context) {
        if (typeof (nameFullOrObject) === 'object')
            return nameFullOrObject;
        const path = objectToPath(context);
        const keys = nameFullToPath(nameFullOrObject, path);
        const obj = Utils.getSafe(this.rootWrapped[0], keys);
        return obj;
    }
    parsePathBaseL1() {
        if (this.pathBaseL1) {
            let pathBase = this.pathBaseL1;
            const objTarget = this.getValue(pathBase);
            if (Utils.getType(objTarget) !== "object")
                throw new Error(`Path (${pathBase}) does not exist!`);
            if (typeof (pathBase) === 'string')
                pathBase = nameFullToPath(pathBase, []);
            this.pathBase = Array.isArray(pathBase) ? pathBase : nameFullToPath(pathBase, []);
            this.pathBaseL1 = undefined;
        }
    }
}
exports.NTreeConfig = NTreeConfig;
function config(fileName, pathBase) {
    return new NTreeConfig(fileName, pathBase);
}
exports.config = config;
function loadConfig(fileName, pathBase) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = new NTreeConfig(fileName, pathBase, { loadLater: true });
        yield config.loadAsync();
        return config;
    });
}
exports.loadConfig = loadConfig;
const keyName = Symbol();
const keyParent = Symbol();
const isUndefined = (value) => (typeof (value) === "undefined");
const isObject = (value) => (typeof (value) === "object" && value !== null && !Array.isArray(value));
function indexObjects(obj, name = "", parent = null) {
    if (isUndefined(obj[keyParent])) {
        obj[keyName] = name;
        obj[keyParent] = parent;
    }
    for (let key in obj)
        if (isObject(obj[key]))
            indexObjects(obj[key], key, obj);
}
function objectToPath(o) {
    if (isUndefined(o[keyParent]))
        return null;
    const path = [];
    for (let objCur = o; objCur; objCur = objCur[keyParent])
        path.push(objCur[keyName]);
    if (path[path.length - 1] === '')
        path.pop();
    return path.reverse();
}
function nameFullToPath(nameFull, pathFull, indexPathCur = pathFull.length) {
    if (!nameFull || nameFull === pathSep)
        return [];
    const pathFullCopy = pathFull.slice(0, indexPathCur);
    const names = nameFull.split(pathSep);
    const length = names.reduce((index, namePart) => namePartApply(namePart, pathFullCopy, index), nameFull.startsWith(pathSep) ? 0 : pathFullCopy.length);
    pathFullCopy.splice(length);
    return pathFullCopy;
}
exports.nameFullToPath = nameFullToPath;
function namePartApply(namePart, pathFull, lengthPath) {
    switch (namePart) {
        case "":
        case ".":
            return lengthPath;
        case "..":
            return (lengthPath > 0) ? lengthPath - 1 : 0;
        default:
            const lengthNew = lengthPath + 1;
            if (lengthNew <= pathFull.length)
                pathFull[lengthNew - 1] = namePart;
            else
                pathFull.push(namePart);
            return lengthNew;
    }
}
