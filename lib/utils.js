"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getPropertyWithSetDefault(o, propertyName, valueDefault) {
    if (!o.hasOwnProperty(propertyName))
        o[propertyName] = valueDefault;
    return o[propertyName];
}
exports.getPropertyWithSetDefault = getPropertyWithSetDefault;
function getType(value) {
    if (value === null)
        return 'null';
    if (value instanceof Array)
        return 'array';
    return typeof (value);
}
exports.getType = getType;
function applyAction(value, action) {
    if (value instanceof Array)
        value.forEach(action);
    else
        action(value);
}
exports.applyAction = applyAction;
function getFirstDefinedResult(value, itemTester, thisArgument) {
    const itemTesterCur = thisArgument ? itemTester.bind(thisArgument) : itemTester;
    if (!(value instanceof Array))
        return itemTesterCur(value);
    for (let i = 0; i < value.length; i++) {
        const result = itemTesterCur(value[i]);
        if (typeof (result) !== "undefined")
            return result;
    }
}
exports.getFirstDefinedResult = getFirstDefinedResult;
function getSafe(o, keys, valueDefault) {
    if (keys.length === 0)
        return valueDefault;
    let i = 0, objCur = o;
    for (; i < keys.length; i++) {
        if (getType(objCur) !== "object")
            return valueDefault;
        objCur = objCur[keys[i]];
    }
    return objCur;
}
exports.getSafe = getSafe;
function copyObject(from, to = null, options = {}) {
    if (typeof (from) !== 'object' || typeof (to) !== 'object' || typeof (options) !== 'object')
        throw new Error("Wrong type : " + typeof (from) + ", " + typeof (to) + ", " + typeof (options));
    if (to === null)
        to = (from instanceof Array) ? [] : {};
    const { skip, deep, setPrototype, onlyKeys, skipKeys } = options;
    for (let key in from) {
        if (!from.hasOwnProperty(key) || (onlyKeys && !onlyKeys[key]) || (skipKeys && skipKeys[key]))
            continue;
        if (to.hasOwnProperty(key) && skip)
            continue;
        const value = from[key];
        if (typeof (value) === 'object' && deep)
            to[key] = copyObject(value, null, options);
        else
            to[key] = value;
    }
    if (setPrototype)
        Object.setPrototypeOf(to, Object.getPrototypeOf(from));
    return to;
}
exports.copyObject = copyObject;
const keyNameH = Symbol();
const keySetVisitedObjects = Symbol();
const keyArrayObjectsToVisit = Symbol();
const emptyFunction = (obj, context) => obj;
function Inherit(keyInherit, idToObject) {
    idToObject = idToObject || emptyFunction;
    function getValueInheritedL(o) {
        if (typeof (o) !== "object" || o === null || this[keySetVisitedObjects].has(o))
            return;
        this[keySetVisitedObjects].add(o);
        if (typeof (o[this[keyNameH]]) !== "undefined")
            return o[this[keyNameH]];
        const inherit = o[keyInherit];
        if (inherit) {
            applyAction(inherit, (objOrId) => this[keyArrayObjectsToVisit].push(idToObject(objOrId, o)));
        }
    }
    function getValueInherited(o, keyName, options = {}) {
        if (typeof (o) !== "object")
            return;
        if (typeof (o[keyName]) !== "undefined")
            return o[keyName];
        const inherit = o[keyInherit];
        if (!inherit)
            return options["getArrayObjects"] ? [o] : void 0;
        const setVisitedObjects = new Set();
        const context = {
            [keyNameH]: keyName,
            [keySetVisitedObjects]: setVisitedObjects,
            [keyArrayObjectsToVisit]: [],
        };
        setVisitedObjects.add(o);
        const arrayObjectsToVisit = context[keyArrayObjectsToVisit];
        applyAction(inherit, (objOrId) => arrayObjectsToVisit.push(idToObject(objOrId, o)));
        let result = getFirstDefinedResult(arrayObjectsToVisit, getValueInheritedL, context);
        if (options["getArrayObjects"]) {
            arrayObjectsToVisit.unshift(o);
            result = arrayRemoveDublicates(arrayObjectsToVisit);
        }
        return result;
    }
    return { getValueInherited };
}
exports.Inherit = Inherit;
function arrayRemoveDublicates(array) {
    if (array.length < 50)
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
exports.arrayRemoveDublicates = arrayRemoveDublicates;
