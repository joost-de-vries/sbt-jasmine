var path = require("path");
var Logger = (function () {
    function Logger(logLevel) {
        this.logLevel = logLevel;
        this.isDebug = "debug" === this.logLevel;
    }
    Logger.prototype.debug = function (message, object) {
        if (this.logLevel === "debug" && object)
            console.log(message, object);
        else if (this.logLevel === "debug")
            console.log(message);
    };
    Logger.prototype.info = function (message) {
        if (this.logLevel === "debug" || this.logLevel === "debug")
            console.log(message);
    };
    Logger.prototype.warn = function (message) {
        if (this.logLevel === "debug" || this.logLevel === "info" || this.logLevel === "warn")
            console.log(message);
    };
    Logger.prototype.error = function (message, error) {
        if (this.logLevel === "debug" || this.logLevel === "info" || this.logLevel === "warn" || this.logLevel === "error") {
            if (error !== undefined) {
                var errorMessage = error.message;
                if (error.fileName !== undefined) {
                    errorMessage = errorMessage + " in " + error.fileName;
                }
                if (error.lineNumber !== undefined) {
                    errorMessage = errorMessage + " at line " + error.lineNumber;
                }
                console.log(message + " " + errorMessage);
            }
            else {
                console.log(message);
            }
        }
    };
    return Logger;
}());
var Some = (function () {
    function Some(value) {
        this.value = value;
    }
    Some.prototype.foreach = function (f) {
        return f(this.value);
    };
    Some.prototype.map = function (f) {
        return new Some(f(this.value));
    };
    return Some;
}());
var None = (function () {
    function None() {
    }
    None.prototype.foreach = function (f) {
        return;
    };
    None.prototype.map = function (f) {
        return new None();
    };
    return None;
}());
var SourceMapping = (function () {
    function SourceMapping(a) {
        this.absolutePath = a[0];
        this.relativePath = a[1];
    }
    SourceMapping.prototype.normalizedAbsolutePath = function () {
        return path.normalize(this.absolutePath);
    };
    SourceMapping.prototype.toOutputPath = function (targetDir, extension) {
        return path.join(targetDir, replaceFileExtension(path.normalize(this.relativePath), extension));
    };
    return SourceMapping;
}());
var SourceMappings = (function () {
    function SourceMappings(sourceFileMappings) {
        console.log("mappings", sourceFileMappings);
        this.mappings = sourceFileMappings.map(function (a) { return new SourceMapping(a); });
    }
    SourceMappings.prototype.asAbsolutePaths = function () {
        if (!this.absolutePaths) {
            this.absolutePaths = this.mappings.map(function (sm) { return sm.normalizedAbsolutePath(); });
        }
        return this.absolutePaths;
    };
    SourceMappings.prototype.find = function (sourceFileName) {
        var absPath = path.normalize(sourceFileName);
        var index = this.asAbsolutePaths().indexOf(absPath);
        if (index !== -1) {
            return new Some(this.mappings[index]);
        }
        else {
            return new None();
        }
    };
    return SourceMappings;
}());
function compileDone(compileResult) {
    console.log("\u0010" + JSON.stringify(compileResult));
}
function parseArgs(args) {
    var SOURCE_FILE_MAPPINGS_ARG = 2;
    var TARGET_ARG = 3;
    var OPTIONS_ARG = 4;
    var cwd = process.cwd();
    var sourceFileMappings;
    try {
        sourceFileMappings = JSON.parse(args[SOURCE_FILE_MAPPINGS_ARG]);
    }
    catch (e) {
        sourceFileMappings = [[
                path.join(cwd, args[SOURCE_FILE_MAPPINGS_ARG]),
                args[SOURCE_FILE_MAPPINGS_ARG]
            ]];
    }
    var target = (args.length > TARGET_ARG ? args[TARGET_ARG] : path.join(cwd, "lib"));
    var options;
    if (target.length > 0 && target.charAt(0) === "{") {
        options = JSON.parse(target);
        target = path.join(cwd, "lib");
    }
    else {
        options = (args.length > OPTIONS_ARG ? JSON.parse(args[OPTIONS_ARG]) : {});
    }
    return {
        sourceFileMappings: sourceFileMappings,
        target: target,
        options: options
    };
}
function replaceFileExtension(file, ext) {
    var oldExt = path.extname(file);
    return file.substring(0, file.length - oldExt.length) + ext;
}
var args = process.argv;
var tests = JSON.parse(args[2]);
var testsDir = JSON.parse(args[3]);
var jasmineOpts = JSON.parse(args[4]);
var logger = new Logger(jasmineOpts.logLevel);
logger.debug("starting jasmine");
logger.debug("tests  " + tests + " in " + testsDir);
jasmineOpts.jasmineConfig.spec_files = tests;
jasmineOpts.jasmineConfig.spec_dir = testsDir;
logger.debug("jasmine config", jasmineOpts.jasmineConfig);
var JasmineNode = require('jasmine');
var jasm = new JasmineNode();
jasm.loadConfig(jasmineOpts.jasmineConfig);
var JasmineReporter = (function () {
    function JasmineReporter(logger) {
        this.logger = logger;
        this.currentSuite = [];
    }
    JasmineReporter.prototype.jasmineStarted = function (suiteInfo) {
        this.logger.debug('Running suite with ' + suiteInfo.totalSpecsDefined);
        this.currentSuite.unshift({
            root: true,
            title: "root",
            suites: [],
            tests: []
        });
    };
    JasmineReporter.prototype.suiteStarted = function (result) {
        this.logger.debug('Suite started: ' + result.description + ' whose full description is: ' + result.fullName + " and id is " + result.id);
        var thisSuite = {
            title: result.fullName,
            suites: [],
            tests: []
        };
        this.currentSuite[0].suites.unshift(thisSuite);
        this.currentSuite.unshift(thisSuite);
    };
    JasmineReporter.prototype.specStarted = function (result) {
        this.logger.debug('Spec started: ' + result.description + ' whose full description is: ' + result.fullName);
    };
    JasmineReporter.prototype.specDone = function (result) {
        this.logger.debug('Spec: ' + result.description + ' was ' + result.status);
        for (var i = 0; i < result.failedExpectations.length; i++) {
            var failedExpectation = result.failedExpectations[i];
            this.currentSuite[0].tests.unshift({ title: result.description + " " + failedExpectation.matcherName,
                status: "fail",
                duration: 0,
                error: {
                    name: failedExpectation.matcherName,
                    message: failedExpectation.message,
                    stack: failedExpectation.stack
                } });
        }
        this.logger.debug("Failed: " + result.failedExpectations.length);
        for (var i = 0; i < result.passedExpectations.length; i++) {
            var passedExpectation = result.passedExpectations[i];
            this.currentSuite[0].tests.unshift({ title: result.description + " " + passedExpectation.matcherName,
                status: "pass",
                duration: 0
            });
        }
        this.logger.debug("Passed: " + result.passedExpectations.length);
    };
    JasmineReporter.prototype.suiteDone = function (result) {
        this.logger.debug('Suite: ' + result.description + ' was ' + result.status);
        this.currentSuite.shift();
    };
    JasmineReporter.prototype.jasmineDone = function () {
        this.logger.debug('Finished suite');
    };
    Object.defineProperty(JasmineReporter.prototype, "result", {
        get: function () {
            return {
                suites: this.currentSuite[0].suites,
                tests: this.currentSuite[0].tests
            };
        },
        enumerable: true,
        configurable: true
    });
    return JasmineReporter;
}());
var reporter = new JasmineReporter(logger);
jasm.addReporter(reporter);
jasm.onComplete(function (b) {
    var msg = b ? "All specs succeeded" : "One or more specs failed";
    logger.debug(msg);
    console.log("\u0010", JSON.stringify(reporter.result));
    process.exit(0);
});
jasm.execute();
