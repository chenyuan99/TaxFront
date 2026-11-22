# Tax Filing

## Purpose

Describe the federal preparation workflow exposed by TaxFront.

## Requirements

### Requirement: Profile-based federal form guidance

TaxFront SHALL use the confirmed residency status for the saved tax year to display official federal form guidance.

#### Scenario: Confirmed residency

- **WHEN** the signed-in user's saved profile has a year and a confirmed residency status
- **THEN** the Tax Forms Guide links to Form 1040 for a citizen or resident alien and Form 1040-NR for a nonresident alien

#### Scenario: Exempt-individual days

- **WHEN** the saved profile records a claim for exempt-individual days for the tax year
- **THEN** the Tax Forms Guide also links to Form 8843

### Requirement: Countable presence days

The profile SHALL calculate the Substantial Presence Test using countable days entered for the selected tax year and two preceding years.

#### Scenario: Meeting both thresholds

- **WHEN** the current year has at least 31 countable days and the sum weighted at 1, 1/3, and 1/6 reaches 183
- **THEN** the profile indicates that the day-count thresholds are met and keeps confirmed residency as a separate selection

### Requirement: Document extraction and combined analysis

TaxFront SHALL process eligible uploads and provide a single dashboard action that returns separate accountant and auditor reports.

#### Scenario: Successfully processed upload

- **WHEN** extraction returns a valid document type, optional tax year, and field object
- **THEN** TaxFront records the result and makes the processing outcome available to the user

#### Scenario: Combined report

- **WHEN** an authenticated user requests tax analysis
- **THEN** the dashboard displays both reports and the accountant uses the selected filing status

### Requirement: Cross-form checklist

The auditor SHALL generate evidence-based checklist findings for documents in the supported review year and cite the corresponding upload or profile evidence.

#### Scenario: Gross compensation available without Schedule SE

- **WHEN** positive 1099-NEC compensation is present and there is no same-year Schedule SE upload
- **THEN** the auditor flags it for review using the net-earnings threshold and identifies the source document

#### Scenario: Interest and wage evidence

- **WHEN** a 1099-INT shows positive interest, or wages are indicated without a same-year W-2
- **THEN** the auditor identifies the evidence and flags the corresponding item for review

#### Scenario: Sole-proprietor income without Schedule C

- **WHEN** the uploads or matching-year profile indicate self-employment and the uploads do not include Schedule C for that year
- **THEN** the auditor flags Schedule C for review

#### Scenario: Excluded days without Form 8843

- **WHEN** the matching-year profile indicates exempt-individual days and the uploads do not include Form 8843 for that year
- **THEN** the auditor flags Form 8843 for review
