"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCheckpoint = void 0;
const typeorm_1 = require("typeorm");
let TransactionCheckpoint = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('transaction_checkpoints')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _walletAddress_decorators;
    let _walletAddress_initializers = [];
    let _walletAddress_extraInitializers = [];
    let _lastBlockNumber_decorators;
    let _lastBlockNumber_initializers = [];
    let _lastBlockNumber_extraInitializers = [];
    let _lastTransactionHash_decorators;
    let _lastTransactionHash_initializers = [];
    let _lastTransactionHash_extraInitializers = [];
    let _updatedAt_decorators;
    let _updatedAt_initializers = [];
    let _updatedAt_extraInitializers = [];
    var TransactionCheckpoint = _classThis = class {
        constructor() {
            this.walletAddress = __runInitializers(this, _walletAddress_initializers, void 0);
            this.lastBlockNumber = (__runInitializers(this, _walletAddress_extraInitializers), __runInitializers(this, _lastBlockNumber_initializers, void 0));
            this.lastTransactionHash = (__runInitializers(this, _lastBlockNumber_extraInitializers), __runInitializers(this, _lastTransactionHash_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _lastTransactionHash_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "TransactionCheckpoint");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _walletAddress_decorators = [(0, typeorm_1.PrimaryColumn)()];
        _lastBlockNumber_decorators = [(0, typeorm_1.Column)({ type: 'bigint' })];
        _lastTransactionHash_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _walletAddress_decorators, { kind: "field", name: "walletAddress", static: false, private: false, access: { has: obj => "walletAddress" in obj, get: obj => obj.walletAddress, set: (obj, value) => { obj.walletAddress = value; } }, metadata: _metadata }, _walletAddress_initializers, _walletAddress_extraInitializers);
        __esDecorate(null, null, _lastBlockNumber_decorators, { kind: "field", name: "lastBlockNumber", static: false, private: false, access: { has: obj => "lastBlockNumber" in obj, get: obj => obj.lastBlockNumber, set: (obj, value) => { obj.lastBlockNumber = value; } }, metadata: _metadata }, _lastBlockNumber_initializers, _lastBlockNumber_extraInitializers);
        __esDecorate(null, null, _lastTransactionHash_decorators, { kind: "field", name: "lastTransactionHash", static: false, private: false, access: { has: obj => "lastTransactionHash" in obj, get: obj => obj.lastTransactionHash, set: (obj, value) => { obj.lastTransactionHash = value; } }, metadata: _metadata }, _lastTransactionHash_initializers, _lastTransactionHash_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: obj => "updatedAt" in obj, get: obj => obj.updatedAt, set: (obj, value) => { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionCheckpoint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionCheckpoint = _classThis;
})();
exports.TransactionCheckpoint = TransactionCheckpoint;
