module {
	public func isLowerCaseLetter(char: Char): Bool {
		let letters = "abcdefghijklmnopqrstuvwxyz";
		for (letter in letters.chars()) {
			if (char == letter) {
				return true;
			}
		};
		return false;
	};
};