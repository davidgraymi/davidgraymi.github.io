# Brand voice

How this site sounds. Use it when writing a post, a project page, a card blurb,
a button, or an error message — and when asking an AI to draft any of those.

The voice is already in the best pages here: the About page, the 404, the
"Why I rebuilt this site" post and the Bindersnap write-up. This document names
what they have in common so new writing matches them.

---

## In one sentence

**An engineer explaining what actually happened — the constraint, the choice,
the number — to a peer I respect, with a dry joke when one is earned.**

## Who's reading

1. **Hiring managers and security/platform leads** deciding whether to talk to
   me. They skim, they're skeptical of adjectives, and they trust specifics.
2. **Engineers** who arrived from a search or a link. They want the technical
   meat and will notice hand-waving.
3. **People who know me** — friends, family, old teammates. They want to see the
   person, not the resume.

Write for the engineer. The hiring manager is persuaded by the same thing the
engineer is: evidence that I understand the work all the way down.

---

## Voice traits

| Trait | Means | Do | Don't |
| --- | --- | --- | --- |
| **Plainspoken** | Short words, concrete nouns, no marketing register. | "It worked. It had been working for years. That is exactly the problem." | "Leveraged cutting-edge technologies to deliver robust solutions." |
| **Specific** | Numbers, names, versions, file sizes. A claim without a figure is a weak claim. | "One `index.html` file, 41,000 characters long." / "10× faster integration test cycle." | "A large legacy codebase." / "Significantly improved performance." |
| **Honest about constraints** | Say what was hard, what I skipped, what's unfinished. Trade-offs are the interesting part. | "Status: honest version. It is a solo side project and it does not get the love it deserves." | Presenting every project as finished, polished and successful. |
| **Curious, to the bottom** | Explain *why*, not just *what*. Suspicious of magic. | "I'm suspicious of things I can't explain to the bottom." | Listing a stack without saying why each piece is there. |
| **Dry, not jokey** | Humor is understatement and a straight face, about once per piece. Never at the reader's expense. | "Segmentation fault (metaphorically)." / "Grad school and a full-time job both have opinions about my evenings." | Puns, exclamation marks, emoji, "wild", "mind-blowing", memes. |
| **Owns it** | First person, active voice, takes responsibility. | "Either I moved it, or something linked to an address that never did. Both are my problem, not yours." | "Mistakes were made." / "The page could not be found." |

### Spectrum

```
Formal    ●●●○○○○○○○  Casual        conversational, but complete sentences
Simple    ●●●●○○○○○○  Complex       plain words; technical terms used precisely, not decoratively
Serious   ●●●●●●○○○○  Playful       serious about the work, light about myself
Reserved  ●●●●●●○○○○  Expressive    feelings stated plainly, never performed
```

---

## Tone by context

The voice stays the same. The tone shifts with the job the words are doing.

| Context | Tone | Example |
| --- | --- | --- |
| **Hero / headlines** | Compressed, a little wry. Fewest possible words. | "Engineer. Scientist. Occasionally underwater." |
| **Section titles** | Plain claim, slightly personal. | "Things I've built, and what each one taught me" |
| **Project write-ups** | Constraint → decision → result → what I'd change. | "The interesting part of engineering is almost never the artifact. It is the constraint you were under and the thing you chose not to do." |
| **Technical posts** | Precise, shows the working, admits uncertainty. Measurements over opinions. | "Here is what I measured, on what hardware, and where I think the number is wrong." |
| **Personal posts** | Warm and specific; let the facts carry the emotion. | "I hadn't actively thought about that project in years." |
| **Services / consulting** | Confident and concrete. Say what I do now, not what I could do. | "Everything below is work I do now, not work I did once." |
| **Buttons & links** | Verb first, two or three words, says where it goes. | "See my work", "Get in touch", "Back home" |
| **Errors & empty states** | Own it, explain it, give a way out. One light touch allowed. | The 404 page. |
| **Meta descriptions** | One sentence, a fact plus a hook, under ~155 characters. | "The old site was a single 41,000-character index.html. Every change was archaeology." |

