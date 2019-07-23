/**
 * Created by Yuriy Litvin on 2018.09.25.
 */

export type ObjectKeyType = string | number | symbol;
export type OneOrArray<T> = T | T[];


export function getPropertyWithSetDefault<T>(o: object, propertyName: string | symbol, valueDefault: T): T {
    if (!o.hasOwnProperty(propertyName))
        o[propertyName] = valueDefault;

    return o[propertyName];
}

export function getType(value: any): string {
    if (value === null)
        return 'null';

    if (value instanceof Array)
        return 'array';

    return typeof(value);
}


// apply the same function for value or value[]
export function applyAction(value: OneOrArray<any>, action: (value) => any) {
    if (value instanceof Array)
        value.forEach(action);
    else
        action(value);
}


export function getFirstDefinedResult(value: OneOrArray<any>, itemTester: (item) => any, thisArgument: any) {
    const itemTesterCur = thisArgument ? itemTester.bind(thisArgument) : itemTester;
    if (!(value instanceof Array))
        return itemTesterCur(value);

    for (let i = 0; i < value.length; i++) {
        const result = itemTesterCur(value[i]);
        if (typeof(result) !== "undefined")
            return result;
    }
}

export function getSafe(o: object, keys: string[], valueDefault?): any {
    if (keys.length === 0)
        return valueDefault;

    // go to the last object
    let i = 0, objCur = o;
    for (; i < keys.length; i++) {
        // console.log(`obj[${i}]`, objCur);
        if (getType(objCur) !== "object")
            return valueDefault;

        // console.log("key:", keys[i]);
        objCur = objCur[keys[i]];
    }
    
    return objCur;
}


interface ObjectWithKeys {
    [keyName: string]: boolean; // should we process this key?
}

interface CopyOptions {
    skip?: boolean; // skip exist keys?
    deep?: boolean; // do deep copy?

    setPrototype?: boolean;

    onlyKeys?: ObjectWithKeys; // set keys for copy
    skipKeys?: ObjectWithKeys; // set keys for skip
}

// like TableTreeCopy
export function copyObject(from: object, to: object = null, options: CopyOptions = {}): object | any[] {
    if (typeof(from) !== 'object' || typeof(to) !== 'object' || typeof(options) !== 'object' )
        throw new Error("Wrong type : " + typeof(from) + ", " + typeof(to) + ", " + typeof(options));

    if (to === null)
        to = (from instanceof Array) ? [] : {};

    const {skip, deep, setPrototype, onlyKeys, skipKeys} = options;
    
    for (let key in from) {
        // console.log("key:", key, from[key]);
        if (!from.hasOwnProperty(key) || (onlyKeys && !onlyKeys[key]) || (skipKeys && skipKeys[key]))
            continue;

        if (to.hasOwnProperty(key) && skip)
            continue;

        const value = from[key];
        if (typeof(value) === 'object' && deep)
            to[key] = copyObject(value, null, options);
        else
            to[key] = value;
    }

    if (setPrototype)
        Object.setPrototypeOf(to, Object.getPrototypeOf(from));

    return to;
}


type IdToObject = (id: any, context: object) => object | null;

export type GetValueInheritedOptions = {
    getArrayObjects?: boolean; // returns an array of objects that have been visited, related to keyArrayObjectsToVisit
    getObjectWithKey?: boolean; // returns the first object that contains the requested key
}
export const keyGetArrayObjects = "getArrayObjects";
export const keyGetObjectWithKey = "getObjectWithKey";


const keyNameH = Symbol();
const keySetVisitedObjects = Symbol();
const keyArrayObjectsToVisit = Symbol();
const keyOptions = "options";

interface InheritContext {
    [keyNameH]: ObjectKeyType,
    [keySetVisitedObjects]: Set<object>,
    [keyArrayObjectsToVisit]: object[],
    [keyOptions]: GetValueInheritedOptions,
}

const emptyFunction: IdToObject = (obj, context) => obj;


