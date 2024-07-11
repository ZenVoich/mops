import mopsSvg from './mops.svg.js';


// Create a class for the element
class MyCustomElement extends HTMLElement {
	static observedAttributes = ['color', 'size'];

	constructor() {
		// Always call super first in constructor
		super();
	}

	_isActive(url) {
		return window.location.href.startsWith(url) ? 'active' : '';
	}

	connectedCallback() {
		let shadow = this.attachShadow({mode: 'open'});
		shadow.innerHTML = `
			<style>
				:host {
					display: flex;
					gap: 30px;
				}
				svg {
					width: 75px;
					height: 75px;
				}
				nav {
					display: flex;
					gap: 10px;
					align-items: center;
				}
				a {
					text-decoration: none;
					color: black;
					padding: 12px 14px;
					font-weight: 500;
					border-radius: 5px;
				}
				a.active {
					// color: #7c8659;
					background-color: #f1f1f1;
					font-weight: 700;
				}
				a:hover {
					background-color: #f0f0f0;
				}
			</style>
			${mopsSvg}
			<nav>
				<a href="https://mops.one" class="active ${this._isActive('https://mops.one')}">Packages</a>
				<a href="https://docs.mops.one" class="${this._isActive('https://docs.mops.one')}">Docs</a>
				<a href="https://cli.mops.one" class="${this._isActive('https://cli.mops.one')}">CLI</a>
				<a href="https://blog.mops.one" class="${this._isActive('https://blog.mops.one')}">Blog</a>
			</nav>
		`;
	}
}

customElements.define('mops-navbar', MyCustomElement);