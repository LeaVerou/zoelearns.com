# Local storage mixin

This mixin provides a way to store application state to local storage and automatically retrieve it when the application is loaded.

To use:

First, import its default export:

```js
import local from "../common/local/index.js";
```

Then, add it as a Vue mixin, passing one or more strings as arguments to specify the names of the properties to store and any other settings:

```js
mixins: [
	local("answers", "settings.max"),
],
```

You can also provide options:
```js
mixins: [
	local({
		paths: ["answers", "settings.max"],
		deep: false, // true by default
		immediate: true, // false by default
		localStorageKey: "foo", // location.pathname.slice(1) by default
	})
],
```


