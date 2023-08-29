import {test; suite; skip} "mo:test";
import Fuzz "mo:fuzz";
import {MINUTE; HOUR; DAY} "mo:time-consts";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Prim "mo:prim";

import DownloadLog "../backend/main/download-log";

let fuzz = Fuzz.Fuzz();
let downloadLog = DownloadLog.DownloadLog();

suite("download trend", func() {
	test("add 100 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 100 * DAY + 100;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("add 100 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 100 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("take snapshots", func() {
		downloadLog.takeSnapshotsIfNeeded(Time.now() - 100 * DAY);
	});

	test("add more than 10 days old record for 'pkg1", func() {
		downloadLog.add({
			time = Time.now() - 10 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("take snapshots", func() {
		downloadLog.takeSnapshotsIfNeeded(Time.now() - 10 * DAY);
	});

	test("add 6 days old record for 'pkg1'", func() {
		downloadLog.add({
			time = Time.now() - 6 * DAY;
			name = "pkg1";
			version = "1.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("take snapshots", func() {
		downloadLog.takeSnapshotsIfNeeded(Time.now() - 6 * DAY);
	});

	test("add 4 days old records for 'pkg1' version 2.0.0", func() {
		downloadLog.add({
			time = Time.now() - 4 * DAY;
			name = "pkg1";
			version = "2.0.0";
			downloader = fuzz.principal.randomPrincipal(1);
		});
	});

	test("take snapshots", func() {
		downloadLog.takeSnapshotsIfNeeded(Time.now() - 4 * DAY);
	});

	test("check download snapshots of all packages", func() {
		let snapshots = downloadLog.getDownloadTrend();
		assert snapshots.size() == 4;
		assert snapshots[0].downloads == 2;
		assert snapshots[1].downloads == 1;
		assert snapshots[2].downloads == 1;
		assert snapshots[3].downloads == 1;
	});
});