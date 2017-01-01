"use strict";
console.log("running foo");
describe("A suite foo", function () {
    it("contains foo spec with an expectation", function () {
        expect(true).toBe(true);
    });
    describe("As suit nested within foo", function() {
        it("contains nested foo spec with an expectation", function () {
            expect(true).toBe(true);
        });
    });
});