/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import {  RELEASE_COMMAND, DEVELOPERS_COMMAND, PUBLISHERS_COMMAND, PLATFORMS_COMMAND } from './commands.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const router = AutoRouter();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      // case AWW_COMMAND.name.toLowerCase(): {
      //   const cuteUrl = await getCuteUrl();
      //   return new JsonResponse({
      //     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      //     data: {
      //       content: cuteUrl,
      //     },
      //   });
      // }
      // case INVITE_COMMAND.name.toLowerCase(): {
      //   const applicationId = env.DISCORD_APPLICATION_ID;
      //   const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
      //   return new JsonResponse({
      //     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      //     data: {
      //       content: INVITE_URL,
      //       flags: InteractionResponseFlags.EPHEMERAL,
      //     },
      //   });
      // }
      case RELEASE_COMMAND.name.toLowerCase(): {      
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The release date is 2024 according to the Steam page and the developers. Note: the confirmation of 2024 from the developers was before the delay of their other game Level Unknown: Backrooms, which has a higher priority to finish than Dreamhouse, so the release date of 2024 is unsure at this time. The Steam Page still indicates 2024 as of writing this (07/07/2024).',
          },
        });
      }
      case DEVELOPERS_COMMAND.name.toLowerCase(): {      
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The developers of Dreamhouse: The Game are **Podarge Visions** (previously Desand Game Studios)',
          },
        });
      }
      case PUBLISHERS_COMMAND.name.toLowerCase(): {      
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'The publishers of Dreamhouse: The Game are **JNK Games** (according to the Steam page), although the developers have said that it might change, an update is needed to get up-to-date information.',
          },
        });
      }
      case PLATFORMS_COMMAND.name.toLowerCase(): {      
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Dreamhouse: The Game will be released on Steam, Playstation and Xbox. (according to the announcement trailer and previous communications from the developer)',
          },
        });
      }
      default:
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch,
};

export default server;
