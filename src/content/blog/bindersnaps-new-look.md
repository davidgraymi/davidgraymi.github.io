---
title: "Bindersnap's new look, and why most of it isn't color"
description: Bindersnap now has a warm redesign, its own home at bindersnap.com, the app at app.bindersnap.com, and a landing page that paints in 2.4 s on a phone.
pubDate: 2026-10-22
tags: ['bindersnap', 'design', 'web-performance', 'healthcare', 'product']
project: bindersnap
---

The filename that started all of this was something like
`IC_Policy_FINAL_APPROVED_Mar14.docx`. If you have worked at a small clinic,
hospice or home health agency, you have met its cousins. Somewhere there is a
`_v2`, a `_FINAL_final`, and a version someone emailed to the administrator
for sign-off that nobody can find again.

[Bindersnap](https://bindersnap.com) is my answer to that file. This month it
got a new look, a new address for the app, and a public site with real pages
on it. Here is what changed, and why most of it is not about color.

## What Bindersnap is now

Bindersnap is policy and procedure management for small healthcare providers.
Each policy keeps its current approved version and a record of who signed off
on it, so when a surveyor asks which version was approved, the answer is on
the page. Writers pay $39 a month each. Reviewers and readers cost nothing,
and every organization starts with a 14-day trial with no card.

That is narrower than how I used to describe it. The
[old write-up](/work/bindersnap) called it "GitHub for everyone who doesn't
use GitHub", which was true and helped nobody decide whether to try it. The
people who feel this problem most are compliance and operations leads at small
providers. They run approvals through Word, email and a shared drive today,
and they have been asked "which version did we approve?" without a good
answer. The redesign is built for that one person.

## The look: warm, on purpose

Compliance software usually looks like it was designed to survive a
procurement review. Gray tables, blue buttons, a dashboard of things you are
late on. The person using it is already stressed. The interface should not
add to it.

So the new identity goes the other way:

- **Type.** Lora, a serif, for headlines. Geist for body text and UI. Geist
  Mono for labels, dates and version numbers. Three faces and no fourth.
- **Color.** Warm paper backgrounds, a near-black ink, one coral accent and one
  green for approved states. Coral is rationed to one call to action per
  section.
- **Dark mode is designed, not inverted.** Four warm-ink surface steps mirror
  the four paper steps in light mode.
- **Contrast is measured, not eyeballed.** The brand coral, `#e85d26`, is only
  3.49:1 against white, which fails WCAG AA for text. So coral is for fills
  and borders, and coral *text* uses a darker token that passes in both
  themes. That rule caught every form label in the sign-in page, which had
  been quietly failing.

The landing page's headline sums up the tone better than I can:

> The surveyor asks which version you approved. Show them.

When I audited the design system in August it scored 57 out of 100. The
tokens were in good shape and everything built on top of them was not. The
work since then has been unglamorous: a status color ramp, contrast fixes,
token cleanup, and tests in CI that fail when someone hardcodes a hex value.
None of that shows up in a screenshot. All of it shows up the third time you
add a screen.

## Two addresses instead of one

Until this month the marketing site and the app shared one origin. That meant
every marketing page took a word an organization could not use as its name,
and anything on the landing page also loaded for signed-in customers.

Now they are separate:

- **[bindersnap.com](https://bindersnap.com)** is the public site: the landing
  page, pricing, help and legal pages, and the guides below.
- **[app.bindersnap.com](https://app.bindersnap.com)** is the app itself.
  [Start a trial](https://app.bindersnap.com/-/signup) or
  [sign in](https://app.bindersnap.com/-/login) there.

Each is a static build served from Cloudflare. Old links into the app
redirect, and a missing page on the public site stays a 404 instead of
quietly opening the app.

## It had to be fast on a phone

A compliance lead is not always at a desk. The first mobile Lighthouse run of
the new landing page found no largest contentful paint at all, and a first
paint at 4.7 s. The page sat invisible until a 441 KB bundle had loaded and
run. That bundle was React plus an icon library, and it was there to draw 30
icons.

The fix was to stop doing that:

- The 30 icons became inline SVG. The landing page's script went from 441 KB
  to 1.9 KB.
- Nothing hides the page while it waits for a script.
- Fonts preload with the page, and hashed bundles are cached for a year.

Locally, mobile Lighthouse went to performance 95, with first and largest
paint at 2.4 s and 0 ms of blocking time. The sign-in page got the same
treatment: the code it needs dropped from 478 KB to 41 KB, because the rest
of the workspace now loads only after you are signed in.

## A public library, not just a pitch

The part of the redesign I expect to matter most is the least visual. The
public site now answers the questions people actually search for before they
are ready to buy anything. Every page is plain HTML with nothing to run, has a
Markdown copy, and is listed in the sitemap.

**[The help center](https://bindersnap.com/help)** walks through the product
for someone who has never used version control:

- [Moving your policy manual in](https://bindersnap.com/help/getting-started)
- [How a change becomes the record](https://bindersnap.com/help/approvals)
- [Reviewing a change](https://bindersnap.com/help/reviewing)
- [PDF, Word and the audit packet](https://bindersnap.com/help/exporting)
- [People and who can do what](https://bindersnap.com/help/people)

**Pages for each kind of provider**, because a hospice and an ambulatory
surgery center answer to different rules:
[home health agencies](https://bindersnap.com/for/home-health-agencies),
[hospices](https://bindersnap.com/for/hospices),
[ambulatory surgery centers](https://bindersnap.com/for/ambulatory-surgery-centers),
[behavioral health programs](https://bindersnap.com/for/behavioral-health),
[rural health clinics](https://bindersnap.com/for/rural-health-clinics) and
[medical practices](https://bindersnap.com/for/medical-practices).

**Requirements, answered**, for the questions that come up before a survey:

- [How often must healthcare policies be reviewed?](https://bindersnap.com/requirements/how-often-to-review-policies)
- [Who has to approve healthcare policies?](https://bindersnap.com/requirements/who-approves-policies)
- [How long must you keep old versions of policies?](https://bindersnap.com/requirements/how-long-to-keep-old-policies)

**Free templates and tools** you can use without signing up, including a
[policy on policies template](https://bindersnap.com/templates/policy-review-and-approval),
a [hand hygiene policy template](https://bindersnap.com/templates/hand-hygiene-policy),
an [emergency preparedness policy template](https://bindersnap.com/templates/emergency-preparedness-policy)
and a [required healthcare policies checklist](https://bindersnap.com/tools/required-policies-checklist).

**Honest comparisons**, starting with the one most people are actually
choosing between:
[policy software vs. a shared drive](https://bindersnap.com/compare/shared-drive).
There are also pages on
[PowerDMS](https://bindersnap.com/compare/powerdms-alternative),
[PolicyTech](https://bindersnap.com/compare/policytech-alternative) and
[PolicyStat](https://bindersnap.com/compare/policystat-alternative).

**A glossary** for the vocabulary surveyors use, from
[controlled document](https://bindersnap.com/glossary/controlled-document) to
[plan of correction](https://bindersnap.com/glossary/plan-of-correction) and
[survey readiness](https://bindersnap.com/glossary/survey-readiness).

[Pricing](https://bindersnap.com/pricing) is a public page with the number on
it. The [security page](https://bindersnap.com/legal/security) and
[privacy policy](https://bindersnap.com/legal/privacy) say plainly what the
product stores, and Bindersnap holds no patient data at all.

## What is still hard

It is still a solo project. A rebrand does not change that, and the backlog
is longer than the list above. The pages are written, but nothing tells me
yet whether the right people will find them. That is the next thing to
measure.

What did change is that the product finally looks like it was made for the
person who has to answer the surveyor, not for the engineer who built it. If
that person is you, or you know them, [the trial is
here](https://app.bindersnap.com/-/signup) and the
[getting started guide](https://bindersnap.com/help/getting-started) shows
how to move a policy manual in.