export function Inherit(keyInherit: ObjectKeyType, idToObject?: IdToObject) {
    const idToObject1 = idToObject || emptyFunction;

    // it uses keys above
    function getValueInheritedL(o: object): any {
        if (typeof(o) !== "object" || o === null || this[keySetVisitedObjects].has(o))
            return;
        this[keySetVisitedObjects].add(o);

        const value = o[this[keyNameH]];
        if (typeof(value) !== "undefined")
            return (this[keyOptions].getObjectWithKey) ? getFirstParentWithKey(o, this[keyNameH]) : value; // getObjectAndKey instead of value for the corresponding option

        const inherit = o[keyInherit];
        if (inherit) {
            applyAction(inherit, (objOrId) => (this[keyArrayObjectsToVisit] as any[]).push(idToObject1(objOrId, o))); // inherit -> arrayObjectsToVisit
        }
    }

    function getValueInherited(o: object, keyName: ObjectKeyType, options: GetValueInheritedOptions = {}): any {
        if (typeof(o) !== "object")
            return;

        const value = o[keyName];
        if (typeof(value) !== "undefined")
            return options.getObjectWithKey ? getFirstParentWithKey(o, keyName) : value;

        const inherit = o[keyInherit];
        if (!inherit)
            return options.getArrayObjects ? [o] : void 0; // undefined

        const setVisitedObjects = new Set();
        const arrayObjectsToVisit: any[] = [];
        const context: InheritContext = {
            [keyNameH]: keyName,
            [keySetVisitedObjects]: setVisitedObjects,
            [keyArrayObjectsToVisit]: arrayObjectsToVisit,
            [keyOptions]: options,
        };
        setVisitedObjects.add(o);

        applyAction(inherit, (objOrId) => arrayObjectsToVisit.push(idToObject1(objOrId, o))); // inherit -> arrayObjectsToVisit

        let result = getFirstDefinedResult(arrayObjectsToVisit, getValueInheritedL, context);
        if (options.getArrayObjects) {
            arrayObjectsToVisit.unshift(o);
            result = arrayRemoveDublicates(arrayObjectsToVisit); // returns arrayObjectsToVisit
        }

        // console.log("result:", result);
        return result;
    }

    function addAbstractH(o: object, parent: object): void {
        const value = o[keyInherit];
        if (!value)
            o[keyInherit] = parent;
        else
        if (!Array.isArray(value)) {
            if (parent !== value)
                o[keyInherit] = [parent, value]; // parent
        }
        else // array!
            unshiftUniqueValue(value, parent);
    }

    function removeAbstractH(o: object, parent: object): void {
        const value = o[keyInherit];
        if (value === parent)
            delete o[keyInherit];
        else
        if (Array.isArray(value)) {
            const index = value.indexOf(parent);
            if (index >= 0) {
                value.splice(index, 1);

                // simplify
                if (value.length === 1)
                    o[keyInherit] = value[0];
            }
        }
    }

    function getKeyInherit(): ObjectKeyType {
        return keyInherit;
    }

    return {getValueInherited, addAbstractH, removeAbstractH, getKeyInherit};
}

export function arrayRemoveDublicates(array: any[]): any[] {
    if (array.length < 50) // 50 - it is a magic weight, linear search vs hash
        return array.filter((val, pos, arr) => (arr.indexOf(val) === pos));

    const result = [];

    const set = new Set();
    for (let v of array) {
        if (!set.has(v)) {
            set.add(v);
            result.push(v);
        }
    }

    return result;
}

export function toArray<T = any>(values: OneOrArray<T>): T[] {
    return Array.isArray(values) ? values : [values];
}

// Array, prepend
export function unshiftUniqueValue(array: any[], value: any) {
    if (array.indexOf(value) < 0)
        array.unshift(value);
}


export const prototypeDefault = Object.getPrototypeOf({});

export function getFirstParentWithKey(o: object, key: ObjectKeyType): object {
    if (!o[key])
        return;

    let obj = o;
    do {
        if (obj.hasOwnProperty(key))
            return obj;

        obj = Object.getPrototypeOf(obj);
    } while (obj && obj !== prototypeDefault);

    return prototypeDefault;
}
