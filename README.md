# Yellow Pen Center — Website

Bilingual (Arabic / English) website for **Yellow Pen Center**, a childcare center for children aged 2 to 6 in Al Hamdaniyah, Jeddah.

The site is plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About the center |
| `programs.html` | Programs, ages and the road to school |
| `gallery.html` | Videos and photos, with a filter and a lightbox |
| `contact.html` | Contact options, visit-request form and FAQ |

## Features

- Arabic (right-to-left) by default, with a language switch to English (left-to-right). The choice is remembered between pages.
- Responsive layout for phones, tablets and desktops.
- "Book a visit" popup and form that open WhatsApp with a ready-to-send message. No data is stored on the site.
- Video lightbox, photo gallery with filtering, and scroll animations that respect the reduced-motion setting.
- Optimized images (WebP) and videos that load only when needed.

## Preview locally

Open `index.html` in a browser, or run a local server:

```bash
npx serve .
```

Add `?lang=en` to any page address for the English version, and `?popup=1` to preview the visit popup.

## Structure

```
index.html, about.html, programs.html, gallery.html, contact.html
assets/
  css/styles.css     Styles. Brand colors and fonts are defined at the top.
  js/i18n.js         English translations for all pages.
  js/main.js         Language switch, animations, lightbox, gallery filter, visit form.
  js/popup.js        "Book a visit" popup and floating button.
  img/               Optimized photos, logo and illustrations.
  video/             Short loops and full clips.
```

## Editing content

- **Arabic text** lives in the HTML files.
- **English text** lives in `assets/js/i18n.js`, matched to the HTML by the `data-i18n` attribute.
- To add a new string in both languages, write the Arabic in the HTML with `data-i18n="some.key"`, then add `"some.key": "English text"` to `i18n.js`.
- The header and footer are repeated in each page. A change to a navigation link or a footer detail has to be made in all five files.
- Popup timing (delay, snooze period) is set by the constants at the top of `assets/js/popup.js`.

## Contact details used on the site

- Phone / WhatsApp: 050 539 3575
- Location: Al Hamdaniyah, Jeddah
- Instagram and TikTok: [@yellowpen2023](https://www.instagram.com/yellowpen2023/)
