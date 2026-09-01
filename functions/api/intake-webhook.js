import {
  clean,
  json,
  readJson
} from '../_lib/http.js';

const DEFAULT_GUILD_ID =
  '1531662107513323781';

async function verifyTurnstile(
  token,
  ip,
  secret
) {
  if (!secret) return true;
  if (!token) return false;

  const body = new FormData();

  body.set(
    'secret',
    secret
  );

  body.set(
    'response',
    token
  );

  if (ip) {
    body.set(
      'remoteip',
      ip
    );
  }

  const response =
    await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body
      }
    );

  const data =
    await response.json();

  return Boolean(
    data.success
  );
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function supabaseConfig(env) {
  const url =
    String(
      env.SUPABASE_URL ||
      env.PUBLIC_SUPABASE_URL ||
      ''
    )
      .trim()
      .replace(/\/+$/, '');

  const serviceKey =
    String(
      env.SUPABASE_SERVICE_ROLE_KEY ||
      ''
    ).trim();

  return {
    url,
    serviceKey
  };
}

function supabaseHeaders(
  serviceKey,
  extra = {}
) {
  return {
    apikey:
      serviceKey,

    authorization:
      `Bearer ${serviceKey}`,

    'content-type':
      'application/json',

    ...extra
  };
}

async function getSubmission(
  env,
  submissionId
) {
  const {
    url,
    serviceKey
  } =
    supabaseConfig(env);

  if (
    !url ||
    !serviceKey
  ) {
    throw new Error(
      'SUPABASE_SERVER_NOT_CONFIGURED'
    );
  }

  const response =
    await fetch(
      `${url}/rest/v1/submissions?id=eq.${encodeURIComponent(
        submissionId
      )}&select=id,reference,type&limit=1`,
      {
        method: 'GET',

        headers:
          supabaseHeaders(
            serviceKey
          )
      }
    );

  if (!response.ok) {
    throw new Error(
      'SUBMISSION_LOOKUP_FAILED'
    );
  }

  const rows =
    await response.json();

  return rows?.[0] ??
    null;
}

async function enqueueSupportTicket(
  env,
  submissionId
) {
  const {
    url,
    serviceKey
  } =
    supabaseConfig(env);

  if (
    !url ||
    !serviceKey
  ) {
    throw new Error(
      'SUPABASE_SERVER_NOT_CONFIGURED'
    );
  }

  const guildId =
    String(
      env.DISCORD_GUILD_ID ||
      DEFAULT_GUILD_ID
    ).trim();

  const response =
    await fetch(
      `${url}/rest/v1/bot_actions`,
      {
        method: 'POST',

        headers:
          supabaseHeaders(
            serviceKey,
            {
              Prefer:
                'return=minimal'
            }
          ),

        body:
          JSON.stringify({
            guild_id:
              guildId,

            action:
              'CREATE_SUPPORT_TICKET',

            payload: {
              submission_id:
                submissionId
            },

            status:
              'pending',

            run_at:
              new Date()
                .toISOString()
          })
      }
    );

  if (!response.ok) {
    const text =
      await response
        .text()
        .catch(
          () => ''
        );

    console.error(
      'bot_actions insert failed',
      response.status,
      text
    );

    throw new Error(
      'BOT_ACTION_INSERT_FAILED'
    );
  }
}

/*
 * Alter Discord-Webhook bleibt nur
 * als Notfall-Fallback erhalten.
 */
async function sendLegacyWebhook(
  env,
  {
    reference,
    category,
    subject,
    priority
  }
) {
  const webhook =
    String(
      env.DISCORD_INTAKE_WEBHOOK ||
      ''
    ).trim();

  if (!webhook) {
    return false;
  }

  const embed = {
    title:
      'Neuer Website-Eingang',

    color:
      priority === 'urgent'
        ? 0xff2d95
        : priority === 'high'
          ? 0x8b5cf6
          : 0x159dff,

    fields: [
      {
        name:
          'Referenz',
        value:
          reference,
        inline:
          true
      },
      {
        name:
          'Kategorie',
        value:
          category,
        inline:
          true
      },
      {
        name:
          'Priorität',
        value:
          priority,
        inline:
          true
      },
      {
        name:
          'Betreff',
        value:
          subject ||
          'Ohne Betreff'
      }
    ],

    footer: {
      text:
        'Nexura RP Website · Bot-Fallback'
    },

    timestamp:
      new Date()
        .toISOString()
  };

  const response =
    await fetch(
      webhook,
      {
        method:
          'POST',

        headers: {
          'content-type':
            'application/json'
        },

        body:
          JSON.stringify({
            username:
              'Nexura Website',

            embeds: [
              embed
            ],

            allowed_mentions: {
              parse: []
            }
          })
      }
    );

  return response.ok;
}

