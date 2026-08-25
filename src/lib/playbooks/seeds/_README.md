# Playbook seeds

One JSON file per service, named by the service `slug`. Loaded with
`node scripts/load-playbooks.js` (see the header of that script). Seeds always load
as **DRAFT** — approval happens only in the admin UI.

Shape (see `FulfillmentStep` and `ServiceRequirement` in `src/lib/types.ts`):

```json
{
  "slug": "ncr-registration",
  "playbookEntity": "company",
  "playbookOutputs": ["NCRCP registration number", "NCR certificate"],
  "playbookCommonFailures": ["..."],
  "informationToProvide": [ { "label": "...", "documentKind": "...", "inNameOf": "entity", "maxAgeDays": 90, "mustBeCertified": true, "aiHint": "..." } ],
  "fulfillmentChecklist": [ { "id": "...", "title": "...", "type": "collect|verify|calculate|draft_document|draft_client_message|email_submission|portal_filing|wait_external|deliver|manual|signoff", "owner": "agent|kevin|staff", "...": "..." } ]
}
```

`informationToProvide` rows are merged into the existing service rows by `id`, then by
case-insensitive `label`, so a seed can enrich existing rows (add `aiHint`, `inNameOf`…)
without duplicating them. Rows marked ⚠ in AI-ORDER-AGENT-PLAN.md §4 are guesses
until Kevin corrects them.