---

## Patterns that work

- **Lead with the concrete thing.** Open on a fact, a number or a moment, not a
  thesis. "The previous version of this site was one `index.html` file…"
- **Short sentence after a long one.** Use it to land the point. "It turned out
  there wasn't any."
- **Name the trade-off.** "I'd rather ship something smaller that I understand
  completely than something impressive that I'm holding by the handle."
- **Quote the requirement.** A one-line blockquote of the real goal is a strong
  anchor for a technical post.
- **End on what it means, not a summary.** The last paragraph should say why it
  mattered or what changed, never "In conclusion".
- **Credit people by name.** Teammates, the person who emailed, the person who
  complained. It's honest and it reads as confident.

## Words to avoid

| Avoid | Use instead |
| --- | --- |
| leverage, utilize | use |
| robust, cutting-edge, innovative, world-class, seamless | say what it actually does, or cut it |
| passionate about | show it with the work |
| streamline, optimize (as filler) | the specific improvement: "10× faster", "4× fewer hours" |
| solutions | the thing: a pipeline, a library, a tool |
| wild, insane, game-changer, mind-blowing | the fact, stated flatly |
| "Excited to announce…" | just announce it |
| "In today's fast-paced world…" | delete the sentence |
| "It's not X, it's Y" reveals, "No X, no Y, no Z" lists | a direct statement |

Resume-speak is the main failure mode. "Developed a Go HTTPS server to
streamline integration testing" is true and tells you nothing. Rewrite it as the
problem, the decision and the number.

---

## Sample rewrites

**Project blurb** (illustrative)

> Before: Developed a scalable, high-performance real-time processing system
> leveraging modern C++ to deliver robust results.
>
> After: A real-time signal processor in C++ that had to hit its deadline every
> cycle, on hardware with no room to spare.

**Services card**

> Before: Passionate about delivering secure, innovative cloud solutions for
> enterprise clients.
>
> After: Threat modeling, zero-trust delivery pipelines, and security review
> built into the release process instead of bolted on at the end. This is my
> day job.

**Personal post opening**

> Before: Then today, a wild email arrived that completely caught me off guard!
>
> After: Then an email arrived from a professor in the Netherlands asking for
> our dataset. I hadn't thought about that project in years.

**Error message**

> Before: Oops! Something went wrong. Please try again later.
>
> After: That didn't send. It's on my end — try again, or email me directly at
> the address below.

---

## Mechanics

- **Person:** first person singular. "I", not "we", unless it was a team — then
  name the team.
- **Spelling:** American English (optimize, behavior, meters, resume — no
  accents). The site
  currently mixes in a few British spellings — fix them when you touch a file.
- **Dashes:** em dashes are fine and part of the voice, but no more than one
  or two per paragraph. Never use one where a full stop works.
- **Numbers:** numerals for anything measured (4×, 41,000, 3 years). Use `×`,
  not `x`, for multipliers.
- **Code:** backticks for file names, commands, flags and identifiers.
- **Headings:** sentence case. Statements beat labels: "The actual requirement"
  beats "Requirements".
- **Exclamation marks:** none in body copy.
- **Length:** project blurbs are one sentence. Card bodies are two or three.
  Posts are as long as the working requires and no longer.

---

## The test

Before publishing, read it once and ask:

1. **Could anyone else have written this?** If a competitor's portfolio could
   carry the same sentence, add the specific detail only I know.
2. **Is there a number?** If a claim could have one, give it.
3. **Did I say what was hard?** If everything sounds easy, it sounds fake.
4. **Would I say this out loud to an engineer I respect?** If it would make
   them wince, rewrite it.
5. **Is there more than one joke?** Cut down to the best one.

