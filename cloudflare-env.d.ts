declare namespace Cloudflare {
  interface Env {
    DEEPSEEK_API_KEY?: string;
    BUDGET_BASELINE_MICRO?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
