import Debug "mo:base/Debug";
import {test; suite} "mo:test";

suite("main suite", func() {
	test("check canister status", func() {
		assert true;
	});

	test("nested suite something", func() {
		test("suite suite suite", func() {
			assert true;

			test("aaaaaaaaaaaa", func() {
				assert true;
			});
		});

		test("e qwe qwe qwe qwe qwe q asda sd asd asd asd asd asd", func() {
			assert true;
		});
	});
	// assert false;
	Debug.print("hello there");

	test("should fail to prevent something", func() {
		suite("dadas", func() {
			assert true;
		});

		suite("test that should fail", func() {
			assert false;
		});

		suite("this test should never run", func() {
			assert true;
		});
	});
});