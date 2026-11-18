# Built-in share targets

Checked on 2026-11-18. Each URL was taken from the service's own docs, code or long-standing public use, requested live from desktop and iPhone user agents, and then re-checked by a second, adversarial reviewer. "Confidence" is how sure that review was that the link works today; "verdict" is what the reviewer concluded.

Services change these links without notice. Re-run `npm run check-targets` to request every https link again, and override a broken one with `registerShareTarget({ id: "<same id>", … })`.

**How "copy, then open" works:** the app has no way to pre-fill a share from a web page, so the widget copies the message first (synchronously, inside the tap) and then opens the app — an https universal link where the app has one, otherwise its URL scheme, and an Android `intent://` URL (opens the app, or its Play Store page if it is missing). Inside in-app browsers, which block URL schemes, it only copies. On computers, WeChat and QQ show the QR code instead.

| Target | id | How it works | Shown on | Confidence | Review |
| --- | --- | --- | --- | --- | --- |
| WhatsApp | `whatsapp` | Link — `wa.me/?text=` with the whole message | all | high | confirmed |
| Telegram | `telegram` | Link — `t.me/share/url?url=&text=` | all | high | confirmed |
| LINE | `line` | Link — `line.me/R/share` on phones, LINE web plugin on computers | all | high | confirmed |
| Messages (SMS/iMessage) | `sms` | Link — `sms:` with body (`&body=` on iOS, `?body=` on Android) | phones | medium | corrected |
| Email | `email` | Link — `mailto:` with subject and body | all | high | confirmed |
| Messenger | `messenger` | Copy link, then `fb-messenger://share` (Android intent) | phones | low | uncertain |
| Viber | `viber` | Copy link, then `viber://forward?text=` (200-character limit) | phones | medium | confirmed |
| KakaoTalk | `kakaotalk` | Copy message, then open KakaoTalk | phones | low | uncertain |
| GroupMe | `groupme` | Copy message, then open GroupMe | phones | low | single check |
| Discord | `discord` | Copy message, then open `discord.com/channels/@me` | all | medium | confirmed |
| Slack | `slack` | Copy message, then `slack://open` | all | high | single check |
| Instagram | `instagram` | Copy message, then open `instagram.com/direct/inbox/` | all | medium | confirmed |
| Snapchat | `snapchat` | Link — `snapchat.com/scan?attachmentUrl=` (Creative Kit Web) | all | medium | confirmed |
| TikTok | `tiktok` | Copy message, then open TikTok | all | medium | confirmed |
| X | `x` | Link — `x.com/intent/tweet?text=&url=` | all | high | confirmed |
| Facebook | `facebook` | Link — `facebook.com/sharer/sharer.php?u=` | all | high | confirmed |
| LinkedIn | `linkedin` | Link — `linkedin.com/sharing/share-offsite/?url=` | all | high | confirmed |
| Reddit | `reddit` | Link — `reddit.com/submit?url=&title=` | all | medium | confirmed |
| Threads | `threads` | Link — `threads.com/intent/post?text=&url=` | all | high | confirmed |
| Bluesky | `bluesky` | Link — `bsky.app/intent/compose?text=` | all | high | confirmed |
| Pinterest | `pinterest` | Link — `pinterest.com/pin/create/button/` (needs `image`) | all | medium | corrected |
| Tumblr | `tumblr` | Link — `tumblr.com/widgets/share/tool` | all | high | confirmed |
| Mastodon | `mastodon` | Link — Share₂Fedi (`s2f.kytta.dev`, third party) asks for the instance | all | medium | confirmed |
| Hacker News | `hackernews` | Link — `news.ycombinator.com/submitlink?u=&t=` | all | high | confirmed |
| VK | `vk` | Link — `vk.com/share.php` | all | medium | uncertain |
| Naver | `naver` | Link — `share.naver.com/web/shareView` (URL encoded twice) | all | high | corrected |
| BAND | `band` | Link — `band.us/plugin/share?body=&route=` | all | high | single check |
| Hatena Bookmark | `hatena` | Link — `b.hatena.ne.jp/entry/panel/?url=` | all | medium | single check |
| Nextdoor | `nextdoor` | Link — `nextdoor.com/sharekit/?source=&body=` | all | high | single check |
| Flipboard | `flipboard` | Link — `share.flipboard.com/bookmarklet/popout` | all | medium | confirmed |
| WeChat 微信 | `wechat` | Copy message, then open WeChat; QR code on computers; ··· hint inside WeChat | all | medium | confirmed |
| Weibo 微博 | `weibo` | Link — `service.weibo.com/share/share.php` | all | high | confirmed |
| QQ | `qq` | Copy message, then open QQ; QR code on computers | all | high | confirmed |
| Qzone QQ空间 | `qzone` | Link — `sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey` | all | medium | confirmed |
| Douban 豆瓣 | `douban` | Link — `douban.com/share/service` | all | medium | corrected |
| RED 小红书 | `xiaohongshu` | Copy message, then open Xiaohongshu | phones | medium | confirmed |
| Douyin 抖音 | `douyin` | Copy message, then open Douyin | phones | medium | confirmed |
| Zhihu 知乎 | `zhihu` | Copy message, then open Zhihu | phones | low | confirmed |
| DingTalk 钉钉 | `dingtalk` | Copy link, then open it inside DingTalk | all | medium | uncertain |
| Google Classroom | `googleclassroom` | Link — `classroom.google.com/share?url=&title=&body=` | all | high | confirmed |
| Microsoft Teams | `teams` | Link — `teams.microsoft.com/share?href=&msgText=` (school/work accounts, desktop Chrome/Edge) | computers | high | confirmed |
| Gmail | `gmail` | Link — Gmail compose (`mail.google.com/mail/?view=cm`) | computers | medium | confirmed |
| Outlook (Microsoft 365) | `outlook` | Link — `outlook.office.com/mail/deeplink/compose` | computers | medium | confirmed |

