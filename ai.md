# Notes for AI assistants working in this repo

House rules for anything written here by an AI. Not deployed with the site.

## Never use em dashes

No em dashes. Not in page copy, not in code comments, not in commit messages,
not in pull request descriptions, not in documentation. The character is `—`,
U+2014, and `&mdash;` is the same thing in HTML.

**Rewrite the sentence, do not substitute another dash.** Swapping in ` - ` or
an en dash misses the point and usually reads worse. Work out what the dash was
doing and use the punctuation that actually does that job:

| The dash was doing this | Use instead |
| --- | --- |
| Introducing an explanation or a list | A colon |
| Wrapping an aside | Commas, or parentheses |
| Joining two related statements | A semicolon, or two sentences |
| Separating a label from its description | A colon |

Some examples from when this rule was applied to the repo:

```
before  make LittleLink work—it uses the bare essentials
after   make LittleLink work, it uses the bare essentials

before  answered that request — the API — not this page's own hosting
after   answered that request (the API), not this page's own hosting

before  location derived from that address by the provider &mdash; country, region, city
after   location derived from that address by the provider: country, region, city
```

### Two things that are not prose

A dash used as a **"no value" placeholder** in a table is a UI element, not
punctuation. Write `n/a` instead. The debug page does this in every table cell
and in the JavaScript fallbacks behind them.

**Other characters are fine.** The arrow in `iad1 → cle1 → abc` on the debug
page is not a dash and should stay; `iad1 to cle1 to abc` reads worse. Hyphens
in compound words are not dashes either.

### Checking

```bash
grep -rn -e '—' -e '&mdash;' . | grep -v '/.git/' | grep -v node_modules | grep -v '^./ai.md'
```

Should return nothing. Run it before committing anything you wrote.

This file is excluded from that search because it is the one place the
character legitimately appears: naming it and showing what not to write.
Nowhere else in either repo should match.
