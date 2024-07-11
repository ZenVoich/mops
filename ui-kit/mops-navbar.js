import mopsSvg from './mops.svg.js';

class MyCustomElement extends HTMLElement {
	_isActive(url) {
		if (url === 'https://mops.one' && window.location.href.includes('localhost')) {
			return 'active';
		}
		return window.location.href.startsWith(url) ? 'active' : '';
	}

	connectedCallback() {
		let shadow = this.attachShadow({mode: 'open'});
		shadow.innerHTML = `
			<style>
				:host {
					display: flex;
					align-items: center;
					gap: 30px;
				}
				svg {
					width: 52px;
					height: 52px;
					margin: -10px 0;
				}
				nav {
					display: flex;
					gap: 10px;
					align-items: center;
					line-height: 1;
					max-width: 60vw;
					overflow-x: auto;
				}
				a {
					text-decoration: none;
					color: black;
					padding: 12px 14px;
					font-weight: 500;
					border-radius: 5px;
				}
				a.active {
					font-weight: 700;
					border-bottom: 2px solid hsl(73deg 20% 44%);
					border-bottom-left-radius: 0;
					border-bottom-right-radius: 0;
				}
				a:hover {
					background-color: #f1f1f1;
				}
			</style>
			${mopsSvg}
			<nav>
				<a href="https://mops.one" class="${this._isActive('https://mops.one')}">Packages</a>
				<a href="https://docs.mops.one" class="${this._isActive('https://docs.mops.one')}">Docs</a>
				<a href="https://blog.mops.one" class="${this._isActive('https://blog.mops.one')}">Blog</a>
				<a href="https://cli.mops.one" class="${this._isActive('https://cli.mops.one')}">CLI releases</a>
			</nav>
		`;
	}
}

customElements.define('mops-navbar', MyCustomElement);