import {MMF1} from '../mmf1.js';

export interface Reporter {
	addFiles(files: string[]): void;
	addRun(file: string, mmf: MMF1, state: Promise<void>, wasiMode: boolean): void;
	done(): boolean;
}