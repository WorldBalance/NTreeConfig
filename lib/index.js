"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Utils = require("./utils");
const pathSep = '/';
const keyInherit = "inherit";
const mapFileDataLoaded = {};
class NTreeConfig {
    constructor(fileName, pathBase) {
        this.pathBase = [];
        this.getValueInheritedEnergyL = Utils.Inherit(keyInherit, (id, context) => this.idToObject(id, context)).getValueInherited;
        this.fileName = fileName;
        this.loadSync();
        if (pathBase) {
            const objTarget = this.getValue(pathBase);
            if (Utils.getType(objTarget) !== "object")
                throw new Error(`Path (${pathBase}) does not exist!`);
            if (!Array.isArray(pathBase))
                pathBase = nameFullToPath(pathBase, this.pathBase);
            this.pathBase = Array.isArray(pathBase) ? pathBase : nameFullToPath(pathBase, []);
        }
    }
    getValue(keys, valueDefault) {
        if (!Array.isArray(keys) || this.pathBase.length > 0)
            keys = Array.isArray(keys) ? this.pathBase.concat(keys) : nameFullToPath(keys, this.pathBase);
        let objCur, next = this.rootWrapped[0];
        for (let key of keys) {
            if (Utils.getType(next) !== "object")
                return valueDefault;
            objCur = next;
            next = this.getValueInheritedEnergyL(objCur, key);
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
        delete target[keyInherit];
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
    idToObject(nameFull, context) {
        const path = objectToPath(context);
        const keys = nameFullToPath(nameFull, path);
        const obj = Utils.getSafe(this.rootWrapped[0], keys);
        return obj;
    }
}
exports.NTreeConfig = NTreeConfig;
function config(fileName, pathBase) {
    return new NTreeConfig(fileName, pathBase);
}
exports.config = config;
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
function namePartApply(namePart, pathFull, lengthPath) {
    switch (namePart) {
        case "":
        case ".":
            return lengthPath;
        case "..":
            return lengthPath - 1;
        default:
            const lengthNew = lengthPath + 1;
            if (lengthNew <= pathFull.length)
                pathFull[lengthNew - 1] = namePart;
            else
                pathFull.push(namePart);
            return lengthNew;
    }
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
