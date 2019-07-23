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
exports.keyGetArrayObjects = "getArrayObjects";
exports.keyGetObjectWithKey = "getObjectWithKey";
const keyNameH = Symbol();
const keySetVisitedObjects = Symbol();
const keyArrayObjectsToVisit = Symbol();
const keyOptions = "options";
const emptyFunction = (obj, context) => obj;
function Inherit(keyInherit, idToObject) {
    const idToObject1 = idToObject || emptyFunction;
    function getValueInheritedL(o) {
        if (typeof (o) !== "object" || o === null || this[keySetVisitedObjects].has(o))
            return;
        this[keySetVisitedObjects].add(o);
        const value = o[this[keyNameH]];
        if (typeof (value) !== "undefined")
            return (this[keyOptions].getObjectWithKey) ? getFirstParentWithKey(o, this[keyNameH]) : value;
        const inherit = o[keyInherit];
        if (inherit) {
            applyAction(inherit, (objOrId) => this[keyArrayObjectsToVisit].push(idToObject1(objOrId, o)));
        }
    }
    function getValueInherited(o, keyName, options = {}) {
        if (typeof (o) !== "object")
            return;
        const value = o[keyName];
        if (typeof (value) !== "undefined")
            return options.getObjectWithKey ? getFirstParentWithKey(o, keyName) : value;
        const inherit = o[keyInherit];
        if (!inherit)
            return options.getArrayObjects ? [o] : void 0;
        const setVisitedObjects = new Set();
        const arrayObjectsToVisit = [];
        const context = {
            [keyNameH]: keyName,
            [keySetVisitedObjects]: setVisitedObjects,
            [keyArrayObjectsToVisit]: arrayObjectsToVisit,
            [keyOptions]: options,
        };
        setVisitedObjects.add(o);
        applyAction(inherit, (objOrId) => arrayObjectsToVisit.push(idToObject1(objOrId, o)));
        let result = getFirstDefinedResult(arrayObjectsToVisit, getValueInheritedL, context);
        if (options.getArrayObjects) {
            arrayObjectsToVisit.unshift(o);
            result = arrayRemoveDublicates(arrayObjectsToVisit);
        }
        return result;
    }
    function addAbstractH(o, parent) {
        const value = o[keyInherit];
        if (!value)
            o[keyInherit] = parent;
        else if (!Array.isArray(value)) {
            if (parent !== value)
                o[keyInherit] = [parent, value];
        }
        else
            unshiftUniqueValue(value, parent);
    }
    function removeAbstractH(o, parent) {
        const value = o[keyInherit];
        if (value === parent)
            delete o[keyInherit];
        else if (Array.isArray(value)) {
            const index = value.indexOf(parent);
            if (index >= 0) {
                value.splice(index, 1);
                if (value.length === 1)
                    o[keyInherit] = value[0];
            }
        }
    }
    function getKeyInherit() {
        return keyInherit;
    }
    return { getValueInherited, addAbstractH, removeAbstractH, getKeyInherit };
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
function toArray(values) {
    return Array.isArray(values) ? values : [values];
}
exports.toArray = toArray;
function unshiftUniqueValue(array, value) {
    if (array.indexOf(value) < 0)
        array.unshift(value);
}
exports.unshiftUniqueValue = unshiftUniqueValue;
exports.prototypeDefault = Object.getPrototypeOf({});
function getFirstParentWithKey(o, key) {
    if (!o[key])
        return;
    let obj = o;
    do {
        if (obj.hasOwnProperty(key))
            return obj;
        obj = Object.getPrototypeOf(obj);
    } while (obj && obj !== exports.prototypeDefault);
    return exports.prototypeDefault;
}
exports.getFirstParentWithKey = getFirstParentWithKey;
