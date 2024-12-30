# Settings mixin

This mixin provides a way to manage settings that are automatically stored and reloaded.

To use:

First, import its default export:

```js
import settings from "../common/settings/index.js";
```

Then, add it as a Vue mixin:

```js
mixins: [
	settings
],
```

2. In your data, you can use a `default_settings` object to provide default settings, if any (a `settings` object with the current settings will be created by the mixin)

You can use a dialog like that:

```html
<dialog id="settings" :open="show_settings">
	<h2>Settings
		<button class="close" @click="show_settings = false"></button>
	</h2>
	<label>
		Foo:
		<input type="range" v-model="settings.foo">
	</label>
</dialog>
```

And a toggle like that:

```html
<button class="show-settings" @click="show_settings = true"></button>
```

Optionally, you could also use the styles in `settings/style.css` to provide styles for these.
