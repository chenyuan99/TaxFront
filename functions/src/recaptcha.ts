import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

const PROJECT_ID = "taxfront-1e142";
const SITE_KEY = "6Lf2xfosAAAAABCtcNZu9xCclAtL2Ivrnxul5aw_";

// Cached client — created once per cold start
let client: RecaptchaEnterpriseServiceClient | null = null;
function getClient(): RecaptchaEnterpriseServiceClient {
  if (!client) client = new RecaptchaEnterpriseServiceClient();
  return client;
}

/**
 * Creates a reCAPTCHA Enterprise assessment and returns the risk score (0.0–1.0),
 * or null if the token is invalid or the action doesn't match.
 *
 * Call this from Cloud Functions that perform sensitive operations (e.g. login,
 * document upload, agent invocations) to gate requests below a risk threshold.
 */
export async function createAssessment(
  token: string,
  recaptchaAction: string
): Promise<number | null> {
  const recaptchaClient = getClient();
  const projectPath = recaptchaClient.projectPath(PROJECT_ID);

  const [response] = await recaptchaClient.createAssessment({
    assessment: {
      event: {
        token,
        siteKey: SITE_KEY,
      },
    },
    parent: projectPath,
  });

  if (!response.tokenProperties?.valid) {
    console.warn(
      `reCAPTCHA token invalid: ${response.tokenProperties?.invalidReason}`
    );
    return null;
  }

  if (response.tokenProperties.action !== recaptchaAction) {
    console.warn(
      `reCAPTCHA action mismatch: expected "${recaptchaAction}", got "${response.tokenProperties.action}"`
    );
    return null;
  }

  const score = response.riskAnalysis?.score ?? 0;
  console.log(`reCAPTCHA score for action "${recaptchaAction}": ${score}`);
  response.riskAnalysis?.reasons?.forEach((reason) => console.log(reason));

  return score;
}

/** Minimum score considered safe. Scores below this are rejected. */
export const RECAPTCHA_SCORE_THRESHOLD = 0.5;
