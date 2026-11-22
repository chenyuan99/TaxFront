## Context

TaxFront currently links to IRS forms. The legacy Python filler was removed.

## Goals / Non-Goals

Support draft PDF output for verified IRS templates. Return submission is outside the change scope.

## Decisions

Maintain an explicit map from supported form and tax year to a verified IRS template and known field names. Generate a new PDF per request using confirmed user input. Check field values and rendered appearances across every populated page. Fail explicitly when a template or field mapping is unavailable.

## Risks / Trade-offs

IRS field names and layouts change between revisions. Every supported template needs a synthetic multipage read-back and appearance check before release.
