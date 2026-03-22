## Style Layers

Active styles now enter through `src/assets/scss/site.scss` and are intentionally split into ordered layers:

1. `00-vendors.css`
   Third-party vendor styles that are not specific to OAE.
2. `01-plugins.css`
   Plugin styles such as animation helpers.
3. `10-template-base.scss`
   The trimmed Iori template baseline source. This replaces the old compiled `10-template-base.css` monolith and is the correct place to manage retained template partials.
4. `20-oae-custom.css`
   OAE-specific layout and component styles.
5. `90-legacy-overrides.css`
   Migrated legacy overrides that still depend on the template baseline.

`oae-unified.css` was removed because it duplicated the same layers in a single unused file and made it unclear which stylesheet was actually active.

## Cleanup Direction

- Keep new product-specific changes out of `10-template-base.scss` when possible.
- Prefer moving OAE-specific styling into `20-oae-custom.css`.
- If the template base needs more trimming, continue removing unused partials from `10-template-base.scss` rather than editing compiled output.
