"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAllPagesInChunks = exports.formatNumber = exports.handleAllPages = exports.handleMultiplePages = exports.parseCountAndStart = exports.validateParameters = exports.parseFacets = exports.parseSubj = exports.parseSort = exports.parseField = exports.urlEncodeQuery = void 0;
const fs_1 = __importDefault(require("fs"));
const get_1 = __importDefault(require("./get"));
function urlEncodeQuery(query) {
    const encode = encodeURIComponent(query).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29');
    return encode;
}
exports.urlEncodeQuery = urlEncodeQuery;
function parseField(field) {
    let fieldString = '';
    if (field) {
        if (Array.isArray(field)) {
            fieldString = field.map((f) => {
                if (f.includes('.')) {
                    return f.split('.').join(',');
                }
                return f;
            }).join(',');
        }
        else if (field.includes('.')) {
            fieldString = field.split('.').join(',');
        }
        else {
            fieldString = field;
        }
    }
    return fieldString;
}
exports.parseField = parseField;
function parseSort(sort) {
    let sortString = '';
    if (sort) {
        if (Array.isArray(sort)) {
            const first3 = sort.slice(0, 3);
            sortString = first3.map((s) => {
                if (!s.order) {
                    return `${s.field}`;
                }
                if (s.order === 'asc') {
                    return `+${s.field}`;
                }
                return `-${s.field}`;
            }).join(',');
        }
        else if (!sort.order) {
            sortString = `${sort.field}`;
        }
        else if (sort.order === 'asc') {
            sortString = `+${sort.field}`;
        }
        else if (sort.order === 'desc') {
            sortString = `-${sort.field}`;
        }
    }
    return sortString;
}
exports.parseSort = parseSort;
function parseSubj(subj) {
    let subjString = '';
    if (subj) {
        if (Array.isArray(subj)) {
            subjString = subj.join(',');
        }
        else {
            subjString = subj;
        }
    }
    return subjString;
}
exports.parseSubj = parseSubj;
function parseFacets(facets) {
    let facetsString = '';
    if (facets) {
        if (Array.isArray(facets)) {
            facetsString = facets.map((facet) => {
                const { option, count: countFacet, sort: sortFacet, prefix, } = facet;
                return `{"option":"${option}"${countFacet ? `,"count":${countFacet}` : ''}${sortFacet ? `,"sort":"${sortFacet}"` : ''}${prefix ? `,"prefix":"${prefix}"` : ''}}`;
            }).join(';');
        }
        else {
            facetsString = `{"option":"${facets.option}"${facets.count ? `,"count":${facets.count}` : ''}${facets.sort ? `,"sort":"${facets.sort}"` : ''}${facets.prefix ? `,"prefix":"${facets.prefix}"` : ''}}`;
        }
    }
    return facetsString;
}
exports.parseFacets = parseFacets;
function validateParameters(retrieveAllPages, startPage, endPage, chunkSize, toJson, perPage) {
    if (retrieveAllPages && (startPage || endPage)) {
        throw new Error('startPage and endPage are not allowed with retrieveAllPages');
    }
    if (chunkSize && (startPage || endPage))
        throw new Error('startPage and endPage are not allowed with chunkSize');
    if (chunkSize && !toJson)
        throw new Error('toJson is required with chunkSize');
    // TODO: Remove this validation when the Scopus API is fixed
    if (perPage && perPage > 25)
        throw new Error('perPage must be less than or equal to 25');
}
exports.validateParameters = validateParameters;
function parseCountAndStart(count, start, retriveAllPages) {
    let searchCount = count;
    let searchStart = start;
    if (retriveAllPages) {
        searchCount = 25;
        searchStart = 0;
    }
    return { searchCount, searchStart };
}
exports.parseCountAndStart = parseCountAndStart;
function getNext(links) {
    return links.find((l) => l['@ref'] === 'next');
}
function handleMultiplePages(data, headers, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        const links = data['search-results'].link;
        let next = getNext(links);
        const allData = data;
        let page = start + 1;
        while (next && page < end) {
            console.log(`Retrieving page ${page}`);
            page += 1;
            const nextData = yield (0, get_1.default)(next['@href'], headers, {});
            allData['search-results'].entry.push(...nextData.data['search-results'].entry);
            next = getNext(nextData.data['search-results'].link);
        }
        return allData;
    });
}
exports.handleMultiplePages = handleMultiplePages;
function handleAllPages(data, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        const links = data['search-results'].link;
        let next = getNext(links);
        const allData = data;
        let page = 1;
        while (next) {
            console.log(`Retrieving page ${page}`);
            page += 1;
            const nextData = yield (0, get_1.default)(next['@href'], headers, {});
            allData['search-results'].entry.push(...nextData.data['search-results'].entry);
            next = getNext(nextData.data['search-results'].link);
        }
        return allData;
    });
}
exports.handleAllPages = handleAllPages;
function formatNumber(num) {
    // Pad the number to 7 digits
    const paddedNum = num.toString().padStart(7, '0');
    // Format the padded number with commas as thousands separators
    const parts = paddedNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
exports.formatNumber = formatNumber;
function handleAllPagesInChunks(data, headers, chunkSize, toJson) {
    return __awaiter(this, void 0, void 0, function* () {
        const links = data['search-results'].link;
        let next = getNext(links);
        const chunk = data;
        let page = 1;
        let start = 0;
        let end;
        while (next) {
            console.log(`Retrieving page ${page}`);
            page += 1;
            const nextData = yield (0, get_1.default)(next['@href'], headers, {});
            chunk['search-results'].entry.push(...nextData.data['search-results'].entry);
            next = getNext(nextData.data['search-results'].link);
            if (chunk['search-results'].entry.length >= chunkSize || !next) {
                end = start + chunk['search-results'].entry.length;
                const startFormatted = formatNumber(start + 1);
                const endFormatted = formatNumber(end);
                fs_1.default.writeFileSync(`${toJson}-${startFormatted}-${endFormatted}.json`, JSON.stringify(chunk, null, 2));
                start = end;
                chunk['search-results'].entry = [];
            }
        }
        return data;
    });
}
exports.handleAllPagesInChunks = handleAllPagesInChunks;
//# sourceMappingURL=search.js.map