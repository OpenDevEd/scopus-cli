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
const scopusSDK_1 = __importDefault(require("./scopusSDK"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const scopusSDK = new scopusSDK_1.default('640b386af562c2438a0166e47a74d4c7');
        const res = yield scopusSDK.search({
            query: 'heart attack OR text(liver)',
            toJson: 'field',
        });
        console.log(res.data);
        fs_1.default.writeFileSync('response.json', JSON.stringify(res.data, null, 2));
    });
}
main();
//# sourceMappingURL=index.js.map