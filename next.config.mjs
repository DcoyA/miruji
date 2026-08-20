import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "여기에_Sentry_조직_슬러그",
  project: "여기에_Sentry_프로젝트명",
});
