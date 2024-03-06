#!/usr/bin/env sh

url="https://x344g-ziaaa-aaaap-abl7a-cai.icp0.io/versions/latest/cli.tgz"

uninstall() {
	echo "Uninstalling previous version"
	npm remove -g ic-mops &> /dev/null
	pnpm remove -g ic-mops &> /dev/null
	bun remove -g ic-mops &> /dev/null
}

install_with_npm() {
	echo "Installing mops with npm..."
	npm add -g --no-fund --no-audit $url || exit 1
}

install_with_pnpm() {
	echo "Installing mops with pnpm..."
	pnpm add -g $url || exit 1
}

install_with_bun() {
	echo "Installing mops with bun..."
	bun add -g $url || exit 1
}

# uninstall previous version
if command -v mops &> /dev/null; then
	uninstall
fi

# use specified package manager
if [[ $PM == "npm" ]]; then
	install_with_npm
elif [[ $PM == "pnpm" ]]; then
	install_with_pnpm
elif [[ $PM == "bun" ]]; then
	install_with_bun
# use the first package manager found
else
	if command -v npm &> /dev/null; then
		install_with_npm
	elif command -v pnpm &> /dev/null; then
		install_with_pnpm
	elif command -v bun &> /dev/null; then
		install_with_bun
	else
		echo "No Node.js package manager found. Please install npm, pnpm, or bun."
		exit 1
	fi
fi

GREEN='\033[0;32m'
NC='\033[0m'

echo "${GREEN}Installation complete${NC}"