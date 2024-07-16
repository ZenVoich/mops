export function getDepName(name : string) : string {
	return name.split('@')[0] || '';
}