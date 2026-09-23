# Integration notes (live Studio)

Unlike `tests/direct/`, nothing here mocks the LLM or web fetch — these are
notes for exercising the real end-to-end flow against a live GenLayer Studio
deployment, using real `gl.nondet.exec_prompt`, `gl.nondet.web.render`, and
`gl.eq_principle.prompt_comparative` calls.

## Suggested live flow

1. Deploy `contracts/TreasuryReleaseCourt.py` via Studio with a short charter
   and a real, publicly reachable `https://` URL you control (e.g. a GitHub
   Pages page or a Gist raw URL) so the jury has something genuine to fetch.
2. Fund with a second Studio account.
3. Submit one packet whose `source_url` clearly satisfies the charter, and
   (optionally) a second packet whose evidence does not, to sanity-check the
   jury correctly returns `NOT_DONE` when evidence is weak.
4. Freeze, then call `score_work` and confirm the verdict/score/reason in
   `get_verdicts()` matches what a human reviewer would conclude from the
   same evidence.
5. Update the source URL's content (without resubmitting a packet) and call
   `reread` from the appeal flow — the contract should still refuse if
   `freeze_submissions` locked a different `evidence_digest`, and should
   otherwise reread the *frozen* packet content, not whatever the live URL
   currently shows, since the digest is computed over packet fields, not
   fetched content.
6. Run the full appeal → reread → settle path with a genuinely borderline
   charter to observe real jury variance across validators, and confirm
   `eq_principle.prompt_comparative`'s tolerance (verdict must match exactly,
   score may differ by up to 10) holds in practice.

These are manual checks, not an automated suite — automating them would
require a live network and a funded faucet account in CI, which is out of
scope for the hackathon submission but is a natural next step.
