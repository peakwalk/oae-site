## CSS Layers

Active CSS enters through `src/style.css` and is intentionally split into ordered layers:

1. `00-vendors.css`
   Third-party vendor styles that are not specific to OAE.
2. `01-plugins.css`
   Plugin styles such as animation helpers.
3. `10-template-base.css`
   The compiled Iori template baseline. This is still a large monolith and should be treated as an imported foundation layer, not the place for new OAE-specific changes.
4. `20-oae-custom.css`
   OAE-specific layout and component styles.
5. `90-legacy-overrides.css`
   Migrated legacy overrides that still depend on the template baseline.

`oae-unified.css` was removed because it duplicated the same layers in a single unused file and made it unclear which stylesheet was actually active.

## Cleanup Direction

- Keep new product-specific changes out of `10-template-base.css` when possible.
- Prefer moving OAE-specific styling into `20-oae-custom.css`.
- If the template base needs real splitting, do it from the original SCSS sources rather than manually carving up the compiled CSS.
