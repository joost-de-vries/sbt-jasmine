lazy val root = Project("plugins", file(".")).dependsOn(plugin)

lazy val plugin = RootProject(file("../").getCanonicalFile.toURI)

resolvers ++= Seq(
  Resolver.sbtPluginRepo("releases"),
  Resolver.mavenLocal,
  Resolver.sonatypeRepo("releases"),
  Resolver.typesafeRepo("releases")
)