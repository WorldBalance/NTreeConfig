/**
 * Created by Yuriy Litvin on 2018.09.25.
 */
// system
import * as fs from 'fs';
import * as path from 'path';

// global
import * as fse from 'fs-extra';
import normalizePath = require('normalize-path');

// local
import * as Utils from "./utils";
import { OneOrArray, ObjectKeyType } from "./utils";


const pathSep = '/';
export const keyInherit = "inherit";


type Root = object;
type TimestampUpdated = number; // Date.now()
type RootWrapped = [Root, TimestampUpdated];
type PathUnix = string;

type FilePathAbsolute = string;
type MapFileDataLoaded = {
    [id: string]: RootWrapped;
}
const mapFileDataLoaded: MapFileDataLoaded = {};



export class NTreeConfig {
    fileName: string;
    rootWrapped: RootWrapped; // the root object of the parsed <fileName>
    pathBase: PathUnix[] = [];
    loadLater: boolean;
    pathBaseL1?: PathUnix[];

    inherit = Utils.Inherit(keyInherit, (id, context) => this.idToObject(id, context));
    getValueInheritedEnergyL = this.inherit.getValueInherited;

    constructor(fileName: string, pathBase?: PathUnix | string[], opt?: {loadLater?: boolean}) {
        this.fileName = normalizePath(fileName);
        this.pathBaseL1 = (typeof(pathBase) === 'string') ? nameFullToPath(pathBase, []) : pathBase;
        this.loadLater = (opt && opt.loadLater);
        if (this.loadLater)
            return;

        this.loadSync();
        this.parsePathBaseL1();
    }

    getValue(keys: PathUnix | OneOrArray<ObjectKeyType>, valueDefault?: any): any {
        const keysIsPath = (typeof(keys) === 'string');
        const arrayKeys1: OneOrArray<ObjectKeyType> = keysIsPath ? nameFullToPath(keys as string, this.pathBase) : keys;
        if (this.pathBase.length === 0 && !Array.isArray(arrayKeys1)) // no basePath, one key
            return this.getValueInheritedEnergyL(this.rootWrapped[0], arrayKeys1);

        const arrayKeys2: ObjectKeyType[] = keysIsPath ? (arrayKeys1 as ObjectKeyType[]) : (this.pathBase as ObjectKeyType[]).concat(Utils.toArray(arrayKeys1));
        // console.log("arrayKeys2:", arrayKeys2);
        let next = this.rootWrapped[0];
        for (const key of arrayKeys2) { // go to the last object
            if (Utils.getType(next) !== "object")
                return valueDefault;

            next = this.getValueInheritedEnergyL(next, key);
            // console.log("next:", next);
        }

        return next;
    }

    // returns copy of calculated object
    getObject(keys: OneOrArray<ObjectKeyType>): object {
        const objTarget = this.getValue(keys);
        if (!objTarget)
            throw new Error("Target object not found! Ext:" + JSON.stringify(keys));

        const nonExistentKey = Symbol(); // we must search for a key that does not exist (to visit all inherited objects)
        const array = this.getValueInheritedEnergyL(objTarget, nonExistentKey, {getArrayObjects: true});
        // console.log("array:", array, {keys});

        const target = {}, opt = {skip: true};
        for (let o of array)
            Utils.copyObject(o, target, opt);
        delete target[keyInherit];

        return target;
    }

    loadSync() {
        const filePathAbsolute: FilePathAbsolute = path.resolve(this.fileName);
        const rootWrappedCached: RootWrapped = Utils.getPropertyWithSetDefault<[object, number]>(mapFileDataLoaded, filePathAbsolute, [null, 0]);
        const fileStat = fs.statSync(this.fileName);
        const needUpdate = (fileStat.mtimeMs > rootWrappedCached[1]);

        this.rootWrapped = rootWrappedCached;
        if (!needUpdate)
            return;

        const raw = fs.readFileSync(this.fileName, 'utf8');
        const parsed = JSON.parse(raw);
        indexObjects(parsed);

        // update cache
        rootWrappedCached[0] = parsed;
        rootWrappedCached[1] = fileStat.mtimeMs;
        // fs.watchFile() - autoupdate?
    }

