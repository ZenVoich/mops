import {test; suite; skip} "mo:test";
import Fuzz "mo:fuzz";
import {MINUTE; HOUR; DAY} "mo:time-consts";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Prim "mo:prim";

import DownloadLog "../backend/main/download-log";

let fuzz = Fuzz.Fuzz();
let downloadLog = DownloadLog.DownloadLog();

suite("populate", func() {
	test("add 100 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 100 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add more than 10 days old record for 'pkg1", func() {
		downloadLog.add({
			time = Time.now() - 10 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 6 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 6 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 4 days old records for 'pkg1' version 2.0.0", func() {
		downloadLog.add({
			time = Time.now() - 4 * DAY;
			name = "pkg1";
			version = "2.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 1 day old record for 'pkg2'", func() {
		downloadLog.add({
			time = Time.now() - 1 * DAY;
			name = "pkg2";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 40 minutes old record for 'pkg2'", func() {
		downloadLog.add({
			time = Time.now() - 40 * MINUTE;
			name = "pkg2";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 40 minutes old record for 'pkg2'", func() {
		downloadLog.add({
			time = Time.now() - 40 * MINUTE;
			name = "pkg2";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 40 minutes old record for 'pkg2'", func() {
		downloadLog.add({
			time = Time.now() - 40 * MINUTE;
			name = "pkg2";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 35 minutes old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 35 * MINUTE;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("take snapshots", func() {
		// first snapshot is always taken
		downloadLog.takeSnapshotsIfNeeded();
	});

	test("add 30 minutes old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 30 * MINUTE;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});
});

func check(name: Text) = suite(name, func() {
	skip("check total download snapshots", func() {
		let snapshots = downloadLog.getDownloadTrend();
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 9;
	});

	test("check download snapshots of all packages", func() {
		let snapshots = downloadLog.getDownloadTrend();
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 5;
	});

	test("check daily snapshots by package name for pkg1", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageName("pkg1");
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 1;
	});

	test("check daily snapshots by package name for pkg2", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageName("pkg2");
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 4;
	});

	test("check daily snapshots by package name for pkg2 with 0 downloads", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageId("lib@2.0.0");
		assert snapshots.size() == 0;
	});

	test("check daily snapshots by name for unknown package", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageName("lib");
		assert snapshots.size() == 0;
	});

	test("check daily snapshots by id for unknown package", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageId("lib@2.0.0");
		assert snapshots.size() == 0;
	});

	test("check total package downloads", func() {
		assert downloadLog.getTotalDownloadsByPackageName("pkg1") == 6;
		assert downloadLog.getTotalDownloadsByPackageId("pkg1@1.0.0") == 5;
		assert downloadLog.getTotalDownloadsByPackageId("pkg1@2.0.0") == 1;

		assert downloadLog.getTotalDownloadsByPackageName("pkg2") == 4;
		assert downloadLog.getTotalDownloadsByPackageId("pkg2@1.0.0") == 4;
		assert downloadLog.getTotalDownloadsByPackageId("pkg2@2.0.0") == 0;

		assert downloadLog.getTotalDownloadsByPackageName("lib") == 0;
		assert downloadLog.getTotalDownloadsByPackageId("lib@2.0.0") == 0;
	});

	test("getDownloadsByPackageNameIn", func() {
		assert downloadLog.getDownloadsByPackageNameIn("pkg1", 1 * DAY + 100) == 2;
		assert downloadLog.getDownloadsByPackageNameIn("pkg1", 2 * DAY) == 2;

		assert downloadLog.getDownloadsByPackageNameIn("pkg2", 1 * DAY + 100) == 4;
		assert downloadLog.getDownloadsByPackageNameIn("pkg2", 2 * DAY) == 4;

		assert downloadLog.getDownloadsByPackageNameIn("lib", 1 * DAY) == 0;
		assert downloadLog.getDownloadsByPackageNameIn("lib", 365 * DAY) == 0;
	});

	test("getMostDownloadedPackageNames", func() {
		assert downloadLog.getMostDownloadedPackageNames() == ["pkg1", "pkg2"];
	});

	test("getMostDownloadedPackageNamesIn", func() {
		assert downloadLog.getMostDownloadedPackageNamesIn(1 * DAY) == ["pkg1", "pkg2"];
		assert downloadLog.getMostDownloadedPackageNamesIn(2 * DAY) == ["pkg2", "pkg1"];
	});
});

check("check before upgrade");

test("upgrade", func() {
	downloadLog.loadStable(downloadLog.toStable());
});

check("check after upgrade");