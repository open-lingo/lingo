# TREVOR — READ THIS BEFORE THE NEXT `terraform apply`

Spencer asked for this file to sit at the repo root so a `git pull` puts it in
front of you. Delete it in the commit that closes the items below.

Source: CDN/cost audit of 2026-09-13 (`docs/handoff-2026-09-11-mobile-qa.md`,
06:45 entry; content pipeline in `docs/content-as-data-2026-09-13.md`).
Verified against `lingo-infra` on 2026-09-13 (`static_site.tf`, `ci_oidc.tf`).

## 1. The app distribution is not in Terraform (latent outage)

- `app.openlingoapp.com` is served by CloudFront distribution `E1BFOGAPA9DNMV`.
  It exists in no `.tf` file. `static_site.tf` `aws_cloudfront_distribution.site`
  is the apex/marketing distribution.
- `aws_s3_bucket_policy.site` (`static_site.tf:132`) allows exactly ONE
  `AWS:SourceArn` = the apex distribution. The app distribution reads the same
  bucket, so its read grant lives outside Terraform.
- **Blast radius:** the next `terraform apply` that touches the bucket policy
  rewrites it to the single ARN and every app.openlingoapp.com request 403s
  (100% of app traffic, web and native) until the policy is re-edited.
- **Do first:** `terraform plan` and confirm the bucket policy shows NO diff.
  Then add the app distribution's ARN to the `SourceArn` list (or `ArnLike`
  with both), apply, and `terraform import aws_cloudfront_distribution.app
  E1BFOGAPA9DNMV` so it is codified. The deploy workflow's cache behaviours it
  must keep: `assets/*` and `content/v1/*.<hash>.json` immutable,
  `content/v1/manifest.json`, `boot-guard.js`, `index.html` no-cache
  (`.github/workflows/deploy.yml`).

## 2. No S3 lifecycle rule on the site bucket (cost drift)

Every deploy adds hashed `assets/*` and `content/v1/*` objects; nothing is
ever removed. Add a lifecycle rule (abort incomplete multipart at 7 days;
expire objects not written by the current deploy after ~90 days, or run a
`--delete` sync for everything except `content/v1/` and `assets/`).

## 3. No CloudFront access logging on either distribution

The billing alarms cannot be attributed to a path or a client without logs.
Standard logs to a log bucket with a 30-day expiry; PriceClass_100 stays.

## 4. Budget, billing alarms, cost breaker

`cost_breaker.tf` and `observability.tf` are in `lingo-infra` but the account's
budget and billing alarms were created outside Terraform (see
`memory: aws-access-and-cost-guardrails`). Import them, and confirm the breaker
is applied and armed.

## Cost context (why this matters at scale)

Content JSON on the CDN costs ≈ $0.3–0.75/mo at 1k MAU, $3–7.5 at 10k,
$28–75 at 100k (worst case: JA course 8 MB once per user + 30 KB manifest
daily). TTS is $0 API cost (Kokoro local for JA, Edge-TTS for es/fr/ko).
Items 1–3 are the difference between that model holding and not.
