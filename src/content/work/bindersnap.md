---
title: Bindersnap
blurb: Policy and procedure management for small healthcare providers, where every approved version keeps a record of who signed off on it.
kind: Personal
category: tools
year: '2023 — present'
stack: ['TypeScript', 'React', 'Bun', 'Gitea']
highlight: Started because my wife complained about her company's policy platform
featured: true
order: 5
links:
  - label: bindersnap.com
    href: https://bindersnap.com
  - label: The app
    href: https://app.bindersnap.com
  - label: Help center
    href: https://bindersnap.com/help
---

My wife complained — repeatedly, correctly — about the policy management
platform at her work. Version control for documents is a solved problem, but the
solution is locked inside developer tooling that nobody outside engineering
would ever agree to use.

[Bindersnap](https://bindersnap.com) is that solution for the people who need it
most: compliance and operations leads at small healthcare providers. Clinics,
ambulatory surgery centers, home health agencies, hospices, behavioral health
programs. They run approvals through Word, email and a shared drive, and sooner
or later a surveyor asks which version of a policy was approved. Bindersnap
keeps each policy's current approved version and the record of who signed off
on it, so the answer is on the page.

## The constraint

The audit trail is the product, not a feature. An approved version cannot change
without a new, reviewable version, and the record has to be complete and
exportable years later. Whoever uses it has never opened a terminal and should
never need to.

## The decisions

- **Git underneath, with the git hidden.** Each binder is a repository in
  [Gitea](https://about.gitea.com). A change is a pull request, a review is a
  pull request review, and each published version is a tag. Documents,
  versions, approvals and comments are git objects, never database rows, so the
  evidence is the same thing the rules were enforced on.
- **Configuration in SQLite.** Names, settings and billing are typed, migrated
  tables. Git cannot answer a question that spans a hundred documents without a
  hundred calls.
- **The browser never sees a Gitea token.** A Bun API owns sign-in and keeps
  each person's token server-side behind an `HttpOnly` cookie. The React app
  only talks to that API.
- **Two workflows, kept apart.** Word and PDF files are uploaded and versioned
  as they are. Policies written in Bindersnap use its own editor, built on
  Tiptap. A Word file is never forced into the editor.
- **Boring hosting.** The API and Gitea run as Docker Compose on one EC2 host,
  configured by pyinfra on every push. The app at
  [app.bindersnap.com](https://app.bindersnap.com) and the public site are
  static files on Cloudflare.
- **Reading is never paywalled.** Writers pay $39 a month each, reviewers and
  readers are free. If an organization stops paying, it loses editing, never
  access to its own approval history.

The [new look](/blog/bindersnaps-new-look) came this fall: a warm visual
identity, a separate address for the app, and a landing page that paints in
2.4 s on a phone instead of sitting blank behind a 441 KB script. The
[help center](https://bindersnap.com/help) walks through it, starting with
[moving a policy manual in](https://bindersnap.com/help/getting-started).

## Status: honest version

It is still a solo side project and it does not get the love it deserves from
me. Grad school and a full-time job both have opinions about my evenings. The
plan is to eventually hire interns to handle sales and grind down a backlog I
will otherwise never reach.

What I would change: I spent too long describing it as "GitHub for everyone who
doesn't use GitHub." That was accurate and it helped nobody decide whether to
try it. Naming the one person it is for made every later decision easier, from
the copy down to which pages the public site needed.

It is the project that best shows how I think about product: find the group who
was told the good tool is not for them, and remove the reason.
