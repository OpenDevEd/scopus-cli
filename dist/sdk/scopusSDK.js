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
const get_1 = __importDefault(require("./utils/get"));
const search_1 = require("./utils/search");
class ScopusSDK {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.elsevier.com/content';
        this.headers = {
            'X-ELS-APIKey': this.apiKey,
        };
    }
    search(_a) {
        return __awaiter(this, arguments, void 0, function* ({ query, view = 'STANDARD', toJson, retriveAllPages = false, perPage = 25, page = 1, startPage, endPage, chunkSize, }) {
            try {
                // Encode query string and replace spaces with '+'
                // and parentheses with their respective encoded values
                const encodedQuery = (0, search_1.urlEncodeQuery)(query);
                (0, search_1.validateParameters)(retriveAllPages, startPage, endPage, chunkSize, toJson, perPage);
                if (retriveAllPages) {
                    perPage = 25;
                    page = 1;
                }
                if (startPage && endPage) {
                    page = startPage;
                }
                // Make GET request to Scopus API
                const response = yield (0, get_1.default)(`${this.baseUrl}/search/scopus`, this.headers, {
                    query: encodedQuery,
                    view,
                    start: ((page * perPage) - perPage).toString(),
                    count: perPage === null || perPage === void 0 ? void 0 : perPage.toString(),
                });
                if (retriveAllPages) {
                    if (chunkSize) {
                        response.data = yield (0, search_1.handleAllPagesInChunks)(response.data, this.headers, chunkSize, toJson);
                    }
                    response.data = yield (0, search_1.handleAllPages)(response.data, this.headers);
                }
                if (startPage && endPage) {
                    response.data = yield (0, search_1.handleMultiplePages)(response.data, this.headers, startPage, endPage);
                }
                // Write response to JSON file if toJson is provided
                if (toJson && !chunkSize) {
                    if (response.status === 200) {
                        fs_1.default.writeFileSync(`${toJson}.json`, JSON.stringify(response.data, null, 2));
                    }
                }
                return response;
            }
            catch (error) {
                throw new Error(`GET request failed: ${error.message}`);
            }
        });
    }
}
exports.default = ScopusSDK;
//# sourceMappingURL=scopusSDK.js.map