import {test; suite} "mo:test";
import Fuzz "mo:fuzz";
import {MINUTE; HOUR; DAY} "mo:time-consts";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Prim "mo:prim";

import DownloadLog "../backend/main/download-log";

let fuzz = Fuzz.Fuzz();
let downloadLog = DownloadLog.DownloadLog();

suite("populate", func() {
	test("add 10 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 10 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add more than 1 day old record for 'pkg1", func() {
		downloadLog.add({
			time = Time.now() - 45 * HOUR;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 22 hours old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 22 * HOUR;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 4 hours old records for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 4 * HOUR;
			name = "pkg1";
			version = "2.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 1 hour old record for 'pkg2'", func() {
		downloadLog.add({
			time = Time.now() - 1 * HOUR;
			name = "pkg2";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});
});

func check(name: Text) = suite(name, func() {
	test("take snapshots", func() {
		// first snapshot is always taken
		downloadLog.takeSnapshotsIfNeeded();
	});

	test("check daily snapshots", func() {
		let snapshots = downloadLog.getDownloadTrend();
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 5;
	});

	test("check daily snapshots by package name", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageName("pkg1");
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 2;
	});

	test("check daily snapshots by package id", func() {
		let snapshots = downloadLog.getDownloadTrendByPackageId("pkg1@2.0.0");
		assert snapshots.size() == 1;
		assert snapshots[0].downloads == 1;
	});

	test("check total downloads", func() {
		assert downloadLog.getTotalDownloadsByPackageName("pkg1") == 4;
		assert downloadLog.getTotalDownloadsByPackageId("pkg1@1.0.0") == 3;
		assert downloadLog.getTotalDownloadsByPackageId("pkg1@2.0.0") == 1;

		assert downloadLog.getTotalDownloadsByPackageName("lib") == 0;
		assert downloadLog.getTotalDownloadsByPackageId("lib@2.0.0") == 0;
	});

	test("getDownloadsByPackageNameIn", func() {
		assert downloadLog.getDownloadsByPackageNameIn("pkg1", 1 * DAY) == 2;
		assert downloadLog.getDownloadsByPackageNameIn("pkg1", 5 * HOUR) == 1;
		assert downloadLog.getDownloadsByPackageNameIn("pkg1", 1 * HOUR) == 0;

		assert downloadLog.getDownloadsByPackageNameIn("pkg2", 1 * HOUR) == 1;
		assert downloadLog.getDownloadsByPackageNameIn("pkg2", 1 * HOUR - 1) == 0;
		assert downloadLog.getDownloadsByPackageNameIn("pkg2", 59 * MINUTE) == 0;

		assert downloadLog.getDownloadsByPackageNameIn("lib", 1 * DAY) == 0;
		assert downloadLog.getDownloadsByPackageNameIn("lib", 365 * DAY) == 0;
	});

	test("getMostDownloadedPackageNames", func() {
		assert downloadLog.getMostDownloadedPackageNames() == ["pkg1", "pkg2"];
	});

	test("getMostDownloadedPackageNamesIn", func() {
		assert downloadLog.getMostDownloadedPackageNamesIn(10 * HOUR) == ["pkg1", "pkg2"];
		assert downloadLog.getMostDownloadedPackageNamesIn(2 * HOUR) == ["pkg2", "pkg1"];
	});
});

check("check before upgrade");

test("upgrade", func() {
	downloadLog.loadStable(downloadLog.toStable());
});

check("check after upgrade");