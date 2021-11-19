import { getDustAPI } from "./weather/dust/index";
import { getFortune } from "./fortune/index";
import { getWeather } from "./weather/index";
import { getRandomMenu } from "./utils/event";
import "./utils/env";
import { App, LogLevel, SocketModeReceiver } from "@slack/bolt";
import { isGenericMessageEvent } from "./utils/helpers";
import scheduler from "node-schedule";
import { getFoodAPI } from "./food";

// heroku url api endpoint
const url = "https://fb-slack-bot.herokuapp.com/";
const port = Number(process.env.PORT) || 5000;
interface SlackRes {
  message: any;
  say: any;
}

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
  await app.start(port);
  console.log("⚡️ Bolt app is running!");
})();

// 미세머닞
app.message(/(미세먼지)/g, async ({ say }) => {
  const result = await getDustAPI();
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text:
      result.sidoName +
      "미세먼지 정보 " +
      result.date +
      " " +
      result.hour +
      " 시 기준 " +
      " `" +
      result.pm25Grade1h +
      "` " +
      "입니다.",
  });
});

// 오늘의 운세
app.message(/(운세)/g, async ({ message, say }: SlackRes) => {
  const { text } = message;
  const result = await getFortune(text.split(" ")[0]);
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text: `🎴 오늘 ${text.split(" ")[0]}의 운세는🎴 : ${result}`,
  });
});

// 점심시간 알림
const send = (text) => {
  app.client.chat.postMessage({
    username: "나나봇",
    text: text,
    channel: "future_bot_test",
    icon_emoji: ":santa:",
  });
};

scheduler.scheduleJob("30 12 * * 1-5", () => {
  send("점심 먹으러 가요! 제가 추천해드릴게요. 😊 `점심`을 입력해보세요. ");
});

scheduler.scheduleJob("00 10 * * 1-5", () => {
  send("💪🏻 `future beauty` 여러분 ! 오늘도 파이팅 !! 💪🏻 ");
});

scheduler.scheduleJob("30 18 * * 1-5", () => {
  send("🙌🏻 `future beauty` 여러분 ! 오늘도 고생하셨어요 !! 🙌🏻 ");
});

// team 참가
app.event("team_join", async ({ event, client }) => {
  try {
    const result = await client.chat.postMessage({
      channel: "fb_free",
      text: `🎉 <@${event.user.id}> 님이 슬랙에 가입하셨습니다. 채널에 초대해 환영해주세요. 🎉 `,
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

app.message(/^(날씨|기상).*/, async ({ say }) => {
  const temp = await getWeather();
  await say({
    icon_emoji: ":santa:",
    username: "나나봇",
    text: `현재 기온은 ${temp}도 입니다.`,
  });
});

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
app.message(/^(점심|점심추천|점심 추천).*/, async ({ context, say }) => {
  // 나중에 몽고 db로 바꾸기
  // 내위치 기준으로 추천해주기

  const menu = getRandomMenu(lunchMenu);

  if (typeof menu !== "string") {
    await say({
      icon_emoji: ":santa:",
      username: "나점심",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "오늘의 점심은 " + " `" + lunchMenu[menu - 1] + "` " + "입니다.",
          },
          accessory: {
            type: "button",
            value: `${lunchMenu[menu - 1]}`,
            text: {
              type: "plain_text",
              text: "맛집 리스트 보기",
            },
            action_id: "view_menu_list",
          },
        },
      ],
      text: ".",
    });
  } else {
    await say(`type error`);
  }
});

app.action("view_menu_list", async ({ action, ack, say, context }: any) => {
  await ack();
  const { searchedQuery, newArr, testArr }: any = await getFoodAPI(
    action.value
  );

  // 문자열 변수를 선언해서 이 안에 넣기
  await say({
    icon_emoji: ":santa:",
    username: "나점심",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${searchedQuery}* 맛집 정보`,
        },
      },
      {
        type: "divider",
      },
      ...newArr.infoArr,
      ...newArr.locationArr,
      {
        type: "divider",
      },
    ],
  });
});

// Listens to incoming messages that contain "hello"
app.message("나봇아 안녕", async ({ message, say }: SlackRes) => {
  await say({
    icon_emoji: ":santa:",
    username: "Nabot",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `안녕하세요 <@${message.user}> 님!`,
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
      icon_emoji: ":santa:",
      username: "Nabot",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `귀찮게 하지 마세요... <@${event.user}>님..`,
          },
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});
