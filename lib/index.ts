/**
 * Created by Yuriy Litvin on 2018.09.25.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as Utils from "./utils";
import {OneOrArray} from "./utils";


const pathSep = '/';
const keyInherit = "inherit";


type Root = object;
type TimestampUpdated = number; // Date.now()
type RootWrapped = [Root, TimestampUpdated];

type FilePathAbsolute = string;
type MapFileDataLoaded = {
    [id: FilePathAbsolute]: RootWrapped;
}
const mapFileDataLoaded: MapFileDataLoaded = {};


export class NTreeConfig {
    fileName: string;
    rootWrapped: RootWrapped; // the root object of the parsed <fileName>
    pathBase: string[] = [];

    getValueInheritedEnergyL = Utils.Inherit(keyInherit, (id, context) => this.idToObject(id, context)).getValueInherited;

    constructor(fileName: string, pathBase?: OneOrArray<string>) {
        this.fileName = fileName;
        this.loadSync();

        if (pathBase) {
            const objTarget = this.getValue(pathBase);
            if (Utils.getType(objTarget) !== "object")
                throw new Error(`Path (${pathBase}) does not exist!`);

            if (!Array.isArray(pathBase))
                pathBase = nameFullToPath(pathBase as string, this.pathBase);

            this.pathBase = Array.isArray(pathBase) ? pathBase : nameFullToPath(pathBase, []);
        }
    }

    getValue(keys: OneOrArray<string | symbol>, valueDefault?: any): any {
        if (!Array.isArray(keys) || this.pathBase.length > 0)
            keys = Array.isArray(keys) ? this.pathBase.concat(keys) : nameFullToPath(keys as string, this.pathBase);

        // go to the last object
        let objCur, next = this.rootWrapped[0];
        for (let key of keys) {
            if (Utils.getType(next) !== "object")
                return valueDefault;
            objCur = next;

            next = this.getValueInheritedEnergyL(objCur, key);
            // console.log("next:", next);
        }

        return next;
    }

    // returns copy of calculated object
    getObject(keys: OneOrArray<string | symbol>): object {
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
        const rootWrappedCached: RootWrapped = Utils.getPropertyWithSetDefault(mapFileDataLoaded, filePathAbsolute, [null, 0]);
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

    private idToObject(nameFull: string, context: object) {
        const path = objectToPath(context);
        const keys: string[] = nameFullToPath(nameFull, path);
        const obj = Utils.getSafe(this.rootWrapped[0], keys);
        // console.log("idToObject", {nameFull, path, keys, obj});
        return obj;
    }
}


export function config(fileName: string, pathBase?: OneOrArray<string>): NTreeConfig {
    return new NTreeConfig(fileName, pathBase);
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


function namePartApply(namePart: string, pathFull: string[], lengthPath: number): number {
    // console.log({namePart, pathFull, lengthPath});
    switch (namePart) {
        case "":
        case ".":
            return lengthPath;

        case "..":
            return lengthPath - 1;

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

export function nameFullToPath(nameFull: string, pathFull: string[], indexPathCur: number = pathFull.length): string[] {
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
