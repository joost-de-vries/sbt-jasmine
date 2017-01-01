package name.devries.sbt.jasmine

import com.typesafe.sbt.jse.{SbtJsEngine, SbtJsTask}
import com.typesafe.sbt.web.{PathMapping, SbtWeb}
import sbt.Keys._
import sbt._
import spray.json.{JsArray, _}

object Import {

  import KeyRanks._

  val jasmine = TaskKey[Unit]("jasmine", "Run js tests")
  val jasmineConfigFile = SettingKey[File]("jasmine-config-file", "The jasmine config file that will be merged with the jasmine config that sbt-jasmine manages. Default is <test assets dir>/jasmine.json. Ie for a Play app 'test/assets/jasmine.json'")
  val jasmineOnly = InputKey[Unit]("jasmine-only", "Execute the jasmine tests provided as arguments or all tests if no arguments are provided.", ATask)
  val jasmineExecuteTests = TaskKey[(TestResult.Value, Map[String, SuiteResult])]("js-execute-tests", "Execute the js testss and return the result.", CTask)
  val jasmineTests = TaskKey[Seq[PathMapping]]("jasmine-tests", "The tests that will be executed by jasmine.")
  val jasmineFilter = SettingKey[FileFilter]("jasmine-filter", "The files for jasmine to run. Default: (web-js-filter in TestAssets) ie GlobFilter(\"*Test.js\") | GlobFilter(\"*Spec.js\") .")
}


object SbtJsTest extends AutoPlugin {

  override def requires = SbtJsTask

  override def trigger = AllRequirements

  val autoImport = Import

  import SbtJsEngine.autoImport.JsEngineKeys._
  import SbtJsTask.autoImport.JsTaskKeys._
  import SbtWeb.autoImport._
  import WebKeys._
  import autoImport._

  val testResultLogger = TestResultLogger.Default.copy(printNoTests = TestResultLogger.const(_ info "No jasmine tests found"))

  override def projectSettings = inTask(jasmine)(SbtJsTask.jsTaskSpecificUnscopedSettings) ++ Seq(

    shellFile in jasmine := getClass.getClassLoader.getResource("jasmine.js"),
    logLevel in jasmine := Level.Info,
    jasmineConfigFile in jasmine := (sourceDirectory in TestAssets).value / "jasmine.json",
    jasmineFilter in jasmine := (jsFilter in TestAssets).value,

    // Find the test files to run.  These need to be in the test assets target directory, however we only want to
    // find tests that originally came from the test sources directories (both managed and unmanaged).
    jasmineTests := {
      val workDir: File = (assets in TestAssets).value
      val testFilter: FileFilter = (jasmineFilter in jasmine).value
      val testSources: Seq[File] = (sources in TestAssets).value ++ (managedResources in TestAssets).value
      val testDirectories: Seq[File] = (sourceDirectories in TestAssets).value ++ (managedResourceDirectories in TestAssets).value
      (testSources ** testFilter).pair(relativeTo(testDirectories)).map {
        case (_, path) => workDir / path -> path
      }
    },

    // Actually run the tests
    jasmineExecuteTests := jasmineTestTask.value(jasmineTests.value),

    // This ensures that jasmine tests get executed when test is run
    (executeTests in Test) <<= (executeTests in Test, jasmineExecuteTests).map { (output, jasmineResult) =>
      val (result, suiteResults) = jasmineResult
      import TestResult._

      // Merge the mocha result with the overall result of the rest of the tests
      val overallResult = (output.overall, result) match {
        case (Error, _) | (_, Error) => Error
        case (Failed, _) | (_, Failed) => Failed
        case _ => Passed
      }
      Tests.Output(overallResult, output.events ++ suiteResults, output.summaries)
    },

    // For running jasmine tests in isolation from other types of tests
    jasmine := {
      val (result, events) = jasmineExecuteTests.value
      testResultLogger.run(streams.value.log, Tests.Output(result, events, Nil), "")
    },

    tags in jasmine := Seq(Tags.Test -> 1),

    // For running only a specified set of tests
    jasmineOnly := {
      // Parse the tests
      val selected = Def.spaceDelimited("<tests>").parsed.toSet
      val availableTests: Seq[PathMapping] = jasmineTests.value

      // Select the correct tests to run
      val tests = if (selected.isEmpty) {
        availableTests
      } else {
        availableTests.collect {
          case (file, n) if selected(n) || selected(n.replaceAll("\\.js$", "")) =>
            (file,n)
        }
      }

      // Run them
      val (result, events) = jasmineTestTask.value(tests)
      testResultLogger.run(streams.value.log, Tests.Output(result, events, Nil), "")
    }
  ) ++ Defaults.testTaskOptions(jasmine)


  /**
    * This is a task that produces a function that will take the test files to run, and then run it.
    *
    * The purpose for this is to allow easily factoring out all the common code from mocha and mocha-only, while still
    * taking advantage of the SBT macros.  Since the tests to be run can't be determined in a task in the case of
    * mocha-only, since they come from the command line input of that particular run, a function is the most convenient
    * way to do this.
    */
  private val jasmineTestTask: Def.Initialize[Task[Seq[PathMapping] => (TestResult.Value, Map[String, SuiteResult])]] = Def.task {
    { (tests: Seq[PathMapping]) =>

      val workDir: File = (assets in TestAssets).value

      // One way of declaring dependencies
      (nodeModules in Plugin).value
      (nodeModules in Assets).value
      (nodeModules in TestAssets).value

      val modules = (
        (nodeModuleDirectories in Plugin).value ++
          (nodeModuleDirectories in Assets).value ++
          (nodeModuleDirectories in TestAssets).value
        ).map(_.getCanonicalPath)


      val options = SbtJasmineOptions((logLevel in jasmine).value.toString, parseJasmineConfig().value)

      val specDir = workDir.relativeTo(baseDirectory.value).getOrElse(throw new IllegalStateException)
      println(s"spec dir $specDir")
      val args = Args(tests, specDir, options)

      import scala.concurrent.duration._
      val results = SbtJsTask.executeJs(
        state = state.value,
        engineType = (engineType in jasmine).value,
        command = (command in jasmine).value,
        nodeModules = modules,
        shellSource = (shellSource in jasmine).value,
        args = args.toSeq,
        100.days)

      val listeners = (testListeners in(Test, jasmine)).value

      results.headOption.map { jsResults =>
        new TestReporter(workDir, listeners).logTestResults(jsResults)
      }.getOrElse((TestResult.Failed, Map.empty[String, SuiteResult]))
    }
  }

  def parseJasmineConfig() = Def.task {

    def removeComments(string: String) = {
      JsonCleaner.minify(string)
    }

    def parseJson(file: File): JsValue = {
      val content = IO.read(file)
      JsonParser(removeComments(content))
    }

    parseJson((jasmineConfigFile in jasmine).value).asJsObject
  }
}


case class Args(testFiles: Seq[PathMapping], testFilesDir:File, options: SbtJasmineOptions) {
  def toSeq = Seq(JsArray(testFiles.map{case (_, relativePath) => JsString(relativePath)}.toVector).toString, JsString(testFilesDir.getPath).toString(), options.toString())
}

case class SbtJasmineOptions(logLevel: String, jasmineConfig: JsObject) {
  override def toString: String = JsObject("logLevel" -> JsString(logLevel), "jasmineConfig" -> jasmineConfig).toString()
}