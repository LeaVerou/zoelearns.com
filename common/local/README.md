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

You can also provide options.
Here, every option is set to its default value:

```js
mixins: [
	local({
		paths: ["answers", "settings.max"],

		// Options for Vue’s watcher
		deep: true,
		immediate: false,

		// localStorage key prefix
		prefix: location.pathname !== "/" ? location.pathname.slice(1).replace(/\/?$/, "/") : "",

		// Delete if equal to this value
		emptyValue: undefined,
	})
],
```

To provide different options per property, just create multiple instances of the mixin.