## Left out on purpose

- **Signal** — no way to pre-fill a message; `sgnl://` links only open a contact or group. Use the native share sheet ("More").
- **Pocket, Skype, KakaoStory, Google+** — shut down; old share URLs no longer work.
- **Bilibili, Kuaishou, Baidu Tieba** — pasting an outside link into these is not how people share; nothing can be pre-filled.
- **WeCom** — the `wxwork://` scheme could not be confirmed from a first-party source.
- **Outlook.com (personal)** and **Yahoo Mail** compose links — after sign-in they cut the shared link at the first `&`.
- **LinkedIn post text** (`feed/?shareActive=true&text=`) — undocumented; the supported share-offsite link is used instead.
- **OK.ru, Zalo** — could not be reached from the test network; unverified.

## Notes per target

### WhatsApp (`whatsapp`)

With no phone number, the user picks the recipient in the app. Some in-app browsers (Instagram, Facebook) can stop universal links from opening the app, so the user lands on the api.whatsapp.com page and taps "Open app" there.

Sources: <https://faq.whatsapp.com/5913398998672934>, <https://wa.me/.well-known/apple-app-site-association>, <https://github.com/nygardk/react-share/blob/main/src/WhatsappShareButton.tsx>

### Telegram (`telegram`)

On desktop the page has no web.telegram.org fallback, only a tg:// button (needs Telegram Desktop) and a download link. A user who only uses Telegram Web will hit a dead end.

Sources: <https://core.telegram.org/widgets/share>, <https://t.me/.well-known/apple-app-site-association>, <https://github.com/nygardk/react-share/blob/main/src/TelegramShareButton.tsx>

### LINE (`line`)

Needs a LINE web login, which is clumsy on desktop for people who mainly use the phone app. LINE's docs show the URL only after you accept the LINE Social Plugins usage guidelines, so read those before using LINE branding. On phones, prefer the line-app entry (line.me/R/share), which opens the app directly.

Sources: <https://developers.line.biz/en/docs/line-social-plugins/install-guide/using-line-share-buttons/>, <https://github.com/nygardk/react-share/blob/main/src/LineShareButton.tsx>

### Messages (SMS/iMessage) (`sms`)

No official Apple or Google docs for the body parameter. Behaviour comes from community testing, so test on real devices. Some in-app browsers block sms: links. On desktop, macOS opens Messages; Windows and Linux usually have no handler.

Sources: <https://www.rfc-editor.org/rfc/rfc5724.html>, <https://docs.sendblue.com/guides/imessage-link-button/>, <https://weblog.west-wind.com/posts/2013/Oct/09/Prefilling-an-SMS-on-Mobile-Devices-with-the-sms-Uri-Scheme>

### Email (`email`)

If no mail client is set (common on desktops that use webmail), clicking does nothing or opens an unwanted setup wizard. Use location.href or an <a href>, not window.open, to avoid a blank tab.

