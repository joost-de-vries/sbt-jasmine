
lazy val root = (project in file(".")).enablePlugins(SbtWeb)

JsEngineKeys.engineType := JsEngineKeys.EngineType.Node

libraryDependencies ++= Seq(
 // "org.webjars.npm" % "types__jasmine" % "2.4.1"
)
dependencyOverrides += "org.webjars.npm" % "glob" % "7.0.5"

jasmineFilter in jasmine := GlobFilter("*Test.js") | GlobFilter("*Spec.js") | GlobFilter("*.spec.js")
logLevel in jasmine := Level.Info