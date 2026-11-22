## ADDED Requirements

### Requirement: Year-specific draft PDF output

TaxFront SHALL generate a separate draft PDF from a verified form revision and confirmed filing inputs.

#### Scenario: Supported form and year

- **WHEN** the user confirms inputs for a supported form and tax year
- **THEN** TaxFront produces a separately downloadable PDF with the values visible on every applicable page and preserves the unmodified template

#### Scenario: Unsupported revision

- **WHEN** the selected form or year lacks a verified template or required field mapping
- **THEN** TaxFront gives a clear error and produces no populated draft
