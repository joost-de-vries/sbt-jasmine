lazy val root = Project("plugins", file(".")).dependsOn(plugin)

lazy val plugin = file("../").getCanonicalFile.toURI

addSbtPlugin("net.virtual-void" % "sbt-dependency-graph" % "0.8.2")

resolvers ++= Seq(
  Resolver.sbtPluginRepo("releases"),
  Resolver.mavenLocal,
  Resolver.sonatypeRepo("releases"),
  Resolver.typesafeRepo("releases")
)