Sources: <https://www.rfc-editor.org/rfc/rfc6068.html>

### Messenger (`messenger`)

Undocumented by Meta and may stop working without notice. Community reports say it works on Android and is unreliable on iOS. It fails silently when Messenger isn't installed. Copy the link to the clipboard first, as with copy-open, so the user has a fallback. Show it on mobile only.

Sources: <https://developers.facebook.com/documentation/sharing/messenger.md>, <https://developers.facebook.com/documentation/sharing/overview.md>, <https://github.com/nygardk/react-share/blob/main/src/FacebookMessengerShareButton.tsx>

### Viber (`viber`)

Show it on mobile only. Without Viber installed nothing happens, or the browser shows an "invalid address" error. Copy the link first as a fallback. Viber Desktop registers viber:// and may handle forward, but Viber only documents it for mobile websites; not verified.

Sources: <https://developers.viber.com/docs/tools/share-button/>, <https://github.com/nygardk/react-share/blob/main/src/ViberShareButton.tsx>

### KakaoTalk (`kakaotalk`)

Copy-open only: the user has to paste and pick a chat. kakaotalk://launch isn't documented by Kakao and wasn't checked on iOS or Android devices. Fallback: offer an optional SDK mode when the host page supplies a Kakao JS key and has its domain registered. Monthly and daily quotas apply to SDK sharing.

Sources: <https://developers.kakao.com/docs/en/kakaotalk-share/js-link>, <https://developers.kakao.com/docs/en/kakaotalk-share/common>, <https://developers.kakao.com/docs/en/javascript/hybrid>

### GroupMe (`groupme`)

GroupMe is very widely used by US college clubs and classes, so it is worth a button on student sites. Confidence that nothing can be pre-filled is high. Confidence in the groupme:// scheme is low: the only evidence is a 2016 Stack Overflow report that groupme://compose?text= opens the app but ignores the text. Microsoft's own help page tells people to share through the OS share sheet, so on…

Sources: <https://support.microsoft.com/en-us/groupme/how-do-i-share-media-or-files-from-another-app-or-browser-to-groupme>, <https://groupme.com/.well-known/apple-app-site-association>, <https://groupme.com/.well-known/assetlinks.json>

### Discord (`discord`)

The user has to paste the link and choose a DM or channel. Android path coverage for /channels/@me isn't verified (the domain is verified for com.discord, but the intent-filter paths weren't inspected). On desktop it opens the web client in a new tab, which some users with the desktop app may find odd.

Sources: <https://discord.com/.well-known/apple-app-site-association>, <https://discord.com/.well-known/assetlinks.json>, <https://docs.discord.com/developers/link-previews/overview>

### Slack (`slack`)

Many student orgs, research labs and workplaces use Slack, but this target can only copy the link and open the app. Leave it out of the defaults and let sites that need it turn it on.

Sources: <https://docs.slack.dev/interactivity/deep-linking>

### Instagram (`instagram`)

Copy-then-paste only. The user must open a chat and paste. Prefer the https universal link over instagram://. With the custom scheme, iOS Safari first asks 'Open in "Instagram"?' and, if the app is missing, shows 'Safari cannot open the page because the address is invalid', which JS cannot catch. With the https link the fallback is simply the web login or inbox page. Universal links do not fire…

Sources: <https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/>, <https://app-site-association.cdn-apple.com/a/v1/www.instagram.com>, <https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.instagram.com&relation=delegate_permission/common.handle_all_urls>

### Snapchat (`snapchat`)

The plain URL isn't on Snap's docs page; it comes from Snap's own SDK code, so Snap could change it. The SDK host sdk.snapkit.com currently serves an incomplete TLS chain (curl and Node fail without the DigiCert intermediate), which hints at low upkeep. Desktop users see a Snapcode to scan with their phone rather than a direct share. Make sure the page has good og:title, og:image and og:site_name.

Sources: <https://developers.snap.com/snap-kit/creative-kit/web>, <https://sdk.snapkit.com/js/v1/create.js>, <https://www.snapchat.com/.well-known/apple-app-site-association>

### TikTok (`tiktok`)

Copy-then-paste only (into a TikTok DM or a comment). The snssdk1233:// scheme is not documented for launching from the web; TikTok documents it only as a canOpenURL check. Prefer the https://www.tiktok.com/ universal link on iOS to avoid Safari's invalid-address alert. Android Chrome: if the scheme is not handled, nothing happens. Use intent:// with package=com.zhiliaoapp.musically and an https…

