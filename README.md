sbt-jasmine [![Build Status](https://travis-ci.org/joost-de-vries/sbt-jasmine.png?branch=master)](https://travis-ci.org/joost-de-vries/sbt-jasmine)
=========

A plugin for running jasmine tests from a Play application or using sbt-web.

Add the plugin to `project/plugins.sbt`

    addSbtPlugin("name.de-vries" % "sbt-jasmine" % "0.0.4")
   
Put a `jasmine.json` file in your test assets directory. Either `test/assets` or `src/test/assets`. And put your jasmine tests in that same directory. 
   
See the `example` directory or the [play-angular-typescript](https://github.com/joost-de-vries/play-angular-typescript.g8) example application.

### Release notes
#### v0.0.4
- upgrade to sbt 1.0

#### v0.0.3
- downgrade to jasmine 2.4.1 because of strange npm dependency resolution problem

#### v0.0.2
- upgrades sbt-js-engine and sbt-web
- ugprades jasmine
- upgrades sbt
