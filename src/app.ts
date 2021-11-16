import { getRandomMenu } from "./utils/event";
import "./utils/env";
import { App, LogLevel, SocketModeReceiver } from "@slack/bolt";
import { isGenericMessageEvent } from "./utils/helpers";

// heroku url api endpoint
const url = "https://fb-slack-bot.herokuapp.com/";
// mongodb url
const connection_url = "";
const welcomeChanneId = "";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // logLevel: LogLevel.DEBUG,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});
app.use(async ({ next }) => {
  // TODO: This can be improved in future versions
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await next!();
});

(async () => {
  // Start your app
  await app.start();

  console.log("⚡️ Bolt app is running!");
})();

// 점심시간 알림

// team 참가
app.event("team_join", async ({ event, client }) => {
  try {
    const result = await client.chat.postMessage({
      channel: "future_bot_test",
      text: `🎉Welcome to the team, 모두 <@${event.user.id}> 님을 환영해주세요. 🎉 `,
    });
  } catch (error) {
    console.error(error);
  }
});

// Publish a App Home
app.event("app_home_opened", async ({ event, client }) => {
  await client.views.publish({
    user_id: event.user,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          block_id: "section678",
          text: {
            type: "mrkdwn",
            text: "App Home Published",
          },
        },
      ],
    },
  });
});

app.message(/^(점심|점심추천|점심 추천).*/, async ({ context, say }) => {
  // 나중에 몽고 db로 바꾸기
  // 내위치 기준으로 추천해주기
  let lunchMenu = [
    "파스타",
    "설렁탕",
    "짜장면 & 짬뽕",
    "쌀국수",
    "만둣국",
    "제육볶음",
    "김치찌개",
    "순댓국",
    "냉면",
    "연어덮밥",
    "돈가스",
    "갈비찜",
    "닭볶음탕",
    "백반집",
    "칼국수",
    "육개장",
    "우삼겹",
    "분식",
    "비빔국수",
    "뚝배기",
    "볶음밥",
    "돼지국밥",
    "햄버거",
    "우동",
    "초밥",
    "돈부리",
    "소바",
    "쫄면",
    "오돌뼈",
    "갈비탕",
    "삼계탕",
    "불고기 백반",
    "규동",
  ];

  const menu = getRandomMenu(lunchMenu);
  if (typeof menu !== "string") {
    await say({
      icon_emoji: ":santa:",
      username: "나점심",
      text: `오늘의 점심은 !!! [${lunchMenu[menu - 1]}]입니다.`,
    });
  } else {
    await say(`type error`);
  }
});

interface SlackRes {
  message: any;
  say: any;
}

// Listens to incoming messages that contain "hello"
app.message("나봇아 안녕", async ({ message, say }: SlackRes) => {
  await say({
    blocks: [
      {
        type: "section",
        icon_emoji: ":santa:",
        username: "Nabot",
        text: {
          type: "mrkdwn",
          text: `안녕하세요 <@${message.user}> 님!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
          },
          action_id: "button_click",
        },
      },
    ],
    text: `안녕하세요 <@${message.user}> 님 !`,
  });

  if (!isGenericMessageEvent(message)) return;
});

app.event("app_mention", async ({ event, context, client, say }) => {
  try {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `부르셨어요 <@${event.user}>님?`,
          },
          // accessory: {
          //   type: "button",
          //   text: {
          //     type: "plain_text",
          //     text: "Button",
          //     emoji: true,
          //   },
          //   value: "click_me_123",
          //   action_id: "first_button",
          // },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

// Listen and respond to button click
app.action("first_button", async ({ action, ack, say, context }) => {
  console.log("button clicked");
  // console.log(action);
  // acknowledge the request right away
  await ack();
  await say("Thanks for clicking the fancy button");
});
