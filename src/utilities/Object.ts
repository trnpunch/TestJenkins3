const toObjectString = Object.prototype.toString;

function isExactObject (data: any) {
    return typeof data === 'object' && toObjectString.call(data) === '[object Object]';
}

export {
    isExactObject
}