Sources: <https://developers.tiktok.com/doc/mobile-sdk-ios-quickstart>, <https://www.tiktok.com/.well-known/apple-app-site-association>, <https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.tiktok.com&relation=delegate_permission/common.handle_all_urls>

### X (`x`)

Logged-out users have to sign in first, and the intent survives the login. Web intents cannot be loaded inside an iframe, so open them in a new window or tab. X may rename the /intent/tweet path to /intent/post one day; both work today.

Sources: <https://docs.x.com/x-for-websites/post-button/guides/web-intent.md>, <https://docs.x.com/x-for-websites/web-intents/overview.md>, <https://docs.x.com/fundamentals/counting-characters.md>

### Facebook (`facebook`)

sharer.php is not in Meta's current developer docs, but it is still served and is the de facto standard. You cannot pre-fill any text; the user types their own. The preview comes only from OG tags, which Facebook caches; refresh them with the Sharing Debugger.

Sources: <https://developers.facebook.com/docs/sharing/reference/share-dialog>, <https://github.com/nygardk/react-share/issues/456>, <https://github.com/nygardk/react-share/issues/487>

### LinkedIn (`linkedin`)

LinkedIn has never documented share-offsite well; the current Microsoft Learn Share Plugin page (updated 2022-03-31) shows only the in.js button. You cannot set the text. Previews depend on OG tags, which LinkedIn caches (refresh with its Post Inspector).

Sources: <https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/plugins/share-plugin>, <https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin>, <https://www.linkedin.com/.well-known/apple-app-site-association>

### Reddit (`reddit`)

There is no official Reddit documentation for submit-link params; the format comes from long-standing use (react-share v6, Shariff and others) and the login redirect above. Many subreddits ban link posts or self-promotion, so users may fail to post.

Sources: <https://old.reddit.com/submit?url=https%3A%2F%2Fexample.com%2Ftest&title=Test%20title>, <https://www.reddit.com/.well-known/apple-app-site-association>, <https://github.com/nygardk/react-share>

### Threads (`threads`)

Needs a Threads (Instagram) account. The link card is built from the target page's OG tags.

Sources: <https://developers.facebook.com/docs/threads/threads-web-intents>, <https://developers.facebook.com/docs/threads/posts>, <https://www.threads.com/.well-known/apple-app-site-association>

### Bluesky (`bluesky`)

Logged-out users are asked to sign in or create an account first. The link card is built from OG tags only once the user is in the composer.

Sources: <https://github.com/bluesky-social/bsky-docs/blob/main/docs/advanced-guides/intent-links.md>, <https://github.com/bluesky-social/social-app/blob/main/src/lib/hooks/useIntentHandler.ts>, <https://github.com/bluesky-social/social-app/blob/main/src/view/com/composer/state/composer.ts>

### Pinterest (`pinterest`)

Hide or disable the button when there is no image. Users have to log in, and the description may be overridden.

Sources: <https://developers.pinterest.com/docs/web-features/buttons/>, <https://assets.pinterest.com/js/pinit_main.js>, <https://community.pinterest.biz/t/pin-description-not-working-for-share-links/32456>

### Tumblr (`tumblr`)

Needs a Tumblr login. Tumblr recommends opening the share tool in a 540x600 popup.

Sources: <https://help.tumblr.com/knowledge-base/share-button-documentation/>, <https://www.tumblr.com/.well-known/apple-app-site-association>, <https://github.com/nygardk/react-share>

### Mastodon (`mastodon`)

It is a third-party relay. The Share₂Fedi README asks heavy users to self-host because the free public instance may become too costly to run; its repo was active on 2026-11-16. Users have to know their instance domain. This takes an extra step compared with other targets.

Sources: <https://github.com/mastodon/mastodon/blob/main/app/helpers/application_helper.rb>, <https://github.com/kytta/share2fedi>, <https://mastodonshare.com/?text=Test%20title&url=https%3A%2F%2Fexample.com%2Ftest>

### Hacker News (`hackernews`)

Niche, tech-focused audience. Requires an HN account. Duplicate URLs redirect to the existing thread, and HN guidelines discourage asking for votes.

