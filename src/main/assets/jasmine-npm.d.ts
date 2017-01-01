/// <reference path="../../../node_modules/@types/jasmine/index.d.ts" />

import Jasmine = jasmine.Jasmine;

interface JasmineConfig{
    spec_dir?: string
    spec_files?: string[]
    helpers?: string[]
    stopSpecOnExpectationFailure?:boolean
    random?:boolean
}

declare class JasmineNpm {
    constructor(options: any);
    loadConfig(c:JasmineConfig):void
    onComplete(f:(b:boolean) => any):void
    addReporter(reporter: any): void
    execute(): void
    execute(filePaths:string[], filter:string): void
    configureDefaultReporter(options: any, ...args: any[]): void;
    addMatchers(matchers: any): void;
    addSpecFile(filePath: any): void;
    addSpecFiles(files: any): void;
    loadConfigFile(configFilePath: any): void;
    loadHelpers(): void;
    loadSpecs(): void;
    randomizeTests(value: any): void;
    seed(value: any): void;
    showColors(value: any): void;
    stopSpecOnExpectationFailure(value: any): void;
    static ConsoleReporter(options: any): any;
}
