---
"@verdocs/react-sdk": minor
"@verdocs/angular-sdk": minor
"@verdocs/vue-sdk": minor
"@verdocs/wc-sdk": minor
---

- `VerdocsSend` in React and Vue, `VerdocsSendComponent` in Angular, and `vdocs-send` in Web components has been updated and modernized.
- A before-send callback receives the request body and can cancel it, allowing the host application to handle the send instead of Verdocs' default internal handling.
- Several additional supporting components have been updated per the above.
- The contact picker visuals have been updated and modernized.
- Sign-in flows will remember the host page's deep link and history state through social auth flows.
- Sign-in flows pass `error` query parameters as-is.
- Sign-in flows show a locked-account message instead of "timed out" when MFA attempts run out.
