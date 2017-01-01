"use strict";
console.log("running bar");
describe("A suite bar", function () {
    it("contains bar spec 1 with an expectation", function () {
        expect(true).toBe(true);
    });
    it("contains bar spec 2 with an expectation", function () {
        expect(true).toBe(false);
    });
});
