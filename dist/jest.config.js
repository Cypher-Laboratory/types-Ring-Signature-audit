"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/deprecated-test/",
    ],
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
};
exports.default = config;
