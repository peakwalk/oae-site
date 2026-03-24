# Asset Layout

Active assets are organized by responsibility:

- `css/`: ordered style layers that are still loaded through `scss/site.scss`
- `images/`: runtime image assets grouped by semantics
- `js/`: runtime scripts for shared site behavior
- `scss/`: Sass source for the active site styles

Image conventions for the active public site:

- `images/favicons/`: browser favicon assets
- `images/brand/`: brand logos
- `images/icons/`: shared UI icons
- `images/decorations/`: non-brand decorative assets
- `images/pages/home/`: homepage-specific artwork

When adding new assets, prefer semantic names and avoid reintroducing template-origin names such as `homepage2` or `template`.