Sources: <https://news.ycombinator.com/bookmarklet.html>, <https://news.ycombinator.com/.well-known/apple-app-site-association>

### VK (`vk`)

Not reachable from some networks; this test network reset the connection. The audience is mainly Russia and CIS. vk.com vs vk.ru: the docs now show vk.ru, but I could not check whether vk.com redirects. Consider hiding this target by default and making it opt-in.

Sources: <https://web.archive.org/web/20260703040321/https://dev.vk.com/en/widgets/share>, <https://github.com/nygardk/react-share>

### Naver (`naver`)

Useful mainly for a Korean audience. It shares only to Naver Blog or Cafe, not a general feed. Mind the double-encoding quirk above; the generic encodeURIComponent placeholder breaks URLs that contain '&'.

Sources: <https://developers.naver.com/docs/share/navershare/>, <https://ssl.pstatic.net/share/js/share/share.js>, <https://share.naver.com/.well-known/apple-app-site-association>

### BAND (`band`)

Worth having for Korean audiences, where BAND is the main group and club app after KakaoTalk. Not a default for a general international set. Users must be logged in.

Sources: <https://developers.band.us/develop/guide/share>, <https://band.us/.well-known/apple-app-site-association>, <https://band.us/.well-known/assetlinks.json>

### Hatena Bookmark (`hatena`)

Hatena Bookmark is the mainstream way to share web pages in Japan. For Japanese students LINE and X matter more, so offer it as an opt-in for Japan-focused sites.

Sources: <https://b.st-hatena.com/js/bookmark_button.js>, <https://b.hatena.ne.jp/guide/bbutton>

### Nextdoor (`nextdoor`)

Nextdoor is mainstream in the US, UK and a few other countries, mainly for local news, events and businesses. It does little for a student audience, so keep it off the defaults.

Sources: <https://developer.nextdoor.com/reference/share-plugin>, <https://developer.nextdoor.com/docs/sharing-overview>

### Flipboard (`flipboard`)

No current Flipboard documentation; it is kept alive in third-party libraries (Shariff since 2018, social-share-urls), and the page bundle still contains Windows Phone and Google+ strings, so it is old. Small audience; low priority.

Sources: <https://github.com/heiseonline/shariff/blob/master/src/js/services/flipboard.js>, <https://about.flipboard.com/inside-flipboard/useful-flipboard-tools-to-help-bloggers-grow-their-reach>, <https://share.flipboard.com/.well-known/apple-app-site-association>

### WeChat 微信 (`wechat`)

WeChat's official mini-program URL Scheme doc says weixin:// links can be opened from web pages outside WeChat by setting location.href. iOS recognizes the scheme directly; Android needs an H5 page that does location.href, which is our case. The call can run on page load or after a user action. iOS Safari shows an '在"微信"中打开？' confirmation. Inside WeChat itself, detect /MicroMessenger/i and tell…

Sources: <https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/url-scheme.html>, <https://developers.weixin.qq.com/doc/service/en/guide/h5/jssdk.html>

### Weibo 微博 (`weibo`)

Posting needs a Weibo login: in the popup on desktop, in the app on mobile. On phones the https link is not a universal link. Weibo's own dialog page shows a preview and an '一键分享' button that runs sinaweibo://browser?url=<share/mobile.php?...>, which opens the Weibo app (already logged in) on the share page. It also offers '账密登录' (password login on passport.weibo.cn) to share on the web. Inside…

Sources: <https://service.weibo.com/share/share.php?url=…>, <https://open.weibo.com/views/js/share_dialog.js>, <https://js.t.sinajs.cn/open/widget/js/share/share.js?ver=201710111224>

### QQ (`qq`)

This is no longer a share form, only a branded QR code for mobile QQ to scan. It largely repeats the widget's own QR feature. Show it on desktop only. On phones it is a dead end (a QR code on the same screen), so use the 'qq-app' copy-open entry there.

Sources: <https://connect.qq.com/widget/shareqq/index.html?url=…>, <https://wiki.connect.qq.com/>

### Qzone QQ空间 (`qzone`)

The UI is old: it still offers 'sync to Tencent Weibo', which shut down in 2020. Posting needs a QQ login in the browser. I could not check a full post without logging in. Do not test with example.com (WAF 501).

Sources: <https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?…>, <https://h5.qzone.qq.com/q/qzs/open/connect/widget/mobile/qzshare/index.html?page=qzshare.html&…>

### Douban 豆瓣 (`douban`)

