<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
   -->

# Network QA

L5 proves that a build contacts only the hosts in `docs/network-calls.md`.
Static grep is not enough: modules can build URLs at runtime.

## Setup

Use a **dedicated macOS user account or a VM**. The proxy certificate must be
trusted by the system, and you do not want that on your daily account.

1. Install mitmproxy (`brew install mitmproxy`).
2. Start it: `mitmproxy --listen-port 8080 --save-stream-file qa.flows`.
3. Trust the CA for the test account: run `mitmproxy` once, then
   `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/.mitmproxy/mitmproxy-ca-cert.pem`.
4. Launch the browser with a fresh profile and an explicit proxy so nothing
   bypasses it:

```sh
PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/qa-net.XXXXXX")"
cat > "${PROFILE}/user.js" <<'EOF'
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", 8080);
user_pref("network.proxy.ssl", "127.0.0.1");
user_pref("network.proxy.ssl_port", 8080);
user_pref("network.proxy.allow_hijacking_localhost", true);
user_pref("app.update.enabled", false);
user_pref("app.update.auto", false);
EOF
```

5. Remove the system CA and the proxy prefs when finished.

If the build uses DoH or a pinned connection, mitmproxy will show a failure
rather than plaintext. Record the host from the DNS layer too:
`log stream --predicate 'process == "zen"'` or `about:networking#dns`.

## Scenarios

Run each for at least 10 minutes, idle, with the listed pref state.

| # | Scenario | Pref state | Allowed hosts |
| --- | --- | --- | --- |
| N-01 | Fresh launch, idle | all new features off | Remote Settings, Safe Browsing (if keyed), nothing Zen-operated |
| N-02 | Open a page | — | The page's own hosts, plus Safe Browsing lookups |
| N-03 | Search | suggestions off | Search engine host only on submit |
| N-04 | Share UI opened | share disabled/empty | no request |
| N-05 | Mods installed, auto-update off | `zen.mods.auto-update=false` | no CDN request |
| N-06 | Live folder added | explicit user action | github.com or the feed host only |
| N-07 | Sync signed in | user action | Mozilla sync + identity hosts |
| N-08 | Update check | auto-update off | no AUS request |
| N-09 | Crash reporter | — | no upload (disabled at build) |
| N-10 | New tab | — | no sponsored/top-sites/telemetry hosts |

## Pass criteria

- Every observed host appears in `network-calls.md`, or the docs are updated in
  the same PR.
- No request is made on a path whose pref is off.
- No request contains page content, tab titles or history, except the page's
  own navigation and the search query on submit.
- The capture is attached to the QA record (`qa.flows` or a host list).

## Known gaps in M0

- No capture has been run; there is no built artifact yet.
- `about:telemetry` and `about:networking` checks require a running build.
- Determining whether Safe Browsing and location keys were compiled in requires
  inspecting the build log; a keyless build silently has fewer calls.
