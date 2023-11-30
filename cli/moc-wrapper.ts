#!/usr/bin/env tsx

import {ExecException, execSync} from 'child_process';

try {
	execSync('/home/zen/.cache/mocv/versions/current/moc ' + process.argv.slice(2).join(' '), {cwd: process.cwd(), stdio: 'inherit'});
}
catch (err: unknown) {
	process.exit((err as ExecException).code || 1);
}