There is a login wall, and I could not see the share form after login. The docs page (douban.com/service/sharebutton) is still served with a 2026 copyright but dates from the old era.

Sources: <https://www.douban.com/service/sharebutton>, <https://www.douban.com/share/service?…>

### RED 小红书 (`xiaohongshu`)

On iOS inside WeChat or QQ, the official SDK uses the universal link instead of the scheme. So https://oia.xiaohongshu.com/oia?deeplink=xhsdiscover%3A%2F%2Fhome is a sensible iOS alternative that may open from in-app browsers where schemes are blocked (not tested on a device). Opening the scheme lands on the home feed. Full pre-fill needs the SDK, an appKey and server signing, which a zero-config…

Sources: <https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js>, <https://oia.xiaohongshu.com/.well-known/apple-app-site-association>, <https://agora.xiaohongshu.com/doc/js>

### Douyin 抖音 (`douyin`)

Douyin's iOS SDK doc lists snssdk1128 among its LSApplicationQueriesSchemes, which confirms the scheme name. A bare snssdk1128:// opening the home screen was not tested on a device. Douyin is a poor place to paste outside links (they are not clickable in posts). The iOS universal link https://www.douyin.com/ ('/' path) is a possible alternative, not tested.

Sources: <https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/sdk/web-app/h5/share-to-h5>, <https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/sdk/mobile-app/access/ios>, <https://www.douyin.com/.well-known/apple-app-site-association>

### Zhihu 知乎 (`zhihu`)

The scheme comes only from third-party lists (zhihu://) and was not tested on a device. Low priority: few people share outside links into Zhihu. Possible iOS https alternative, not tested: https://oia.zhihu.com/ (universal link for all paths).

Sources: <https://www.zhihu.com/share?url=…>, <https://oia.zhihu.com/.well-known/apple-app-site-association>, <https://juejin.cn/post/7103791796324728869>

### DingTalk 钉钉 (`dingtalk`)

The current official page documents page/link for links clicked in PC client messages. Mobile behavior (opening in DingTalk's built-in browser) is widely used but not documented on that page and not tested on a device. The general routing-protocol page is marked deprecated. Mostly useful for workplace audiences.

Sources: <https://help.dingtalk.io/open/development/message-link-description.md>, <https://open.dingtalk.com/document/orgapp/unified-routing-protocol>

### Google Classroom (`googleclassroom`)

Needs a Google account enrolled in or teaching Classroom classes, usually a school Workspace account. Students can attach the link to their own work or class stream only where the class allows it; teachers get announcement, assignment, material and question options. Google's guide asks that custom buttons follow the Classroom branding guidelines.

Sources: <https://developers.google.com/workspace/classroom/guides/sharebutton>, <https://classroom.google.com/.well-known/apple-app-site-association>, <https://apis.google.com/js/platform.js>

### Microsoft Teams (`teams`)

Microsoft's doc says only desktop Microsoft Edge and Google Chrome are supported, and Freemium (Teams free/personal) and guest accounts are not. So this is for students and staff with school or work Microsoft 365 accounts on desktop. The shared page needs og:title/og:description/og:image (or a meta title and description) for the preview card; links behind authentication get no preview.

Sources: <https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps>, <https://teams.microsoft.com/share/launcher.js>, <https://teams.microsoft.com/.well-known/apple-app-site-association>

### Gmail (`gmail`)

Desktop only. On mobile Safari the link lands in the Gmail inbox without opening compose (reported March 2024, no workaround). On mobile, use mailto:?subject={title}&body={message} instead, which opens whichever mail app is the default, Gmail app included. Not an official Google API and could change.

Sources: <https://til.simonwillison.net/google/gmail-compose-url>, <https://github.com/simonw/til/blob/main/google/gmail-compose-url.md>

### Outlook (Microsoft 365) (`outlook`)

Signed-out users get the documented '+'-instead-of-space bug after sign-in (community workaround: base64-encode the compose URL into https://outlook.office.com/owa/?state=1&redirectTo=). Tenant policies may block or alter it. Undocumented.

Sources: <https://techcommunity.microsoft.com/discussions/microsoft-365/outlook-deeplink-for-email-compose-replaces-spaces-with--when-user-not-logged-in/4111903>, <https://learn.microsoft.com/en-us/answers/questions/4619953/want-to-pre-populate-to-cc-subject-body-by-passing>

