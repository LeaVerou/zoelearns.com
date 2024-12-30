# Settings mixin

This mixin provides a way to manage settings that are automatically stored and reloaded.

To use:

1. Add its default export as a Vue mixin
2. In your data, you need a `default_settings` object with the default settings, if any (a `settings` object with the current settings will be created by the mixin)

Optionally, you could also use the styles in `settings/style.css` to provide a settings dialog and a toggle to show it.
1. Apply a class of `show-settings` to the toggle to get the default styling
2. Apply an id of `settings` to the dialog
