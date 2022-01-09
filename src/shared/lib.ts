export const stringify = (json: unknown) => JSON.stringify(json, (key, value) => {
	if (typeof value === 'undefined')
		return '__UNDEFINED_UWU_EVIL__';
	else
		return value;
});

export const applyDiff = <T extends unknown>(a: unknown, b: unknown): T => {
	// @ts-ignore-line
	for (const [ key, value ] of Object.entries(b)) {
		if (typeof value === 'object') {
			// @ts-ignore-line
			if (!a[key]) a[key] = Array.isArray(value) ? [] : {}
			// @ts-ignore-line
			applyDiff(a[key], value)
		} else if (typeof value === 'undefined') {
			// @ts-ignore-line
			Array.isArray(a) ? a.splice(key, 1) : delete a[key]
		} else {
			// @ts-ignore-line
			a[key] = value
		}
	}
	// @ts-ignore-line
	return a
}

export const transformWeirdUndefineds = (object: unknown) => {
	if (typeof object !== 'object' || !object) return
	for (const [ key, value ] of Object.entries(object)) {
		if (value === '__UNDEFINED_UWU_EVIL__')
			// @ts-ignore-line
			object[key] = undefined
		else
			transformWeirdUndefineds(value)
	}
}