---
title: Bindersnap
blurb: Production policy and procedure management software for small healthcare providers. Every approved version carries a permanent, exportable record of who reviewed and signed off on it.
kind: Product
category: tools
year: '2023 — present'
stack: ['TypeScript', 'React', 'Bun', 'Gitea']
highlight: Live at app.bindersnap.com. $39 per writer per month, with reviewers and readers always free
featured: true
order: -1
links:
  - label: bindersnap.com
    href: https://bindersnap.com
  - label: Start a free trial
    href: https://app.bindersnap.com/-/signup
  - label: Help center
    href: https://bindersnap.com/help
product:
  url: https://bindersnap.com
  applicationCategory: BusinessApplication
  audience: Small healthcare providers
  price: '39'
  priceUnit: Per writer per month. Reviewers and readers are free. 14-day free trial with no card required.
  featureList:
    - Versioned policies and procedures with an immutable approval history
    - Review and sign-off workflow for every change
    - Upload and version Word and PDF documents as they are
    - Built-in policy editor
    - Exportable audit packets for surveyors
    - Role-based access for writers, reviewers and readers
    - Approval history stays readable even after a subscription ends
---

[Bindersnap](https://bindersnap.com) is policy and procedure management software
for small healthcare providers: clinics, ambulatory surgery centers, home health
agencies, hospices, behavioral health programs and rural health clinics. It is
live in production at [app.bindersnap.com](https://app.bindersnap.com), with
public pricing, a self-serve 14-day trial and a full
[help center](https://bindersnap.com/help).

## The problem

Most small providers run policy approvals through Word, email and a shared
drive. That works until a surveyor asks which version of a policy was in effect
and who approved it. The answer then sits in an inbox, or in a file called
`IC_Policy_FINAL_APPROVED_Mar14.docx`, or nowhere at all.

Enterprise policy platforms solve this, but they are priced and built for
hospital systems. Bindersnap gives a compliance or operations lead at a
20-person agency the same guarantee: the current approved version of every
policy, and a complete record of who signed off on it, on one page.

## What it does

- **Every change is reviewed.** An approved policy cannot be edited in place.
  A change becomes a new version that goes through review and sign-off before
  it replaces the old one.
- **The record is permanent.** Each published version keeps its approvers,
  dates and comments, and the full history exports as a PDF audit packet years
  later.
- **It works with the documents you already have.** Word and PDF files upload
  and version as they are. New policies can be written in Bindersnap's own
  editor. Nothing forces a Word file into a new format.
- **Pricing that fits a small team.** Writers are $39 a month each. Reviewers
  and readers are free, so the whole staff can read current policy without
  adding seats.
- **Your history is yours.** If an organization stops paying, it loses editing,
  never access to its own approval history.
- **No patient data.** Bindersnap stores policies and approvals, not PHI. The
  [security page](https://bindersnap.com/legal/security) and
  [privacy policy](https://bindersnap.com/legal/privacy) say exactly what is
  stored.

## How it is built

The audit trail is the product, so the architecture is built around making it
trustworthy.

- **Git as the system of record.** Each binder is a repository in
  [Gitea](https://about.gitea.com). A change is a pull request, a review is a
  pull request review, and each published version is a tag. Documents,
  versions, approvals and comments are git objects rather than database rows,
  so the evidence is the same data the approval rules were enforced on. Users
  never see any of it.
- **Typed configuration in SQLite.** Organization settings, membership and
  billing live in migrated tables, so questions that span hundreds of
  documents are one query.
- **Credentials never reach the browser.** A Bun API owns authentication and
  keeps each user's repository token server-side behind an `HttpOnly` cookie.
  The React app talks only to that API.
- **Simple, reproducible infrastructure.** The API and Gitea run under Docker
  Compose on AWS EC2, configured by pyinfra on every push. The app and the
  public site are static builds served from Cloudflare's edge.
- **Fast on a phone.** The landing page reaches largest contentful paint in
  2.4 s on mobile Lighthouse with 0 ms of blocking time, and the sign-in page
  loads 41 KB of code instead of 478 KB.

## Recent work

This fall Bindersnap shipped a [full redesign](/blog/bindersnaps-new-look): a
warm visual identity with WCAG AA contrast enforced in CI, separate addresses
for the marketing site and the app, and a public library of guides. That
library includes pages for
[each type of provider](https://bindersnap.com/for/home-health-agencies),
answers to common
[regulatory questions](https://bindersnap.com/requirements/how-often-to-review-policies),
free [policy templates](https://bindersnap.com/templates/policy-review-and-approval),
and comparisons with
[PowerDMS](https://bindersnap.com/compare/powerdms-alternative),
[PolicyTech](https://bindersnap.com/compare/policytech-alternative) and
[PolicyStat](https://bindersnap.com/compare/policystat-alternative).

## Get started

[Start a 14-day trial](https://app.bindersnap.com/-/signup) with no card
required, or read
[moving your policy manual in](https://bindersnap.com/help/getting-started) to
see what the first afternoon looks like. Pricing is on the
[public pricing page](https://bindersnap.com/pricing).
