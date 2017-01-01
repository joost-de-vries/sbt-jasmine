/// <reference path="./internal.ts" />
/// <reference path="../../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="./jasmine-npm.d.ts" />
import SuiteInfo = jasmine.SuiteInfo
import CustomReporterResult = jasmine.CustomReporterResult
interface SbtJasmineOptions {
    logLevel: string,
    jasmineConfig: JasmineConfig
}
const args = process.argv;

const tests = JSON.parse(args[2])
const testsDir = JSON.parse(args[3])
const jasmineOpts: SbtJasmineOptions = JSON.parse(args[4])

const logger = new Logger(jasmineOpts.logLevel)


logger.debug("starting jasmine")
logger.debug(`tests  ${tests} in ${testsDir}`)
jasmineOpts.jasmineConfig.spec_files = tests
jasmineOpts.jasmineConfig.spec_dir = testsDir
logger.debug(`jasmine config`, jasmineOpts.jasmineConfig)

const JasmineNode = require('jasmine')

const jasm: JasmineNpm = new JasmineNode()

jasm.loadConfig(jasmineOpts.jasmineConfig)

interface TestErrorResult {
    name: string,
    message?: string
    stack?: string
}
interface UnitTestResult {
    title: string
    status: "pass" |"pending"| "fail"|"error"
    duration: number
    error?: TestErrorResult
}

interface TestSuiteResult {
    root?: boolean
    title?: string
    filename?: string
    suites: TestSuiteResult[]
    tests: UnitTestResult[]
}


class JasmineReporter implements jasmine.CustomReporter {

    private currentSuite:TestSuiteResult[]=[]
    constructor(private logger: Logger) {
    }

    jasmineStarted?(suiteInfo: SuiteInfo): void {
        this.logger.debug('Running suite with ' + suiteInfo.totalSpecsDefined);
        this.currentSuite.unshift({
            root:true,
            title: "root",
            suites: [],
            tests: []
        })
//        this.logger.debug(`current `,this.currentSuite)
    }

    suiteStarted?(result: CustomReporterResult): void {
        this.logger.debug('Suite started: ' + result.description + ' whose full description is: ' + result.fullName+" and id is "+result.id);
        const thisSuite = {
            title: result.fullName,
            suites: [],
            tests: []
        } as TestSuiteResult
        this.currentSuite[0].suites.unshift(thisSuite)
        this.currentSuite.unshift(thisSuite)
  //      this.logger.debug(`current `,this.currentSuite)
    }

    specStarted(result: CustomReporterResult): void {
        this.logger.debug('Spec started: ' + result.description + ' whose full description is: ' + result.fullName);
    }

    specDone(result: CustomReporterResult): void {
        this.logger.debug('Spec: ' + result.description + ' was ' + result.status);
        for (let i = 0; i < result.failedExpectations!.length; i++) {
            const failedExpectation = result.failedExpectations![i]
    //        this.logger.debug('Failure: ' + failedExpectation.matcherName +" "+failedExpectation.message);
      //      this.logger.debug(failedExpectation.stack);
            this.currentSuite[0].tests.unshift({    title: result.description + " " + failedExpectation.matcherName,
            status: "fail",
            duration: 0,
            error: {
                name: failedExpectation.matcherName,
                message: failedExpectation.message,
                stack: failedExpectation.stack
            }})
        }
        this.logger.debug("Failed: " + result.failedExpectations!.length);
        for (let i = 0; i < result.passedExpectations!.length; i++) {
            const passedExpectation = result.passedExpectations![i]
     //       this.logger.debug('Passed: ' + passedExpectation.matcherName +" "+passedExpectation.message);
     //       this.logger.debug(passedExpectation.stack);
            this.currentSuite[0].tests.unshift({    title: result.description + " " + passedExpectation.matcherName,
                status: "pass",
                duration: 0
            })
        }
        this.logger.debug("Passed: " + result.passedExpectations!.length);

    }

    suiteDone(result: CustomReporterResult): void {
        this.logger.debug('Suite: ' + result.description + ' was ' + result.status);
        // for (var i = 0; i < result.failedExpectations!.length; i++) {
        //
        //     this.logger.debug('AfterAll ' + result.failedExpectations![i].message);
        //     this.logger.debug(result.failedExpectations![i].stack);
        // }

        this.currentSuite.shift()
    }

    jasmineDone(): any {
        this.logger.debug('Finished suite')//,this.currentSuite[0]);
    }

    get result(): TestSuiteResult {
        return {
            suites: this.currentSuite[0].suites,
            tests: this.currentSuite[0].tests
        }
    }
}


//jasm.configureDefaultReporter({});
const reporter = new JasmineReporter(logger)
jasm.addReporter(reporter)

jasm.onComplete(b => {
    const msg = b ? "All specs succeeded" : "One or more specs failed"
    logger.debug(msg)
    console.log("\u0010", JSON.stringify(reporter.result))
    process.exit(0)
})

jasm.execute()

