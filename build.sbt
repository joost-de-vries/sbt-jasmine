sbtPlugin := true
organization := "name.de-vries"
name := "sbt-jasmine"
version := "0.0.3"


scalaVersion := "2.10.6"
scalacOptions ++= Seq(
  "-feature",
  "-encoding", "UTF8",
  "-deprecation",
  "-unchecked",
  "-Xlint",
  "-Ywarn-dead-code",
  "-Ywarn-adapted-args"
)

libraryDependencies ++= Seq(
  "org.webjars.npm" % "jasmine" % "2.4.1"  // using 2.6.0 doesn't resolve correctly..
)

dependencyOverrides += "org.webjars.npm" % "glob" % "7.0.5"

addSbtPlugin("com.typesafe.sbt" % "sbt-js-engine" % "1.2.1")
addSbtPlugin("com.typesafe.sbt" % "sbt-web" % "1.4.1")

scriptedSettings
scriptedLaunchOpts <+= version apply { v => s"-Dproject.version=$v" }
scriptedLaunchOpts += "-XX:MaxPermSize=256m"

// Publish settings
publishMavenStyle := false
bintrayRepository in bintray := "sbt-plugins"
bintrayOrganization in bintray := None
bintrayVcsUrl := Some("git@github.com:joost-de-vries/sbt-jasmine.git")
homepage := Some(url("https://github.com/joost-de-vries/sbt-jasmine"))
licenses +=("Apache-2.0", url("http://www.apache.org/licenses/LICENSE-2.0"))


