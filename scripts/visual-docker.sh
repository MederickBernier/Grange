#!/usr/bin/env bash
#
# Runs the visual tests inside the Playwright image, which is where the baselines come from.
#
# The screenshots in visual/__screenshots__ were taken in this container, so this is the script
# that agrees with them. `pnpm visual` runs the same tests against the host's own renderer, which
# is useful while working on a component and will differ on text.
#
# Arguments are passed through to `playwright test`, so `pnpm visual:docker --update-snapshots`
# rewrites the baselines and `--grep` narrows the run.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble"

# Run inside the container. Passed to bash as a script with the caller's arguments after it, so
# they arrive as "$@" rather than being spliced into a string.
INNER='
  set -euo pipefail
  # corepack enable needs a writable directory, and /usr/local/bin is not one for a non-root
  # user. The shim has to exist because several package scripts call pnpm themselves.
  mkdir -p /tmp/bin
  export PATH=/tmp/bin:$PATH
  corepack enable --install-directory /tmp/bin
  # No install: the host node_modules is mounted and its binaries are the same platform, and a
  # fresh store inside the container would mean re-downloading everything on every run. Run
  # `pnpm install` on the host first. CI installs in its own step instead, in this same image.
  pnpm build-storybook
  npx playwright test "$@"
'

docker run --rm --ipc=host \
  `# --user keeps what it writes owned by the caller, rather than leaving root-owned files` \
  --user "$(id -u):$(id -g)" \
  -v "$PWD":/work -w /work \
  -e CI="${CI:-}" -e HOME=/tmp -e XDG_CACHE_HOME=/tmp/.cache \
  `# the pinned pnpm is not in the image, and corepack otherwise stops to ask before fetching it` \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  "$IMAGE" \
  bash -c "$INNER" -- "$@"
