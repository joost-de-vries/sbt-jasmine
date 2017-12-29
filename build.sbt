import sbt.CrossVersion
import sbt.Keys.crossSbtVersions

sbtPlugin := true
organization := "name.de-vries"
name := "sbt-jasmine"
version := "0.0.5"


scalaVersion := (CrossVersion partialVersion sbtCrossVersion.value match {
  case Some((0, 13)) => "2.10.6"
  case Some((1, _))  => "2.12.3"
  case _             => sys error s"Unhandled sbt version ${sbtCrossVersion.value}"
})

crossSbtVersions := Seq("0.13.16", "1.0.4")

val sbtCrossVersion = sbtVersion in pluginCrossBuild
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

addSbtPlugin("com.typesafe.sbt" % "sbt-js-engine" % "1.2.2")
addSbtPlugin("com.typesafe.sbt" % "sbt-web" % "1.4.3")

scriptedLaunchOpts +=   s"-Dproject.version=${version.value}"
scriptedLaunchOpts += "-XX:MaxPermSize=256m"

// Publish settings
publishMavenStyle := false
bintrayRepository in bintray := "sbt-plugins"
bintrayOrganization in bintray := None
bintrayVcsUrl := Some("git@github.com:joost-de-vries/sbt-jasmine.git")
homepage := Some(url("https://github.com/joost-de-vries/sbt-jasmine"))
licenses +=("Apache-2.0", url("http://www.apache.org/licenses/LICENSE-2.0"))


