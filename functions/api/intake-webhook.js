import {
  clean,
  json,
  readJson
} from '../_lib/http.js';

const DEFAULT_GUILD_ID =
  '1531662107513323781';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? '')
  );
}

function getSupabaseConfig(env) {
  const url =
    String(
      env.SUPABASE_URL ??
      ''
    )
      .trim()
      .replace(
        /\/+$/,
        ''
      );

  const serviceKey =
    String(
      env.SUPABASE_SERVICE_ROLE_KEY ??
      ''
    ).trim();

  if (
    !url ||
    !serviceKey
  ) {
    throw new Error(
      'SUPABASE_SERVER_NOT_CONFIGURED'
    );
  }

  return {
    url,
    serviceKey
  };
}

function headers(
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

/*
 * Submission direkt aus Supabase laden.
 */
async function getSubmission(
  env,
  submissionId
) {
  const {
    url,
    serviceKey
  } =
    getSupabaseConfig(
      env
    );

  const response =
    await fetch(
      `${url}/rest/v1/submissions` +
      `?id=eq.${encodeURIComponent(
        submissionId
      )}` +
      `&select=id,reference,type,status,created_at` +
      `&limit=1`,
      {
        method:
          'GET',

        headers:
          headers(
            serviceKey
          )
      }
    );

  if (!response.ok) {
    const body =
      await response
        .text()
        .catch(
          () => ''
        );

    console.error(
      'Submission lookup failed:',
      response.status,
      body
    );

    throw new Error(
      'SUBMISSION_LOOKUP_FAILED'
    );
  }

  const rows =
    await response.json();

  return (
    rows?.[0] ??
    null
  );
}

/*
 * Prüfen, ob dieselbe Submission
 * bereits in der Bot-Queue steckt.
 *
 * Dadurch erzeugt mehrfaches Absenden
 * oder ein Browser-Retry keine
 * doppelten Tickets.
 */
async function findExistingAction(
  env,
  guildId,
  submissionId
) {
  const {
    url,
    serviceKey
  } =
    getSupabaseConfig(
      env
    );

  const response =
    await fetch(
      `${url}/rest/v1/bot_actions` +
      `?guild_id=eq.${encodeURIComponent(
        guildId
      )}` +
      `&action=eq.CREATE_SUPPORT_TICKET` +
      `&select=id,status,payload,created_at` +
      `&order=created_at.desc` +
      `&limit=100`,
      {
        method:
          'GET',

        headers:
          headers(
            serviceKey
          )
      }
    );

  if (!response.ok) {
    const body =
      await response
        .text()
        .catch(
          () => ''
        );

    console.error(
      'bot_actions lookup failed:',
      response.status,
      body
    );

    throw new Error(
      'BOT_ACTION_LOOKUP_FAILED'
    );
  }

  const rows =
    await response.json();

  return (
    rows ?? []
  ).find(row => {
    const id =
      String(
        row?.payload
          ?.submission_id ??
        ''
      );

    return (
      id ===
        submissionId &&
      [
        'pending',
        'running',
        'done'
      ].includes(
        String(
          row.status
        )
      )
    );
  }) ?? null;
}

/*
 * CREATE_SUPPORT_TICKET
 * in bot_actions einreihen.
 */
async function enqueueSupportTicket(
  env,
  guildId,
  submissionId
) {
  const {
    url,
    serviceKey
  } =
    getSupabaseConfig(
      env
    );

  /*
   * Doppelte Queue-Einträge verhindern.
   */
  const existing =
    await findExistingAction(
      env,
      guildId,
      submissionId
    );

  if (existing) {
    return {
      queued:
        true,

      duplicate:
        true,

      actionId:
        existing.id,

      status:
        existing.status
    };
  }

  const response =
    await fetch(
      `${url}/rest/v1/bot_actions`,
      {
        method:
          'POST',

        headers:
          headers(
            serviceKey,
            {
              Prefer:
                'return=representation'
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
    const body =
      await response
        .text()
        .catch(
          () => ''
        );

    console.error(
      'CREATE_SUPPORT_TICKET insert failed:',
      response.status,
      body
    );

    throw new Error(
      'BOT_ACTION_INSERT_FAILED'
    );
  }

  const rows =
    await response.json();

  return {
    queued:
      true,

    duplicate:
      false,

    actionId:
      rows?.[0]?.id ??
      null,

    status:
      rows?.[0]?.status ??
      'pending'
  };
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

    const submissionId =
      String(
        data.submission_id ??
        data.submissionId ??
        ''
      ).trim();

    const reference =
      clean(
        data.reference,
        80
      );

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
          status:
            400
        }
      );
    }

    if (!reference) {
      return json(
        {
          error:
            'Referenz fehlt.'
        },
        {
          status:
            400
        }
      );
    }

    /*
     * Existiert diese Submission
     * wirklich?
     */
    const submission =
      await getSubmission(
        env,
        submissionId
      );

    if (!submission) {
      return json(
        {
          error:
            'Website-Anfrage nicht gefunden.'
        },
        {
          status:
            404
        }
      );
    }

    /*
     * UUID und sichtbare Referenz
     * müssen zusammenpassen.
     */
    if (
      String(
        submission.reference
      ) !==
      String(
        reference
      )
    ) {
      return json(
        {
          error:
            'Referenz stimmt nicht mit der Anfrage überein.'
        },
        {
          status:
            409
        }
      );
    }

    /*
     * Nur Support und Appeals.
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
            'Dieser Vorgang darf nicht als Support-Ticket verarbeitet werden.'
        },
        {
          status:
            400
        }
      );
    }

    /*
     * Nur relativ frisch erstellte
     * Submissions dürfen über diesen
     * öffentlichen Endpoint erstmals
     * in die Queue gestellt werden.
     *
     * Das reduziert Missbrauch zusätzlich.
     */
    const createdAt =
      new Date(
        submission.created_at
      ).getTime();

    if (
      Number.isNaN(
        createdAt
      )
    ) {
      return json(
        {
          error:
            'Ungültiges Erstellungsdatum.'
        },
        {
          status:
            400
        }
      );
    }

    const ageMs =
      Date.now() -
      createdAt;

    /*
     * 30 Minuten reichen auch bei
     * langsamerem Upload/Deployment.
     */
    if (
      ageMs < -60000 ||
      ageMs >
        30 *
        60 *
        1000
    ) {
      return json(
        {
          error:
            'Diese Anfrage ist zu alt für eine automatische Discord-Weiterleitung.'
        },
        {
          status:
            409
        }
      );
    }

    const guildId =
      String(
        env.DISCORD_GUILD_ID ??
        DEFAULT_GUILD_ID
      ).trim();

    const queued =
      await enqueueSupportTicket(
        env,
        guildId,
        submissionId
      );

    return json(
      {
        ok:
          true,

        queued:
          true,

        duplicate:
          queued.duplicate,

        action_id:
          queued.actionId,

        action_status:
          queued.status,

        submission_id:
          submissionId
      },
      {
        status:
          202
      }
    );

  } catch (error) {
    console.error(
      'intake-webhook error:',
      error
    );

    const message =
      String(
        error?.message ??
        error
      );

    if (
      message ===
      'PAYLOAD_TOO_LARGE'
    ) {
      return json(
        {
          error:
            'Anfrage ist zu groß.'
        },
        {
          status:
            413
        }
      );
    }

    if (
      message ===
      'INVALID_JSON'
    ) {
      return json(
        {
          error:
            'Ungültige Anfrage.'
        },
        {
          status:
            400
        }
      );
    }

    if (
      message ===
      'SUPABASE_SERVER_NOT_CONFIGURED'
    ) {
      return json(
        {
          error:
            'Supabase-Serverzugriff ist in Cloudflare nicht konfiguriert.'
        },
        {
          status:
            500
        }
      );
    }

    return json(
      {
        error:
          'Die Anfrage konnte nicht an den Nexura-Bot übergeben werden.',

        code:
          message
      },
      {
        status:
          500
      }
    );
  }
}
