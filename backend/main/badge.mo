import Nat "mo:base/Nat";

module {
	public func mops(version : Text) : Text {
		let title = "mops: " # version;
		let key = "mops";
		let val = version;
		let valTextLength = Nat.toText(65 * val.size());

"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"110\" height=\"20\" role=\"img\" aria-label=\"" # title # "\">
<title>" # title # "</title>
<linearGradient id=\"s\" x2=\"0\" y2=\"100%\">
<stop offset=\"0\" stop-color=\"#bbb\" stop-opacity=\".1\"/>
<stop offset=\"1\" stop-opacity=\".1\"/>
</linearGradient><clipPath id=\"r\">
<rect width=\"110\" height=\"20\" rx=\"3\" fill=\"#fff\"/></clipPath><g clip-path=\"url(#r)\">
<rect width=\"50\" height=\"20\" fill=\"#555\"/>
<rect x=\"50\" width=\"60\" height=\"20\" fill=\"#007ec6\"/><rect width=\"110\" height=\"20\" fill=\"url(#s)\"/></g>
<g fill=\"#fff\" text-anchor=\"middle\" font-family=\"Verdana,Geneva,DejaVu Sans,sans-serif\" text-rendering=\"geometricPrecision\" font-size=\"110\">
<text aria-hidden=\"true\" x=\"245\" y=\"150\" fill=\"#010101\" fill-opacity=\".3\" transform=\"scale(.1)\" textLength=\"350\">" # key # "</text>
<text x=\"245\" y=\"140\" transform=\"scale(.1)\" fill=\"#fff\" textLength=\"350\">" # key # "</text>
<text aria-hidden=\"true\" x=\"770\" y=\"150\" fill=\"#010101\" fill-opacity=\".3\" transform=\"scale(.1)\" textLength=\"" # valTextLength # "\">" # val # "</text>
<text x=\"770\" y=\"140\" transform=\"scale(.1)\" fill=\"#fff\" textLength=\"" # valTextLength # "\">" # val # "</text></g></svg>";
	};
};