    async loadAsync(): Promise<void> {
        const filePathAbsolute: FilePathAbsolute = path.resolve(this.fileName);
        const rootWrappedCached: RootWrapped = Utils.getPropertyWithSetDefault<[object, number]>(mapFileDataLoaded, filePathAbsolute, [null, 0]);
        const fileStat = await fse.stat(this.fileName);
        const needUpdate = (fileStat.mtimeMs > rootWrappedCached[1]);

        this.rootWrapped = rootWrappedCached;
        if (!needUpdate)
            return;

        const objectParsed = await fse.readJson(this.fileName, { encoding: 'utf8' });
        indexObjects(objectParsed);

        // update cache
        rootWrappedCached[0] = objectParsed;
        rootWrappedCached[1] = fileStat.mtimeMs;
        // fs.watchFile() - autoupdate?

        if (this.pathBaseL1)
            this.parsePathBaseL1();
    }

    private idToObject(nameFullOrObject: string | object, context: object) {
        if (typeof(nameFullOrObject) === 'object')
            return nameFullOrObject;

        const path = objectToPath(context);
        const keys: string[] = nameFullToPath(nameFullOrObject, path);
        const obj = Utils.getSafe(this.rootWrapped[0], keys);
        // console.log("idToObject", {nameFullOrObject, path, keys, obj});
        return obj;
    }

    private parsePathBaseL1() {
        if (this.pathBaseL1) {
            let pathBase = this.pathBaseL1;
            const objTarget = this.getValue(pathBase);
            if (Utils.getType(objTarget) !== "object")
                throw new Error(`Path (${pathBase}) does not exist!`);

            if (typeof(pathBase) === 'string')
                pathBase = nameFullToPath(pathBase, []);

            this.pathBase = Array.isArray(pathBase) ? pathBase : nameFullToPath(pathBase, []);
            this.pathBaseL1 = undefined;
        }
    }
}


export function config(fileName: string, pathBase?: OneOrArray<string>): NTreeConfig {
    return new NTreeConfig(fileName, pathBase);
}

export async function loadConfig(fileName: string, pathBase?: OneOrArray<string>): Promise<NTreeConfig> {
    const config = new NTreeConfig(fileName, pathBase, {loadLater: true});
    await config.loadAsync();
    return config;
}



const keyName = Symbol();
const keyParent = Symbol();

const isUndefined = (value) => (typeof(value) === "undefined");
const isObject = (value) => (typeof(value) === "object" && value !== null && !Array.isArray(value));

function indexObjects(obj: object, name: string = "", parent = null) {
    if (isUndefined(obj[keyParent])){
        obj[keyName] = name;
        obj[keyParent] = parent;
    }

    for (let key in obj)
        if (isObject(obj[key]))
            indexObjects(obj[key], key, obj);
}

function objectToPath(o: object): string[] {
    if (isUndefined(o[keyParent]))
        return null; // Error!!

    const path = [];
    for (let objCur = o; objCur; objCur = objCur[keyParent])
        path.push(objCur[keyName]);

    if (path[path.length - 1] === '')
        path.pop();

    // console.log("path:", path);
    return path.reverse();
}


// resolves nameFull using pathFull [with max depth indexPathCur]
// example: nameFullToPath("../asd", ["obj1", "obj1.1"]) -> ["obj1", "asd"]
export function nameFullToPath(nameFull: PathUnix, pathFull: string[], indexPathCur: number = pathFull.length): string[] {
    // console.log({nameFull, pathFull, indexPathCur});
    if (!nameFull || nameFull === pathSep)
        return [];

    const pathFullCopy = pathFull.slice(0, indexPathCur);

    const names = nameFull.split(pathSep);
    const length = names.reduce((index, namePart) => namePartApply(namePart, pathFullCopy, index), nameFull.startsWith(pathSep) ? 0 : pathFullCopy.length);

    pathFullCopy.splice(length);
    // console.log("pathFullCopy:", pathFullCopy);
    return pathFullCopy;
}


function namePartApply(namePart: string, pathFull: PathUnix[], lengthPath: number): number {
    // console.log({namePart, pathFull, lengthPath});
    switch (namePart) {
        case "":
        case ".":
            return lengthPath;

        case "..":
            return (lengthPath > 0) ? lengthPath - 1 : 0;

        default:
            const lengthNew = lengthPath + 1;
            // console.log({lengthNew, l: pathFull.length});
            if (lengthNew <= pathFull.length)
                pathFull[lengthNew - 1] = namePart;
            else
                pathFull.push(namePart);
            return lengthNew;
    }
}
