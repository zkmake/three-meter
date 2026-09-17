# Changesets

Every user-facing change ships with a changeset: `bun run changeset`, pick the bump, describe it
for the CHANGELOG. On `main`, the release workflow turns pending changesets into a "Version
Packages" PR; merging that PR publishes to npm.
