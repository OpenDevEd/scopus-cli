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
const fs_1 = __importDefault(require("fs"));
const scopusSDK_1 = __importDefault(require("../sdk/scopusSDK"));
function getKey() {
    const key = fs_1.default.readFileSync('scopus-api-key.txt', 'utf8');
    return key.trim();
}
function sanitise(str) {
    let term = str;
    term = term.replace(/\t+/gs, ' ');
    term = term.replace(/ +/gs, ' ');
    term = term.replace(/^ +/gs, '');
    term = term.replace(/ +$/gs, '');
    return term;
}
function quoteIfNeeded(term) {
    let t = term;
    if (t.match(/ /) && !t.match(/^".*"$/)) {
        t = `"${t}"`;
    }
    return t;
}
function searchBuilder(query) {
    let searchQuery = '';
    for (let i = 0; i < query.length; i += 1) {
        if (query[i].match(/(\w+)\.\.\./)) {
            const key = query[i].match(/(\w+)\.\.\./)[1];
            // open a file
            const file = `searchterms/${key}.txt`;
            let result = fs_1.default.existsSync(file) ? fs_1.default.readFileSync(file, 'utf8') : key;
            // split result into an array by new line
            const resultarr = result.split(/\r?\n/);
            result = '';
            let operator = '';
            let useoperator = false;
            // remove comments from results file
            for (let j = 0; j < resultarr.length; j += 1) {
                if (resultarr[j].match(/#(OR|AND)\s*$/)) {
                    operator = `${resultarr[j].match(/#(OR|AND)\s*$/)[1]} `;
                    useoperator = true;
                }
                if (resultarr[j].match(/#(-)\s*$/)) {
                    useoperator = true;
                    operator = ' ';
                    console.log('operator empty.');
                }
                const term = sanitise(resultarr[j].replace(/#.+$/g, ''));
                if (term !== '') {
                    result
                        += `${(result.match(/[\w")]\s+$/) && !term.match(/^\s*\)/) ? operator : '')
                            + (useoperator ? quoteIfNeeded(term) : term)} `;
                }
            }
            result = query[i].replace(RegExp(`${key}\\.\\.\\.`), result);
            searchQuery += ` ${result}`;
        }
        else {
            searchQuery += ` ${quoteIfNeeded(query[i])}`;
        }
    }
    // Allow use of [ and ] instead of ( and ).
    searchQuery = searchQuery.replace(/\[/gs, '(');
    searchQuery = searchQuery.replace(/\]/gs, ')');
    return searchQuery;
}
function buildQuery(query, title, titleAndAbstract) {
    let searchQuery = searchBuilder(query);
    if (title) {
        searchQuery = `TITLE(${searchQuery})`;
    }
    if (titleAndAbstract) {
        searchQuery = `TITLE-ABS-KEY(${searchQuery})`;
    }
    console.log('Final query:', searchQuery);
    return searchQuery;
}
function saveAndSearch(scopusOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        fs_1.default.writeFileSync('scopusOptions.json', JSON.stringify(scopusOptions, null, 2));
        const scopusSDK = new scopusSDK_1.default(getKey());
        const res = yield scopusSDK.search(scopusOptions);
        return res;
    });
}
function handleCount(scopusOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        scopusOptions.perPage = 1;
        scopusOptions.page = 1;
        const results = yield saveAndSearch(scopusOptions);
        console.log('count:', results.data['search-results']['opensearch:totalResults']);
        return results.data['search-results']['opensearch:totalResults'];
    });
}
function search(args) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let query = args.searchQuery;
        if (args.searchstringfromfile) {
            if (!fs_1.default.existsSync(args.searchstringfromfile)) {
                console.log(`File not found: ${args.searchstringfromfile}`);
                process.exit(1);
            }
            query = fs_1.default.readFileSync(args.searchstringfromfile, 'utf8');
            query = query.split(/\r?\n/);
        }
        const scopusOptions = {
            query: buildQuery(query, args.title, args.title_and_abstract).trim(),
        };
        if (args.count) {
            const res = yield handleCount(scopusOptions);
            return res;
        }
        if (args.view) {
            scopusOptions.view = args.view;
        }
        if (args.save) {
            scopusOptions.toJson = args.save;
        }
        if (args.autosave) {
            const filename = (_a = scopusOptions.query) === null || _a === void 0 ? void 0 : _a.trim().split('  ').join(' ');
            scopusOptions.toJson = filename;
            if (args.time) {
                // Y-M-D_H:M:S
                const date = new Date().toISOString().replace('T', '_').replace(/\..+/, '');
                scopusOptions.toJson = `${date}-${filename}`;
            }
            args.save = scopusOptions.toJson;
        }
        if (args.perPage) {
            scopusOptions.perPage = args.perPage;
        }
        if (args.chunkSize) {
            scopusOptions.chunkSize = args.chunkSize;
        }
        scopusOptions.retriveAllPages = !!args.allpages;
        const res = yield saveAndSearch(scopusOptions);
        if (args.save || args.autosave) {
            const configJson = Object.assign({ date: new Date().toISOString().replace('T', ' ').replace(/\..+/, '') }, scopusOptions);
            fs_1.default.writeFileSync(`${scopusOptions.toJson}.config.json`, JSON.stringify(configJson, null, 2));
        }
        else {
            console.log(JSON.stringify(res.data, null, 2));
        }
        return res.data;
    });
}
exports.default = search;
//# sourceMappingURL=parser.js.map