export async function onRequestPost({
  request,
  env
}) {
  try {
    const data =
      await readJson(
        request,
        12_000
      );

    const verified =
      await verifyTurnstile(
        data.turnstileToken,

        request.headers.get(
          'CF-Connecting-IP'
        ),

        env
          .TURNSTILE_SECRET_KEY
      );

    if (!verified) {
      return json(
        {
          error:
            'Sicherheitsprüfung fehlgeschlagen.'
        },
        {
          status: 403
        }
      );
    }

    const submissionId =
      String(
        data.submission_id ||
        data.submissionId ||
        ''
      ).trim();

    const reference =
      clean(
        data.reference,
        80
      );

    const category =
      clean(
        data.category,
        100
      );

    const subject =
      clean(
        data.subject,
        180
      );

    const priority =
      clean(
        data.priority,
        30
      ) ||
      'normal';

    if (
      !submissionId ||
      !isUuid(
        submissionId
      )
    ) {
      return json(
        {
          error:
            'Ungültige Submission-ID.'
        },
        {
          status: 400
        }
      );
    }

    if (
      !reference ||
      !category
    ) {
      return json(
        {
          error:
            'Referenz und Kategorie fehlen.'
        },
        {
          status: 400
        }
      );
    }

    /*
     * Submission serverseitig prüfen.
     *
     * Dadurch kann ein Besucher nicht
     * irgendeine beliebige Bot-Aktion
     * über diesen öffentlichen Endpoint
     * erzeugen.
     */
    let submission;

    try {
      submission =
        await getSubmission(
          env,
          submissionId
        );
    } catch (error) {
      /*
       * Falls Supabase serverseitig
       * noch nicht konfiguriert ist,
       * behalten wir vorübergehend
       * den alten Webhook als Fallback.
       */
      if (
        error.message ===
        'SUPABASE_SERVER_NOT_CONFIGURED'
      ) {
        const webhookSent =
          await sendLegacyWebhook(
            env,
            {
              reference,
              category,
              subject,
              priority
            }
          );

        return json({
          ok: true,
          queued: false,
          fallback:
            webhookSent,
          reason:
            'Supabase-Serverzugriff noch nicht konfiguriert.'
        });
      }

      throw error;
    }

    if (!submission) {
      return json(
        {
          error:
            'Website-Anfrage nicht gefunden.'
        },
        {
          status: 404
        }
      );
    }

    /*
     * Die vom Browser gelieferte
     * Referenz muss zum DB-Eintrag
     * passen.
     */
    if (
      String(
        submission.reference
      ) !==
      String(reference)
    ) {
      return json(
        {
          error:
            'Referenz stimmt nicht mit der Anfrage überein.'
        },
        {
          status: 409
        }
      );
    }

    /*
     * Nur Support und Einsprüche dürfen
     * über diesen Endpoint automatisch
     * Discord-Tickets erzeugen.
     */
    if (
      ![
        'support',
        'appeal'
      ].includes(
        String(
          submission.type
        )
      )
    ) {
      return json(
        {
          error:
            'Dieser Vorgang ist kein Support-Ticket.'
        },
        {
          status: 400
        }
      );
    }

    await enqueueSupportTicket(
      env,
      submissionId
    );

    return json(
      {
        ok: true,
        queued: true,
        submission_id:
          submissionId
      },
      {
        status: 202
      }
    );

  } catch (error) {
    console.error(
      'intake-webhook error',
      error
    );

    const status =
      error.message ===
      'PAYLOAD_TOO_LARGE'
        ? 413
        : 500;

    return json(
      {
        error:
          error.message ===
          'INVALID_JSON'
            ? 'Ungültige Anfrage.'
            : 'Anfrage konnte nicht an den Nexura-Bot übergeben werden.'
      },
      {
        status
      }
    );
  }
}
